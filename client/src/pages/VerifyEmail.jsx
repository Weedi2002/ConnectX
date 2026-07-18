import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api.js';
import AuthLayout from '../components/AuthLayout.jsx';

function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState('verifying');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (!token) {
      setState('error');
      return;
    }
    api
      .post('/auth/verify-email', { token })
      .then(() => setState('success'))
      .catch(() => setState('error'));
  }, [token]);

  const messages = {
    verifying: 'Verifying your email...',
    success: 'Your email has been verified!',
    error: 'Verification link is invalid or expired.',
  };

  return (
    <AuthLayout title="Email verification">
      <p className="text-slate-300">{messages[state]}</p>
      <p className="mt-6 text-sm">
        <Link to="/" className="text-indigo-400 hover:underline">
          Go to app
        </Link>
      </p>
    </AuthLayout>
  );
}

export default VerifyEmail;
