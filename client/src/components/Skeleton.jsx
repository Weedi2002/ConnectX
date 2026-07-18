import { cn } from '../utils/cn.js';

export function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded-md bg-slate-700/50', className)} />;
}

export function ChatListSkeleton() {
  return (
    <div className="space-y-3 p-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-2 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MessagesSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className={cn('flex', i % 2 ? 'justify-end' : 'justify-start')}>
          <Skeleton className="h-10 w-48 rounded-2xl" />
        </div>
      ))}
    </div>
  );
}
