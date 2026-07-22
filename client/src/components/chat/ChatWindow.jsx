import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { fetchMessages, setActiveChat, updateChatSettings } from '../../redux/chatSlice.js';
import { getSocket } from '../../services/socket.js';
import { api, chatSettingsApi, aiApi } from '../../services/api.js';
import Avatar from '../Avatar.jsx';
import MessageList from './MessageList.jsx';
import MessageInput from './MessageInput.jsx';
import GroupInfoPanel from './GroupInfoPanel.jsx';
import ForwardModal from './ForwardModal.jsx';
import { formatLastSeen } from '../../utils/format.js';

function ChatWindow() {
  const dispatch = useDispatch();
  const { chats, activeChatId, typingByChat } = useSelector((s) => s.chat);
  const userId = useSelector((s) => s.auth.user?._id);
  const [showInfo, setShowInfo] = useState(false);
  const [forwardMsg, setForwardMsg] = useState(null);
  const [pinned, setPinned] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [aiBusy, setAiBusy] = useState(false);
  const [summary, setSummary] = useState(null);

  const chat = chats.find((c) => c._id === activeChatId);
  const isGroup = chat?.isGroup;
  const settings = useSelector((s) => s.chat.settingsByChat[activeChatId]) || {};
  const peer = chat && !isGroup ? chat.members?.find((m) => m._id !== userId) : null;
  const typingIds = (typingByChat[activeChatId] || []).filter((id) => id !== userId);
  const typingNames = isGroup
    ? chat?.members?.filter((m) => typingIds.includes(m._id)).map((m) => m.username).join(', ')
    : '';

  useEffect(() => { setShowInfo(false); }, [activeChatId]);

  useEffect(() => {
    if (!activeChatId) return;
    dispatch(fetchMessages({ chatId: activeChatId }));
    const socket = getSocket();
    socket?.emit('chat:join', activeChatId);
    socket?.emit('message:delivered', { chatId: activeChatId });
    socket?.emit('message:read', { chatId: activeChatId });
    api.patch(`/messages/${activeChatId}/read`).catch(() => {});
  }, [activeChatId, dispatch]);

  useEffect(() => {
    if (!activeChatId) return;
    let active = true;
    api.get(`/messages/${activeChatId}/pinned`).then((r) => { if (active) setPinned(r.data.messages); });
    return () => { active = false; };
  }, [activeChatId]);

  const handleForward = (msg) => setForwardMsg(msg);

  const handleSmartReply = async () => {
    if (!activeChatId || aiBusy) return;
    setAiBusy(true);
    try { const { data } = await aiApi.smartReply(activeChatId); setSuggestions(data.suggestions || []); if (!data.suggestions?.length) toast('No suggestions'); }
    catch (err) { toast.error(err.response?.data?.error || 'AI unavailable'); }
    finally { setAiBusy(false); }
  };

  const toggleSetting = async (key) => {
    try { const { data } = await chatSettingsApi.update(activeChatId, key, !settings[key]); dispatch(updateChatSettings({ chatId: activeChatId, settings: data.settings })); }
    catch { toast.error('Failed'); }
  };

  useEffect(() => {
    const socket = getSocket();
    const refresh = () => { if (!activeChatId) return; api.get(`/messages/${activeChatId}/pinned`).then((r) => setPinned(r.data.messages)); };
    socket?.on('message:updated', refresh);
    return () => socket?.off('message:updated', refresh);
  }, [activeChatId]);

  if (!activeChatId || !chat) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl glass-card text-4xl">💬</div>
          <p className="text-base font-medium text-slate-200">Select a chat</p>
          <p className="text-sm text-slate-400 mt-1">Pick a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  const headerAvatar = isGroup ? { username: chat.name, avatar: chat.avatar } : peer;
  const subtitle = isGroup
    ? typingNames ? `${typingNames} typing...` : `${chat.members.length} members`
    : typingIds.length > 0 ? 'typing...' : peer?.presence === 'online' ? 'Online' : `Last seen ${formatLastSeen(peer?.lastSeen)}`;

  return (
    <div className="relative flex h-full flex-col min-w-0">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.08]">
        <button onClick={() => dispatch(setActiveChat(null))} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/[0.08] md:hidden">←</button>
        <button onClick={() => isGroup && setShowInfo((v) => !v)} className="flex min-w-0 items-center gap-3 text-left">
          <Avatar user={headerAvatar} size={40} showPresence={!isGroup} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-100">{peer?.username || chat.name}</p>
            <p className="truncate text-xs text-slate-400">{subtitle}</p>
          </div>
        </button>
        <div className="ml-auto flex items-center gap-1">
          <button className="rounded-lg p-2.5 text-slate-400 hover:bg-white/[0.08] hover:text-slate-200" title="Voice call">📞</button>
          <button className="rounded-lg p-2.5 text-slate-400 hover:bg-white/[0.08] hover:text-slate-200" title="Video call">📹</button>
          {isGroup && <button onClick={() => setShowInfo((v) => !v)} className="rounded-lg p-2.5 text-slate-400 hover:bg-white/[0.08] hover:text-slate-200">ⓘ</button>}
          <button onClick={() => toggleSetting('pinned')} className="rounded-lg p-2.5 text-slate-400 hover:bg-white/[0.08] hover:text-slate-200">{settings.pinned ? '📌' : '📍'}</button>
          <button onClick={() => toggleSetting('favorite')} className="rounded-lg p-2.5 text-slate-400 hover:bg-white/[0.08] hover:text-slate-200">{settings.favorite ? '⭐' : '☆'}</button>
          <button onClick={handleSmartReply} disabled={aiBusy} className="rounded-lg p-2.5 text-slate-400 hover:bg-white/[0.08] hover:text-slate-200 disabled:opacity-50">{aiBusy ? '⏳' : '✨'}</button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 min-h-0">
        <MessageList chatId={activeChatId} isGroup={isGroup} onForward={handleForward} />
      </div>

      {/* Pinned */}
      {pinned.length > 0 && (
        <div className="glass flex items-center gap-2 mx-2 mb-1 rounded-lg px-3 py-1.5 text-[11px] text-slate-300">
          <span>📌</span>
          <span className="truncate"><span className="font-semibold">{pinned[0].sender?.username}: </span>{pinned[0].content || '📎'}</span>
          {pinned.length > 1 && <span className="ml-auto text-slate-500">+{pinned.length - 1}</span>}
        </div>
      )}

      {/* Input */}
      <MessageInput chatId={activeChatId} suggestions={suggestions} onUseSuggestion={() => setSuggestions([])} />

      {isGroup && showInfo && (
        <div className="absolute inset-0 z-20 md:static md:inset-auto">
          <GroupInfoPanel chat={chat} onClose={() => setShowInfo(false)} />
        </div>
      )}

      {forwardMsg && <ForwardModal message={forwardMsg} onClose={() => setForwardMsg(null)} />}

      {summary !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setSummary(null)}>
          <div className="glass max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl p-5 shadow-glass" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-lg font-semibold text-slate-100">✨ Summary</p>
              <button onClick={() => setSummary(null)} className="text-slate-400 hover:text-red-400">×</button>
            </div>
            <div className="whitespace-pre-wrap text-sm text-slate-200 leading-relaxed">{summary}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatWindow;
