
export default function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* KPI Cards skeleton grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4"
          >
            <div className="flex justify-between items-center">
              <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
            </div>
            <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
          </div>
        ))}
      </div>

      {/* Main Content Layout splits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution Grid skeleton */}
        <div className="lg:col-span-2 space-y-4">
          <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm space-y-2"
              >
                <div className="h-3.5 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
                <div className="h-6 w-10 bg-slate-200 dark:bg-slate-800 rounded"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts Panel skeleton */}
        <div className="space-y-4">
          <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3 items-start border-b border-slate-100 dark:border-slate-800/60 pb-3 last:border-0 last:pb-0">
                <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-lg shrink-0"></div>
                <div className="space-y-2 w-full">
                  <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
                  <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
