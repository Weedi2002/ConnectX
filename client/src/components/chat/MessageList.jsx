import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMessages } from '../../redux/chatSlice.js';
import MessageBubble from './MessageBubble.jsx';
import { MessagesSkeleton } from '../Skeleton.jsx';

const EMPTY = [];

function MessageList({ chatId, isGroup, onForward }) {
  const dispatch = useDispatch();
  const stored = useSelector((s) => s.chat.messagesByChat[chatId]);
  const messages = useMemo(() => stored || EMPTY, [stored]);
  const hasMore = useSelector((s) => s.chat.hasMoreByChat[chatId]);
  const loading = useSelector((s) => s.chat.loadingMessages);
  const userId = useSelector((s) => s.auth.user?._id);

  const containerRef = useRef(null);
  const bottomRef = useRef(null);
  const prevHeightRef = useRef(0);
  const loadingRef = useRef(false);

  const lastId = messages[messages.length - 1]?._id;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [lastId]);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore || messages.length === 0) return;
    loadingRef.current = true;
    const container = containerRef.current;
    prevHeightRef.current = container?.scrollHeight || 0;
    await dispatch(fetchMessages({ chatId, before: messages[0].createdAt }));
    requestAnimationFrame(() => {
      if (container) {
        container.scrollTop = container.scrollHeight - prevHeightRef.current;
      }
      loadingRef.current = false;
    });
  }, [dispatch, chatId, hasMore, messages]);

  const onScroll = (e) => {
    if (e.target.scrollTop < 60) loadMore();
  };

  if (loading && messages.length === 0) return <MessagesSkeleton />;

  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      className="flex-1 space-y-2 overflow-y-auto px-4 py-4"
    >
      {hasMore && <p className="text-center text-xs text-slate-500">Scroll up to load more...</p>}
      {messages.map((msg) => (
        <MessageBubble
          key={msg._id}
          message={msg}
          own={msg.sender?._id === userId}
          isGroup={isGroup}
          onForward={onForward}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

export default MessageList;
