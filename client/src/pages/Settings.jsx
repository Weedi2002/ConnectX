import { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { api } from '../services/api.js';
import { setUser } from '../redux/authSlice.js';
import { setTheme } from '../redux/themeSlice.js';
import Avatar from '../components/Avatar.jsx';

function Settings() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const theme = useSelector((s) => s.theme.mode);
  const fileInput = useRef(null);
  const [savingAvatar, setSavingAvatar] = useState(false);

  const profileForm = useForm({
    defaultValues: { username: user?.username, bio: user?.bio, status: user?.status },
  });
  const passwordForm = useForm();

  const saveProfile = async (values) => {
    try {
      const { data } = await api.put('/users/profile', values);
      dispatch(setUser(data.user));
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    }
  };
  const uploadAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSavingAvatar(true);
    try {
      const form = new FormData();
      form.append('avatar', file);
      const { data } = await api.put('/users/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      dispatch(setUser(data.user));
      toast.success('Avatar updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setSavingAvatar(false);
    }
  };
  const changePassword = async (values) => {
    try {
      await api.post('/auth/change-password', values);
      toast.success('Password changed');
      passwordForm.reset();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Change failed');
    }
  };
  const changeTheme = (mode) => {
    dispatch(setTheme(mode));
    api.put('/users/profile', { theme: mode }).catch(() => {});
  };

  return (
    <div className="min-h-screen chat-bg p-4 text-slate-100">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="rounded-xl p-2 text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 transition-colors"
          >
            ←
          </button>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        <section className="glass rounded-3xl p-6">
          <div className="flex items-center gap-4">
            <Avatar user={user} size={72} />
            <div>
              <button
                onClick={() => fileInput.current?.click()}
                disabled={savingAvatar}
                className="glass-card !rounded-xl px-4 py-2 text-sm text-slate-300"
              >
                {savingAvatar ? 'Uploading...' : 'Change avatar'}
              </button>
              <input ref={fileInput} type="file" accept="image/*" hidden onChange={uploadAvatar} />
            </div>
          </div>

          <form onSubmit={profileForm.handleSubmit(saveProfile)} className="mt-6 space-y-3">
            <input
              className="glass-input w-full px-4 py-2.5 text-sm"
              placeholder="Username"
              {...profileForm.register('username')}
            />
            <input
              className="glass-input w-full px-4 py-2.5 text-sm"
              placeholder="Status"
              {...profileForm.register('status')}
            />
            <textarea
              className="glass-input w-full resize-none px-4 py-2.5 text-sm"
              placeholder="Bio"
              rows={3}
              {...profileForm.register('bio')}
            />
            <button className="glass-btn-primary w-full py-2.5 text-sm">Save profile</button>
          </form>
        </section>

        <section className="glass rounded-3xl p-6">
          <h2 className="mb-3 font-semibold">Appearance</h2>
          <div className="flex gap-3">
            {['dark', 'light'].map((mode) => (
              <button
                key={mode}
                onClick={() => changeTheme(mode)}
                className={`rounded-xl px-5 py-2.5 text-sm capitalize transition-all ${theme === mode ? 'glass-btn-primary' : 'glass-card text-slate-400'}`}
              >
                {mode}
              </button>
            ))}
          </div>
        </section>

        <section className="glass rounded-3xl p-6">
          <h2 className="mb-3 font-semibold">Change password</h2>
          <form onSubmit={passwordForm.handleSubmit(changePassword)} className="space-y-3">
            <input
              className="glass-input w-full px-4 py-2.5 text-sm"
              type="password"
              placeholder="Current password"
              {...passwordForm.register('currentPassword', { required: true })}
            />
            <input
              className="glass-input w-full px-4 py-2.5 text-sm"
              type="password"
              placeholder="New password (min 8)"
              {...passwordForm.register('newPassword', { required: true, minLength: 8 })}
            />
            <button className="glass-btn-primary w-full py-2.5 text-sm">Change password</button>
          </form>
        </section>
      </div>
    </div>
  );
}

export default Settings;
