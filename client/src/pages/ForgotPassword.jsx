import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../services/api.js';
import AuthLayout, { inputClass, buttonClass } from '../components/AuthLayout.jsx';

function ForgotPassword() {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm();

  const onSubmit = async ({ email }) => {
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('If that email exists, a reset link has been sent.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Request failed');
    }
  };

  return (
    <AuthLayout title="Forgot password" subtitle="We'll email you a reset link">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input
          className={inputClass}
          type="email"
          placeholder="Email"
          {...register('email', { required: true })}
        />
        <button className={buttonClass} disabled={isSubmitting}>
          {isSubmitting ? 'Sending...' : 'Send reset link'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-400">
        <Link to="/login" className="text-indigo-400 hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

export default ForgotPassword;
