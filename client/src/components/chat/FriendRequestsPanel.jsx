import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Avatar from '../Avatar.jsx';
import {
  fetchIncoming,
  fetchSent,
  fetchFriends,
  fetchBlocked,
  acceptRequest,
  rejectRequest,
  cancelRequest,
  unblockUser,
} from '../../redux/friendSlice.js';
import { openChat } from '../../redux/chatSlice.js';

export default function FriendRequestsPanel({ onClose }) {
  const dispatch = useDispatch();
  const { incoming, sent, friends, blocked } = useSelector((s) => s.friend);
  const [tab, setTab] = useState('incoming');

  useEffect(() => {
    dispatch(fetchIncoming());
    dispatch(fetchSent());
    dispatch(fetchFriends());
    dispatch(fetchBlocked());
  }, [dispatch]);

  const openChatWith = async (userId) => {
    const result = await dispatch(openChat(userId));
    if (openChat.fulfilled.match(result)) onClose();
    else toast.error('Could not open chat');
  };

  const accept = async (id) => {
    try {
      await dispatch(acceptRequest(id));
      toast.success('Friend request accepted');
    } catch {
      toast.error('Failed');
    }
  };
  const reject = async (id) => {
    try {
      await dispatch(rejectRequest(id));
    } catch {
      toast.error('Failed');
    }
  };
  const cancel = async (id) => {
    try {
      await dispatch(cancelRequest(id));
    } catch {
      toast.error('Failed');
    }
  };
  const unblock = async (id) => {
    try {
      await dispatch(unblockUser(id));
      toast.success('Unblocked');
    } catch {
      toast.error('Failed');
    }
  };

  const tabs = [
    { k: 'incoming', l: `Incoming (${incoming.length})` },
    { k: 'sent', l: `Sent (${sent.length})` },
    { k: 'friends', l: `Friends (${friends.length})` },
    { k: 'blocked', l: `Blocked (${blocked.length})` },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass w-full max-w-md rounded-3xl shadow-glass"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] p-5">
          <h2 className="font-semibold text-slate-100">Friend Requests</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
          >
            ×
          </button>
        </div>

        <div className="flex gap-1 px-5 pt-3">
          {tabs.map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`rounded-full px-3 py-1 text-xs transition-all ${
                tab === t.k ? 'glass-btn-primary' : 'text-slate-400 hover:bg-white/[0.06]'
              }`}
            >
              {t.l}
            </button>
          ))}
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-5 space-y-2">
          {tab === 'incoming' &&
            (incoming.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No incoming requests</p>
            ) : (
              incoming.map((r) => (
                <div key={r._id} className="glass-card flex items-center gap-3 !rounded-xl p-3">
                  <Avatar user={r.sender} size={40} />
                  <p className="min-w-0 flex-1 truncate text-sm text-slate-100">
                    {r.sender?.username}
                  </p>
                  <button
                    onClick={() => accept(r._id)}
                    className="glass-btn-primary px-4 py-1.5 text-xs"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => reject(r._id)}
                    className="glass-card !rounded-lg px-4 py-1.5 text-xs text-slate-300"
                  >
                    Reject
                  </button>
                </div>
              ))
            ))}

          {tab === 'sent' &&
            (sent.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No sent requests</p>
            ) : (
              sent.map((r) => (
                <div key={r._id} className="glass-card flex items-center gap-3 !rounded-xl p-3">
                  <Avatar user={r.recipient} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-slate-100">{r.recipient?.username}</p>
                    <p className="text-xs text-slate-500">Pending</p>
                  </div>
                  <button
                    onClick={() => cancel(r._id)}
                    className="glass-card !rounded-lg px-4 py-1.5 text-xs text-slate-300"
                  >
                    Cancel
                  </button>
                </div>
              ))
            ))}

          {tab === 'blocked' &&
            (blocked.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No blocked users</p>
            ) : (
              blocked.map((u) => (
                <div key={u._id} className="glass-card flex items-center gap-3 !rounded-xl p-3">
                  <Avatar user={u} size={40} />
                  <p className="min-w-0 flex-1 truncate text-sm text-slate-100">{u.username}</p>
                  <button
                    onClick={() => unblock(u._id)}
                    className="glass-card !rounded-lg px-4 py-1.5 text-xs text-slate-300"
                  >
                    Unblock
                  </button>
                </div>
              ))
            ))}

          {tab === 'friends' &&
            (friends.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No friends yet</p>
            ) : (
              friends.map((u) => (
                <button
                  key={u._id}
                  onClick={() => openChatWith(u._id)}
                  className="glass-card flex w-full items-center gap-3 !rounded-xl p-3 text-left"
                >
                  <Avatar user={u} size={40} showPresence />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-slate-100">{u.username}</p>
                    <p className="truncate text-xs text-slate-500">{u.presence}</p>
                  </div>
                </button>
              ))
            ))}
        </div>
      </motion.div>
    </div>
  );
}
