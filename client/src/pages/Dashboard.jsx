import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchChats, fetchNotifications } from '../redux/chatSlice.js';
import { fetchIncoming, fetchFriends } from '../redux/friendSlice.js';
import { useSocketEvents } from '../hooks/useSocketEvents.js';
import Sidebar from '../components/chat/Sidebar.jsx';
import ChatWindow from '../components/chat/ChatWindow.jsx';
import { cn } from '../utils/cn.js';

function Dashboard() {
  const dispatch = useDispatch();
  const activeChatId = useSelector((s) => s.chat.activeChatId);
  useSocketEvents();

  useEffect(() => {
    dispatch(fetchChats());
    dispatch(fetchIncoming());
    dispatch(fetchFriends());
    dispatch(fetchNotifications());
  }, [dispatch]);

  return (
    <div className="flex h-screen overflow-hidden chat-bg text-slate-100">
      <div
        className={cn(
          'glass flex-shrink-0 border-r border-white/[0.06] md:w-80 lg:w-96',
          activeChatId ? 'hidden md:flex md:flex-col' : 'flex flex-col w-full',
        )}
      >
        <Sidebar />
      </div>
      <div className={cn('flex-1 min-w-0', activeChatId ? 'flex' : 'hidden md:flex')}>
        <ChatWindow />
      </div>
    </div>
  );
}

export default Dashboard;
