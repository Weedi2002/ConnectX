import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { searchApi } from '../../services/api.js';
import { setActiveChat } from '../../redux/chatSlice.js';
import Avatar from '../Avatar.jsx';
import UserProfileModal from './UserProfileModal.jsx';
import { formatTime } from '../../utils/format.js';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'users', label: 'People' },
  { key: 'messages', label: 'Messages' },
  { key: 'files', label: 'Files' },
  { key: 'groups', label: 'Groups' },
];

export default function SearchModal({ onClose }) {
  const dispatch = useDispatch();
  const [q, setQ] = useState('');
  const [type, setType] = useState('all');
  const [results, setResults] = useState({ users: [], groups: [], messages: [] });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [profileUserId, setProfileUserId] = useState(null);

  useEffect(() => {
    searchApi
      .recent()
      .then((r) => setRecent(r.data.recentSearches))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      const term = q.trim();
      if (!term) {
        setResults({ users: [], groups: [], messages: [] });
        return;
      }
      setLoading(true);
      try {
        const { data } = await searchApi.global(term, type);
        setResults(data);
      } catch {
        toast.error('Search failed');
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q, type]);

  const runSearch = async (term) => {
    setQ(term);
    try {
      await searchApi.addRecent(term);
      const { data } = await searchApi.recent();
      setRecent(data.recentSearches);
    } catch {
      /* non-critical */
    }
  };

  const openChat = (chatId) => {
    dispatch(setActiveChat(chatId));
    onClose();
  };
  const hasContent = results.users.length || results.groups.length || results.messages.length;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-20 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass w-full max-w-lg rounded-3xl shadow-glass"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 border-b border-white/[0.06] p-4">
            <span className="text-slate-400">🔍</span>
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && q.trim() && runSearch(q.trim())}
              placeholder="Search people, messages, files, groups..."
              className="flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
            />
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
            >
              ×
            </button>
          </div>

          <div className="flex gap-1 px-4 pt-3">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setType(t.key)}
                className={`rounded-full px-3 py-1 text-xs transition-all ${type === t.key ? 'glass-btn-primary' : 'text-slate-400 hover:bg-white/[0.06]'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="max-h-[55vh] overflow-y-auto p-4">
            {!q.trim() && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500">Recent searches</p>
                  {recent.length > 0 && (
                    <button
                      onClick={() => searchApi.clearRecent().then(() => setRecent([]))}
                      className="text-xs text-slate-500 hover:text-slate-300"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {recent.length === 0 ? (
                  <p className="text-xs text-slate-500">No recent searches</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {recent.map((r) => (
                      <button
                        key={r.query}
                        onClick={() => setQ(r.query)}
                        className="glass-card !rounded-full px-3 py-1 text-xs text-slate-300"
                      >
                        {r.query}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {q.trim() && !hasContent && !loading && (
              <p className="py-8 text-center text-sm text-slate-500">No results</p>
            )}

            {results.users.length > 0 && (
              <Section title="People">
                {results.users.map((u) => (
                  <Row key={u._id} onClick={() => setProfileUserId(u._id)}>
                    <Avatar user={u} size={36} showPresence />
                    <span className="text-sm">{u.username}</span>
                  </Row>
                ))}
              </Section>
            )}

            {results.groups.length > 0 && (
              <Section title="Groups">
                {results.groups.map((g) => (
                  <Row key={g._id} onClick={() => openChat(g._id)}>
                    <Avatar user={{ username: g.name, avatar: g.avatar }} size={36} />
                    <span className="text-sm">{g.name}</span>
                    <span className="ml-auto text-xs text-slate-500">
                      {g.members.length} members
                    </span>
                  </Row>
                ))}
              </Section>
            )}

            {results.messages.length > 0 && (
              <Section title="Messages">
                {results.messages.map((m) => (
                  <Row key={m._id} onClick={() => openChat(m.chat?._id)}>
                    <Avatar user={m.sender} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-500">
                        {m.sender?.username} · {m.chat?.name || 'chat'}
                      </p>
                      <p className="truncate text-sm">
                        {m.attachments?.length > 0 && !m.content
                          ? `📎 ${m.attachments[0].name}`
                          : m.content}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-500">{formatTime(m.createdAt)}</span>
                  </Row>
                ))}
              </Section>
            )}
          </div>
        </motion.div>
      </div>

      {profileUserId && (
        <UserProfileModal userId={profileUserId} onClose={() => setProfileUserId(null)} />
      )}
    </>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-3">
      <p className="mb-1.5 text-xs font-semibold text-slate-500">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-white/[0.06] transition-colors"
    >
      {children}
    </button>
  );
}
