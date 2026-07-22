import { useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import Avatar from '../Avatar.jsx';
import { Skeleton } from '../Skeleton.jsx';
import UserProfileModal from './UserProfileModal.jsx';

function NewChatSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [profileId, setProfileId] = useState(null);

  useEffect(() => {
    const id = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/users', { params: { q: query } });
        setResults(data.users);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [query]);

  return (
    <div className="p-3">
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search users..."
        className="glass-input mb-3 w-full px-4 py-2.5 text-sm"
      />
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="glass-card h-14 !rounded-xl" />
          ))}
        </div>
      ) : (
        <ul className="space-y-1">
          {results.map((u) => (
            <li key={u._id}>
              <button
                onClick={() => setProfileId(u._id)}
                className="glass-card flex w-full items-center gap-3 !rounded-xl px-3 py-3 text-left"
              >
                <Avatar user={u} size={36} showPresence />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-100">{u.username}</p>
                  <p className="truncate text-xs text-slate-400">{u.bio}</p>
                </div>
              </button>
            </li>
          ))}
          {results.length === 0 && (
            <p className="py-4 text-center text-sm text-slate-500">No users found</p>
          )}
        </ul>
      )}

      {profileId && <UserProfileModal userId={profileId} onClose={() => setProfileId(null)} />}
    </div>
  );
}

export default NewChatSearch;
