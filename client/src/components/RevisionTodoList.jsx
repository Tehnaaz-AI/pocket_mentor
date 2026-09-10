import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, Circle, Plus, Trash2, Sparkles, 
  ListTodo, ArrowRight, Target 
} from 'lucide-react';
import { api } from '../services/api';

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
  const [filter, setFilter] = useState('all');
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

  const handleAutoPopulate = async () => {
    try {
      await api.generateRecommendation();
    } catch (err) {
      console.error('Could not generate recommendation:', err);
    }

    const existingTexts = new Set(todos.map(t => t.text));
    const wanted = [];

    for (const w of weakTopics.slice(0, 2)) {
      const title = `Targeted drill: master "${w.concept}"`;
      if (!existingTexts.has(title)) {
        wanted.push({ title, priority: 'high', estimatedMinutes: 25 });
      }
    }
    if (recentSessions.length > 0) {
      const title = `Rapid recall: "${recentSessions[0].title.slice(0, 30)}"`;
      if (!existingTexts.has(title)) {
        wanted.push({ title, priority: 'medium', estimatedMinutes: 10 });
      }
    }
    if (wanted.length === 0 && todos.length === 0) {
      wanted.push({ title: 'Import course notes & take a diagnostic quiz', priority: 'medium', estimatedMinutes: 20 });
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
    <div className="card-miro p-6 sm:p-7 border-[#e0e2e8] bg-white space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-[#1c1c1e] tracking-tight">
              Study Focus & Goals
            </h3>
            <span className="badge-pill badge-neutral font-mono text-[11px]">
              {completedCount}/{totalCount}
            </span>
          </div>
          <p className="text-xs text-[#555a6a]">Micro-targets to maintain retention and daily rhythm.</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleAutoPopulate}
            className="btn-ghost text-xs px-3 py-1.5 border border-[#e0e2e8]"
            title="Auto-plan from weak concepts"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-[#ffd02f]" />
            <span>Auto-Plan</span>
          </button>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary text-xs px-3 py-1.5"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>Add Goal</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs text-[#8e91a0]">
            <span className="font-medium">Completion</span>
            <span className="font-bold text-[#1c1c1e] font-mono">{percentComplete}%</span>
          </div>
          <div className="w-full bg-[#f0f2f5] h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1c1c1e] rounded-full transition-all duration-300"
              style={{ width: `${percentComplete}%` }}
            />
          </div>
        </div>
      )}

      {/* Add Task Form (collapsible) */}
      {showAddForm && (
        <form onSubmit={handleAdd} className="p-4 rounded-xl bg-[#f7f8fa] border border-[#e0e2e8] space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="e.g. Revise CPU Scheduling algorithms before class..."
              className="input-miro flex-1 text-xs"
              autoFocus
            />
            <div className="flex items-center space-x-2">
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="input-miro text-xs py-2 px-2.5"
              >
                <option value="High">High Priority</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>

              <button
                type="submit"
                disabled={!newText.trim()}
                className="btn-primary text-xs py-2 px-4"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Filter Tabs & Clear */}
      <div className="flex items-center justify-between border-b border-[#eef0f3] pb-2 text-xs">
        <div className="flex items-center space-x-1">
          {['all', 'active', 'completed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`capitalize px-3 py-1 rounded-full font-medium transition-colors ${
                filter === f
                  ? 'bg-[#1c1c1e] text-white'
                  : 'text-[#555a6a] hover:text-[#1c1c1e] hover:bg-[#f7f8fa]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {completedCount > 0 && (
          <button
            onClick={handleClearCompleted}
            className="text-xs text-[#8e91a0] hover:text-[#ff9999] transition-colors"
          >
            Clear completed
          </button>
        )}
      </div>

      {/* Tasks List */}
      <div className="space-y-2">
        {filteredTodos.length > 0 ? (
          filteredTodos.map((todo) => {
            let priorityBadge = 'badge-neutral';
            if (todo.priority === 'High') priorityBadge = 'badge-coral';
            else if (todo.priority === 'Medium') priorityBadge = 'badge-yellow';

            return (
              <div
                key={todo.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  todo.completed
                    ? 'bg-[#fafbfc] border-[#eef0f3] opacity-60'
                    : 'bg-white border-[#e0e2e8] hover:border-[#c7cad5]'
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
                      <CheckCircle2 className="w-4 h-4 text-[#00b473]" />
                    ) : (
                      <Circle className="w-4 h-4 text-[#c7cad5] hover:text-[#1c1c1e] transition-colors" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-medium transition-all ${
                      todo.completed ? 'line-through text-[#8e91a0]' : 'text-[#1c1c1e]'
                    }`}>
                      {todo.text}
                    </p>
                  </div>
                </div>

                {/* Right: Badge, Link button & Delete */}
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <span className={`badge-pill text-[10px] uppercase font-mono ${priorityBadge}`}>
                    {todo.priority}
                  </span>

                  <button
                    onClick={() => handleDelete(todo.id)}
                    className="p-1 text-[#8e91a0] hover:text-[#ff9999] transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-6 text-center text-[#8e91a0] text-xs rounded-xl bg-[#fafbfc] border border-dashed border-[#e0e2e8]">
            No revision goals in this view.
          </div>
        )}
      </div>
    </div>
  );
}
