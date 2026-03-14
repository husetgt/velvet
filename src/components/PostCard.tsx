'use client'

import { useState, useEffect } from 'react'
import UnlockButton from './UnlockButton'

interface CommentItem {
  id: string
  userId: string
  postId: string
  content: string
  createdAt: string
  user: {
    id: string
    displayName: string
    username: string
    avatarUrl?: string | null
  }
}

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

/**
 * Image carousel — Fanvue style:
 * - aspect-[4/5] max-h-[500px], object-cover
 * - "Subscribers only" badge top-left if locked
 * - blur-xl on the actual image for locked posts (not a placeholder)
 * - "1/N" indicator bottom-center
 */
function ImageCarousel({
  urls,
  isBlurred,
  isLocked,
  price,
  postId,
  onUnlock,
}: {
  urls: string[]
  isBlurred: boolean
  isLocked: boolean
  price?: number | null
  postId: string
  onUnlock?: (id: string) => void
}) {
  const [idx, setIdx] = useState(0)

  return (
    <div className="relative w-full aspect-video max-h-[480px] bg-black overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={urls[idx]}
        alt=""
        className={`w-full h-full object-contain transition-all ${isBlurred ? 'blur-xl scale-105' : ''}`}
      />

      {/* Subscribers-only badge — top-left */}
      {isLocked && (
        <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/70 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C9.24 2 7 4.24 7 7v1H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2V7c0-2.76-2.24-5-5-5zm0 2c1.66 0 3 1.34 3 3v1H9V7c0-1.66 1.34-3 3-3zm0 10a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
          </svg>
          {price ? `$${Number(price).toFixed(2)}` : 'Subscribers only'}
        </div>
      )}

      {/* Unlock button overlay for locked posts with price */}
      {isBlurred && price && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/60 backdrop-blur-sm rounded-2xl px-6 py-4 flex flex-col items-center gap-3">
            <p className="text-white font-bold text-lg">${Number(price).toFixed(2)}</p>
            <p className="text-white/60 text-xs">One-time unlock</p>
            <UnlockButton postId={postId} price={price} onUnlock={onUnlock} />
          </div>
        </div>
      )}

      {/* Unlock message for locked posts without price (subscribers only) */}
      {isBlurred && !price && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/50 backdrop-blur-sm rounded-2xl px-6 py-4 flex flex-col items-center gap-2 text-center">
            <svg className="w-8 h-8 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <p className="text-white font-semibold text-sm">Subscribers only</p>
            <p className="text-white/50 text-xs">Subscribe to unlock this content</p>
          </div>
        </div>
      )}

      {/* Carousel controls */}
      {urls.length > 1 && (
        <>
          {idx > 0 && (
            <button
              onClick={() => setIdx((i) => i - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors z-10"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}
          {idx < urls.length - 1 && (
            <button
              onClick={() => setIdx((i) => i + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors z-10"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
          {/* Page indicator — bottom-center */}
          <div className="absolute bottom-3 left-0 right-0 flex justify-center z-10">
            <span className="px-2.5 py-0.5 rounded-full text-xs text-white font-medium bg-black/60 backdrop-blur-sm">
              {idx + 1}/{urls.length}
            </span>
          </div>
        </>
      )}
    </div>
  )
}

function CommentAvatar({ displayName, avatarUrl }: { displayName: string; avatarUrl?: string | null }) {
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  if (avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatarUrl} alt={displayName} className="w-7 h-7 rounded-full object-cover shrink-0" />
  }
  return (
    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}>
      {initials}
    </div>
  )
}

export default function PostCard({ post, isUnlocked = false, onUnlock }: PostCardProps) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.likesCount)
  const [likeLoading, setLikeLoading] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<CommentItem[]>([])
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [commentInput, setCommentInput] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  const isBlurred = post.isLocked && !isUnlocked
  const timestamp = timeAgo(post.createdAt)
  const isVideo = post.mediaUrls.length > 0 && /\.(mp4|mov|webm|ogg)(\?|$)/i.test(post.mediaUrls[0])

  // Load like state on mount
  useEffect(() => {
    fetch(`/api/posts/${post.id}/likes`)
      .then(r => r.json())
      .then(d => {
        if (typeof d.count === 'number') setLikeCount(d.count)
        if (typeof d.liked === 'boolean') setLiked(d.liked)
      })
      .catch(() => {})
  }, [post.id])

  const handleLike = async () => {
    if (likeLoading) return
    const wasLiked = liked
    setLiked(!wasLiked)
    setLikeCount(c => wasLiked ? c - 1 : c + 1)
    setLikeLoading(true)
    try {
      const res = await fetch('/api/posts/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id }),
      })
      const data = await res.json()
      if (res.ok) {
        setLiked(data.liked)
        setLikeCount(data.count)
      } else {
        setLiked(wasLiked)
        setLikeCount(c => wasLiked ? c + 1 : c - 1)
      }
    } catch {
      setLiked(wasLiked)
      setLikeCount(c => wasLiked ? c + 1 : c - 1)
    } finally {
      setLikeLoading(false)
    }
  }

  const loadComments = async () => {
    if (commentsLoaded) return
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`)
      const data = await res.json()
      if (data.comments) setComments(data.comments)
      setCommentsLoaded(true)
    } catch {}
  }

  const handleToggleComments = () => {
    if (!showComments && !commentsLoaded) {
      loadComments()
    }
    setShowComments(v => !v)
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentInput.trim() || submittingComment) return
    setSubmittingComment(true)
    try {
      const res = await fetch('/api/posts/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, content: commentInput.trim() }),
      })
      const data = await res.json()
      if (res.ok && data.comment) {
        setComments(prev => [...prev, data.comment])
        setCommentInput('')
      }
    } finally {
      setSubmittingComment(false)
    }
  }

  return (
    <div className="rounded-2xl border border-[#2a2a30] bg-[#161618] overflow-hidden mb-4">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <a href={`/${post.creator.username}`}>
          <CreatorAvatar displayName={post.creator.displayName} avatarUrl={post.creator.avatarUrl} />
        </a>
        <div className="flex-1 min-w-0">
          <a href={`/${post.creator.username}`} className="font-semibold text-white text-sm leading-tight hover:text-[#e040fb] transition-colors">
            {post.creator.displayName}
          </a>
          <div className="text-xs text-[#8888a0] mt-0.5">@{post.creator.username}</div>
        </div>
        <span className="text-xs text-[#8888a0] shrink-0">{timestamp}</span>
      </div>

      {/* Caption — always visible */}
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
          {isVideo ? (
            /* Video — always show, blurred if locked */
            <div className="relative w-full aspect-video max-h-[480px] bg-black overflow-hidden">
              <video
                src={post.mediaUrls[0]}
                className={`w-full h-full object-cover ${isBlurred ? 'blur-xl scale-105' : ''}`}
                controls={!isBlurred}
                playsInline
              />
              {isBlurred && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black/60 backdrop-blur-sm rounded-2xl px-6 py-4 flex flex-col items-center gap-2 text-center">
                    <svg className="w-8 h-8 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <p className="text-white font-semibold text-sm">
                      {post.price ? `$${Number(post.price).toFixed(2)} unlock` : 'Subscribers only'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Image carousel — Fanvue style */
            <ImageCarousel
              urls={post.mediaUrls}
              isBlurred={isBlurred}
              isLocked={post.isLocked}
              price={post.price}
              postId={post.id}
              onUnlock={onUnlock}
            />
          )}
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-3 flex items-center gap-5 text-sm text-[#8888a0] border-t border-[#1e1e21]">
        {/* Like */}
        <button
          onClick={handleLike}
          disabled={likeLoading}
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
          <span className="font-medium">{likeCount}</span>
        </button>

        {/* Comment */}
        <button
          onClick={handleToggleComments}
          className={`flex items-center gap-1.5 transition-colors hover:text-white ${showComments ? 'text-white' : ''}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="font-medium">{comments.length}</span>
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="border-t border-[#1e1e21] px-4 pb-4">
          <div className="pt-3 space-y-3 max-h-64 overflow-y-auto">
            {!commentsLoaded && (
              <div className="flex justify-center py-4">
                <div className="w-4 h-4 rounded-full border-2 border-[#e040fb] border-t-transparent animate-spin" />
              </div>
            )}
            {commentsLoaded && comments.length === 0 && (
              <p className="text-[#555568] text-xs text-center py-2">No comments yet. Be the first!</p>
            )}
            {comments.map(c => (
              <div key={c.id} className="flex items-start gap-2">
                <CommentAvatar displayName={c.user.displayName} avatarUrl={c.user.avatarUrl} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-white text-xs font-semibold">{c.user.displayName}</span>
                    <span className="text-[#555568] text-[10px]">{timeAgo(c.createdAt)}</span>
                  </div>
                  <p className="text-[#d0d0e0] text-sm leading-relaxed mt-0.5">{c.content}</p>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleSubmitComment} className="flex items-center gap-2 mt-3">
            <input
              type="text"
              value={commentInput}
              onChange={e => setCommentInput(e.target.value)}
              placeholder="Write a comment…"
              className="flex-1 rounded-xl bg-[#1e1e21] border border-[#2a2a30] text-white placeholder-[#555568] focus:outline-none focus:border-[#e040fb44] transition-all px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={!commentInput.trim() || submittingComment}
              className="w-8 h-8 rounded-xl flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-opacity shrink-0"
              style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
            >
              <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
