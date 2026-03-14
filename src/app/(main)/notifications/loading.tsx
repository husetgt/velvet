export default function Loading() {
  return (
    <div className="flex-1 overflow-auto animate-pulse">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="h-8 w-48 bg-[#2a2a30] rounded mb-8" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-[#161618] border border-[#2a2a30]">
              <div className="w-10 h-10 rounded-full bg-[#2a2a30] shrink-0" />
              <div className="flex-1">
                <div className="h-4 w-full bg-[#2a2a30] rounded mb-2" />
                <div className="h-3 w-24 bg-[#1e1e21] rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
