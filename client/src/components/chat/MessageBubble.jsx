import { useState } from 'react';
import { motion } from 'framer-motion';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import EmojiPicker from 'emoji-picker-react';
import { api } from '../../services/api.js';
import { removeMessage, setReplyTo, updateMessage } from '../../redux/chatSlice.js';
import { formatTime, formatBytes } from '../../utils/format.js';
import { cn } from '../../utils/cn.js';
import Markdown from './Markdown.jsx';
import VoiceMessage from './VoiceMessage.jsx';

function Attachment({ att }) {
  if (att.type === 'audio') return <VoiceMessage url={att.url} name={att.name} size={att.size} own={false} />;
  if (att.type === 'image') return <a href={att.url} target="_blank" rel="noreferrer"><img src={att.url} alt={att.name} loading="lazy" className="max-h-56 rounded-xl object-cover" /></a>;
  if (att.type === 'video') return <video src={att.url} controls className="max-h-56 rounded-xl" />;
  return (
    <a href={att.url} target="_blank" rel="noreferrer" download className="flex items-center gap-2 rounded-xl bg-white/[0.08] px-3 py-2 text-sm hover:bg-white/[0.12]">
      <span>📄</span>
      <span className="min-w-0">
        <span className="block truncate">{att.name}</span>
        <span className="block text-[10px] text-slate-400">{formatBytes(att.size)}</span>
      </span>
    </a>
  );
}

function ReplyPreview({ replyTo, own }) {
  if (!replyTo || replyTo.deleted) return null;
  return (
    <div className={cn('mb-1.5 flex items-center gap-2 rounded-lg border-l-2 px-2 py-1 text-[11px]', own ? 'border-white/30 bg-white/[0.08]' : 'border-cyan-400/50 bg-white/[0.06]')}>
      <span className="font-semibold">{replyTo.sender?.username}</span>
      <span className="truncate opacity-70">{replyTo.attachments?.length > 0 && !replyTo.content ? `📎 ${replyTo.attachments[0].name}` : replyTo.content}</span>
    </div>
  );
}

const receipt = { sent: '✓', delivered: '✓✓', read: '✓✓' };

function ReactionBar({ reactions, onReact }) {
  const grouped = {};
  reactions.forEach((r) => { grouped[r.emoji] = grouped[r.emoji] || { emoji: r.emoji, count: 0 }; grouped[r.emoji].count += 1; });
  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {Object.values(grouped).map((r) => (
        <button key={r.emoji} onClick={() => onReact(r.emoji)} className="rounded-full bg-white/[0.1] px-2 py-0.5 text-[11px] hover:bg-white/[0.15]">
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
  const [translated, setTranslated] = useState(null);
  const [translating, setTranslating] = useState(false);

  const handleDelete = async () => { try { await api.delete(`/messages/${message._id}`); dispatch(removeMessage({ messageId: message._id })); } catch { toast.error('Failed'); } };
  const handleEdit = async () => { const next = prompt('Edit', message.content); if (next == null || !next.trim() || next === message.content) return; try { const { data } = await api.patch(`/messages/${message._id}`, { content: next.trim() }); dispatch(updateMessage(data.message)); } catch { toast.error('Failed'); } };
  const handleReact = async (emoji) => { setPicker(false); try { const { data } = await api.post(`/messages/${message._id}/react`, { emoji }); dispatch(updateMessage(data.message)); } catch { toast.error('Failed'); } };
  const handlePin = async () => { setMenu(false); try { const { data } = await api.post(`/messages/${message._id}/pin`); dispatch(updateMessage(data.message)); toast.success(data.message.pinned ? 'Pinned' : 'Unpinned'); } catch { toast.error('Failed'); } };
  const handleBookmark = async () => { setMenu(false); try { await api.post(`/messages/${message._id}/bookmark`); toast.success('Done'); } catch { toast.error('Failed'); } };
  const handleCopy = () => { navigator.clipboard?.writeText(message.content); setMenu(false); toast.success('Copied'); };
  const handleTranslate = async () => { setMenu(false); if (translated !== null) { setTranslated(null); return; } if (!message.content) return; setTranslating(true); try { const { data } = await api.post('/ai/translate', { text: message.content, target: 'English' }); setTranslated(data.translated); } catch { toast.error('Failed'); } finally { setTranslating(false); } };
  const handleReply = () => { dispatch(setReplyTo({ chatId, message })); setMenu(false); };

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={cn('group relative flex mb-3', own ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[65%] rounded-2xl px-3.5 py-2.5 text-[12px] leading-relaxed', own ? 'bubble-own rounded-br-sm' : 'bubble-other rounded-bl-sm')}>
        {isGroup && !own && <p className="mb-1 text-[10px] font-semibold text-cyan-300">{message.sender?.username}</p>}
        {message.forwardedFrom && <p className="mb-1 text-[9px] opacity-50">↪ Forwarded</p>}
        <ReplyPreview replyTo={message.replyTo} own={own} />
        {message.attachments?.length > 0 && <div className="mb-1.5 space-y-1.5">{message.attachments.map((att, i) => <Attachment key={i} att={att} />)}</div>}
        {message.content && <Markdown>{message.content}</Markdown>}
        {translated !== null && <div className="mt-1.5 rounded-lg bg-cyan-500/[0.1] border border-cyan-500/20 px-2 py-1 text-[11px] text-slate-300">🌐 {translated}</div>}
        {message.edited && <span className="ml-1 text-[9px] opacity-40">(edited)</span>}
        <div className="mt-1 flex items-center justify-end gap-1.5 text-[9px] opacity-50">
          <span>{formatTime(message.createdAt)}</span>
          {own && <span className={message.status === 'read' ? 'text-cyan-300 opacity-100' : ''}>{receipt[message.status] || '✓'}</span>}
          {message.pinned && <span>📌</span>}
          <button onClick={() => setMenu((m) => !m)} className="ml-0.5 hidden group-hover:inline hover:text-slate-200">⋯</button>
        </div>
        {message.reactions?.length > 0 && <ReactionBar reactions={message.reactions} onReact={handleReact} />}
        {menu && (
          <div className={cn('absolute z-20 mt-1 w-36 glass rounded-xl p-1 shadow-glass text-[11px]', own ? 'right-0' : 'left-0')}>
            <button onClick={handleReply} className="flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-left hover:bg-white/[0.08]">↩ Reply</button>
            <button onClick={() => setPicker((p) => !p)} className="flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-left hover:bg-white/[0.08]">😊 React</button>
            <button onClick={handlePin} className="flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-left hover:bg-white/[0.08]">📌 {message.pinned ? 'Unpin' : 'Pin'}</button>
            <button onClick={handleBookmark} className="flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-left hover:bg-white/[0.08]">🔖 Bookmark</button>
            {own && <button onClick={handleEdit} className="flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-left hover:bg-white/[0.08]">✏️ Edit</button>}
            <button onClick={() => { setMenu(false); onForward?.(message); }} className="flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-left hover:bg-white/[0.08]">➡️ Forward</button>
            {own && <button onClick={handleDelete} className="flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-left text-red-400 hover:bg-white/[0.08]">🗑 Delete</button>}
            <button onClick={handleCopy} className="flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-left hover:bg-white/[0.08]">📋 Copy</button>
            {message.content && <button onClick={handleTranslate} className="flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-left hover:bg-white/[0.08]">{translating ? '⏳…' : translated !== null ? '↺ Original' : '🌐 Translate'}</button>}
          </div>
        )}
        {picker && <div className="absolute z-30 mt-1"><EmojiPicker onEmojiClick={(e) => handleReact(e.emoji)} width={260} height={320} previewConfig={{ showPreview: false }} /></div>}
      </div>
    </motion.div>
  );
}

export default MessageBubble;
