import { Skeleton } from '../ui/skeleton';
import { Card } from '../ui/card';

export default function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* KPI Cards skeleton grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card
            key={i}
            className="p-5 space-y-4"
          >
            <div className="flex justify-between items-center">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-16" />
          </Card>
        ))}
      </div>

      {/* Main Content Layout splits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution Grid skeleton */}
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card
                key={i}
                className="p-4 space-y-2"
              >
                <Skeleton className="h-3.5 w-16" />
                <Skeleton className="h-6 w-10" />
              </Card>
            ))}
          </div>
        </div>

        {/* Alerts Panel skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <Card className="p-5 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3 items-start border-b border-slate-100 dark:border-slate-800/60 pb-3 last:border-0 last:pb-0">
                <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
                <div className="space-y-2 w-full">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
