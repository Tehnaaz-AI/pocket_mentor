import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, Circle, Plus, Trash2, Sparkles, Check, 
  ListTodo, Flame, AlertCircle, ArrowRight, Zap, Target 
} from 'lucide-react';
import { api } from '../services/api';

/**
 * Revision to-do list.
 *
 * The markup is unchanged from PocketMentor 1.0; only the storage layer was
 * swapped. These items used to live in the browser's localStorage, which meant
 * they never reached the server and nothing could act on them. They are now
 * real Task records, so a task created by the Next Best Action engine and one
 * the student types are the same kind of thing.
 *
 * Server Tasks are mapped to the shape this component already renders
 * ({ id, text, priority, completed }) so none of the JSX below had to change.
 */
const PRIORITY_TO_API = { High: 'high', Medium: 'medium', Low: 'low' };
const PRIORITY_FROM_API = { high: 'High', medium: 'Medium', low: 'Low' };

const toTodo = (task) => ({
  id: task._id,
  text: task.title,
  priority: PRIORITY_FROM_API[task.priority] || 'Medium',
  completed: task.status === 'completed',
  concept: task.topicId || undefined,
  createdAt: task.createdAt
});

export default function RevisionTodoList({ userId, weakTopics = [], recentSessions = [], onOpenSession, onNavigate }) {
  const [todos, setTodos] = useState([]);
  const [newText, setNewText] = useState('');
  const [newPriority, setNewPriority] = useState('Medium');
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'completed'
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const { tasks } = await api.getTasks();
      setTodos((tasks || []).map(toTodo));
    } catch (err) {
      console.error('Failed to load revision tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (id) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    const nextCompleted = !todo.completed;

    // Optimistic: flip locally, then persist.
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: nextCompleted } : t));
    try {
      await api.updateTask(id, { status: nextCompleted ? 'completed' : 'pending' });
    } catch (err) {
      console.error('Failed to update task:', err);
      setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !nextCompleted } : t));
    }
  };

  const handleDelete = async (id) => {
    const previous = todos;
    setTodos(prev => prev.filter(t => t.id !== id));
    try {
      await api.deleteTask(id);
    } catch (err) {
      console.error('Failed to delete task:', err);
      setTodos(previous);
    }
  };

  const handleAdd = async (e) => {
    e?.preventDefault();
    if (!newText.trim()) return;

    const text = newText.trim();
    setNewText('');
    setShowAddForm(false);
    try {
      const { task } = await api.createTask({
        title: text,
        priority: PRIORITY_TO_API[newPriority] || 'medium',
        estimatedMinutes: 20
      });
      setTodos(prev => [toTodo(task), ...prev]);
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  /**
   * Generate revision tasks from the real academic state.
   *
   * This used to invent task text from whatever weak concepts happened to be
   * on screen. It now asks the priority engine, which already creates a Task
   * for its Next Best Action, and falls back to the diagnosed weak topics.
   */
  const handleAutoPopulate = async () => {
    try {
      await api.generateRecommendation();
    } catch (err) {
      console.error('Could not generate a recommendation:', err);
    }

    const existingTexts = new Set(todos.map(t => t.text));
    const wanted = [];

    for (const w of weakTopics.slice(0, 2)) {
      const title = `Targeted drill: master "${w.concept}"`;
      if (!existingTexts.has(title)) {
        wanted.push({ title, priority: 'high', estimatedMinutes: 30 });
      }
    }
    if (recentSessions.length > 0) {
      const title = `Rapid 60s recall: "${recentSessions[0].title.slice(0, 30)}"`;
      if (!existingTexts.has(title)) {
        wanted.push({ title, priority: 'medium', estimatedMinutes: 10 });
      }
    }
    if (wanted.length === 0 && todos.length === 0) {
      wanted.push({ title: 'Import new course notes & take a 5-question quiz', priority: 'medium', estimatedMinutes: 20 });
    }

    for (const task of wanted) {
      try {
        const { task: created } = await api.createTask(task);
        setTodos(prev => [toTodo(created), ...prev]);
      } catch (err) {
        console.error('Failed to create revision task:', err);
      }
    }

    await loadTasks();
  };

  const handleClearCompleted = async () => {
    const completed = todos.filter(t => t.completed);
    setTodos(prev => prev.filter(t => !t.completed));
    for (const t of completed) {
      try {
        await api.deleteTask(t.id);
      } catch (err) {
        console.error('Failed to clear task:', err);
      }
    }
  };

  const completedCount = todos.filter(t => t.completed).length;
  const totalCount = todos.length;
  const percentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredTodos = todos.filter(t => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  return (
    <div className="card-glass p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6 shadow-xl relative overflow-hidden">
      {/* Background Subtle Gradient */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-brand-500/15 text-brand-300 border border-brand-500/30">
              <ListTodo className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
                <span>Quick Revision To-Do List</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-brand-300 font-semibold border border-white/5">
                  {completedCount}/{totalCount}
                </span>
              </h3>
              <p className="text-xs text-slate-400">Daily micro-goals to build study streaks and reinforce memory.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleAutoPopulate}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-brand-500/10 border border-brand-500/30 hover:bg-brand-500/20 text-brand-300 text-xs font-bold transition-all shadow-sm"
            title="Auto-create tasks from diagnosed weak concepts"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Auto-Plan</span>
          </button>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-md shadow-brand-600/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Goal</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5 relative z-10">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold flex items-center space-x-1">
            <Target className="w-3.5 h-3.5 text-brand-400" />
            <span>Revision Completion Rate</span>
          </span>
          <span className="font-bold text-slate-200">{percentComplete}%</span>
        </div>
        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-white/5">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${percentComplete}%` }}
          />
        </div>
      </div>

      {/* Add Task Form (collapsible) */}
      {showAddForm && (
        <form onSubmit={handleAdd} className="p-4 rounded-2xl bg-slate-900/90 border border-brand-500/30 space-y-3 animate-in fade-in">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="e.g. Master Coffman conditions before class..."
              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-brand-500"
              autoFocus
            />
            <div className="flex items-center space-x-2">
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="px-2.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-slate-300 focus:outline-none"
              >
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Normal">Normal</option>
              </select>

              <button
                type="submit"
                disabled={!newText.trim()}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white text-xs font-bold transition-all"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Filter Tabs & Clear */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2 text-xs">
        <div className="flex items-center space-x-2">
          {['all', 'active', 'completed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`capitalize px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                filter === f
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {completedCount > 0 && (
          <button
            onClick={handleClearCompleted}
            className="text-[11px] text-slate-500 hover:text-rose-400 transition-colors"
          >
            Clear completed
          </button>
        )}
      </div>

      {/* Tasks List */}
      <div className="space-y-2.5 relative z-10">
        {filteredTodos.length > 0 ? (
          filteredTodos.map((todo) => {
            let priorityBadge = 'bg-slate-800 text-slate-400 border-white/5';
            if (todo.priority === 'High') priorityBadge = 'bg-rose-500/10 text-rose-300 border-rose-500/25';
            else if (todo.priority === 'Medium') priorityBadge = 'bg-amber-500/10 text-amber-300 border-amber-500/25';

            return (
              <div
                key={todo.id}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                  todo.completed
                    ? 'bg-slate-900/40 border-white/5 opacity-60'
                    : 'bg-slate-900/80 border-white/10 hover:border-brand-500/30'
                }`}
              >
                {/* Left: Checkbox & Text */}
                <div 
                  onClick={() => handleToggle(todo.id)}
                  className="flex items-center space-x-3 cursor-pointer flex-1 min-w-0 mr-3"
                >
                  <button
                    type="button"
                    className="flex-shrink-0 focus:outline-none"
                  >
                    {todo.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-500 hover:text-brand-400 transition-colors" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p className={`text-xs sm:text-sm font-medium transition-all ${
                      todo.completed ? 'line-through text-slate-500' : 'text-slate-200'
                    }`}>
                      {todo.text}
                    </p>
                  </div>
                </div>

                {/* Right: Badge, Link button & Delete */}
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${priorityBadge}`}>
                    {todo.priority}
                  </span>

                  {/* Quick Action button if attached to a session */}
                  {todo.sessionId && onOpenSession && !todo.completed && (
                    <button
                      onClick={() => onOpenSession(todo.sessionId)}
                      className="p-1 px-2 rounded-lg bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 text-[11px] font-bold flex items-center space-x-1"
                      title="Open study session"
                    >
                      <span>Review</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(todo.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Delete goal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-slate-500 text-xs rounded-2xl bg-slate-900/30 border border-dashed border-white/5">
            No revision goals found in this view.
          </div>
        )}
      </div>
    </div>
  );
}
