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

export default function PostCard({ post, isUnlocked = false, onUnlock }: PostCardProps) {
  const [liked, setLiked] = useState(false)
  const isBlurred = post.isLocked && !isUnlocked

  const dateStr =
    typeof post.createdAt === 'string'
      ? new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : post.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  const initials = post.creator.displayName.charAt(0).toUpperCase()

  return (
    <div className="rounded-2xl border border-[#2a2a30] bg-[#161618] overflow-hidden transition-all hover:border-[#e040fb33] hover:shadow-[0_0_24px_rgba(224,64,251,0.06)]">
      {/* Creator header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div className="relative shrink-0">
          {post.creator.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.creator.avatarUrl}
              alt={post.creator.displayName}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
            >
              {initials}
            </div>
          )}
          {/* Online dot */}
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#0d0d0f] border-2 border-[#161618]" style={{background: 'none'}} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white text-sm leading-tight">{post.creator.displayName}</div>
          <div className="text-xs text-[#555568] mt-0.5">@{post.creator.username} · {dateStr}</div>
        </div>
        {post.isLocked && (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(224,64,251,0.12), rgba(124,77,255,0.12))',
              border: '1px solid rgba(224,64,251,0.25)',
              color: '#e040fb',
            }}
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C9.24 2 7 4.24 7 7v1H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2V7c0-2.76-2.24-5-5-5zm0 2c1.66 0 3 1.34 3 3v1H9V7c0-1.66 1.34-3 3-3zm0 10a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/>
            </svg>
            PPV
          </div>
        )}
      </div>

      {/* Text content */}
      {(post.title || post.content) && (
        <div className="px-4 pb-3">
          {post.title && (
            <h3 className={`font-semibold text-white mb-1.5 leading-snug ${isBlurred ? 'blur-sm select-none' : ''}`}>
              {post.title}
            </h3>
          )}
          <p className={`text-[#b0b0c8] text-sm leading-relaxed ${isBlurred ? 'blur-sm select-none' : ''}`}>
            {isBlurred ? post.content.substring(0, 120) + '…' : post.content}
          </p>
        </div>
      )}

      {/* Media */}
      {post.mediaUrls.length > 0 && (
        <div className="relative mx-4 mb-3 rounded-xl overflow-hidden">
          {/* Actual media (shown if unlocked) */}
          {!isBlurred ? (
            <div className="grid gap-1" style={{gridTemplateColumns: post.mediaUrls.length > 1 ? '1fr 1fr' : '1fr'}}>
              {post.mediaUrls.slice(0, 4).map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={url}
                  alt=""
                  className="w-full object-cover rounded-xl"
                  style={{ maxHeight: post.mediaUrls.length > 1 ? '200px' : '360px' }}
                />
              ))}
            </div>
          ) : (
            /* Locked placeholder */
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
              {/* Blurred gradient background */}
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(135deg, rgba(224,64,251,0.25), rgba(124,77,255,0.25), rgba(13,13,15,0.6))',
                  backdropFilter: 'blur(2px)',
                }}
              />
              {/* Blurred pseudo-content */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="grid grid-cols-2 gap-2 w-full h-full p-3 opacity-20">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="rounded-lg"
                      style={{
                        background: `linear-gradient(${45 + i * 30}deg, rgba(224,64,251,0.4), rgba(124,77,255,0.4))`,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Lock overlay */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center"
                style={{ background: 'rgba(13,13,15,0.55)' }}
              >
                {/* Lock icon */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-2xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(224,64,251,0.2), rgba(124,77,255,0.2))',
                    border: '1px solid rgba(224,64,251,0.3)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="url(#lock-grad-card)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <defs>
                      <linearGradient id="lock-grad-card" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#e040fb" />
                        <stop offset="100%" stopColor="#7c4dff" />
                      </linearGradient>
                    </defs>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>

                {/* Count badge */}
                <div className="mb-1 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-white/70 bg-black/30">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                  </svg>
                  {post.mediaUrls.length} {post.mediaUrls.length === 1 ? 'file' : 'files'}
                </div>

                <p className="text-white font-bold text-base mb-1">
                  {post.price ? `Unlock for $${Number(post.price).toFixed(2)}` : 'Subscribe to unlock'}
                </p>
                <p className="text-white/50 text-xs mb-4">
                  {post.price ? 'One-time purchase' : 'Included with subscription'}
                </p>

                {post.price && (
                  <UnlockButton
                    postId={post.id}
                    price={Number(post.price)}
                    onUnlock={onUnlock}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="px-4 pb-4 pt-1 flex items-center gap-5 text-sm text-[#555568] border-t border-[#1e1e21]">
        <button
          onClick={() => setLiked((l) => !l)}
          className={`flex items-center gap-1.5 transition-all hover:text-[#e040fb] active:scale-110 ${liked ? 'text-[#e040fb]' : ''}`}
        >
          <svg
            className="w-4.5 h-4.5 w-[18px] h-[18px]"
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
      </div>
    </div>
  )
}
