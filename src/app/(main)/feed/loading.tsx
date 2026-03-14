export default function Loading() {
  return (
    <div className="flex min-h-screen bg-[#0d0d0f]">
      <div className="w-60 shrink-0 bg-[#111113]" />
      <main className="flex-1 p-8">
        <div className="max-w-2xl mx-auto space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-[#161618] animate-pulse" />
          ))}
        </div>
      </main>
    </div>
  )
}
