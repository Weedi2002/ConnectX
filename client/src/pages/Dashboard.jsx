import { useEffect, useState } from 'react';
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
  const [activeNav, setActiveNav] = useState('chat');
  useSocketEvents();

  useEffect(() => {
    dispatch(fetchChats());
    dispatch(fetchIncoming());
    dispatch(fetchFriends());
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleNavChange = (key) => {
    setActiveNav(key);
  };

  return (
    <div className="flex h-screen items-center justify-center p-6 chat-bg">
      <div
        className={cn(
          'app-shell flex h-full w-full gap-3 p-3',
          activeChatId ? 'max-w-[1400px]' : 'max-w-[1200px]',
        )}
      >
        {/* Nav rail panel */}
        <div
          className={cn(
            'nav-panel flex flex-shrink-0 flex-col items-center py-4 px-1',
            activeChatId ? 'hidden md:flex' : 'flex',
          )}
        >
          <Sidebar.NavRail activeNav={activeNav} onNavChange={handleNavChange} />
        </div>

        {/* Sidebar content panel */}
        <div
          className={cn(
            'sidebar-panel flex flex-col flex-1 min-w-0',
            activeChatId ? 'hidden md:flex' : 'flex',
          )}
        >
          <Sidebar.ContentPanel activeNav={activeNav} />
        </div>

        {/* Chat area panel */}
        <div
          className={cn(
            'chat-panel flex flex-col flex-1 min-w-0',
            activeChatId ? 'flex' : 'hidden md:flex',
          )}
        >
          <ChatWindow />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
