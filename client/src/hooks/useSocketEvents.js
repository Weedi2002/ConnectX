import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket.js';
import { getAccessToken } from '../services/token.js';
import {
  addMessage,
  removeMessage,
  updateMessage,
  setTyping,
  updatePresence,
  updateChatSettings,
  incrementUnread,
  addNotification,
  upsertChat,
  removeChat,
} from '../redux/chatSlice.js';
import { addIncoming } from '../redux/friendSlice.js';

export function useSocketEvents() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const activeChatId = useSelector((s) => s.chat.activeChatId);

  useEffect(() => {
    if (!user) {
      disconnectSocket();
      return;
    }
    const token = getAccessToken();
    const socket = connectSocket(token);

    const onNew = ({ message }) => {
      dispatch(addMessage(message));
      if (
        String(message.chat) !== String(activeChatId) &&
        String(message.sender?._id) !== String(user._id)
      ) {
        dispatch(incrementUnread(message.chat));
      }
    };
    const onUpdated = ({ message }) => dispatch(updateMessage(message));
    const onDeleted = ({ messageId }) => dispatch(removeMessage({ messageId }));
    const onPresence = (p) => dispatch(updatePresence(p));
    const onNotification = ({ notification }) => dispatch(addNotification(notification));
    const onFriendRequest = ({ request }) => dispatch(addIncoming(request));
    const onTypingStart = ({ chatId, userId }) =>
      dispatch(setTyping({ chatId, userId, typing: true }));
    const onTypingStop = ({ chatId, userId }) =>
      dispatch(setTyping({ chatId, userId, typing: false }));
    const onChatNew = ({ chat }) => {
      dispatch(upsertChat(chat));
      socket.emit('chat:join', chat._id);
    };
    const onChatUpdated = ({ chat }) => dispatch(upsertChat(chat));
    const onChatRemoved = ({ chatId }) => dispatch(removeChat({ chatId }));
    const onChatSettings = ({ chatId, settings }) =>
      dispatch(updateChatSettings({ chatId, settings }));

    socket.on('message:new', onNew);
    socket.on('message:updated', onUpdated);
    socket.on('message:deleted', onDeleted);
    socket.on('presence:update', onPresence);
    socket.on('typing:start', onTypingStart);
    socket.on('typing:stop', onTypingStop);
    socket.on('chat:new', onChatNew);
    socket.on('chat:updated', onChatUpdated);
    socket.on('chat:removed', onChatRemoved);
    socket.on('chat:settings', onChatSettings);
    socket.on('notification:new', onNotification);
    socket.on('friend:request', onFriendRequest);

    return () => {
      socket.off('message:new', onNew);
      socket.off('message:updated', onUpdated);
      socket.off('message:deleted', onDeleted);
      socket.off('presence:update', onPresence);
      socket.off('typing:start', onTypingStart);
      socket.off('typing:stop', onTypingStop);
      socket.off('chat:new', onChatNew);
      socket.off('chat:updated', onChatUpdated);
      socket.off('chat:removed', onChatRemoved);
      socket.off('chat:settings', onChatSettings);
      socket.off('notification:new', onNotification);
      socket.off('friend:request', onFriendRequest);
    };
  }, [user, dispatch, activeChatId]);

  return getSocket();
}
