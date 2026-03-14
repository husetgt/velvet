export default function MembershipLoading() {
  return (
    <div className="flex-1 p-6 max-w-2xl mx-auto w-full">
      <div className="h-8 w-40 rounded-xl bg-[#1e1e21] animate-pulse mb-6" />
      <div className="space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="rounded-2xl border border-[#2a2a30] bg-[#161618] p-5 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#2a2a30]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 rounded bg-[#2a2a30]" />
                <div className="h-3 w-20 rounded bg-[#2a2a30]" />
              </div>
            </div>
            <div className="h-3 w-48 rounded bg-[#2a2a30]" />
          </div>
        ))}
      </div>
    </div>
  )
}
