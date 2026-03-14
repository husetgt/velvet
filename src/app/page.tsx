import Link from 'next/link'
import Navbar from '@/components/Navbar'

const FEATURED_CREATORS = [
  { username: 'aurora', displayName: 'Aurora Belle', subscribers: '12.4K', category: 'Art & Design', color: 'from-pink-500 to-purple-600' },
  { username: 'nxvak', displayName: 'Nxvak', subscribers: '8.9K', category: 'Music', color: 'from-violet-500 to-indigo-600' },
  { username: 'luxelena', displayName: 'Luxe Lena', subscribers: '21.3K', category: 'Lifestyle', color: 'from-fuchsia-500 to-pink-600' },
  { username: 'solaris', displayName: 'Solaris', subscribers: '5.1K', category: 'Photography', color: 'from-purple-600 to-blue-600' },
  { username: 'nightbloom', displayName: 'Night Bloom', subscribers: '14.7K', category: 'Fashion', color: 'from-pink-600 to-rose-600' },
  { username: 'vellichor', displayName: 'Vellichor', subscribers: '9.2K', category: 'Writing', color: 'from-indigo-500 to-purple-600' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0d0d0f] text-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-24 px-6">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-[#e040fb22] to-[#7c4dff22] blur-[120px] rounded-full" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1e1e21] border border-[#2a2a30] text-sm text-[#8888a0] mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-velvet-gradient inline-block" style={{background: 'linear-gradient(135deg, #e040fb, #7c4dff)'}} />
            The premium creator platform
          </div>

          <h1 className="text-6xl md:text-7xl font-bold leading-tight mb-6">
            For creators who{' '}
            <span className="velvet-gradient-text">demand more.</span>
          </h1>

          <p className="text-xl text-[#8888a0] max-w-2xl mx-auto mb-10 leading-relaxed">
            Connect with your most dedicated fans. Share exclusive content. Build a sustainable income on your own terms.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-3.5 rounded-xl font-semibold text-white bg-velvet-gradient hover:opacity-90 transition-opacity"
              style={{background: 'linear-gradient(135deg, #e040fb, #7c4dff)'}}
            >
              Join as a Fan
            </Link>
            <Link
              href="/creator-login"
              className="px-8 py-3.5 rounded-xl font-semibold text-white border border-[#2a2a30] hover:border-[#e040fb66] hover:bg-[#1e1e21] transition-all"
            >
              Creator Hub →
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-8 max-w-md mx-auto text-center">
            {[['50K+', 'Creators'], ['2M+', 'Fans'], ['$10M+', 'Paid Out']].map(([num, label]) => (
              <div key={label}>
                <div className="text-2xl font-bold velvet-gradient-text">{num}</div>
                <div className="text-sm text-[#8888a0] mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Creators */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3">Featured Creators</h2>
          <p className="text-center text-[#8888a0] mb-12">Discover exclusive content from top creators</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURED_CREATORS.map((creator) => (
              <Link key={creator.username} href={`/${creator.username}`} className="group block">
                <div className="relative rounded-2xl overflow-hidden border border-[#2a2a30] hover:border-[#e040fb44] transition-all hover:shadow-[0_0_30px_rgba(224,64,251,0.1)] bg-[#161618]">
                  {/* Banner */}
                  <div className={`h-24 bg-gradient-to-br ${creator.color} opacity-70`} />

                  <div className="p-5 pt-0">
                    {/* Avatar */}
                    <div className={`-mt-7 w-14 h-14 rounded-xl bg-gradient-to-br ${creator.color} flex items-center justify-center text-white font-bold text-lg mb-3 border-2 border-[#161618]`}>
                      {creator.displayName.charAt(0)}
                    </div>

                    <div className="font-semibold text-white group-hover:velvet-gradient-text transition-all">
                      {creator.displayName}
                    </div>
                    <div className="text-sm text-[#8888a0] mt-0.5">{creator.category}</div>

                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-[#8888a0]">{creator.subscribers} subscribers</span>
                      <span className="text-[#e040fb] opacity-0 group-hover:opacity-100 transition-opacity">View →</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="rounded-3xl p-12 relative overflow-hidden border border-[#2a2a30]" style={{background: 'linear-gradient(135deg, rgba(224,64,251,0.08), rgba(124,77,255,0.08))'}}>
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 blur-[60px] rounded-full" style={{background: 'linear-gradient(135deg, rgba(224,64,251,0.2), rgba(124,77,255,0.2))'}} />
            </div>
            <div className="relative">
              <h2 className="text-4xl font-bold mb-4">Ready to get started?</h2>
              <p className="text-[#8888a0] mb-8 text-lg">Join thousands of creators already earning on Velvet.</p>
              <Link
                href="/signup"
                className="inline-block px-10 py-4 rounded-xl font-semibold text-white hover:opacity-90 transition-opacity"
                style={{background: 'linear-gradient(135deg, #e040fb, #7c4dff)'}}
              >
                Create Your Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2a2a30] py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="velvet-gradient-text font-bold text-xl">Velvet</div>

          <div className="flex items-center gap-6 text-sm text-[#8888a0]">
            <Link href="/signup" className="hover:text-white transition-colors">Sign Up</Link>
            <Link href="/login" className="hover:text-white transition-colors">Fan Login</Link>
            <span>© 2026 Velvet. All rights reserved.</span>
          </div>

          <Link href="/creator-login" className="text-xs text-[#8888a0] hover:text-[#e040fb] transition-colors">
            Creator Login
          </Link>
        </div>
      </footer>
    </div>
  )
}
