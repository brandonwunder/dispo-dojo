export default function MessageSkeleton({ count = 3 }) {
  return (
    <div className="space-y-4 px-1">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-3 animate-pulse">
          <div className="h-8 w-8 shrink-0 rounded-full bg-white/[0.06]" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-3 w-20 rounded-sm bg-white/[0.08]" />
              <div className="h-2 w-12 rounded-sm bg-white/[0.04]" />
            </div>
            <div className="h-3 w-full max-w-[280px] rounded-sm bg-white/[0.06]" />
            {i % 2 === 0 && (
              <div className="h-3 w-3/5 rounded-sm bg-white/[0.04]" />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
