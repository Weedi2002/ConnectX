import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api.js';
import AuthLayout from '../components/AuthLayout.jsx';

function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState('verifying');

  useEffect(() => {
    api
      .post(`/auth/verify-email/${token}`)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <AuthLayout title="Email verification">
      <div className="text-center">
        {status === 'verifying' && <p className="text-slate-400">Verifying your email...</p>}
        {status === 'success' && (
          <div>
            <p className="text-emerald-400 mb-4">Email verified successfully!</p>
            <Link to="/login" className="glass-btn-primary inline-block px-6 py-2.5 text-sm">
              Sign in
            </Link>
          </div>
        )}
        {status === 'error' && (
          <div>
            <p className="text-red-400 mb-4">Verification failed or link expired.</p>
            <Link to="/login" className="glass-btn-primary inline-block px-6 py-2.5 text-sm">
              Back to sign in
            </Link>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}

export default VerifyEmail;
