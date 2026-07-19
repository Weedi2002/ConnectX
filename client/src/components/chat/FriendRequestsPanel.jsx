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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900"
      >
        <div className="flex items-center justify-between border-b border-slate-800 p-4">
          <h2 className="font-semibold text-slate-100">Friend Requests</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            ×
          </button>
        </div>

        <div className="flex gap-1 px-4 pt-3">
          {[
            { k: 'incoming', l: `Incoming (${incoming.length})` },
            { k: 'sent', l: `Sent (${sent.length})` },
            { k: 'friends', l: `Friends (${friends.length})` },
            { k: 'blocked', l: `Blocked (${blocked.length})` },
          ].map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={
                'rounded-full px-3 py-1 text-xs ' +
                (tab === t.k ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-300')
              }
            >
              {t.l}
            </button>
          ))}
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4">
          {tab === 'incoming' &&
            (incoming.length === 0 ? (
              <p className="text-center text-sm text-slate-500">No incoming requests</p>
            ) : (
              incoming.map((r) => (
                <div
                  key={r._id}
                  className="mb-2 flex items-center gap-3 rounded-lg bg-slate-800/60 p-2"
                >
                  <Avatar user={r.sender} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-slate-100">{r.sender?.username}</p>
                  </div>
                  <button
                    onClick={() => accept(r._id)}
                    className="rounded-lg bg-indigo-500 px-3 py-1 text-xs text-white"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => reject(r._id)}
                    className="rounded-lg bg-slate-700 px-3 py-1 text-xs text-slate-200"
                  >
                    Reject
                  </button>
                </div>
              ))
            ))}

          {tab === 'sent' &&
            (sent.length === 0 ? (
              <p className="text-center text-sm text-slate-500">No sent requests</p>
            ) : (
              sent.map((r) => (
                <div
                  key={r._id}
                  className="mb-2 flex items-center gap-3 rounded-lg bg-slate-800/60 p-2"
                >
                  <Avatar user={r.recipient} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-slate-100">{r.recipient?.username}</p>
                    <p className="text-xs text-slate-400">Pending</p>
                  </div>
                  <button
                    onClick={() => cancel(r._id)}
                    className="rounded-lg bg-slate-700 px-3 py-1 text-xs text-slate-200"
                  >
                    Cancel
                  </button>
                </div>
              ))
            ))}

          {tab === 'blocked' &&
            (blocked.length === 0 ? (
              <p className="text-center text-sm text-slate-500">No blocked users</p>
            ) : (
              blocked.map((u) => (
                <div
                  key={u._id}
                  className="mb-2 flex items-center gap-3 rounded-lg bg-slate-800/60 p-2"
                >
                  <Avatar user={u} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-slate-100">{u.username}</p>
                  </div>
                  <button
                    onClick={() => unblock(u._id)}
                    className="rounded-lg bg-slate-700 px-3 py-1 text-xs text-slate-200"
                  >
                    Unblock
                  </button>
                </div>
              ))
            ))}

          {tab === 'friends' &&
            (friends.length === 0 ? (
              <p className="text-center text-sm text-slate-500">No friends yet</p>
            ) : (
              friends.map((u) => (
                <button
                  key={u._id}
                  onClick={() => openChatWith(u._id)}
                  className="mb-2 flex w-full items-center gap-3 rounded-lg bg-slate-800/60 p-2 text-left hover:bg-slate-700"
                >
                  <Avatar user={u} size={40} showPresence />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-slate-100">{u.username}</p>
                    <p className="truncate text-xs text-slate-400">{u.presence}</p>
                  </div>
                </button>
              ))
            ))}
        </div>
      </motion.div>
    </div>
  );
}
