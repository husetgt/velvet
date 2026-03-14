export default function Loading() {
  return (
    <div className="flex min-h-screen bg-[#0d0d0f]">
      <div className="w-60 shrink-0 bg-[#111113]" />
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="h-12 rounded-2xl bg-[#161618] animate-pulse mb-8 max-w-xl" />
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-56 rounded-2xl bg-[#161618] animate-pulse" />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
