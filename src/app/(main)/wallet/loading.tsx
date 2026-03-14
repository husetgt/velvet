export default function Loading() {
  return (
    <div className="flex-1 overflow-auto animate-pulse">
      <div className="max-w-xl mx-auto px-4 py-10">
        <div className="h-8 w-32 bg-[#2a2a30] rounded mb-8" />
        <div className="rounded-2xl bg-[#161618] border border-[#2a2a30] p-6 mb-5">
          <div className="h-4 w-24 bg-[#2a2a30] rounded mb-3" />
          <div className="h-10 w-40 bg-[#2a2a30] rounded" />
        </div>
        <div className="rounded-2xl bg-[#161618] border border-[#2a2a30] p-6">
          <div className="h-4 w-32 bg-[#2a2a30] rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between items-center py-3 border-b border-[#2a2a30]">
                <div className="h-4 w-40 bg-[#2a2a30] rounded" />
                <div className="h-4 w-16 bg-[#1e1e21] rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
