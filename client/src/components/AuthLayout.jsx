import { motion } from 'framer-motion';

function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen items-center justify-center chat-bg p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass w-full max-w-md rounded-3xl p-8 shadow-glass"
      >
        <h1 className="bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-center text-3xl font-bold text-transparent">
          ConnectX
        </h1>
        <h2 className="mt-6 text-xl font-semibold text-slate-100">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </motion.div>
    </div>
  );
}

export const inputClass =
  'glass-input w-full px-4 py-2.5 text-sm';

export const buttonClass =
  'glass-btn-primary w-full py-2.5 text-sm';

export default AuthLayout;
