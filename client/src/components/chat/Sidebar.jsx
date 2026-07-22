import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Avatar from '../Avatar.jsx';
import ChatList from './ChatList.jsx';
import NewChatSearch from './NewChatSearch.jsx';
import CreateGroupModal from './CreateGroupModal.jsx';
import SearchModal from './SearchModal.jsx';
import FriendRequestsPanel from './FriendRequestsPanel.jsx';
import { logout } from '../../redux/authSlice.js';
import { disconnectSocket } from '../../services/socket.js';

const NAV_ITEMS = [
  { key: 'home', icon: '🏠', label: 'Home' },
  { key: 'chat', icon: '💬', label: 'Chats' },
  { key: 'friends', icon: '👥', label: 'Friends' },
  { key: 'notifications', icon: '🔔', label: 'Notifications' },
  { key: 'settings', icon: '⚙️', label: 'Settings' },
];

function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const [activeNav, setActiveNav] = useState('chat');
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [globalSearch, setGlobalSearch] = useState(false);
  const [friendsOpen, setFriendsOpen] = useState(false);
  const friendUnread = useSelector((s) => s.friend.unread);

  const handleLogout = async () => {
    disconnectSocket();
    await dispatch(logout());
    toast.success('Signed out');
  };

  const handleNav = (key) => {
    if (key === 'settings') return navigate('/settings');
    if (key === 'friends') return setFriendsOpen(true);
    setActiveNav(key);
  };

  return (
    <>
      {/* Vertical nav rail */}
      <div className="flex flex-col items-center gap-1 py-4 px-2 border-r border-white/[0.06]">
        <button onClick={() => navigate('/settings')} className="mb-3" title="Profile">
          <Avatar user={user} size={36} showPresence />
        </button>

        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            onClick={() => handleNav(item.key)}
            className={`relative flex h-10 w-10 items-center justify-center rounded-xl text-lg transition-all duration-200 ${
              activeNav === item.key
                ? 'nav-active'
                : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'
            }`}
            title={item.label}
          >
            {item.icon}
            {item.key === 'friends' && friendUnread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {friendUnread > 99 ? '99+' : friendUnread}
              </span>
            )}
          </button>
        ))}

        <div className="mt-auto" />

        <button
          onClick={handleLogout}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-all hover:bg-red-500/10 hover:text-red-400"
          title="Logout"
        >
          🚪
        </button>
      </div>

      {/* Chat list panel */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Search header */}
        <div className="px-4 pt-4 pb-2">
          <div className="glass-input flex items-center gap-2 px-4 py-2.5">
            <span className="text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search..."
              onClick={() => setGlobalSearch(true)}
              readOnly
              className="flex-1 bg-transparent text-sm text-slate-200 outline-none cursor-pointer placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Sections */}
        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-3">
          {/* Groups section */}
          <div className="glass-card p-3">
            <p className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Groups
            </p>
            <ChatList type="groups" />
          </div>

          {/* Person section */}
          <div className="glass-card p-3">
            <div className="flex items-center justify-between px-1 pb-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Person
              </p>
              <button
                onClick={() => setCreatingGroup(true)}
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                title="New group"
              >
                + New Group
              </button>
            </div>
            <ChatList type="persons" />
          </div>
        </div>
      </div>

      {creatingGroup && <CreateGroupModal onClose={() => setCreatingGroup(false)} />}
      {globalSearch && <SearchModal onClose={() => setGlobalSearch(false)} />}
      {friendsOpen && <FriendRequestsPanel onClose={() => setFriendsOpen(false)} />}
    </>
  );
}

export default Sidebar;
