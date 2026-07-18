import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { usersApi } from '../../services/api.js';
import { sendRequest, blockUser } from '../../redux/friendSlice.js';
import Avatar from '../Avatar.jsx';
import { formatLastSeen } from '../../utils/format.js';

function relStatus(lists, userId) {
  if (lists.sent.some((r) => String(r.recipient?._id) === String(userId))) return 'sent';
  if (lists.incoming.some((r) => String(r.sender?._id) === String(userId))) return 'incoming';
  if (lists.blocked.some((u) => u._id === userId)) return 'blocked';
  return 'none';
}

export default function UserProfileModal({ userId, onClose }) {
  const dispatch = useDispatch();
  const lists = useSelector((s) => s.friend);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [blocking, setBlocking] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    usersApi
      .profile(userId)
      .then((r) => active && setUser(r.data.user))
      .catch(() => active && toast.error('Could not load profile'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center text-slate-400">
          Loading...
        </div>
      </div>
    );
  }
  if (!user) return null;

  const status = relStatus(lists, user._id);

  const addFriend = async () => {
    try {
      await dispatch(sendRequest(user._id));
      toast.success('Friend request sent');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const block = async () => {
    try {
      setBlocking(true);
      await dispatch(blockUser(user._id));
      toast.success('User blocked');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally {
      setBlocking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6"
      >
        <div className="flex flex-col items-center text-center">
          <Avatar user={user} size={88} showPresence />
          <h2 className="mt-3 text-lg font-semibold text-slate-100">{user.username}</h2>
          <p className="mt-1 text-sm text-slate-400">{user.status || user.bio || 'No status'}</p>
          <p className="mt-1 text-xs text-slate-500">
            {user.presence === 'online' ? 'Online' : `Last seen ${formatLastSeen(user.lastSeen)}`}
          </p>
        </div>

        <div className="mt-6 space-y-2">
          {status === 'none' && (
            <>
              <button
                onClick={addFriend}
                className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-500 py-2 text-sm font-medium text-white"
              >
                Add Friend
              </button>
              <button
                onClick={block}
                disabled={blocking}
                className="w-full rounded-lg bg-slate-800 py-2 text-sm text-slate-200 hover:bg-slate-700"
              >
                Block
              </button>
            </>
          )}
          {status === 'sent' && (
            <p className="rounded-lg bg-slate-800 py-2 text-center text-sm text-slate-400">
              Friend request sent
            </p>
          )}
          {status === 'incoming' && (
            <p className="rounded-lg bg-slate-800 py-2 text-center text-sm text-emerald-400">
              This user sent you a friend request
            </p>
          )}
          {status === 'blocked' && (
            <button
              onClick={block}
              disabled={blocking}
              className="w-full rounded-lg bg-slate-800 py-2 text-sm text-slate-200 hover:bg-slate-700"
            >
              Unblock
            </button>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-lg py-2 text-sm text-slate-400 hover:text-slate-200"
        >
          Close
        </button>
      </motion.div>
    </div>
  );
}
