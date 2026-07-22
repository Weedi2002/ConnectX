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
    ? chat?.members
        ?.filter((m) => typingIds.includes(m._id))
        .map((m) => m.username)
        .join(', ')
    : '';

  useEffect(() => {
    setShowInfo(false);
  }, [activeChatId]);

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
    api.get(`/messages/${activeChatId}/pinned`).then((r) => {
      if (active) setPinned(r.data.messages);
    });
    return () => { active = false; };
  }, [activeChatId]);

  const handleForward = (msg) => setForwardMsg(msg);

  const handleSmartReply = async () => {
    if (!activeChatId || aiBusy) return;
    setAiBusy(true);
    try {
      const { data } = await aiApi.smartReply(activeChatId);
      setSuggestions(data.suggestions || []);
      if (!data.suggestions?.length) toast('No suggestions right now');
    } catch (err) {
      toast.error(err.response?.data?.error || 'AI unavailable');
    } finally {
      setAiBusy(false);
    }
  };

  const handleSummarize = async () => {
    if (!activeChatId || aiBusy) return;
    setAiBusy(true);
    try {
      const { data } = await aiApi.summarize(activeChatId);
      setSummary(data.summary || 'No summary available.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'AI unavailable');
    } finally {
      setAiBusy(false);
    }
  };

  const toggleSetting = async (key) => {
    try {
      const { data } = await chatSettingsApi.update(activeChatId, key, !settings[key]);
      dispatch(updateChatSettings({ chatId: activeChatId, settings: data.settings }));
    } catch {
      toast.error('Failed to update');
    }
  };

  useEffect(() => {
    const socket = getSocket();
    const refreshPinned = () => {
      if (!activeChatId) return;
      api.get(`/messages/${activeChatId}/pinned`).then((r) => setPinned(r.data.messages));
    };
    socket?.on('message:updated', refreshPinned);
    return () => socket?.off('message:updated', refreshPinned);
  }, [activeChatId]);

  /* ── Empty state ── */
  if (!activeChatId || !chat) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-3xl glass-card text-5xl">
            💬
          </div>
          <p className="text-lg font-medium text-slate-300">Select a chat</p>
          <p className="text-sm text-slate-500 mt-1">Pick a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  const headerAvatar = isGroup ? { username: chat.name, avatar: chat.avatar } : peer;
  const subtitle = isGroup
    ? typingNames
      ? `${typingNames} typing...`
      : `${chat.members.length} members`
    : typingIds.length > 0
      ? 'typing...'
      : peer?.presence === 'online'
        ? 'Online'
        : `Last seen ${formatLastSeen(peer?.lastSeen)}`;

  return (
    <div className="relative flex h-full flex-col min-w-0">
      {/* ── Glass Header ── */}
      <header className="glass flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
        <button
          onClick={() => dispatch(setActiveChat(null))}
          className="rounded-xl p-2 text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 transition-colors md:hidden"
        >
          ←
        </button>
        <button
          onClick={() => isGroup && setShowInfo((v) => !v)}
          className="flex min-w-0 items-center gap-3 text-left"
        >
          <Avatar user={headerAvatar} size={40} showPresence={!isGroup} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-100">{peer?.username || chat.name}</p>
            <p className="truncate text-xs text-slate-400">{subtitle}</p>
          </div>
        </button>

        <div className="ml-auto flex items-center gap-1">
          <button
            className="rounded-xl p-2 text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 transition-colors"
            title="Voice call"
          >
            📞
          </button>
          <button
            className="rounded-xl p-2 text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 transition-colors"
            title="Video call"
          >
            📹
          </button>
          {isGroup && (
            <button
              onClick={() => setShowInfo((v) => !v)}
              className="rounded-xl p-2 text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 transition-colors"
              title="Group info"
            >
              ⓘ
            </button>
          )}
          <button
            onClick={() => toggleSetting('pinned')}
            className="rounded-xl p-2 text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 transition-colors"
            title="Pin chat"
          >
            {settings.pinned ? '📌' : '📍'}
          </button>
          <button
            onClick={() => toggleSetting('favorite')}
            className="rounded-xl p-2 text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 transition-colors"
            title="Favorite"
          >
            {settings.favorite ? '⭐' : '☆'}
          </button>
          <button
            onClick={handleSmartReply}
            disabled={aiBusy}
            className="rounded-xl p-2 text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 transition-colors disabled:opacity-50"
            title="AI smart replies"
          >
            {aiBusy ? '⏳' : '✨'}
          </button>
        </div>
      </header>

      {/* ── Messages ── */}
      <MessageList chatId={activeChatId} isGroup={isGroup} onForward={handleForward} />

      {/* ── Pinned bar ── */}
      {pinned.length > 0 && (
        <div className="glass-light flex items-center gap-2 mx-3 mb-2 rounded-xl px-4 py-2 text-xs text-slate-300">
          <span className="text-sm">📌</span>
          <span className="truncate">
            <span className="font-semibold">{pinned[0].sender?.username}: </span>
            {pinned[0].content || '📎 attachment'}
          </span>
          {pinned.length > 1 && (
            <span className="ml-auto whitespace-nowrap text-slate-500">
              +{pinned.length - 1} more
            </span>
          )}
        </div>
      )}

      {/* ── Input ── */}
      <MessageInput
        chatId={activeChatId}
        suggestions={suggestions}
        onUseSuggestion={() => setSuggestions([])}
        onSummarize={handleSummarize}
        aiBusy={aiBusy}
      />

      {forwardMsg && <ForwardModal message={forwardMsg} onClose={() => setForwardMsg(null)} />}

      {isGroup && showInfo && (
        <div className="absolute inset-0 z-20 md:static md:inset-auto">
          <GroupInfoPanel chat={chat} onClose={() => setShowInfo(false)} />
        </div>
      )}

      {summary !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setSummary(null)}
        >
          <div
            className="glass max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-3xl p-6 shadow-glass"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-lg font-semibold text-slate-100">✨ Conversation summary</p>
              <button
                onClick={() => setSummary(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/[0.06] hover:text-red-400"
              >
                ×
              </button>
            </div>
            <div className="whitespace-pre-wrap text-sm text-slate-200 leading-relaxed">{summary}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatWindow;
