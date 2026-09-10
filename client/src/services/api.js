const API_BASE = (import.meta.env?.VITE_API_BASE || '/api').replace(/\/$/, '');

function getAuthHeaders() {
  const token = localStorage.getItem('pm_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request(endpoint, options = {}) {
  const headers = options.isFormData
    ? { ...(localStorage.getItem('pm_token') ? { Authorization: `Bearer ${localStorage.getItem('pm_token')}` } : {}) }
    : getAuthHeaders();

  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const response = await fetch(`${API_BASE}${formattedEndpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {})
    }
  });

  if (response.status === 401) {
    localStorage.removeItem('pm_token');
    localStorage.removeItem('pm_user');
    window.dispatchEvent(new CustomEvent('auth-change'));
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  // Auth
  async register(name, email, password) {
    const data = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
    if (data.token) {
      localStorage.setItem('pm_token', data.token);
      localStorage.setItem('pm_user', JSON.stringify(data.user));
    }
    return data;
  },

  async login(email, password) {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (data.token) {
      localStorage.setItem('pm_token', data.token);
      localStorage.setItem('pm_user', JSON.stringify(data.user));
    }
    return data;
  },

  async guestLogin() {
    const data = await request('/auth/guest', { method: 'POST' });
    if (data.token) {
      localStorage.setItem('pm_token', data.token);
      localStorage.setItem('pm_user', JSON.stringify(data.user));
    }
    return data;
  },

  async getMe() {
    return request('/auth/me');
  },

  logout() {
    localStorage.removeItem('pm_token');
    localStorage.removeItem('pm_user');
    window.dispatchEvent(new CustomEvent('auth-change'));
  },

  getCurrentUser() {
    try {
      const userStr = localStorage.getItem('pm_user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated() {
    return !!localStorage.getItem('pm_token');
  },

  // Notes
  async uploadNoteFile(formData) {
    return request('/notes/upload', {
      method: 'POST',
      body: formData,
      isFormData: true
    });
  },

  async pasteNote(title, subject, text) {
    return request('/notes/paste', {
      method: 'POST',
      body: JSON.stringify({ title, subject, text })
    });
  },

  async getNotes() {
    return request('/notes');
  },

  async getNote(id) {
    return request(`/notes/${id}`);
  },

  async deleteNote(id) {
    return request(`/notes/${id}`, { method: 'DELETE' });
  },

  // Study Kit
  async generateStudyKit(payload) {
    return request('/study/generate', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getStudySession(sessionId) {
    return request(`/study/${sessionId}`);
  },

  async askMyNotes(sessionId, query) {
    return request(`/study/${sessionId}/ask`, {
      method: 'POST',
      body: JSON.stringify({ query })
    });
  },

  async rateFlashcard(cardId, rating) {
    return request(`/study/flashcards/${cardId}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating })
    });
  },

  // Quiz
  async submitQuiz(quizId, answers) {
    return request(`/quiz/${quizId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers })
    });
  },

  async generateReviseAgain(quizId) {
    return request(`/quiz/${quizId}/revise`, {
      method: 'POST'
    });
  },

  // Dashboard & Progress
  async getDashboard() {
    return request('/dashboard');
  },

  async getProgress() {
    return request('/progress');
  },

  // ============================================================
  // Academic OS — "What should I study next, and why?"
  // The original methods above are untouched; these are additive.
  // ============================================================

  /** The current Next Best Action, generated on demand if there isn't one. */
  async getNextBestAction() {
    return request('/recommendations/next');
  },

  /** Force a fresh run of the priority engine. */
  async generateRecommendation() {
    return request('/recommendations/generate', { method: 'POST' });
  },

  /**
   * Start the recommended session.
   * Returns { sessionId } when notes exist for the topic — that id opens the
   * existing Study Workspace. Returns actionType 'import' with prefill data
   * when the topic has no notes yet.
   */
  async startRecommendation(recommendationId) {
    return request(`/recommendations/${recommendationId}/start`, { method: 'POST' });
  },

  async skipRecommendation(recommendationId) {
    return request(`/recommendations/${recommendationId}/skip`, { method: 'PUT' });
  },

  async getRecommendationHistory(limit = 10) {
    return request(`/recommendations?limit=${limit}`);
  },

  // --- Academic state ---
  async getAcademicProfile() {
    return request('/academic/profile');
  },

  async updateAcademicProfile(updates) {
    return request('/academic/profile', { method: 'PUT', body: JSON.stringify(updates) });
  },

  async getSubjects() {
    return request('/academic/subjects');
  },

  async getTopics({ weak = false, subjectId } = {}) {
    const params = new URLSearchParams();
    if (weak) params.set('weak', 'true');
    if (subjectId) params.set('subjectId', subjectId);
    const qs = params.toString();
    return request(`/academic/topics${qs ? `?${qs}` : ''}`);
  },

  async getGoals(status) {
    return request(`/academic/goals${status ? `?status=${status}` : ''}`);
  },

  async createGoal(goal) {
    return request('/academic/goals', { method: 'POST', body: JSON.stringify(goal) });
  },

  async deleteGoal(id) {
    return request(`/academic/goals/${id}`, { method: 'DELETE' });
  },

  async getDeadlines(status) {
    return request(`/academic/deadlines${status ? `?status=${status}` : ''}`);
  },

  async createDeadline(deadline) {
    return request('/academic/deadlines', { method: 'POST', body: JSON.stringify(deadline) });
  },

  async deleteDeadline(id) {
    return request(`/academic/deadlines/${id}`, { method: 'DELETE' });
  },

  // --- Tasks: real storage for the revision to-do list ---
  async getTasks(status) {
    return request(`/academic/tasks${status ? `?status=${status}` : ''}`);
  },

  async createTask(task) {
    return request('/academic/tasks', { method: 'POST', body: JSON.stringify(task) });
  },

  async updateTask(id, updates) {
    return request(`/academic/tasks/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
  },

  async deleteTask(id) {
    return request(`/academic/tasks/${id}`, { method: 'DELETE' });
  }
};
