import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { notificationsApi } from '../../services/api.js';
import { setNotifications, setActiveChat } from '../../redux/chatSlice.js';
import Avatar from '../Avatar.jsx';
import { formatTime } from '../../utils/format.js';

function title(n) {
  const name = n.actor?.username || (n.payload?.username || 'Someone');
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

export default function NotificationsBell() {
  const dispatch = useDispatch();
  const notifications = useSelector((s) => s.chat.notifications);
  const unreadChats = useSelector((s) => s.chat.unreadByChat);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const chatTotal = Object.values(unreadChats).reduce((a, b) => a + b, 0);
  const badge = unreadCount + chatTotal;

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (open) {
      notificationsApi
        .list()
        .then((r) => dispatch(setNotifications(r.data.notifications)))
        .catch(() => {});
    }
  }, [open, dispatch]);

  useEffect(() => {
    const last = notifications[0];
    if (
      last &&
      !last.read &&
      !document.hasFocus() &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      new Notification(title(last), { body: body(last) });
    }
  }, [notifications]);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

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
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-800"
        title="Notifications"
      >
        🔔
        {badge > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute left-0 z-50 mt-2 w-80 max-w-[calc(100vw-1rem)] rounded-2xl border border-slate-800 bg-slate-900 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 p-3">
              <p className="font-semibold text-slate-100">Notifications</p>
              <div className="flex gap-2 text-xs">
                <button onClick={markAll} className="text-indigo-400 hover:underline">
                  Mark all read
                </button>
                <button onClick={clearAll} className="text-slate-500 hover:underline">
                  Clear
                </button>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="p-6 text-center text-sm text-slate-500">No notifications</p>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n._id}
                    onClick={() => {
                      if (n.chat) dispatch(setActiveChat(String(n.chat._id)));
                      setOpen(false);
                    }}
                    className={
                      'flex w-full items-start gap-3 border-b border-slate-800/60 p-3 text-left hover:bg-slate-800/60 ' +
                      (n.read ? 'opacity-60' : '')
                    }
                  >
                    <Avatar user={n.actor || { username: '?' }} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-100">{title(n)}</p>
                      {body(n) && <p className="truncate text-xs text-slate-400">{body(n)}</p>}
                      <p className="mt-0.5 text-[10px] text-slate-500">{formatTime(n.createdAt)}</p>
                    </div>
                    {!n.read && <span className="mt-1 h-2 w-2 rounded-full bg-indigo-400" />}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
