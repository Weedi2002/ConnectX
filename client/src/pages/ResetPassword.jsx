import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../services/api.js';
import AuthLayout, { inputClass, buttonClass } from '../components/AuthLayout.jsx';

function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async ({ password }) => {
    try {
      await api.post('/auth/reset-password', { token, password });
      toast.success('Password reset. Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Reset failed');
    }
  };

  if (!token) {
    return (
      <AuthLayout title="Invalid link" subtitle="This reset link is missing or invalid">
        <Link to="/forgot-password" className="text-indigo-400 hover:underline">
          Request a new link
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset password" subtitle="Choose a new password">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input
          className={inputClass}
          type="password"
          placeholder="New password"
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 8, message: 'Min 8 characters' },
          })}
        />
        {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
        <button className={buttonClass} disabled={isSubmitting}>
          {isSubmitting ? 'Resetting...' : 'Reset password'}
        </button>
      </form>
    </AuthLayout>
  );
}

export default ResetPassword;
