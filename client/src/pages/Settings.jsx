import { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { api } from '../services/api.js';
import { setUser } from '../redux/authSlice.js';
import { setTheme } from '../redux/themeSlice.js';
import Avatar from '../components/Avatar.jsx';
import { inputClass, buttonClass } from '../components/AuthLayout.jsx';

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

  const changeTheme = async (mode) => {
    dispatch(setTheme(mode));
    api.put('/users/profile', { theme: mode }).catch(() => {});
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-slate-100">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800"
          >
            ←
          </button>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center gap-4">
            <Avatar user={user} size={72} />
            <div>
              <button
                onClick={() => fileInput.current?.click()}
                disabled={savingAvatar}
                className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm hover:bg-slate-700"
              >
                {savingAvatar ? 'Uploading...' : 'Change avatar'}
              </button>
              <input ref={fileInput} type="file" accept="image/*" hidden onChange={uploadAvatar} />
            </div>
          </div>

          <form onSubmit={profileForm.handleSubmit(saveProfile)} className="mt-6 space-y-3">
            <input
              className={inputClass}
              placeholder="Username"
              {...profileForm.register('username')}
            />
            <input
              className={inputClass}
              placeholder="Status"
              {...profileForm.register('status')}
            />
            <textarea
              className={inputClass}
              placeholder="Bio"
              rows={3}
              {...profileForm.register('bio')}
            />
            <button className={buttonClass}>Save profile</button>
          </form>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="mb-3 font-semibold">Appearance</h2>
          <div className="flex gap-3">
            {['dark', 'light'].map((mode) => (
              <button
                key={mode}
                onClick={() => changeTheme(mode)}
                className={`rounded-lg border px-4 py-2 text-sm capitalize ${
                  theme === mode
                    ? 'border-indigo-500 bg-indigo-500/20'
                    : 'border-slate-700 hover:bg-slate-800'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="mb-3 font-semibold">Change password</h2>
          <form onSubmit={passwordForm.handleSubmit(changePassword)} className="space-y-3">
            <input
              className={inputClass}
              type="password"
              placeholder="Current password"
              {...passwordForm.register('currentPassword', { required: true })}
            />
            <input
              className={inputClass}
              type="password"
              placeholder="New password (min 8)"
              {...passwordForm.register('newPassword', { required: true, minLength: 8 })}
            />
            <button className={buttonClass}>Change password</button>
          </form>
        </section>
      </div>
    </div>
  );
}

export default Settings;
