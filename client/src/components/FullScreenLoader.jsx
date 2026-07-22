function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center chat-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-indigo-500" />
        <p className="text-sm text-slate-400">Loading...</p>
      </div>
    </div>
  );
}

export default FullScreenLoader;
