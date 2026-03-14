import Link from 'next/link'
import Navbar from '@/components/Navbar'

const FEATURED_CREATORS = [
  { username: 'aurora', displayName: 'Aurora Belle', subscribers: '12.4K', price: '9.99', initials: 'AB', color: 'from-pink-500 to-purple-600' },
  { username: 'nxvak', displayName: 'Nxvak', subscribers: '8.9K', price: '7.99', initials: 'NX', color: 'from-violet-500 to-indigo-600' },
  { username: 'luxelena', displayName: 'Luxe Lena', subscribers: '21.3K', price: '14.99', initials: 'LL', color: 'from-fuchsia-500 to-pink-600' },
  { username: 'solaris', displayName: 'Solaris', subscribers: '5.1K', price: '6.99', initials: 'SL', color: 'from-purple-600 to-blue-600' },
  { username: 'nightbloom', displayName: 'Night Bloom', subscribers: '14.7K', price: '12.99', initials: 'NB', color: 'from-pink-600 to-rose-600' },
  { username: 'vellichor', displayName: 'Vellichor', subscribers: '9.2K', price: '8.99', initials: 'VL', color: 'from-indigo-500 to-purple-600' },
]

const TESTIMONIALS = [
  {
    quote: "Finally a platform where my favourite creators actually post their best stuff. Absolutely worth every penny.",
    name: 'Jamie R.',
    stars: 5,
  },
  {
    quote: "The content quality here is on another level. I cancelled every other subscription I had.",
    name: 'Mia K.',
    stars: 5,
  },
  {
    quote: "Direct messages with creators actually get answered. Feels way more personal than anywhere else.",
    name: 'Tom H.',
    stars: 5,
  },
  {
    quote: "Easy to find new creators, easy to subscribe, and the content never disappoints. Love it.",
    name: 'Sara L.',
    stars: 5,
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0d0d0f] text-white">
      <Navbar />

      {/* ─── Hero ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-40 pb-28 px-6">
        {/* Layered ambient glow orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-24 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full blur-[140px] opacity-30"
            style={{ background: 'radial-gradient(ellipse, #e040fb 0%, #7c4dff 60%, transparent 100%)' }}
          />
          <div
            className="absolute top-1/2 -left-40 w-[500px] h-[400px] rounded-full blur-[120px] opacity-20"
            style={{ background: 'radial-gradient(ellipse, #e040fb 0%, transparent 70%)' }}
          />
          <div
            className="absolute top-1/3 -right-32 w-[440px] h-[380px] rounded-full blur-[110px] opacity-20"
            style={{ background: 'radial-gradient(ellipse, #7c4dff 0%, transparent 70%)' }}
          />
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] rounded-full blur-[100px] opacity-15"
            style={{ background: 'radial-gradient(ellipse, #e040fb 0%, #7c4dff 70%, transparent 100%)' }}
          />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1e1e21] border border-[#2a2a30] text-sm text-[#8888a0] mb-10">
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
            />
            Members-only content
          </div>

          {/* Headline */}
          <h1 className="text-6xl md:text-8xl font-black leading-[1.05] tracking-tight mb-7">
            Your favourite creators.{' '}
            <span className="velvet-gradient-text block mt-1">Uncensored.</span>
          </h1>

          {/* Subtext */}
          <p className="text-xl md:text-2xl text-[#8888a0] max-w-2xl mx-auto mb-12 leading-relaxed font-light">
            Exclusive photos, videos and messages.{' '}
            <span className="text-white font-medium">Subscribe to unlock everything.</span>
          </p>

          {/* CTA */}
          <Link
            href="/signup"
            className="inline-block px-12 py-4 rounded-2xl text-lg font-bold text-white hover:opacity-90 transition-all hover:scale-[1.02] active:scale-100 shadow-2xl shadow-purple-900/40"
            style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
          >
            Join Free
          </Link>

          {/* Stats row */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-3">
            {[
              { value: '10,000+', label: 'creators' },
              { value: '500,000+', label: 'fans' },
              { value: 'New content', label: 'daily' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#161618] border border-[#2a2a30] text-sm"
              >
                <span className="font-semibold text-white">{stat.value}</span>
                <span className="text-[#8888a0]">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ──────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">How it works</h2>
          <p className="text-center text-[#8888a0] mb-16 text-lg">Three simple steps to get started</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                icon: '👤',
                title: 'Create a free account',
                desc: 'Sign up in seconds. No card required to browse — ever.',
              },
              {
                step: '02',
                icon: '🔍',
                title: 'Find creators you love',
                desc: 'Browse thousands of creators across every category imaginable.',
              },
              {
                step: '03',
                icon: '🔓',
                title: 'Subscribe and unlock',
                desc: 'Get access to exclusive content, direct messages, and more.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative rounded-2xl p-8 border border-[#2a2a30] bg-[#161618] overflow-hidden"
              >
                <div
                  className="absolute top-4 right-4 text-5xl font-black opacity-[0.04] select-none pointer-events-none"
                  style={{ color: '#e040fb' }}
                >
                  {item.step}
                </div>
                <div className="text-4xl mb-5">{item.icon}</div>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-[#8888a0] text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Featured Creators ─────────────────────────────── */}
      <section className="py-24 px-6 bg-[#0a0a0c]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-3">Popular right now</h2>
          <p className="text-center text-[#8888a0] mb-14 text-lg">The creators everyone is talking about</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURED_CREATORS.map((creator) => (
              <Link key={creator.username} href={`/${creator.username}`} className="group block">
                <div className="relative rounded-2xl overflow-hidden border border-[#2a2a30] bg-[#161618] transition-all duration-300 hover:border-[#e040fb55] hover:shadow-[0_0_40px_rgba(224,64,251,0.12)]">
                  {/* Banner */}
                  <div className={`h-28 bg-gradient-to-br ${creator.color} opacity-75`} />

                  <div className="p-5 pt-0">
                    {/* Avatar */}
                    <div
                      className={`-mt-8 w-16 h-16 rounded-2xl bg-gradient-to-br ${creator.color} flex items-center justify-center text-white font-black text-xl mb-4 border-[3px] border-[#161618] shadow-lg`}
                    >
                      {creator.initials}
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-white text-base">{creator.displayName}</div>
                        <div className="text-sm text-[#8888a0] mt-0.5">{creator.subscribers} subscribers</div>
                      </div>
                      <div
                        className="shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold text-white mt-0.5"
                        style={{ background: 'linear-gradient(135deg, rgba(224,64,251,0.2), rgba(124,77,255,0.2))', border: '1px solid rgba(224,64,251,0.25)' }}
                      >
                        From ${creator.price}/mo
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-[#2a2a30] flex items-center justify-between">
                      <span className="text-xs text-[#555568]">Exclusive content</span>
                      <span
                        className="text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: '#e040fb' }}
                      >
                        Subscribe →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/explore"
              className="inline-block px-8 py-3.5 rounded-xl text-sm font-semibold border border-[#2a2a30] text-[#8888a0] hover:text-white hover:border-[#e040fb55] transition-all"
            >
              Browse all creators
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Testimonials ──────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-3">Loved by fans worldwide</h2>
          <p className="text-center text-[#8888a0] mb-14 text-lg">Join millions of fans already on Velvet</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="rounded-2xl p-7 border border-[#2a2a30] bg-[#161618]">
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <svg key={j} className="w-4 h-4" viewBox="0 0 20 20" fill="#e040fb">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-white leading-relaxed mb-5 text-[15px]">&ldquo;{t.quote}&rdquo;</p>
                <div className="text-sm text-[#555568] font-medium">{t.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div
            className="relative rounded-3xl p-14 text-center overflow-hidden border border-[#2a2a30]"
            style={{ background: 'linear-gradient(135deg, rgba(224,64,251,0.07), rgba(124,77,255,0.1))' }}
          >
            {/* Inner glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at 50% -20%, rgba(224,64,251,0.25) 0%, transparent 60%)',
              }}
            />
            <div className="relative">
              <h2 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
                Ready to see more?
              </h2>
              <p className="text-[#8888a0] mb-10 text-lg">
                Free to join. Cancel any time.
              </p>
              <Link
                href="/signup"
                className="inline-block px-12 py-4 rounded-2xl text-lg font-bold text-white hover:opacity-90 transition-all hover:scale-[1.02] active:scale-100 shadow-2xl shadow-purple-900/40"
                style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
              >
                Create your free account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ────────────────────────────────────────── */}
      <footer className="border-t border-[#2a2a30] py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left — logo + copyright */}
          <div className="flex items-center gap-3">
            <span className="velvet-gradient-text font-bold text-xl">Velvet</span>
            <span className="text-[#2a2a30] text-sm select-none">|</span>
            <span className="text-sm text-[#555568]">© 2026 Velvet</span>
          </div>

          {/* Center — nav links */}
          <nav className="flex items-center gap-6 text-sm text-[#555568]">
            <Link href="/" className="hover:text-[#8888a0] transition-colors">Home</Link>
            <Link href="/explore" className="hover:text-[#8888a0] transition-colors">Explore</Link>
            <Link href="/signup" className="hover:text-[#8888a0] transition-colors">Sign Up</Link>
            <Link href="/login" className="hover:text-[#8888a0] transition-colors">Login</Link>
          </nav>

          {/* Right — hidden creator link */}
          <Link
            href="/creator-login"
            className="text-xs text-[#2a2a30] hover:text-[#555568] transition-colors"
          >
            For creators
          </Link>
        </div>
      </footer>
    </div>
  )
}
