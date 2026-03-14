'use client'

import { useState } from 'react'
import UnlockButton from './UnlockButton'

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

function timeAgo(date: string | Date): string {
  const now = new Date()
  const d = typeof date === 'string' ? new Date(date) : date
  const diffMs = now.getTime() - d.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return 'just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? 's' : ''} ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 30) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function CreatorAvatar({ displayName, avatarUrl }: { displayName: string; avatarUrl?: string | null }) {
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  if (avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatarUrl} alt={displayName} className="w-10 h-10 rounded-full object-cover shrink-0" />
  }
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
      style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
    >
      {initials}
    </div>
  )
}

function ImageCarousel({ urls }: { urls: string[] }) {
  const [idx, setIdx] = useState(0)
  return (
    <div className="relative aspect-[4/5] bg-black overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={urls[idx]}
        alt=""
        className="w-full h-full object-cover"
      />
      {urls.length > 1 && (
        <>
          {/* Prev */}
          {idx > 0 && (
            <button
              onClick={() => setIdx((i) => i - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}
          {/* Next */}
          {idx < urls.length - 1 && (
            <button
              onClick={() => setIdx((i) => i + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
          {/* Page indicator */}
          <div className="absolute bottom-3 left-0 right-0 flex justify-center">
            <span className="px-2.5 py-0.5 rounded-full text-xs text-white font-medium bg-black/60 backdrop-blur-sm">
              {idx + 1}/{urls.length}
            </span>
          </div>
        </>
      )}
    </div>
  )
}

function LockedOverlay({ price, postId, onUnlock }: { price?: number | null; postId: string; onUnlock?: (id: string) => void }) {
  return (
    <div
      className="relative aspect-[4/5] overflow-hidden flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, rgba(224,64,251,0.18), rgba(124,77,255,0.18), rgba(13,13,15,0.7))',
      }}
    >
      {/* Blurred gradient shapes */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-full h-full" style={{ background: 'linear-gradient(135deg, rgba(224,64,251,0.3), rgba(124,77,255,0.3))' }} />
      </div>
      {/* Dark overlay */}
      <div className="absolute inset-0" style={{ background: 'rgba(13,13,15,0.55)' }} />
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{
            background: 'linear-gradient(135deg, rgba(224,64,251,0.2), rgba(124,77,255,0.2))',
            border: '1px solid rgba(224,64,251,0.35)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="url(#lock-grad-ov)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <defs>
              <linearGradient id="lock-grad-ov" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e040fb" />
                <stop offset="100%" stopColor="#7c4dff" />
              </linearGradient>
            </defs>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        {price ? (
          <>
            <p className="text-white font-bold text-lg mb-1">${Number(price).toFixed(2)}</p>
            <p className="text-white/60 text-xs mb-4">One-time unlock</p>
            <UnlockButton postId={postId} price={price} onUnlock={onUnlock} />
          </>
        ) : (
          <>
            <p className="text-white font-semibold text-sm mb-1">Subscribers only</p>
            <p className="text-white/50 text-xs">Subscribe to unlock this content</p>
          </>
        )}
      </div>
    </div>
  )
}

export default function PostCard({ post, isUnlocked = false, onUnlock }: PostCardProps) {
  const [liked, setLiked] = useState(false)
  const [commentCount] = useState(0)

  const isBlurred = post.isLocked && !isUnlocked
  const timestamp = timeAgo(post.createdAt)

  // Detect video URLs
  const isVideo = post.mediaUrls.length > 0 && /\.(mp4|mov|webm|ogg)(\?|$)/i.test(post.mediaUrls[0])

  return (
    <div className="rounded-2xl border border-[#2a2a30] bg-[#161618] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <CreatorAvatar displayName={post.creator.displayName} avatarUrl={post.creator.avatarUrl} />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white text-sm leading-tight">{post.creator.displayName}</div>
          <div className="text-xs text-[#8888a0] mt-0.5">@{post.creator.username}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-[#8888a0]">{timestamp}</span>
          {/* Three-dot menu */}
          <button className="w-7 h-7 rounded-lg flex items-center justify-center text-[#8888a0] hover:text-white hover:bg-[#1e1e21] transition-colors">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Caption */}
      {(post.title || post.content) && (
        <div className="px-4 pb-3">
          {post.title && (
            <h3 className="font-semibold text-white mb-1.5 leading-snug text-[15px]">{post.title}</h3>
          )}
          {post.content && (
            <p className="text-[#d0d0e0] text-[15px] leading-relaxed">{post.content}</p>
          )}
        </div>
      )}

      {/* Media */}
      {post.mediaUrls.length > 0 && (
        <div className="overflow-hidden">
          {isBlurred ? (
            <LockedOverlay price={post.price} postId={post.id} onUnlock={onUnlock} />
          ) : isVideo ? (
            <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <video
                src={post.mediaUrls[0]}
                className="w-full h-full object-cover"
                controls
                playsInline
              />
            </div>
          ) : (
            <ImageCarousel urls={post.mediaUrls} />
          )}
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-3 flex items-center gap-5 text-sm text-[#8888a0] border-t border-[#1e1e21]">
        {/* Like */}
        <button
          onClick={() => setLiked((l) => !l)}
          className={`flex items-center gap-1.5 transition-all hover:text-[#e040fb] active:scale-110 ${liked ? 'text-[#e040fb]' : ''}`}
        >
          <svg
            className="w-[18px] h-[18px]"
            viewBox="0 0 24 24"
            fill={liked ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span className="font-medium">{post.likesCount + (liked ? 1 : 0)}</span>
        </button>

        {/* Comment */}
        <button className="flex items-center gap-1.5 transition-colors hover:text-white">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="font-medium">{commentCount}</span>
        </button>

        {/* PPV badge */}
        {post.isLocked && post.price && !isUnlocked && (
          <div
            className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold"
            style={{
              background: 'linear-gradient(135deg, rgba(224,64,251,0.12), rgba(124,77,255,0.12))',
              border: '1px solid rgba(224,64,251,0.25)',
              color: '#e040fb',
            }}
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C9.24 2 7 4.24 7 7v1H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2V7c0-2.76-2.24-5-5-5zm0 2c1.66 0 3 1.34 3 3v1H9V7c0-1.66 1.34-3 3-3zm0 10a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
            </svg>
            ${Number(post.price).toFixed(2)}
          </div>
        )}
      </div>
    </div>
  )
}
