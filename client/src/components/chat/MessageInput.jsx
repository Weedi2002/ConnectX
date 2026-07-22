import { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import EmojiPicker from 'emoji-picker-react';
import { api } from '../../services/api.js';
import { addMessage, setReplyTo } from '../../redux/chatSlice.js';
import { getSocket } from '../../services/socket.js';
import { formatBytes, formatDuration } from '../../utils/format.js';

function MessageInput({ chatId, suggestions = [], onUseSuggestion, onSummarize, aiBusy }) {
  const dispatch = useDispatch();
  const replyTo = useSelector((s) => s.chat.replyToByChat[chatId]);
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [picker, setPicker] = useState(false);

  const typingRef = useRef(false);
  const typingTimeout = useRef(null);
  const fileInput = useRef(null);

  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const cancelledRef = useRef(false);

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
        chatId, content: text.trim(), attachments, replyTo: replyTo?._id,
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

  const startRecording = async () => {
    if (recording || sending) return;
    cancelledRef.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        clearInterval(timerRef.current);
        mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
        if (cancelledRef.current) { setRecording(false); setRecordingTime(0); return; }
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        await uploadVoice(blob);
        setRecording(false);
        setRecordingTime(0);
      };
      recorder.start();
      setRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } catch {
      toast.error('Microphone access denied');
      setRecording(false);
    }
  };

  const stopRecording = () => { mediaRecorderRef.current?.stop(); };
  const cancelRecording = () => { cancelledRef.current = true; stopRecording(); };

  const uploadVoice = async (blob) => {
    if (blob.size < 1000) { toast.error('Recording too short'); return; }
    setSending(true);
    try {
      const ext = blob.type.includes('mp4') ? 'm4a' : 'webm';
      const file = new File([blob], `voice-${Date.now()}.${ext}`, { type: blob.type });
      const form = new FormData();
      form.append('files', file);
      const { data } = await api.post('/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const att = data.attachments[0];
      const attachment = { url: att.url, publicId: att.publicId, type: 'audio', name: att.name, size: att.size, mime: att.mime };
      const { data: msg } = await api.post('/messages', { chatId, content: '', attachments: [attachment] });
      dispatch(addMessage(msg.message));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send voice message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="glass border-t border-white/[0.06] px-4 py-3">
      {/* Reply preview */}
      {replyTo && (
        <div className="glass-card mb-2 flex items-center gap-2 !rounded-xl border-l-2 border-indigo-400 px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-indigo-300">{replyTo.sender?.username || 'User'}</p>
            <p className="truncate text-xs text-slate-300">
              {replyTo.attachments?.length > 0 && !replyTo.content
                ? `📎 ${replyTo.attachments[0].name}`
                : replyTo.content}
            </p>
          </div>
          <button onClick={() => dispatch(setReplyTo({ chatId, message: null }))} className="text-slate-400 hover:text-red-400">×</button>
        </div>
      )}

      {/* File chips */}
      {files.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {files.map((f, i) => (
            <span key={i} className="glass-card flex items-center gap-1.5 !rounded-full px-3 py-1 text-xs">
              📎 {f.name} ({formatBytes(f.size)})
              <button onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))} className="ml-0.5 text-slate-400 hover:text-red-400">×</button>
            </span>
          ))}
        </div>
      )}

      {/* Recording indicator */}
      {recording && (
        <div className="glass-card mb-2 flex items-center gap-2 !rounded-xl px-4 py-2.5 text-sm">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
          <span className="text-slate-300">Recording… {formatDuration(recordingTime)}</span>
          <span className="ml-auto flex gap-2">
            <button onClick={cancelRecording} className="glass-card !rounded-lg px-3 py-1 text-xs text-red-300">✕ Cancel</button>
            <button onPointerDown={stopRecording} className="glass-btn-primary px-3 py-1 text-xs">⏹ Send</button>
          </span>
        </div>
      )}

      {/* AI suggestions */}
      {suggestions.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { setText((t) => (t ? `${t} ${s}` : s)); onUseSuggestion?.(s); }}
              className="glass-card !rounded-full border-indigo-500/20 px-3 py-1 text-xs text-indigo-200 hover:bg-indigo-500/10"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <form onSubmit={handleSend} className="flex items-center gap-2">
        <button type="button" onClick={() => fileInput.current?.click()} className="flex-shrink-0 rounded-xl p-2.5 text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 transition-colors" title="Attach files">
          📎
        </button>
        <input ref={fileInput} type="file" multiple hidden onChange={(e) => setFiles((prev) => [...prev, ...Array.from(e.target.files)].slice(0, 5))} />

        <button type="button" onClick={() => setPicker((p) => !p)} className="flex-shrink-0 rounded-xl p-2.5 text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 transition-colors" title="Emoji">
          😊
        </button>

        <input
          value={text}
          onChange={(e) => { setText(e.target.value); emitTyping(); }}
          placeholder="Type your message here..."
          className="glass-input flex-1 px-4 py-2.5 text-sm"
        />

        <button type="button" onClick={onSummarize} disabled={aiBusy} className="flex-shrink-0 rounded-xl p-2.5 text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 transition-colors disabled:opacity-50" title="AI summarize">
          ✨
        </button>

        {recording ? (
          <span className="glass-card flex-shrink-0 !rounded-full bg-red-500/20 px-4 py-2.5 text-sm text-red-300">● Rec</span>
        ) : (
          <button type="button" onPointerDown={startRecording} disabled={sending} className="flex-shrink-0 rounded-xl p-2.5 text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 transition-colors disabled:opacity-50" title="Hold to record voice message">
            🎤
          </button>
        )}

        <button type="submit" disabled={sending || (!text.trim() && files.length === 0)} className="glass-btn-primary flex-shrink-0 px-5 py-2.5 text-sm">
          {sending ? '...' : '➤'}
        </button>
      </form>

      {picker && (
        <div className="absolute bottom-20 left-3 z-30">
          <EmojiPicker
            onEmojiClick={(e) => { setText((t) => t + e.emoji); setPicker(false); }}
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
