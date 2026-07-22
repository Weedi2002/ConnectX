import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { api } from '../../services/api.js';
import Avatar from '../Avatar.jsx';

function chatLabel(chat, userId) {
  if (chat.isGroup) return { username: chat.name, avatar: chat.avatar };
  return chat.members?.find((m) => m._id !== userId) || {};
}

function ForwardModal({ message, onClose }) {
  const { chats } = useSelector((s) => s.chat);
  const userId = useSelector((s) => s.auth.user?._id);

  const forward = async (chatId) => {
    try {
      await api.post(`/messages/${message._id}/forward`, { chatId });
      toast.success('Message forwarded');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to forward');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass w-full max-w-sm rounded-3xl p-5 shadow-glass"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-100">Forward to</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
          >
            ×
          </button>
        </div>
        <ul className="max-h-72 space-y-1 overflow-y-auto">
          {chats.map((chat) => {
            const label = chatLabel(chat, userId);
            return (
              <li key={chat._id}>
                <button
                  onClick={() => forward(chat._id)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-white/[0.06] transition-colors"
                >
                  <Avatar user={label} size={36} />
                  <span className="text-sm text-slate-100">{label.username}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </motion.div>
    </div>
  );
}

export default ForwardModal;
