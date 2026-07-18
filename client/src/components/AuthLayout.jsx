import { motion } from 'framer-motion';

function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl backdrop-blur"
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
  'w-full rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500';

export const buttonClass =
  'w-full rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-4 py-2.5 font-medium text-white transition hover:opacity-90 disabled:opacity-50';

export default AuthLayout;
