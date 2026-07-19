import { useState } from 'react';
import { motion } from 'framer-motion';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import EmojiPicker from 'emoji-picker-react';
import { api } from '../../services/api.js';
import { removeMessage, setReplyTo, updateMessage } from '../../redux/chatSlice.js';
import { formatTime, formatBytes } from '../../utils/format.js';
import { cn } from '../../utils/cn.js';
import Avatar from '../Avatar.jsx';
import Markdown from './Markdown.jsx';
import VoiceMessage from './VoiceMessage.jsx';

function Attachment({ att }) {
  if (att.type === 'audio') {
    return <VoiceMessage url={att.url} name={att.name} size={att.size} own={false} />;
  }
  if (att.type === 'image') {
    return (
      <a href={att.url} target="_blank" rel="noreferrer">
        <img
          src={att.url}
          alt={att.name}
          loading="lazy"
          className="max-h-64 rounded-lg object-cover"
        />
      </a>
    );
  }
  if (att.type === 'video') {
    return <video src={att.url} controls className="max-h-64 rounded-lg" />;
  }
  return (
    <a
      href={att.url}
      target="_blank"
      rel="noreferrer"
      download
      className="flex items-center gap-2 rounded-lg bg-slate-700/50 px-3 py-2 text-sm hover:bg-slate-700"
    >
      <span className="text-lg">📄</span>
      <span className="min-w-0">
        <span className="block truncate">{att.name}</span>
        <span className="block text-xs text-slate-400">{formatBytes(att.size)}</span>
      </span>
    </a>
  );
}

function ReplyPreview({ replyTo, own }) {
  if (!replyTo || replyTo.deleted) return null;
  return (
    <div
      className={cn(
        'mb-1 flex items-center gap-2 rounded-lg border-l-2 px-2 py-1 text-xs',
        own ? 'border-white/60 bg-white/10' : 'border-indigo-400 bg-slate-700/50',
      )}
    >
      <span className="font-semibold">{replyTo.sender?.username || 'User'}</span>
      <span className="truncate opacity-80">
        {replyTo.attachments?.length > 0 && !replyTo.content
          ? `📎 ${replyTo.attachments[0].name}`
          : replyTo.content}
      </span>
    </div>
  );
}

const receipt = { sent: '✓', delivered: '✓✓', read: '✓✓' };

function ReactionBar({ reactions, onReact }) {
  const grouped = {};
  reactions.forEach((r) => {
    grouped[r.emoji] = grouped[r.emoji] || { emoji: r.emoji, count: 0, mine: false };
    grouped[r.emoji].count += 1;
  });
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {Object.values(grouped).map((r) => (
        <button
          key={r.emoji}
          onClick={() => onReact(r.emoji)}
          className="rounded-full bg-slate-700/70 px-2 py-0.5 text-xs hover:bg-slate-600"
        >
          {r.emoji} {r.count}
        </button>
      ))}
    </div>
  );
}

function MessageBubble({ message, own, isGroup, chatId, onForward }) {
  const dispatch = useDispatch();
  const [menu, setMenu] = useState(false);
  const [picker, setPicker] = useState(false);

  const handleDelete = async () => {
    try {
      await api.delete(`/messages/${message._id}`);
      dispatch(removeMessage({ messageId: message._id }));
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleEdit = async () => {
    const next = prompt('Edit message', message.content);
    if (next == null || !next.trim() || next === message.content) return;
    try {
      const { data } = await api.patch(`/messages/${message._id}`, { content: next.trim() });
      dispatch(updateMessage(data.message));
    } catch {
      toast.error('Failed to edit');
    }
  };

  const handleReact = async (emoji) => {
    setPicker(false);
    try {
      const { data } = await api.post(`/messages/${message._id}/react`, { emoji });
      dispatch(updateMessage(data.message));
    } catch {
      toast.error('Failed to react');
    }
  };

  const handlePin = async () => {
    setMenu(false);
    try {
      const { data } = await api.post(`/messages/${message._id}/pin`);
      dispatch(updateMessage(data.message));
      toast.success(data.message.pinned ? 'Pinned' : 'Unpinned');
    } catch {
      toast.error('Failed to pin');
    }
  };

  const handleBookmark = async () => {
    setMenu(false);
    try {
      await api.post(`/messages/${message._id}/bookmark`);
      toast.success('Bookmark updated');
    } catch {
      toast.error('Failed to bookmark');
    }
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(message.content);
    setMenu(false);
    toast.success('Copied');
  };

  const handleReply = () => {
    dispatch(setReplyTo({ chatId, message }));
    setMenu(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('group relative flex', own ? 'justify-end' : 'justify-start')}
    >
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-3 py-2 text-sm',
          own
            ? 'rounded-br-sm bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white'
            : 'rounded-bl-sm bg-slate-800 text-slate-100',
        )}
      >
        {isGroup && !own && (
          <p className="mb-0.5 text-xs font-semibold text-indigo-300">
            {message.sender?.username}
          </p>
        )}

        {message.forwardedFrom && (
          <p className="mb-0.5 text-[10px] opacity-70">↪ Forwarded</p>
        )}

        <ReplyPreview replyTo={message.replyTo} own={own} />

        {message.attachments?.length > 0 && (
          <div className="mb-1 space-y-2">
            {message.attachments.map((att, i) => (
              <Attachment key={i} att={att} />
            ))}
          </div>
        )}
        {message.content && <Markdown>{message.content}</Markdown>}

        {message.edited && <span className="ml-1 text-[10px] opacity-60">(edited)</span>}

        <div className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-70">
          <span>{formatTime(message.createdAt)}</span>
          {own && (
            <span className={message.status === 'read' ? 'text-sky-300' : ''}>
              {receipt[message.status] || '✓'}
            </span>
          )}
          {message.pinned && <span title="Pinned">📌</span>}
          <button
            onClick={() => setMenu((m) => !m)}
            className="ml-1 hidden group-hover:inline hover:text-slate-200"
            title="More"
          >
            ⋯
          </button>
        </div>

        {message.reactions?.length > 0 && (
          <ReactionBar reactions={message.reactions} onReact={handleReact} />
        )}

        {menu && (
          <div
            className={cn(
              'absolute z-20 mt-1 w-36 rounded-lg border border-slate-700 bg-slate-900 p-1 text-xs shadow-xl',
              own ? 'right-0' : 'left-0',
            )}
          >
            <button onClick={handleReply} className="block w-full rounded px-2 py-1 text-left hover:bg-slate-800">
              ↩ Reply
            </button>
            <button onClick={() => setPicker((p) => !p)} className="block w-full rounded px-2 py-1 text-left hover:bg-slate-800">
              😊 React
            </button>
            <button onClick={handlePin} className="block w-full rounded px-2 py-1 text-left hover:bg-slate-800">
              📌 {message.pinned ? 'Unpin' : 'Pin'}
            </button>
            <button onClick={handleBookmark} className="block w-full rounded px-2 py-1 text-left hover:bg-slate-800">
              🔖 Bookmark
            </button>
            {own && (
              <button onClick={handleEdit} className="block w-full rounded px-2 py-1 text-left hover:bg-slate-800">
                ✏️ Edit
              </button>
            )}
            <button
              onClick={() => {
                setMenu(false);
                onForward?.(message);
              }}
              className="block w-full rounded px-2 py-1 text-left hover:bg-slate-800"
            >
              ➡️ Forward
            </button>
            {own && (
              <button onClick={handleDelete} className="block w-full rounded px-2 py-1 text-left text-red-400 hover:bg-slate-800">
                🗑 Delete
              </button>
            )}
            <button onClick={handleCopy} className="block w-full rounded px-2 py-1 text-left hover:bg-slate-800">
              📋 Copy
            </button>
          </div>
        )}

        {picker && (
          <div className="absolute z-30 mt-1">
            <EmojiPicker
              onEmojiClick={(e) => handleReact(e.emoji)}
              width={280}
              height={340}
              previewConfig={{ showPreview: false }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default MessageBubble;
