export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0d0d0f] animate-pulse">
      {/* Banner skeleton */}
      <div className="w-full h-48 bg-[#1a1a1d]" />
      <div className="max-w-2xl mx-auto px-4">
        {/* Avatar skeleton */}
        <div className="relative -mt-12 mb-4 flex items-end justify-between">
          <div className="w-24 h-24 rounded-full bg-[#2a2a30] border-4 border-[#0d0d0f]" />
          <div className="flex gap-2 pb-1">
            <div className="w-24 h-9 rounded-xl bg-[#2a2a30]" />
            <div className="w-16 h-9 rounded-xl bg-[#2a2a30]" />
          </div>
        </div>
        {/* Name skeleton */}
        <div className="h-6 w-48 bg-[#2a2a30] rounded mb-2" />
        <div className="h-4 w-32 bg-[#1e1e21] rounded mb-4" />
        {/* Stats skeleton */}
        <div className="flex gap-5 mb-4">
          <div className="h-4 w-20 bg-[#1e1e21] rounded" />
          <div className="h-4 w-20 bg-[#1e1e21] rounded" />
          <div className="h-4 w-24 bg-[#1e1e21] rounded" />
        </div>
        {/* Bio skeleton */}
        <div className="h-4 w-full bg-[#1e1e21] rounded mb-2" />
        <div className="h-4 w-3/4 bg-[#1e1e21] rounded mb-5" />
        {/* Button skeleton */}
        <div className="h-12 w-full bg-[#2a2a30] rounded-2xl mb-6" />
        {/* Posts skeleton */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-[#161618] rounded-2xl mb-5 border border-[#2a2a30]" />
        ))}
      </div>
    </div>
  )
}
