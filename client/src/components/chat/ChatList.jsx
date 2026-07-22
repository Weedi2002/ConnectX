import { useMemo } from 'react';
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

function ChatList({ type } = {}) {
  const dispatch = useDispatch();
  const { chats, loadingChats, activeChatId, unreadByChat } = useSelector((s) => s.chat);
  const userId = useSelector((s) => s.auth.user?._id);

  const sorted = useMemo(() => {
    let filtered = chats;
    if (type === 'groups') filtered = chats.filter((c) => c.isGroup);
    else if (type === 'persons') filtered = chats.filter((c) => !c.isGroup);
    return [...filtered].sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  }, [chats, type]);

  if (loadingChats) return <ChatListSkeleton />;

  if (sorted.length === 0) {
    if (type === 'groups')
      return <p className="px-1 py-2 text-center text-[10px] text-slate-500">No groups yet</p>;
    return null;
  }

  return (
    <ul className="space-y-0.5">
      {sorted.map((chat) => {
        const peer = otherMember(chat, userId);
        const last = chat.lastMessage;
        const unread = unreadByChat[chat._id];
        const isActive = activeChatId === chat._id;
        const timeStr = last ? formatTime(last.createdAt) : '';

        return (
          <li key={chat._id}>
            <button
              onClick={() => dispatch(setActiveChat(chat._id))}
              className={cn(
                'flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left transition-all',
                isActive ? 'bg-white/[0.1]' : 'hover:bg-white/[0.05]',
              )}
            >
              <Avatar user={peer} size={34} showPresence={!chat.isGroup} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <p className="truncate text-[11px] font-medium text-slate-100">{peer.username}</p>
                  {timeStr && (
                    <span className="flex-shrink-0 text-[8px] text-slate-500">{timeStr}</span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-1 mt-0.5">
                  <p className="truncate text-[9px] text-slate-400">
                    {last?.attachments?.length ? '📎' : last?.content || 'No messages'}
                  </p>
                  {unread > 0 && (
                    <span className="flex h-3.5 min-w-3.5 flex-shrink-0 items-center justify-center rounded-full bg-cyan-500 px-1 text-[7px] font-bold text-white">
                      {unread > 99 ? '99+' : unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export default ChatList;
