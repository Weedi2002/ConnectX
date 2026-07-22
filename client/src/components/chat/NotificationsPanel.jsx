import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { notificationsApi } from '../../services/api.js';
import { setNotifications, setActiveChat } from '../../redux/chatSlice.js';
import Avatar from '../Avatar.jsx';
import { formatTime } from '../../utils/format.js';

function title(n) {
  const name = n.actor?.username || n.payload?.username || 'Someone';
  switch (n.type) {
    case 'message':
      return `New message from ${name}`;
    case 'added_to_group':
      return `Added to ${n.payload?.chatName || 'a group'}`;
    case 'group_updated':
      return `${n.payload?.chatName || 'A group'} was updated`;
    case 'member_left':
      return `${name} left ${n.payload?.chatName || 'a group'}`;
    case 'message_pinned':
      return `${name} pinned a message`;
    default:
      return 'New notification';
  }
}

function body(n) {
  if (n.type === 'message') return n.payload?.content || '';
  if (n.type === 'message_pinned') return n.payload?.content || '';
  return n.payload?.chatName || '';
}

export default function NotificationsPanel() {
  const dispatch = useDispatch();
  const notifications = useSelector((s) => s.chat.notifications);

  useEffect(() => {
    notificationsApi
      .list()
      .then((r) => dispatch(setNotifications(r.data.notifications)))
      .catch(() => {});
  }, [dispatch]);

  const markAll = async () => {
    try {
      await notificationsApi.markAllRead();
      const { data } = await notificationsApi.list();
      dispatch(setNotifications(data.notifications.map((n) => ({ ...n, read: true }))));
    } catch {
      toast.error('Failed');
    }
  };

  const clearAll = async () => {
    try {
      await notificationsApi.clear();
      dispatch(setNotifications([]));
    } catch {
      toast.error('Failed');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/[0.06]">
        <h3 className="font-semibold text-sm text-slate-100">Notifications</h3>
        <div className="flex gap-3 text-xs">
          <button onClick={markAll} className="text-cyan-400 hover:text-cyan-300 transition-colors">
            Mark all read
          </button>
          <button
            onClick={clearAll}
            className="text-slate-500 hover:text-slate-400 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {notifications.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">No notifications</p>
        ) : (
          notifications.map((n) => (
            <button
              key={n._id}
              onClick={() => {
                if (n.chat) dispatch(setActiveChat(String(n.chat._id)));
              }}
              className={`flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors hover:bg-white/[0.06] ${n.read ? 'opacity-50' : ''}`}
            >
              <Avatar user={n.actor || { username: '?' }} size={36} />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-100">{title(n)}</p>
                {body(n) && <p className="mt-0.5 truncate text-xs text-slate-400">{body(n)}</p>}
                <p className="mt-1 text-[10px] text-slate-500">{formatTime(n.createdAt)}</p>
              </div>
              {!n.read && <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-cyan-400" />}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
