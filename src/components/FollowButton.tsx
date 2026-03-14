'use client'

import { useState } from 'react'

interface Props {
  creatorId: string
  initialIsFollowing: boolean
}

export default function FollowButton({ creatorId, initialIsFollowing }: Props) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      if (isFollowing) {
        await fetch('/api/follow', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ creatorId }),
        })
        setIsFollowing(false)
      } else {
        await fetch('/api/follow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ creatorId }),
        })
        setIsFollowing(true)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`px-4 py-2 rounded-full text-sm font-semibold transition-all min-h-[38px] flex items-center gap-1.5 disabled:opacity-60 ${
        isFollowing
          ? 'border border-[#3a3a44] text-[#e040fb] hover:border-red-500/40 hover:text-red-400'
          : 'border border-[#3a3a44] text-white hover:border-[#e040fb44] hover:bg-[#161618]'
      }`}
    >
      {loading ? (
        <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      ) : isFollowing ? (
        <>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
          Following
        </>
      ) : (
        'Follow'
      )}
    </button>
  )
}
