import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchChats } from '../redux/chatSlice.js';
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
  }, [dispatch]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div
        className={cn(
          'w-full border-r border-slate-800 md:w-80 lg:w-96',
          activeChatId ? 'hidden md:block' : 'block',
        )}
      >
        <Sidebar />
      </div>
      <div className={cn('flex-1', activeChatId ? 'block' : 'hidden md:block')}>
        <ChatWindow />
      </div>
    </div>
  );
}

export default Dashboard;
