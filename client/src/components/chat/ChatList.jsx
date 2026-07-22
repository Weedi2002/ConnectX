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
    if (type === 'groups') {
      return (
        <div className="flex flex-col items-center py-6 text-center">
          <p className="text-xs text-slate-500">No groups yet</p>
        </div>
      );
    }
    return null;
  }

  return (
    <ul className="space-y-1">
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
                'flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-all',
                isActive
                  ? 'bg-white/[0.1] border border-white/[0.08]'
                  : 'hover:bg-white/[0.05]',
              )}
            >
              <div className="relative flex-shrink-0">
                <Avatar user={peer} size={38} showPresence={!chat.isGroup} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1.5">
                  <p className="truncate text-[13px] font-medium text-slate-100">
                    {peer.username}
                  </p>
                  {timeStr && (
                    <span className="flex-shrink-0 text-[10px] text-slate-500">{timeStr}</span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-1.5 mt-0.5">
                  <p className="truncate text-[11px] text-slate-400">
                    {last?.attachments?.length
                      ? '📎 Attachment'
                      : last?.content || 'No messages yet'}
                  </p>
                  {unread > 0 && (
                    <span className="flex h-4 min-w-4 flex-shrink-0 items-center justify-center rounded-full bg-cyan-500 px-1 text-[9px] font-bold text-white">
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
