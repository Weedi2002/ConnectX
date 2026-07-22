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
    <div className="flex h-screen items-center justify-center p-3 chat-bg">
      <div className="app-shell flex h-full w-full overflow-hidden">
        {/* Sidebar */}
        <div
          className={cn(
            'sidebar-bg flex flex-col border-r border-white/[0.08] md:w-80 lg:w-96',
            activeChatId ? 'hidden md:flex' : 'flex w-full',
          )}
        >
          <Sidebar />
        </div>

        {/* Chat area */}
        <div className={cn('chat-area-bg flex-1 min-w-0', activeChatId ? 'flex' : 'hidden md:flex')}>
          <ChatWindow />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
