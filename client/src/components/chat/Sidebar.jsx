import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Avatar from '../Avatar.jsx';
import ChatList from './ChatList.jsx';
import NewChatSearch from './NewChatSearch.jsx';
import CreateGroupModal from './CreateGroupModal.jsx';
import SearchModal from './SearchModal.jsx';
import NotificationsBell from './NotificationsBell.jsx';
import FriendRequestsPanel from './FriendRequestsPanel.jsx';
import { logout } from '../../redux/authSlice.js';
import { toggleTheme } from '../../redux/themeSlice.js';
import { disconnectSocket } from '../../services/socket.js';

function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const theme = useSelector((s) => s.theme.mode);
  const [searching, setSearching] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [globalSearch, setGlobalSearch] = useState(false);
  const [friendsOpen, setFriendsOpen] = useState(false);
  const friendUnread = useSelector((s) => s.friend.unread);

  const handleLogout = async () => {
    disconnectSocket();
    await dispatch(logout());
    toast.success('Signed out');
  };

  return (
    <div className="flex h-full flex-col bg-slate-900">
      <header className="flex items-center justify-between border-b border-slate-800 p-4">
        <button
          onClick={() => navigate('/settings')}
          className="flex items-center gap-3"
          title="Settings"
        >
          <Avatar user={user} size={40} showPresence />
          <div className="text-left">
            <p className="text-sm font-semibold">{user?.username}</p>
            <p className="text-xs text-slate-400">View profile</p>
          </div>
        </button>
        <div className="flex items-center gap-1">
          <NotificationsBell />
          <button
            onClick={() => setFriendsOpen(true)}
            className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-800"
            title="Friend requests"
          >
            👥
            {friendUnread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {friendUnread > 99 ? '99+' : friendUnread}
              </span>
            )}
          </button>
          <button
            onClick={() => dispatch(toggleTheme())}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800"
            title="Toggle theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button
            onClick={handleLogout}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800"
            title="Logout"
          >
            ⎋
          </button>
        </div>
      </header>

      <div className="flex gap-2 p-3">
        <button
          onClick={() => setGlobalSearch(true)}
          className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700"
          title="Search"
        >
          🔍
        </button>
        <button
          onClick={() => setSearching((v) => !v)}
          className="flex-1 rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-500 py-2 text-sm font-medium text-white"
        >
          {searching ? 'Close search' : '+ New chat'}
        </button>
        <button
          onClick={() => setCreatingGroup(true)}
          className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700"
          title="New group"
        >
          👥
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {searching ? <NewChatSearch onDone={() => setSearching(false)} /> : <ChatList />}
      </div>

      {creatingGroup && <CreateGroupModal onClose={() => setCreatingGroup(false)} />}
      {globalSearch && <SearchModal onClose={() => setGlobalSearch(false)} />}
      {friendsOpen && <FriendRequestsPanel onClose={() => setFriendsOpen(false)} />}
    </div>
  );
}

export default Sidebar;
