import { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { api, chatSettingsApi } from '../../services/api.js';
import { upsertChat, removeChat, updateChatSettings } from '../../redux/chatSlice.js';
import Avatar from '../Avatar.jsx';

function GroupInfoPanel({ chat, onClose }) {
  const dispatch = useDispatch();
  const me = useSelector((s) => s.auth.user);
  const muted = useSelector((s) => s.chat.settingsByChat[chat._id]?.muted) || false;
  const fileInput = useRef(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(chat.name || '');
  const [description, setDescription] = useState(chat.description || '');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [adding, setAdding] = useState(false);

  const isAdmin = chat.admins?.some((a) => (a._id || a) === me._id);
  const adminIds = new Set((chat.admins || []).map((a) => a._id || a));
  const apply = (data) => dispatch(upsertChat(data.chat));

  const saveInfo = async () => {
    try {
      const { data } = await api.put(`/chats/group/${chat._id}`, { name, description });
      apply(data);
      setEditing(false);
      toast.success('Group updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    }
  };
  const uploadAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const form = new FormData();
      form.append('avatar', file);
      const { data } = await api.put(`/chats/group/${chat._id}/avatar`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      apply(data);
      toast.success('Avatar updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    }
  };
  const searchUsers = async (q) => {
    setQuery(q);
    if (!q.trim()) return setResults([]);
    try {
      const { data } = await api.get('/users', { params: { q } });
      const memberIds = new Set(chat.members.map((m) => m._id));
      setResults(data.users.filter((u) => !memberIds.has(u._id)));
    } catch {
      setResults([]);
    }
  };
  const addMember = async (userId) => {
    try {
      const { data } = await api.post(`/chats/group/${chat._id}/members`, { memberIds: [userId] });
      apply(data);
      setQuery('');
      setResults([]);
      setAdding(false);
      toast.success('Member added');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add');
    }
  };
  const removeMember = async (userId) => {
    try {
      const { data } = await api.delete(`/chats/group/${chat._id}/members/${userId}`);
      apply(data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to remove');
    }
  };
  const promote = async (userId) => {
    const { data } = await api.put(`/chats/group/${chat._id}/admins/${userId}`);
    apply(data);
  };
  const demote = async (userId) => {
    try {
      const { data } = await api.delete(`/chats/group/${chat._id}/admins/${userId}`);
      apply(data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to demote');
    }
  };
  const leave = async () => {
    try {
      await api.post(`/chats/group/${chat._id}/leave`);
      dispatch(removeChat({ chatId: chat._id }));
      toast.success('Left group');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to leave');
    }
  };
  const toggleMute = async () => {
    try {
      const { data } = await chatSettingsApi.update(chat._id, 'muted', !muted);
      dispatch(updateChatSettings({ chatId: chat._id, settings: data.settings }));
      toast.success(muted ? 'Unmuted' : 'Muted');
    } catch {
      toast.error('Failed to update');
    }
  };

  return (
    <motion.aside
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="glass flex h-full w-full flex-col border-l border-white/[0.06] md:w-80"
    >
      <header className="flex items-center justify-between border-b border-white/[0.06] p-4">
        <h2 className="font-semibold text-slate-100">Group info</h2>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
        >
          ×
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <Avatar user={{ username: chat.name, avatar: chat.avatar }} size={80} />
            {isAdmin && (
              <>
                <button
                  onClick={() => fileInput.current?.click()}
                  className="absolute bottom-0 right-0 glass-btn-primary rounded-full px-2 py-1 text-xs"
                >
                  ✎
                </button>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={uploadAvatar}
                />
              </>
            )}
          </div>

          {editing ? (
            <div className="mt-4 w-full space-y-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="glass-input w-full px-4 py-2.5 text-sm"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="glass-input w-full resize-none px-4 py-2.5 text-sm"
              />
              <button onClick={saveInfo} className="glass-btn-primary w-full py-2 text-sm">
                Save
              </button>
            </div>
          ) : (
            <>
              <h3 className="mt-3 text-lg font-semibold text-slate-100">{chat.name}</h3>
              <p className="mt-1 text-sm text-slate-400">{chat.description || 'No description'}</p>
              <p className="mt-1 text-xs text-slate-500">{chat.members.length} members</p>
              {isAdmin && (
                <button
                  onClick={() => setEditing(true)}
                  className="mt-2 text-xs text-indigo-400 hover:underline"
                >
                  Edit info
                </button>
              )}
            </>
          )}
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-medium text-slate-300">Members</h4>
            {isAdmin && (
              <button
                onClick={() => setAdding((v) => !v)}
                className="text-xs text-indigo-400 hover:underline"
              >
                {adding ? 'Cancel' : '+ Add'}
              </button>
            )}
          </div>

          {adding && (
            <div className="mb-3">
              <input
                value={query}
                onChange={(e) => searchUsers(e.target.value)}
                placeholder="Search users..."
                className="glass-input mb-1 w-full px-4 py-2 text-sm"
              />
              <ul className="max-h-32 overflow-y-auto">
                {results.map((u) => (
                  <li key={u._id}>
                    <button
                      onClick={() => addMember(u._id)}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-white/[0.06]"
                    >
                      <Avatar user={u} size={28} />
                      <span className="text-sm text-slate-100">{u.username}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <ul className="space-y-1">
            {chat.members.map((m) => {
              const memberIsAdmin = adminIds.has(m._id);
              return (
                <li
                  key={m._id}
                  className="group flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-white/[0.06] transition-colors"
                >
                  <Avatar user={m} size={32} showPresence />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-slate-100">
                      {m.username} {m._id === me._id && '(You)'}
                    </p>
                    {memberIsAdmin && <p className="text-[10px] text-indigo-400">Admin</p>}
                  </div>
                  {isAdmin && m._id !== me._id && (
                    <div className="hidden items-center gap-1 group-hover:flex">
                      <button
                        onClick={() => (memberIsAdmin ? demote(m._id) : promote(m._id))}
                        className="glass-card !rounded-lg px-2 py-1 text-[10px] text-slate-300"
                      >
                        {memberIsAdmin ? 'Demote' : 'Promote'}
                      </button>
                      <button
                        onClick={() => removeMember(m._id)}
                        className="glass-card !rounded-lg px-2 py-1 text-[10px] text-red-400"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <footer className="space-y-2 border-t border-white/[0.06] p-4">
        <button
          onClick={toggleMute}
          className="glass-card w-full !rounded-xl py-2.5 text-sm text-slate-300"
        >
          {muted ? '🔔 Unmute' : '🔕 Mute'}
        </button>
        <button
          onClick={leave}
          className="glass-card w-full !rounded-xl py-2.5 text-sm text-red-400 hover:bg-red-500/10"
        >
          Leave group
        </button>
      </footer>
    </motion.aside>
  );
}

export default GroupInfoPanel;
