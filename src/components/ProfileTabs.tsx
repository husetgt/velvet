'use client'

import { useState } from 'react'
import Link from 'next/link'
import PostCard from '@/components/PostCard'

interface Post {
  id: string
  title?: string | null
  content: string
  mediaUrls: string[]
  isLocked: boolean
  price?: number | null
  likesCount: number
  createdAt: string
  isUnlocked: boolean
  creator: {
    username: string
    displayName: string
    avatarUrl?: string | null
  }
}

interface ProfileTabsProps {
  posts: Post[]
  isOwnProfile: boolean
}

export default function ProfileTabs({ posts, isOwnProfile }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<'posts' | 'media'>('posts')

  const mediaPosts = posts.filter(p => p.mediaUrls && p.mediaUrls.length > 0)

  return (
    <>
      {/* Tabs */}
      <div className="flex items-center border-b border-[#2a2a30] mb-6">
        <button
          onClick={() => setActiveTab('posts')}
          className={`relative pb-3 mr-6 transition-colors ${activeTab === 'posts' ? '' : 'text-[#8888a0] hover:text-white'}`}
        >
          {activeTab === 'posts' ? (
            <span
              className="font-semibold text-sm"
              style={{
                background: 'linear-gradient(135deg, #e040fb, #7c4dff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Posts
            </span>
          ) : (
            <span className="font-medium text-sm">Posts</span>
          )}
          {activeTab === 'posts' && (
            <div
              className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
              style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
            />
          )}
        </button>

        <button
          onClick={() => setActiveTab('media')}
          className={`relative pb-3 mr-6 transition-colors ${activeTab === 'media' ? '' : 'text-[#8888a0] hover:text-white'}`}
        >
          {activeTab === 'media' ? (
            <span
              className="font-semibold text-sm"
              style={{
                background: 'linear-gradient(135deg, #e040fb, #7c4dff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Media
            </span>
          ) : (
            <span className="font-medium text-sm">Media</span>
          )}
          {activeTab === 'media' && (
            <div
              className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
              style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
            />
          )}
        </button>
      </div>

      {/* Posts tab */}
      {activeTab === 'posts' && (
        <>
          {posts.length === 0 ? (
            <div className="text-center py-20 text-[#8888a0] text-sm">
              No posts yet — check back soon.
            </div>
          ) : (
            <div className="space-y-5 pb-16">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} isUnlocked={post.isUnlocked} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Media tab */}
      {activeTab === 'media' && (
        <>
          {mediaPosts.length === 0 ? (
            <div className="text-center py-20 text-[#8888a0] text-sm">
              No media yet.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5 pb-16">
              {mediaPosts.map((post) => {
                const firstMedia = post.mediaUrls[0]
                const isVideo = /\.(mp4|mov|webm|ogg)/i.test(firstMedia)
                const isLocked = post.isLocked && !post.isUnlocked

                return (
                  <Link
                    key={post.id}
                    href={`/${post.creator.username}#post-${post.id}`}
                    className="relative aspect-square rounded-lg overflow-hidden group block"
                  >
                    {isVideo ? (
                      <video
                        src={isLocked ? undefined : firstMedia}
                        className="w-full h-full object-cover"
                        muted
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={isLocked ? firstMedia : firstMedia}
                        alt=""
                        className={`w-full h-full object-cover transition-transform group-hover:scale-105 ${isLocked ? 'blur-sm' : ''}`}
                      />
                    )}

                    {/* Locked overlay */}
                    {isLocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ background: 'rgba(224,64,251,0.25)', border: '1px solid rgba(224,64,251,0.5)' }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="#e040fb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                          </svg>
                        </div>
                      </div>
                    )}

                    {/* Video indicator */}
                    {isVideo && !isLocked && (
                      <div className="absolute top-1.5 right-1.5">
                        <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4 drop-shadow">
                          <polygon points="23 7 16 12 23 17 23 7"/>
                          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" fill="white"/>
                        </svg>
                      </div>
                    )}

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  </Link>
                )
              })}
            </div>
          )}
        </>
      )}
    </>
  )
}
