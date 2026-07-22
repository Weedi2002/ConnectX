import { useForm } from 'react-hook-form';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../services/api.js';
import AuthLayout, { inputClass, buttonClass } from '../components/AuthLayout.jsx';

function ResetPassword() {
  const { token } = useParams();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (values) => {
    try { await api.post(`/auth/reset-password/${token}`, values); toast.success('Password reset! You can now sign in.'); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  return (
    <AuthLayout title="Reset password" subtitle="Enter your new password">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <input className={inputClass} type="password" placeholder="New password (min 8)" {...register('newPassword', { required: true, minLength: 8 })} />
          {errors.newPassword && <p className="mt-1 text-xs text-red-400">Min 8 characters</p>}
        </div>
        <button className={buttonClass} disabled={isSubmitting}>{isSubmitting ? 'Resetting...' : 'Reset password'}</button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-400">
        <Link to="/login" className="text-indigo-400 hover:text-indigo-300 hover:underline">Back to sign in</Link>
      </p>
    </AuthLayout>
  );
}

export default ResetPassword;
