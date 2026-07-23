import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import Avatar from '../Avatar.jsx';
import { fetchFriends } from '../../redux/friendSlice.js';
import { openChat } from '../../redux/chatSlice.js';

function FriendsList() {
  const dispatch = useDispatch();
  const friends = useSelector((s) => s.friend.friends);

  useEffect(() => {
    dispatch(fetchFriends());
  }, [dispatch]);

  const handleOpenChat = async (userId) => {
    const result = await dispatch(openChat(userId));
    if (openChat.fulfilled.match(result)) {
      toast.success('Chat opened');
    } else {
      toast.error('Could not open chat');
    }
  };

  if (friends.length === 0) {
    return <p className="px-1 py-2 text-center text-[10px] text-slate-500">No friends yet</p>;
  }

  return (
    <ul className="space-y-0.5">
      {friends.map((friend) => (
        <li key={friend._id}>
          <button
            onClick={() => handleOpenChat(friend._id)}
            className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left transition-all hover:bg-white/[0.05]"
          >
            <Avatar user={friend} size={34} showPresence />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-medium text-slate-100">{friend.username}</p>
              <p className="truncate text-[9px] text-slate-400">
                {friend.presence === 'online' ? 'Online' : 'Offline'}
              </p>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}

export default FriendsList;
