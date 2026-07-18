import { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import EmojiPicker from 'emoji-picker-react';
import { api } from '../../services/api.js';
import { addMessage, setReplyTo } from '../../redux/chatSlice.js';
import { getSocket } from '../../services/socket.js';
import { formatBytes } from '../../utils/format.js';

function MessageInput({ chatId }) {
  const dispatch = useDispatch();
  const replyTo = useSelector((s) => s.chat.replyToByChat[chatId]);
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [picker, setPicker] = useState(false);
  const typingRef = useRef(false);
  const typingTimeout = useRef(null);
  const fileInput = useRef(null);

  const emitTyping = () => {
    const socket = getSocket();
    if (!typingRef.current) {
      typingRef.current = true;
      socket?.emit('typing:start', { chatId });
    }
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      typingRef.current = false;
      socket?.emit('typing:stop', { chatId });
    }, 1500);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() && files.length === 0) return;
    setSending(true);
    try {
      let attachments = [];
      if (files.length > 0) {
        const form = new FormData();
        files.forEach((f) => form.append('files', f));
        const { data } = await api.post('/upload', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        attachments = data.attachments;
      }
      const { data } = await api.post('/messages', {
        chatId,
        content: text.trim(),
        attachments,
        replyTo: replyTo?._id,
      });
      dispatch(addMessage(data.message));
      setText('');
      setFiles([]);
      dispatch(setReplyTo({ chatId, message: null }));
      getSocket()?.emit('typing:stop', { chatId });
      typingRef.current = false;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border-t border-slate-800 bg-slate-900 p-3">
      {replyTo && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border-l-2 border-indigo-400 bg-slate-800 px-3 py-2 text-xs">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-indigo-300">{replyTo.sender?.username || 'User'}</p>
            <p className="truncate text-slate-300">
              {replyTo.attachments?.length > 0 && !replyTo.content
                ? `📎 ${replyTo.attachments[0].name}`
                : replyTo.content}
            </p>
          </div>
          <button
            onClick={() => dispatch(setReplyTo({ chatId, message: null }))}
            className="text-slate-400 hover:text-red-400"
          >
            ×
          </button>
        </div>
      )}
      {files.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {files.map((f, i) => (
            <span
              key={i}
              className="flex items-center gap-1 rounded-lg bg-slate-800 px-2 py-1 text-xs"
            >
              📎 {f.name} ({formatBytes(f.size)})
              <button
                onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                className="ml-1 text-slate-400 hover:text-red-400"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <form onSubmit={handleSend} className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800"
          title="Attach files"
        >
          📎
        </button>
        <input
          ref={fileInput}
          type="file"
          multiple
          hidden
          onChange={(e) => setFiles((prev) => [...prev, ...Array.from(e.target.files)].slice(0, 5))}
        />
        <button
          type="button"
          onClick={() => setPicker((p) => !p)}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800"
          title="Emoji"
        >
          😊
        </button>
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            emitTyping();
          }}
          placeholder="Type a message..."
          className="flex-1 rounded-full border border-slate-700 bg-slate-800/60 px-4 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={sending}
          className="rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Send
        </button>
      </form>
      {picker && (
        <div className="absolute bottom-20 left-3 z-30">
          <EmojiPicker
            onEmojiClick={(e) => {
              setText((t) => t + e.emoji);
              setPicker(false);
            }}
            width={280}
            height={320}
            previewConfig={{ showPreview: false }}
          />
        </div>
      )}
    </div>
  );
}

export default MessageInput;
