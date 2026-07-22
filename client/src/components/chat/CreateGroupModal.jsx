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
      try { const { data } = await api.get('/users', { params: { q: query } }); setResults(data.users); }
      catch { setResults([]); }
    }, 300);
    return () => clearTimeout(id);
  }, [query]);

  const toggle = (user) => setSelected((prev) => prev.some((u) => u._id === user._id) ? prev.filter((u) => u._id !== user._id) : [...prev, user]);

  const submit = async () => {
    if (!name.trim()) return toast.error('Group name is required');
    if (selected.length < 1) return toast.error('Select at least one member');
    setCreating(true);
    const result = await dispatch(createGroup({ name: name.trim(), description: description.trim(), memberIds: selected.map((u) => u._id) }));
    setCreating(false);
    if (createGroup.fulfilled.match(result)) { toast.success('Group created'); onClose(); }
    else toast.error('Failed to create group');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass w-full max-w-md rounded-3xl p-6 shadow-glass" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">New group</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-white/[0.06] hover:text-slate-200">×</button>
        </div>

        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Group name" className="glass-input mb-3 w-full px-4 py-2.5 text-sm" />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" rows={2} className="glass-input mb-3 w-full resize-none px-4 py-2.5 text-sm" />

        {selected.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {selected.map((u) => (
              <span key={u._id} className="glass-card flex items-center gap-1.5 !rounded-full px-3 py-1 text-xs text-indigo-200">
                {u.username}
                <button onClick={() => toggle(u)} className="hover:text-red-400">×</button>
              </span>
            ))}
          </div>
        )}

        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search users to add..." className="glass-input mb-2 w-full px-4 py-2.5 text-sm" />
        <ul className="mb-4 max-h-48 space-y-1 overflow-y-auto">
          {results.map((u) => {
            const active = selected.some((s) => s._id === u._id);
            return (
              <li key={u._id}>
                <button onClick={() => toggle(u)} className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-white/[0.06] transition-colors', active && 'bg-indigo-500/10')}>
                  <Avatar user={u} size={32} />
                  <span className="flex-1 text-sm text-slate-100">{u.username}</span>
                  {active && <span className="text-indigo-400">✓</span>}
                </button>
              </li>
            );
          })}
        </ul>

        <button onClick={submit} disabled={creating} className="glass-btn-primary w-full py-2.5 text-sm disabled:opacity-50">
          {creating ? 'Creating...' : 'Create group'}
        </button>
      </motion.div>
    </div>
  );
}

export default CreateGroupModal;
