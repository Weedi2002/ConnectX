import { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import EmojiPicker from 'emoji-picker-react';
import { api } from '../../services/api.js';
import { addMessage, setReplyTo } from '../../redux/chatSlice.js';
import { getSocket } from '../../services/socket.js';
import { formatBytes, formatDuration } from '../../utils/format.js';

function MessageInput({ chatId, suggestions = [], onUseSuggestion }) {
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
    if (!typingRef.current) { typingRef.current = true; socket?.emit('typing:start', { chatId }); }
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => { typingRef.current = false; socket?.emit('typing:stop', { chatId }); }, 1500);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() && files.length === 0) return;
    setSending(true);
    try {
      let attachments = [];
      if (files.length > 0) { const form = new FormData(); files.forEach((f) => form.append('files', f)); const { data } = await api.post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } }); attachments = data.attachments; }
      const { data } = await api.post('/messages', { chatId, content: text.trim(), attachments, replyTo: replyTo?._id });
      dispatch(addMessage(data.message));
      setText(''); setFiles([]);
      dispatch(setReplyTo({ chatId, message: null }));
      getSocket()?.emit('typing:stop', { chatId });
      typingRef.current = false;
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSending(false); }
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
        setRecording(false); setRecordingTime(0);
      };
      recorder.start();
      setRecording(true); setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } catch { toast.error('Microphone denied'); setRecording(false); }
  };

  const stopRecording = () => { mediaRecorderRef.current?.stop(); };
  const cancelRecording = () => { cancelledRef.current = true; stopRecording(); };

  const uploadVoice = async (blob) => {
    if (blob.size < 1000) { toast.error('Too short'); return; }
    setSending(true);
    try {
      const ext = blob.type.includes('mp4') ? 'm4a' : 'webm';
      const file = new File([blob], `voice-${Date.now()}.${ext}`, { type: blob.type });
      const form = new FormData(); form.append('files', file);
      const { data } = await api.post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      const att = data.attachments[0];
      const { data: msg } = await api.post('/messages', { chatId, content: '', attachments: [{ url: att.url, publicId: att.publicId, type: 'audio', name: att.name, size: att.size, mime: att.mime }] });
      dispatch(addMessage(msg.message));
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSending(false); }
  };

  return (
    <div className="glass-input-bar border-t border-white/[0.06] px-4 py-3">
      {replyTo && (
        <div className="mb-2.5 flex items-center gap-2 rounded-xl border-l-2 border-cyan-400 bg-white/[0.06] px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-cyan-300">{replyTo.sender?.username}</p>
            <p className="truncate text-[11px] text-slate-300">{replyTo.attachments?.length > 0 && !replyTo.content ? `📎 ${replyTo.attachments[0].name}` : replyTo.content}</p>
          </div>
          <button onClick={() => dispatch(setReplyTo({ chatId, message: null }))} className="text-slate-400 hover:text-red-400">×</button>
        </div>
      )}

      {files.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {files.map((f, i) => (
            <span key={i} className="flex items-center gap-1 rounded-full bg-white/[0.08] px-2.5 py-1 text-[10px]">
              📎 {f.name} ({formatBytes(f.size)})
              <button onClick={() => setFiles((p) => p.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-red-400">×</button>
            </span>
          ))}
        </div>
      )}

      {recording && (
        <div className="mb-2.5 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2 text-[12px]">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          <span className="text-slate-300">Recording… {formatDuration(recordingTime)}</span>
          <span className="ml-auto flex gap-1.5">
            <button onClick={cancelRecording} className="rounded-lg px-2.5 py-1 text-[10px] text-red-300 hover:bg-white/[0.06]">✕</button>
            <button onPointerDown={stopRecording} className="glass-btn-primary px-2.5 py-1 text-[10px]">⏹</button>
          </span>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {suggestions.map((s, i) => (
            <button key={i} type="button" onClick={() => { setText((t) => (t ? `${t} ${s}` : s)); onUseSuggestion?.(s); }} className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 text-[10px] text-cyan-200 hover:bg-cyan-500/20">{s}</button>
          ))}
        </div>
      )}

      <form onSubmit={handleSend} className="flex items-center gap-2">
        <button type="button" onClick={() => setPicker((p) => !p)} className="flex-shrink-0 rounded-full p-2 text-slate-400 hover:bg-white/[0.08] hover:text-slate-200 transition-colors" title="Emoji">
          😊
        </button>
        <input ref={fileInput} type="file" multiple hidden onChange={(e) => setFiles((p) => [...p, ...Array.from(e.target.files)].slice(0, 5))} />
        <input
          value={text}
          onChange={(e) => { setText(e.target.value); emitTyping(); }}
          placeholder="Type your message here..."
          className="message-input flex-1 rounded-full px-4 py-2.5 text-[12px]"
        />
        <button type="button" onClick={() => fileInput.current?.click()} className="flex-shrink-0 rounded-full p-2 text-slate-400 hover:bg-white/[0.08] hover:text-slate-200 transition-colors" title="Attach">
          📎
        </button>
        {recording ? (
          <span className="flex-shrink-0 rounded-full bg-red-500/20 px-3 py-2 text-[11px] text-red-300">●</span>
        ) : (
          <button type="button" onPointerDown={startRecording} disabled={sending} className="flex-shrink-0 rounded-full p-2 text-slate-400 hover:bg-white/[0.08] hover:text-slate-200 disabled:opacity-50 transition-colors" title="Record">
            🎤
          </button>
        )}
      </form>

      {picker && <div className="absolute bottom-16 left-4 z-30"><EmojiPicker onEmojiClick={(e) => { setText((t) => t + e.emoji); setPicker(false); }} width={260} height={300} previewConfig={{ showPreview: false }} /></div>}
    </div>
  );
}

export default MessageInput;
