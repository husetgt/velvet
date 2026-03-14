'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import AppNavbar from '@/components/AppNavbar'

interface UserInfo {
  id: string
  username: string
  displayName: string
  avatarUrl?: string | null
  role: string
}

interface MessageItem {
  id: string
  senderId: string
  receiverId: string
  content: string
  mediaUrl?: string | null
  price?: number | null
  isRead: boolean
  createdAt: string
  sender: {
    id: string
    username: string
    displayName: string
    avatarUrl?: string | null
  }
  receiver?: {
    id: string
    username: string
    displayName: string
    avatarUrl?: string | null
  }
}

function getInitial(name: string) {
  return name.charAt(0).toUpperCase()
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  if (now.getTime() - d.getTime() < 86400000) return formatTime(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function AvatarCircle({ name, avatarUrl, size = 'md' }: { name: string; avatarUrl?: string | null; size?: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-10 h-10 text-sm'
  if (avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatarUrl} alt={name} className={`${cls} rounded-full object-cover shrink-0`} />
  }
  return (
    <div
      className={`${cls} rounded-full flex items-center justify-center font-bold text-white shrink-0`}
      style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
    >
      {getInitial(name)}
    </div>
  )
}

function LockedMessageBubble({ msg, isMine, onUnlock }: { msg: MessageItem; isMine: boolean; onUnlock: (id: string) => void }) {
  const [unlocking, setUnlocking] = useState(false)

  const handleUnlock = async () => {
    setUnlocking(true)
    try {
      const res = await fetch('/api/payments/unlock-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: msg.id }),
      })
      const data = await res.json()
      if (res.ok) {
        onUnlock(msg.id)
      } else {
        alert(data.error || 'Failed to unlock')
      }
    } finally {
      setUnlocking(false)
    }
  }

  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{
        width: 220,
        background: 'linear-gradient(135deg, rgba(224,64,251,0.1), rgba(124,77,255,0.1))',
        border: '1px solid rgba(224,64,251,0.25)',
      }}
    >
      <div className="h-28 relative" style={{ background: 'linear-gradient(135deg, rgba(224,64,251,0.2), rgba(124,77,255,0.2))', filter: 'blur(0px)' }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-10 h-10 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
      </div>
      <div className="px-3 py-2.5">
        <p className="text-white text-xs font-medium mb-0.5">{msg.content}</p>
        {msg.price && (
          <p className="text-[#e040fb] text-xs font-bold mb-2">${Number(msg.price).toFixed(2)} to unlock</p>
        )}
        {!isMine && (
          <button
            onClick={handleUnlock}
            disabled={unlocking}
            className="w-full py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-50 transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
          >
            {unlocking ? 'Processing…' : `Unlock · $${Number(msg.price ?? 0).toFixed(2)}`}
          </button>
        )}
      </div>
    </div>
  )
}

export default function MessagesPage() {
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null)
  const [allMessages, setAllMessages] = useState<MessageItem[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [thread, setThread] = useState<MessageItem[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const threadEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.user) setCurrentUser(data.user)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!currentUser) return
    fetch('/api/messages')
      .then((r) => r.json())
      .then((data) => { if (data.messages) setAllMessages(data.messages) })
  }, [currentUser])

  const conversations = (() => {
    if (!currentUser) return []
    const seen = new Map<string, MessageItem>()
    for (const msg of allMessages) {
      const otherId = msg.senderId === currentUser.id ? msg.receiverId : msg.senderId
      if (!seen.has(otherId)) seen.set(otherId, msg)
    }
    return Array.from(seen.entries()).map(([otherId, msg]) => ({
      userId: otherId,
      displayName: msg.senderId === currentUser.id ? (msg.receiver?.displayName ?? 'Unknown') : msg.sender.displayName,
      username: msg.senderId === currentUser.id ? (msg.receiver?.username ?? '') : msg.sender.username,
      avatarUrl: msg.senderId === currentUser.id ? msg.receiver?.avatarUrl : msg.sender.avatarUrl,
      lastMessage: msg.content,
      lastAt: msg.createdAt,
    }))
  })()

  useEffect(() => {
    if (!selectedUserId) return
    fetch(`/api/messages?with=${selectedUserId}`)
      .then((r) => r.json())
      .then((data) => { if (data.messages) setThread(data.messages) })
  }, [selectedUserId])

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim() || !selectedUserId || !currentUser) return
    setSending(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: selectedUserId, content: messageInput.trim() }),
      })
      const data = await res.json()
      if (res.ok && data.message) {
        setThread((prev) => [...prev, data.message])
        setMessageInput('')
      }
    } finally {
      setSending(false)
    }
  }

  const handleUnlockMessage = (msgId: string) => {
    setThread((prev) => prev.map((m) => m.id === msgId ? { ...m, price: null } : m))
  }

  const selectedConvo = conversations.find((c) => c.userId === selectedUserId)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0f] text-white flex items-center justify-center">
        <div className="text-[#8888a0] text-sm">Loading…</div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0d0d0f] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#8888a0] mb-4 text-sm">Please sign in to view messages</p>
          <Link href="/login" className="px-6 py-2.5 rounded-xl font-semibold text-white hover:opacity-90 transition-opacity text-sm" style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}>
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0d0d0f] text-white flex flex-col">
      <AppNavbar
        user={{ displayName: currentUser.displayName, username: currentUser.username, role: currentUser.role, avatarUrl: currentUser.avatarUrl }}
        unreadMessages={0}
        unreadNotifications={0}
      />

      {/* Full height container below navbar */}
      <div className="flex flex-1 pt-[60px] overflow-hidden" style={{ height: 'calc(100vh - 0px)' }}>
        {/* Conversation list — fixed w-80 */}
        <div className="w-80 border-r border-[#2a2a30] bg-[#0d0d0f] flex flex-col shrink-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-[#2a2a30]">
            <h2 className="font-bold text-white text-base">Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full pb-16 px-6 text-center">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                  style={{ background: 'linear-gradient(135deg, rgba(224,64,251,0.12), rgba(124,77,255,0.12))', border: '1px solid rgba(224,64,251,0.15)' }}
                >
                  <svg className="w-5 h-5 text-[#e040fb]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <p className="text-white text-sm font-medium">No messages yet</p>
                <p className="text-[#8888a0] text-xs mt-1">Messages appear here</p>
              </div>
            ) : (
              conversations.map((convo) => (
                <button
                  key={convo.userId}
                  onClick={() => setSelectedUserId(convo.userId)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors border-b border-[#1a1a1e] ${
                    selectedUserId === convo.userId ? 'bg-[#161618]' : 'hover:bg-[#111114]'
                  }`}
                >
                  <AvatarCircle name={convo.displayName} avatarUrl={convo.avatarUrl} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-white truncate">{convo.displayName}</span>
                      <span className="text-[10px] text-[#8888a0] shrink-0">{formatDate(convo.lastAt)}</span>
                    </div>
                    <div className="text-xs text-[#8888a0] truncate">{convo.lastMessage}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Thread */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#0d0d0f]">
          {selectedConvo ? (
            <>
              {/* Thread header */}
              <div className="px-6 py-4 border-b border-[#2a2a30] flex items-center gap-3 bg-[#0d0d0f] shrink-0">
                <AvatarCircle name={selectedConvo.displayName} avatarUrl={selectedConvo.avatarUrl} />
                <div>
                  <div className="font-semibold text-white text-sm">{selectedConvo.displayName}</div>
                  <div className="text-xs text-[#8888a0]">@{selectedConvo.username}</div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
                {thread.map((msg) => {
                  const isMine = msg.senderId === currentUser.id
                  const isLockedPPV = !isMine && msg.price && msg.price > 0

                  return (
                    <div key={msg.id} className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                      {!isMine && (
                        <AvatarCircle name={msg.sender.displayName} avatarUrl={msg.sender.avatarUrl} size="sm" />
                      )}
                      <div className={`flex flex-col gap-1 ${isMine ? 'items-end' : 'items-start'}`}>
                        {isLockedPPV ? (
                          <LockedMessageBubble msg={msg} isMine={isMine} onUnlock={handleUnlockMessage} />
                        ) : (
                          <div
                            className={`max-w-xs px-4 py-2.5 text-sm leading-relaxed ${
                              isMine
                                ? 'rounded-2xl rounded-br-sm text-white'
                                : 'rounded-2xl rounded-bl-sm bg-[#1e1e21] text-white'
                            }`}
                            style={isMine ? { background: 'linear-gradient(135deg, #e040fb, #7c4dff)' } : {}}
                          >
                            {msg.content}
                          </div>
                        )}
                        <span className="text-[10px] text-[#8888a0] px-1">{formatTime(msg.createdAt)}</span>
                      </div>
                    </div>
                  )
                })}
                <div ref={threadEndRef} />
              </div>

              {/* Send form */}
              <form onSubmit={handleSend} className="px-6 py-4 border-t border-[#2a2a30] flex items-center gap-3 shrink-0">
                {/* Attachment icon */}
                <button type="button" className="w-9 h-9 rounded-xl flex items-center justify-center text-[#8888a0] hover:text-white hover:bg-[#1e1e21] transition-colors shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                </button>
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Send a message…"
                  className="flex-1 rounded-2xl bg-[#161618] border border-[#2a2a30] text-white placeholder-[#8888a0] focus:outline-none focus:border-[#e040fb44] transition-all px-4 py-2.5 text-sm"
                />
                <button
                  type="submit"
                  disabled={sending || !messageInput.trim()}
                  className="w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-opacity shrink-0"
                  style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
                >
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'linear-gradient(135deg, rgba(224,64,251,0.12), rgba(124,77,255,0.12))', border: '1px solid rgba(224,64,251,0.2)' }}
              >
                <svg className="w-7 h-7 text-[#e040fb]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <p className="text-white font-semibold mb-1">Select a conversation</p>
              <p className="text-[#8888a0] text-sm">Choose a conversation from the left</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
