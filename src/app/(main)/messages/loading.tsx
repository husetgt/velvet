export default function Loading() {
  return (
    <div className="flex min-h-screen bg-[#0d0d0f]">
      <div className="w-60 shrink-0 bg-[#111113]" />
      <div className="w-80 shrink-0 border-r border-[#2a2a30] bg-[#0d0d0f] p-4 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-[#161618] animate-pulse" />
        ))}
      </div>
      <main className="flex-1 p-8">
        <div className="max-w-2xl mx-auto space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded-2xl bg-[#161618] animate-pulse" />
          ))}
        </div>
      </main>
    </div>
  )
}
