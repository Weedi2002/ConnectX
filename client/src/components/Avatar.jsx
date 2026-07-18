import { cn } from '../utils/cn.js';

const presenceColor = {
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  busy: 'bg-red-500',
  offline: 'bg-slate-500',
};

function Avatar({ user, size = 40, showPresence = false }) {
  const initial = user?.username?.[0]?.toUpperCase() || '?';
  const dot = Math.max(8, size * 0.28);

  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      {user?.avatar?.url ? (
        <img
          src={user.avatar.url}
          alt={user.username}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 font-semibold text-white"
          style={{ fontSize: size * 0.4 }}
        >
          {initial}
        </div>
      )}
      {showPresence && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full ring-2 ring-slate-900',
            presenceColor[user?.presence] || presenceColor.offline,
          )}
          style={{ width: dot, height: dot }}
        />
      )}
    </div>
  );
}

export default Avatar;
