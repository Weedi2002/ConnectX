import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { api } from '../../services/api.js';
import { createGroup } from '../../redux/chatSlice.js';
import Avatar from '../Avatar.jsx';
import { cn } from '../../utils/cn.js';

function CreateGroupModal({ onClose }) {
  const dispatch = useDispatch();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const id = setTimeout(async () => {
      try {
        const { data } = await api.get('/users', { params: { q: query } });
        setResults(data.users);
      } catch {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [query]);

  const toggle = (user) => {
    setSelected((prev) =>
      prev.some((u) => u._id === user._id)
        ? prev.filter((u) => u._id !== user._id)
        : [...prev, user],
    );
  };

  const submit = async () => {
    if (!name.trim()) return toast.error('Group name is required');
    if (selected.length < 1) return toast.error('Select at least one member');
    setCreating(true);
    const result = await dispatch(
      createGroup({
        name: name.trim(),
        description: description.trim(),
        memberIds: selected.map((u) => u._id),
      }),
    );
    setCreating(false);
    if (createGroup.fulfilled.match(result)) {
      toast.success('Group created');
      onClose();
    } else {
      toast.error('Failed to create group');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">New group</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            ×
          </button>
        </div>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Group name"
          className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          rows={2}
          className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500"
        />

        {selected.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {selected.map((u) => (
              <span
                key={u._id}
                className="flex items-center gap-1 rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs text-indigo-200"
              >
                {u.username}
                <button onClick={() => toggle(u)}>×</button>
              </span>
            ))}
          </div>
        )}

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users to add..."
          className="mb-2 w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500"
        />
        <ul className="mb-4 max-h-48 space-y-1 overflow-y-auto">
          {results.map((u) => {
            const active = selected.some((s) => s._id === u._id);
            return (
              <li key={u._id}>
                <button
                  onClick={() => toggle(u)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-slate-800',
                    active && 'bg-slate-800',
                  )}
                >
                  <Avatar user={u} size={32} />
                  <span className="flex-1 text-sm text-slate-100">{u.username}</span>
                  {active && <span className="text-indigo-400">✓</span>}
                </button>
              </li>
            );
          })}
        </ul>

        <button
          onClick={submit}
          disabled={creating}
          className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-500 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {creating ? 'Creating...' : 'Create group'}
        </button>
      </motion.div>
    </div>
  );
}

export default CreateGroupModal;
