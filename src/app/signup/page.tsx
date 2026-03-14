'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', username: '', displayName: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Signup failed')
      router.push('/login?registered=1')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center px-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] blur-[100px] rounded-full" style={{background: 'linear-gradient(135deg, rgba(224,64,251,0.15), rgba(124,77,255,0.15))'}} />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="velvet-gradient-text text-3xl font-bold">Velvet</Link>
          <p className="text-[#8888a0] mt-2">Join the community</p>
        </div>

        <div className="rounded-2xl p-8 border border-[#2a2a30] bg-[#161618]">
          <h1 className="text-2xl font-bold mb-6">Create your account</h1>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#8888a0] mb-1.5">Display Name</label>
              <input
                type="text"
                required
                value={form.displayName}
                onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                placeholder="Your name"
                className="w-full px-4 py-2.5 rounded-xl bg-[#1e1e21] border border-[#2a2a30] text-white placeholder-[#555568] focus:outline-none focus:border-[#e040fb] focus:ring-1 focus:ring-[#e040fb33] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#8888a0] mb-1.5">Username</label>
              <input
                type="text"
                required
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                placeholder="username"
                className="w-full px-4 py-2.5 rounded-xl bg-[#1e1e21] border border-[#2a2a30] text-white placeholder-[#555568] focus:outline-none focus:border-[#e040fb] focus:ring-1 focus:ring-[#e040fb33] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#8888a0] mb-1.5">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-xl bg-[#1e1e21] border border-[#2a2a30] text-white placeholder-[#555568] focus:outline-none focus:border-[#e040fb] focus:ring-1 focus:ring-[#e040fb33] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#8888a0] mb-1.5">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="At least 8 characters"
                className="w-full px-4 py-2.5 rounded-xl bg-[#1e1e21] border border-[#2a2a30] text-white placeholder-[#555568] focus:outline-none focus:border-[#e040fb] focus:ring-1 focus:ring-[#e040fb33] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90 mt-2"
              style={{background: 'linear-gradient(135deg, #e040fb, #7c4dff)'}}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-[#8888a0] mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-[#e040fb] hover:text-[#ef70ff] transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
