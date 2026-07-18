import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveChat } from '../../redux/chatSlice.js';
import { ChatListSkeleton } from '../Skeleton.jsx';
import Avatar from '../Avatar.jsx';
import { formatTime } from '../../utils/format.js';
import { cn } from '../../utils/cn.js';

function otherMember(chat, userId) {
  if (chat.isGroup) return { username: chat.name || 'Group', avatar: chat.avatar };
  return chat.members?.find((m) => m._id !== userId) || chat.members?.[0] || {};
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pinned', label: '📌 Pinned' },
  { key: 'favorite', label: '⭐ Fav' },
  { key: 'archived', label: '📥 Archived' },
];

function ChatList() {
  const dispatch = useDispatch();
  const { chats, loadingChats, activeChatId, settingsByChat, unreadByChat } = useSelector(
    (s) => s.chat,
  );
  const userId = useSelector((s) => s.auth.user?._id);
  const [filter, setFilter] = useState('all');

  const visible = useMemo(() => {
    const withSettings = chats.map((c) => ({ ...c, _s: settingsByChat[c._id] || {} }));
    let list = withSettings;
    if (filter === 'pinned') list = withSettings.filter((c) => c._s.pinned);
    else if (filter === 'favorite') list = withSettings.filter((c) => c._s.favorite);
    else if (filter === 'archived') list = withSettings.filter((c) => c._s.archived);
    else list = withSettings.filter((c) => !c._s.archived);

    if (filter === 'all') {
      list = [...list].sort((a, b) => {
        if (a._s.pinned !== b._s.pinned) return a._s.pinned ? -1 : 1;
        return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
      });
    }
    return list;
  }, [chats, settingsByChat, filter]);

  if (loadingChats) return <ChatListSkeleton />;

  return (
    <div>
      <div className="flex gap-1 px-3 py-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'rounded-full px-2.5 py-1 text-xs',
              filter === f.key
                ? 'bg-indigo-500 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="p-6 text-center text-sm text-slate-500">
          {filter === 'all' ? 'No chats yet. Start one!' : `No ${filter} chats`}
        </p>
      ) : (
        <ul>
          {visible.map((chat) => {
            const peer = otherMember(chat, userId);
            const last = chat.lastMessage;
            const muted = chat._s.muted;
            return (
              <li key={chat._id}>
                <button
                  onClick={() => dispatch(setActiveChat(chat._id))}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-800/60',
                    activeChatId === chat._id && 'bg-slate-800',
                  )}
                >
                  <Avatar user={peer} size={44} showPresence={!chat.isGroup} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="truncate text-sm font-medium">
                        {chat._s.pinned && '📌 '}
                        {peer.username}
                      </p>
                      <div className="flex items-center gap-1">
                        {unreadByChat[chat._id] > 0 && (
                          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                            {unreadByChat[chat._id] > 99 ? '99+' : unreadByChat[chat._id]}
                          </span>
                        )}
                        {last && (
                          <span className="text-[10px] text-slate-500">
                            {formatTime(last.createdAt)}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="flex items-center gap-1 truncate text-xs text-slate-400">
                      {muted && <span title="Muted">🔕</span>}
                      {last?.attachments?.length ? '📎 Attachment' : last?.content || 'No messages yet'}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default ChatList;
