'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import AppSidebar from '@/components/AppSidebar'

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
  const d = new Date(dateStr)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 86400000) return formatTime(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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

  // Fetch current user info
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.user) setCurrentUser(data.user)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Fetch conversations list
  useEffect(() => {
    if (!currentUser) return
    fetch('/api/messages')
      .then((r) => r.json())
      .then((data) => {
        if (data.messages) setAllMessages(data.messages)
      })
  }, [currentUser])

  // Build unique conversations from message list
  const conversations = (() => {
    if (!currentUser) return []
    const seen = new Map<string, MessageItem>()
    for (const msg of allMessages) {
      const otherId =
        msg.senderId === currentUser.id ? msg.receiverId : msg.senderId
      if (!seen.has(otherId)) seen.set(otherId, msg)
    }
    return Array.from(seen.entries()).map(([otherId, msg]) => ({
      userId: otherId,
      displayName:
        msg.senderId === currentUser.id
          ? (msg.receiver?.displayName ?? 'Unknown')
          : msg.sender.displayName,
      username:
        msg.senderId === currentUser.id
          ? (msg.receiver?.username ?? '')
          : msg.sender.username,
      lastMessage: msg.content,
      lastAt: msg.createdAt,
    }))
  })()

  // Load thread when a conversation is selected
  useEffect(() => {
    if (!selectedUserId) return
    fetch(`/api/messages?with=${selectedUserId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.messages) setThread(data.messages)
      })
  }, [selectedUserId])

  // Scroll to bottom of thread
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

  const selectedConvo = conversations.find((c) => c.userId === selectedUserId)

  if (loading) {
    return (
      <div className="flex h-screen bg-[#0d0d0f] text-white items-center justify-center">
        <div className="text-[#8888a0]">Loading...</div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="flex h-screen bg-[#0d0d0f] text-white items-center justify-center">
        <div className="text-center">
          <p className="text-[#8888a0] mb-4">Please sign in to view messages</p>
          <Link
            href="/login"
            className="px-6 py-2.5 rounded-xl font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#0d0d0f] text-white overflow-hidden">
      <AppSidebar
        user={{
          displayName: currentUser.displayName,
          username: currentUser.username,
          role: currentUser.role,
        }}
        activePath="/messages"
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Conversations list */}
        <div className="w-72 border-r border-[#2a2a30] bg-[#0d0d0f] flex flex-col shrink-0">
          <div className="p-4 border-b border-[#2a2a30]">
            <h2 className="font-bold text-white">Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-[#8888a0] text-sm">
                No conversations yet
              </div>
            ) : (
              conversations.map((convo) => (
                <button
                  key={convo.userId}
                  onClick={() => setSelectedUserId(convo.userId)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#161618] transition-colors border-b border-[#2a2a30] ${
                    selectedUserId === convo.userId ? 'bg-[#161618]' : ''
                  }`}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
                  >
                    {getInitial(convo.displayName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-white truncate">
                        {convo.displayName}
                      </span>
                      <span className="text-xs text-[#555568] shrink-0">
                        {formatDate(convo.lastAt)}
                      </span>
                    </div>
                    <div className="text-xs text-[#8888a0] truncate">{convo.lastMessage}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Thread */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedConvo ? (
            <>
              {/* Thread header */}
              <div className="px-6 py-4 border-b border-[#2a2a30] flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
                >
                  {getInitial(selectedConvo.displayName)}
                </div>
                <div>
                  <div className="font-semibold text-white">{selectedConvo.displayName}</div>
                  <div className="text-xs text-[#8888a0]">@{selectedConvo.username}</div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {thread.map((msg) => {
                  const isMine = msg.senderId === currentUser.id
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      {!isMine && (
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                          style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
                        >
                          {getInitial(msg.sender.displayName)}
                        </div>
                      )}
                      <div className={`max-w-xs ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                        <div
                          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isMine
                              ? 'rounded-br-sm text-white'
                              : 'rounded-bl-sm bg-[#1e1e21] text-white'
                          }`}
                          style={isMine ? { background: 'linear-gradient(135deg, #e040fb, #7c4dff)' } : {}}
                        >
                          {msg.content}
                        </div>
                        <span className="text-xs text-[#555568]">{formatTime(msg.createdAt)}</span>
                      </div>
                    </div>
                  )
                })}
                <div ref={threadEndRef} />
              </div>

              {/* Send form */}
              <form
                onSubmit={handleSend}
                className="px-6 py-4 border-t border-[#2a2a30] flex items-center gap-3"
              >
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 rounded-xl bg-[#1e1e21] border border-[#2a2a30] text-white placeholder-[#555568] focus:outline-none focus:border-[#e040fb] focus:ring-1 focus:ring-[#e040fb33] transition-all px-4 py-2.5 text-sm"
                />
                <button
                  type="submit"
                  disabled={sending || !messageInput.trim()}
                  className="px-5 py-2.5 rounded-xl font-semibold text-white text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
                >
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4"
                  style={{ background: 'linear-gradient(135deg, rgba(224,64,251,0.15), rgba(124,77,255,0.15))' }}
                >
                  💬
                </div>
                <p className="text-white font-semibold mb-1">Select a conversation</p>
                <p className="text-[#8888a0] text-sm">Choose someone to message</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
