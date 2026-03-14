export default function Loading() {
  return (
    <div className="flex-1 overflow-auto animate-pulse">
      <div className="max-w-xl mx-auto px-4 py-10">
        <div className="h-8 w-32 bg-[#2a2a30] rounded mb-8" />
        <div className="space-y-5">
          <div className="rounded-2xl border border-[#2a2a30] bg-[#161618] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#2a2a30]">
              <div className="h-4 w-24 bg-[#2a2a30] rounded" />
            </div>
            <div className="p-6">
              <div className="flex items-center gap-5 mb-6">
                <div className="w-20 h-20 rounded-full bg-[#2a2a30]" />
                <div>
                  <div className="h-5 w-32 bg-[#2a2a30] rounded mb-2" />
                  <div className="h-3 w-24 bg-[#1e1e21] rounded" />
                </div>
              </div>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i}>
                    <div className="h-3 w-24 bg-[#1e1e21] rounded mb-2" />
                    <div className="h-10 w-full bg-[#1e1e21] rounded-xl" />
                  </div>
                ))}
                <div className="h-12 w-full bg-[#2a2a30] rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
