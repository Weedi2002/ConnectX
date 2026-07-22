import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { login } from '../redux/authSlice.js';
import AuthLayout, { inputClass, buttonClass } from '../components/AuthLayout.jsx';

function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (values) => {
    const result = await dispatch(login(values));
    if (login.fulfilled.match(result)) { toast.success('Welcome back!'); navigate('/'); }
    else toast.error(result.payload || 'Login failed');
  };

  return (
    <AuthLayout title="Sign in" subtitle="Access your conversations">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <input className={inputClass} type="email" placeholder="Email" {...register('email', { required: 'Email is required' })} />
          {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
        </div>
        <div>
          <input className={inputClass} type="password" placeholder="Password" {...register('password', { required: 'Password is required' })} />
          {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
        </div>
        <div className="text-right">
          <Link to="/forgot-password" className="text-sm text-indigo-400 hover:text-indigo-300 hover:underline">Forgot password?</Link>
        </div>
        <button className={buttonClass} disabled={isSubmitting}>{isSubmitting ? 'Signing in...' : 'Sign in'}</button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-400">
        No account? <Link to="/register" className="text-indigo-400 hover:text-indigo-300 hover:underline">Create one</Link>
      </p>
    </AuthLayout>
  );
}

export default Login;
