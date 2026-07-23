import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Avatar from '../Avatar.jsx';
import ChatList from './ChatList.jsx';
import FriendsList from './FriendsList.jsx';
import CreateGroupModal from './CreateGroupModal.jsx';
import SearchModal from './SearchModal.jsx';
import FriendRequestsPanel from './FriendRequestsPanel.jsx';
import NotificationsPanel from './NotificationsPanel.jsx';
import { logout } from '../../redux/authSlice.js';
import { disconnectSocket } from '../../services/socket.js';

const NAV_ITEMS = [
  { key: 'home', icon: '🏠', label: 'Home' },
  { key: 'chat', icon: '💬', label: 'Chats' },
  { key: 'friends', icon: '👥', label: 'Friends' },
  { key: 'notifications', icon: '🔔', label: 'Notifications' },
  { key: 'settings', icon: '⚙️', label: 'Settings' },
];

function NavRail({ activeNav, onNavChange }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const friendUnread = useSelector((s) => s.friend.unread);
  const notifications = useSelector((s) => s.chat.notifications);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleLogout = async () => {
    disconnectSocket();
    await dispatch(logout());
    toast.success('Signed out');
  };

  const handleNav = (key) => {
    if (key === 'settings') return navigate('/settings');
    onNavChange(key);
  };

  return (
    <>
      <button onClick={() => navigate('/settings')} className="mb-3" title="Profile">
        <Avatar user={user} size={40} showPresence />
      </button>

      {NAV_ITEMS.map((item) => (
        <button
          key={item.key}
          onClick={() => handleNav(item.key)}
          className={`relative flex h-12 w-12 items-center justify-center rounded-xl text-xl transition-all ${
            activeNav === item.key
              ? 'nav-active'
              : 'text-slate-400 hover:bg-white/[0.08] hover:text-slate-200'
          }`}
          title={item.label}
        >
          {item.icon}
          {item.key === 'friends' && friendUnread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
              {friendUnread > 99 ? '99+' : friendUnread}
            </span>
          )}
          {item.key === 'notifications' && unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      ))}

      <div className="mt-auto" />

      <button
        onClick={handleLogout}
        className="flex h-12 w-12 items-center justify-center rounded-xl text-slate-500 hover:bg-red-500/10 hover:text-red-400"
        title="Logout"
      >
        🚪
      </button>
    </>
  );
}

function ContentPanel({ activeNav }) {
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [globalSearch, setGlobalSearch] = useState(false);
  const [friendsOpen, setFriendsOpen] = useState(false);

  useEffect(() => {
    if (activeNav === 'friends') setFriendsOpen(true);
  }, [activeNav]);

  return (
    <>
      {activeNav === 'notifications' ? (
        <NotificationsPanel />
      ) : (
        <>
          {/* Search */}
          <div className="px-4 pt-4 pb-3">
            <div className="glass-input flex items-center gap-3 px-4 py-3">
              <span className="text-slate-400 text-base">🔍</span>
              <input
                type="text"
                placeholder="Search..."
                onClick={() => setGlobalSearch(true)}
                readOnly
                className="flex-1 bg-transparent text-sm text-slate-200 outline-none cursor-pointer placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Scrollable sections */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
            {/* Groups */}
            <div className="glass-card p-3">
              <div className="flex items-center justify-between px-2 pb-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Groups
                </p>
                <button
                  onClick={() => setCreatingGroup(true)}
                  className="text-xs text-cyan-400 hover:text-cyan-300"
                >
                  + New Group
                </button>
              </div>
              <ChatList type="groups" />
            </div>

            {/* Person */}
            <div className="glass-card p-3">
              <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Person
              </p>
              <FriendsList />
            </div>
          </div>
        </>
      )}

      {creatingGroup && <CreateGroupModal onClose={() => setCreatingGroup(false)} />}
      {globalSearch && <SearchModal onClose={() => setGlobalSearch(false)} />}
      {friendsOpen && <FriendRequestsPanel onClose={() => setFriendsOpen(false)} />}
    </>
  );
}

const Sidebar = { NavRail, ContentPanel };
export default Sidebar;
