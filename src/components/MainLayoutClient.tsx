'use client'

import { useState } from 'react'
import AppSidebar from './AppSidebar'
import dynamic from 'next/dynamic'

const NewPostModal = dynamic(() => import('./NewPostModal'), { ssr: false })

interface Props {
  user: {
    displayName: string
    username: string
    role: string
    avatarUrl: string | null
  }
  children: React.ReactNode
}

export default function MainLayoutClient({ user, children }: Props) {
  const [showNewPost, setShowNewPost] = useState(false)

  return (
    <div className="flex min-h-screen bg-[#0d0d0f] text-white">
      <AppSidebar user={user} onNewPost={() => setShowNewPost(true)} />
      {/* pt-14 on mobile gives space for the fixed hamburger button */}
      <main className="flex-1 min-w-0 overflow-auto pt-14 lg:pt-0">
        {children}
      </main>
      {showNewPost && (
        <NewPostModal
          onClose={() => setShowNewPost(false)}
          onPosted={() => setShowNewPost(false)}
        />
      )}
    </div>
  )
}
