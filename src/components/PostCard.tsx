'use client'

import { useState } from 'react'
import Image from 'next/image'

interface Post {
  id: string
  title?: string | null
  content: string
  mediaUrls: string[]
  isLocked: boolean
  price?: number | null
  likesCount: number
  createdAt: string | Date
  creator: {
    username: string
    displayName: string
    avatarUrl?: string | null
  }
}

interface PostCardProps {
  post: Post
  isUnlocked?: boolean
  onUnlock?: (postId: string) => void
}

export default function PostCard({ post, isUnlocked = false, onUnlock }: PostCardProps) {
  const [unlocking, setUnlocking] = useState(false)
  const [liked, setLiked] = useState(false)
  const isBlurred = post.isLocked && !isUnlocked

  const handleUnlock = async () => {
    if (!onUnlock) return
    setUnlocking(true)
    try {
      const res = await fetch('/api/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id }),
      })
      if (res.ok) onUnlock(post.id)
      else {
        const data = await res.json()
        alert(data.error || 'Failed to unlock post')
      }
    } finally {
      setUnlocking(false)
    }
  }

  const dateStr = typeof post.createdAt === 'string'
    ? new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : post.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <div className="rounded-2xl border border-[#2a2a30] bg-[#161618] overflow-hidden hover:border-[#e040fb22] transition-all">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
          style={{background: 'linear-gradient(135deg, #e040fb, #7c4dff)'}}>
          {post.creator.displayName.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="font-semibold text-white text-sm">{post.creator.displayName}</div>
          <div className="text-xs text-[#555568]">@{post.creator.username} · {dateStr}</div>
        </div>
        {post.isLocked && (
          <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium" style={{background: 'linear-gradient(135deg, rgba(224,64,251,0.15), rgba(124,77,255,0.15))', border: '1px solid rgba(224,64,251,0.2)'}}>
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{color: '#e040fb'}}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span style={{color: '#e040fb'}}>Premium</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`px-4 pb-3 relative ${isBlurred ? 'select-none' : ''}`}>
        {post.title && (
          <h3 className={`font-semibold text-white mb-2 ${isBlurred ? 'blur-sm' : ''}`}>{post.title}</h3>
        )}
        <p className={`text-[#ccccdd] text-sm leading-relaxed ${isBlurred ? 'blur-sm' : ''}`}>
          {isBlurred ? post.content.substring(0, 100) + '...' : post.content}
        </p>
      </div>

      {/* Media */}
      {post.mediaUrls.length > 0 && (
        <div className={`relative mx-4 mb-3 rounded-xl overflow-hidden ${isBlurred ? '' : ''}`}>
          <div className={`${isBlurred ? 'blur-xl scale-105' : ''} transition-all`}>
            <div className="aspect-video bg-[#1e1e21] rounded-xl overflow-hidden">
              {/* Show first image */}
              <div className="w-full h-full flex items-center justify-center text-[#555568] text-sm">
                {post.mediaUrls.length} media file{post.mediaUrls.length > 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Unlock overlay */}
          {isBlurred && (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl" style={{background: 'rgba(13,13,15,0.7)', backdropFilter: 'blur(4px)'}}>
              <svg className="w-8 h-8 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{color: '#e040fb'}}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <p className="text-white font-semibold mb-1">Unlock this post</p>
              <p className="text-[#8888a0] text-sm mb-4">
                {post.price ? `$${Number(post.price).toFixed(2)} one-time` : 'Subscribe to access'}
              </p>
              {post.price && onUnlock && (
                <button
                  onClick={handleUnlock}
                  disabled={unlocking}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
                  style={{background: 'linear-gradient(135deg, #e040fb, #7c4dff)'}}
                >
                  {unlocking ? 'Unlocking...' : `Unlock for $${Number(post.price).toFixed(2)}`}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Footer actions */}
      <div className="px-4 pb-4 flex items-center gap-4 text-sm text-[#555568]">
        <button
          onClick={() => setLiked(l => !l)}
          className={`flex items-center gap-1.5 transition-colors hover:text-[#e040fb] ${liked ? 'text-[#e040fb]' : ''}`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <span>{post.likesCount + (liked ? 1 : 0)}</span>
        </button>
      </div>
    </div>
  )
}
