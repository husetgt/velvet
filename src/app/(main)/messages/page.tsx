'use client'

import { useState, useEffect, useRef, Suspense, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'

interface UserInfo {
  id: string
  username: string
  displayName: string
  avatarUrl?: string | null
  role: string
  isCreator?: boolean
}

interface MessageItem {
  id: string
  senderId: string
  receiverId: string
  content: string
  mediaUrl?: string | null
  mediaPrice?: number | null
  isMediaLocked?: boolean
  price?: number | null
  isRead: boolean
  createdAt: string
  _optimistic?: boolean
  _error?: boolean
  sender: { id: string; username: string; displayName: string; avatarUrl?: string | null }
  receiver?: { id: string; username: string; displayName: string; avatarUrl?: string | null }
}

interface ConversationEntry {
  userId: string
  displayName: string
  username: string
  avatarUrl?: string | null
  lastMessage: string
  lastAt: string
  unread: number
  nickname?: string
}

interface SpendingInfo {
  totalSpent: number
  ppvSpent: number
  tipsGiven: number
  subStatus: string
  subPrice: number | null
  subSince: string | null
}

interface NoteEntry {
  id: string
  text: string
  createdAt: string
}

function getInitial(name: string) { return name.charAt(0).toUpperCase() }
function getInitials(name: string) { return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) }

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}
function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  if (now.getTime() - d.getTime() < 86400000) return formatTime(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
function formatDateSep(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}
function sameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString()
}

function AvatarCircle({ name, avatarUrl, size = 'md', online = false }: { name: string; avatarUrl?: string | null; size?: 'xs' | 'sm' | 'md'; online?: boolean }) {
  const dims = size === 'xs' ? 'w-6 h-6 text-[10px]' : size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
  return (
    <div className="relative shrink-0">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt={name} className={`${dims} rounded-full object-cover`} />
      ) : (
        <div className={`${dims} rounded-full flex items-center justify-center font-bold text-white`} style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}>
          {getInitials(name)}
        </div>
      )}
      {online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-[#0d0d0f]" />}
    </div>
  )
}

function LockedMessageBubble({ msg, isMine, onUnlock }: { msg: MessageItem; isMine: boolean; onUnlock: (id: string) => void }) {
  const [unlocking, setUnlocking] = useState(false)
  const price = msg.mediaPrice ?? msg.price
  const handleUnlock = async () => {
    setUnlocking(true)
    try {
      const res = await fetch('/api/payments/unlock-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: msg.id }),
      })
      const data = await res.json()
      if (res.ok) { onUnlock(msg.id) }
      else alert(data.error || 'Failed to unlock')
    } finally { setUnlocking(false) }
  }
  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ width: 220, background: 'linear-gradient(135deg, rgba(224,64,251,0.1), rgba(124,77,255,0.1))', border: '1px solid rgba(224,64,251,0.25)' }}>
      <div className="h-24 relative" style={{ background: 'linear-gradient(135deg, rgba(224,64,251,0.2), rgba(124,77,255,0.2))' }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-8 h-8 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
      </div>
      <div className="px-3 py-2.5">
        <p className="text-white text-xs font-medium mb-0.5">{msg.content}</p>
        {price && <p className="text-[#e040fb] text-xs font-bold mb-2">${Number(price).toFixed(2)} to unlock</p>}
        {!isMine && (
          <button onClick={handleUnlock} disabled={unlocking} className="w-full py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-50 transition-opacity hover:opacity-90" style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}>
            {unlocking ? 'Processing…' : `Unlock · $${Number(price ?? 0).toFixed(2)}`}
          </button>
        )}
      </div>
    </div>
  )
}

function MessagesPageInner() {
  const searchParams = useSearchParams()
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null)
  const [allMessages, setAllMessages] = useState<MessageItem[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [syntheticUser, setSyntheticUser] = useState<{ id: string; username: string; displayName: string; avatarUrl?: string | null } | null>(null)
  const [thread, setThread] = useState<MessageItem[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [spendingInfo, setSpendingInfo] = useState<SpendingInfo | null>(null)
  const [activeTab, setActiveTab] = useState<'messages' | 'media'>('messages')
  const threadEndRef = useRef<HTMLDivElement>(null)

  // Nickname state
  const [nickname, setNickname] = useState('')
  const [nicknameSaving, setNicknameSaving] = useState(false)
  const [nicknameConvoMeta, setNicknameConvoMeta] = useState<{ nickname?: string | null; notes?: NoteEntry[] } | null>(null)

  // Notes state
  const [notes, setNotes] = useState<NoteEntry[]>([])
  const [newNoteText, setNewNoteText] = useState('')
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingNoteText, setEditingNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  // PPV price state
  const [ppvPrice, setPpvPrice] = useState<number | null>(null)
  const [showPriceInput, setShowPriceInput] = useState(false)
  const [priceInputValue, setPriceInputValue] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.user) setCurrentUser(d.user)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    const withParam = searchParams.get('with')
    if (withParam) {
      setSelectedUserId(withParam)
      fetch(`/api/users/${withParam}`)
        .then(r => r.json())
        .then(d => { if (d.user) setSyntheticUser(d.user) })
        .catch(() => {})
    }
  }, [searchParams])

  useEffect(() => {
    if (!currentUser) return
    fetch('/api/messages').then(r => r.json()).then(d => { if (d.messages) setAllMessages(d.messages) })
  }, [currentUser])

  const conversations: ConversationEntry[] = (() => {
    if (!currentUser) return []
    const seen = new Map<string, MessageItem>()
    for (const msg of allMessages) {
      const otherId = msg.senderId === currentUser.id ? msg.receiverId : msg.senderId
      if (!seen.has(otherId)) seen.set(otherId, msg)
    }
    const result = Array.from(seen.entries()).map(([otherId, msg]) => ({
      userId: otherId,
      displayName: msg.senderId === currentUser.id ? (msg.receiver?.displayName ?? 'Unknown') : msg.sender.displayName,
      username: msg.senderId === currentUser.id ? (msg.receiver?.username ?? '') : msg.sender.username,
      avatarUrl: msg.senderId === currentUser.id ? msg.receiver?.avatarUrl : msg.sender.avatarUrl,
      lastMessage: msg.content,
      lastAt: msg.createdAt,
      unread: allMessages.filter(m => m.senderId === otherId && !m.isRead).length,
    }))
    if (syntheticUser && !result.find(c => c.userId === syntheticUser.id)) {
      result.unshift({
        userId: syntheticUser.id,
        displayName: syntheticUser.displayName,
        username: syntheticUser.username,
        avatarUrl: syntheticUser.avatarUrl,
        lastMessage: '',
        lastAt: new Date().toISOString(),
        unread: 0,
      })
    }
    return result
  })()

  const filteredConvos = search
    ? conversations.filter(c => c.displayName.toLowerCase().includes(search.toLowerCase()) || c.username.toLowerCase().includes(search.toLowerCase()))
    : conversations

  // Load thread + meta when selected user changes
  useEffect(() => {
    if (!selectedUserId) return
    fetch(`/api/messages?with=${selectedUserId}`).then(r => r.json()).then(d => { if (d.messages) setThread(d.messages) })
    fetch(`/api/messages/spending?userId=${selectedUserId}`).then(r => r.json()).then(d => { if (d) setSpendingInfo(d) }).catch(() => {})
    // Load nickname/notes meta (creator only)
    if (currentUser?.isCreator) {
      fetch(`/api/messages/nickname?targetUserId=${selectedUserId}`).then(r => r.json()).then(d => {
        if (d.meta) {
          setNicknameConvoMeta(d.meta)
          setNickname(d.meta.nickname ?? '')
          setNotes((d.meta.notes as NoteEntry[]) ?? [])
        } else {
          setNicknameConvoMeta(null)
          setNickname('')
          setNotes([])
        }
      }).catch(() => {})
    }
  }, [selectedUserId, currentUser])

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread])

  // ── Optimistic send ─────────────────────────────────────────────────────
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim() || !selectedUserId || !currentUser) return
    setSending(true)
    setSendError('')

    // Optimistic message
    const optimisticId = `optimistic_${Date.now()}`
    const optimisticMsg: MessageItem = {
      id: optimisticId,
      senderId: currentUser.id,
      receiverId: selectedUserId,
      content: messageInput.trim(),
      mediaUrl: null,
      isRead: false,
      createdAt: new Date().toISOString(),
      _optimistic: true,
      sender: {
        id: currentUser.id,
        username: currentUser.username,
        displayName: currentUser.displayName,
        avatarUrl: currentUser.avatarUrl,
      },
    }
    setThread(prev => [...prev, optimisticMsg])
    const sentContent = messageInput.trim()
    setMessageInput('')

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: selectedUserId, content: sentContent }),
      })
      const data = await res.json()
      if (res.ok && data.message) {
        // Replace optimistic with real
        setThread(prev => prev.map(m => m.id === optimisticId ? data.message : m))
        // Update conversation list
        setAllMessages(prev => [data.message, ...prev])
      } else if (res.status === 403) {
        setSendError('Subscribe to this creator to send messages')
        setThread(prev => prev.map(m => m.id === optimisticId ? { ...m, _error: true, _optimistic: false } : m))
      } else {
        setThread(prev => prev.map(m => m.id === optimisticId ? { ...m, _error: true, _optimistic: false } : m))
      }
    } catch {
      setThread(prev => prev.map(m => m.id === optimisticId ? { ...m, _error: true, _optimistic: false } : m))
    } finally {
      setSending(false)
    }
  }

  const handleRetryMessage = async (failedMsg: MessageItem) => {
    setThread(prev => prev.filter(m => m.id !== failedMsg.id))
    if (!selectedUserId || !currentUser) return
    const optimisticId = `optimistic_${Date.now()}`
    const optimisticMsg: MessageItem = { ...failedMsg, id: optimisticId, _optimistic: true, _error: false }
    setThread(prev => [...prev, optimisticMsg])
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: selectedUserId, content: failedMsg.content }),
      })
      const data = await res.json()
      if (res.ok && data.message) {
        setThread(prev => prev.map(m => m.id === optimisticId ? data.message : m))
      } else {
        setThread(prev => prev.map(m => m.id === optimisticId ? { ...m, _error: true, _optimistic: false } : m))
      }
    } catch {
      setThread(prev => prev.map(m => m.id === optimisticId ? { ...m, _error: true, _optimistic: false } : m))
    }
  }

  // ── File attachment + PPV ───────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedUserId || !currentUser) return
    setSendError('')
    const optimisticId = `optimistic_media_${Date.now()}`
    const optimisticMsg: MessageItem = {
      id: optimisticId,
      senderId: currentUser.id,
      receiverId: selectedUserId,
      content: ppvPrice ? `📎 Media · $${ppvPrice.toFixed(2)} to unlock` : '📎 Media',
      mediaUrl: URL.createObjectURL(file),
      isRead: false,
      createdAt: new Date().toISOString(),
      _optimistic: true,
      sender: { id: currentUser.id, username: currentUser.username, displayName: currentUser.displayName, avatarUrl: currentUser.avatarUrl },
    }
    setThread(prev => [...prev, optimisticMsg])
    if (fileInputRef.current) fileInputRef.current.value = ''

    try {
      // Upload file
      const formData = new FormData()
      formData.append('files', file)
      const uploadRes = await fetch('/api/upload/media', { method: 'POST', body: formData })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed')
      const mediaUrl = uploadData.urls?.[0]

      // Send message
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: selectedUserId,
          content: ppvPrice ? `PPV media · $${ppvPrice.toFixed(2)} to unlock` : '📎 Media',
          mediaUrl,
          mediaPrice: ppvPrice,
          isMediaLocked: !!ppvPrice,
        }),
      })
      const data = await res.json()
      if (res.ok && data.message) {
        setThread(prev => prev.map(m => m.id === optimisticId ? data.message : m))
      } else {
        setThread(prev => prev.map(m => m.id === optimisticId ? { ...m, _error: true, _optimistic: false } : m))
      }
    } catch (err) {
      console.error(err)
      setThread(prev => prev.map(m => m.id === optimisticId ? { ...m, _error: true, _optimistic: false } : m))
    }
    setPpvPrice(null)
  }

  const handleUnlockMessage = (msgId: string) => {
    setThread(prev => prev.map(m => m.id === msgId ? { ...m, mediaPrice: null, price: null, isMediaLocked: false } : m))
  }

  // ── Nickname save ───────────────────────────────────────────────────────
  const handleSaveNickname = async () => {
    if (!selectedUserId) return
    setNicknameSaving(true)
    try {
      await fetch('/api/messages/nickname', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: selectedUserId, nickname }),
      })
    } finally { setNicknameSaving(false) }
  }

  // ── Notes ───────────────────────────────────────────────────────────────
  const handleAddNote = async () => {
    if (!newNoteText.trim() || !selectedUserId) return
    setSavingNote(true)
    try {
      const res = await fetch('/api/messages/notes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: selectedUserId, note: newNoteText.trim(), action: 'add' }),
      })
      const data = await res.json()
      if (res.ok) { setNotes(data.notes ?? []); setNewNoteText('') }
    } finally { setSavingNote(false) }
  }

  const handleEditNote = async (noteId: string) => {
    if (!editingNoteText.trim() || !selectedUserId) return
    setSavingNote(true)
    try {
      const res = await fetch('/api/messages/notes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: selectedUserId, note: editingNoteText.trim(), action: 'edit', noteId }),
      })
      const data = await res.json()
      if (res.ok) { setNotes(data.notes ?? []); setEditingNoteId(null); setEditingNoteText('') }
    } finally { setSavingNote(false) }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!selectedUserId) return
    const res = await fetch('/api/messages/notes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId: selectedUserId, action: 'delete', noteId }),
    })
    const data = await res.json()
    if (res.ok) setNotes(data.notes ?? [])
  }

  const selectedConvo = conversations.find(c => c.userId === selectedUserId)
  const isCreator = currentUser?.isCreator || currentUser?.role === 'CREATOR'

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 rounded-full border-2 border-[#e040fb] border-t-transparent animate-spin" /></div>
  }

  const showListMobile = !selectedUserId
  const showThreadMobile = !!selectedUserId

  return (
    <div className="flex flex-1 overflow-hidden h-[calc(100vh-56px)] lg:h-screen">
      {/* Left panel — conversation list */}
      <div className={`${showListMobile ? 'flex' : 'hidden'} md:flex w-full md:w-[320px] lg:w-[380px] border-r border-[#2a2a30] bg-[#0d0d0f] flex-col shrink-0 overflow-hidden`}>
        <div className="px-5 py-4 border-b border-[#2a2a30] shrink-0">
          <h2 className="font-bold text-white text-lg mb-3">Chats</h2>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8888a0]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations…"
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#161618] border border-[#2a2a30] text-white placeholder-[#555568] focus:outline-none focus:border-[#e040fb44] transition-all text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConvos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full pb-16 px-6 text-center">
              <p className="text-white text-sm font-medium">{search ? 'No results' : 'No messages yet'}</p>
              <p className="text-[#8888a0] text-xs mt-1">{search ? 'Try a different name' : 'Conversations appear here'}</p>
            </div>
          ) : (
            filteredConvos.map(convo => (
              <button
                key={convo.userId}
                onClick={() => setSelectedUserId(convo.userId)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors border-b border-[#1a1a1e] ${selectedUserId === convo.userId ? 'bg-[#161618]' : 'hover:bg-[#111114]'}`}
              >
                <AvatarCircle name={convo.displayName} avatarUrl={convo.avatarUrl} online />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-white truncate">{convo.displayName}</span>
                    <span className="text-[10px] text-[#8888a0] shrink-0">{formatDate(convo.lastAt)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-[#8888a0] truncate">{convo.lastMessage}</span>
                    {convo.unread > 0 && (
                      <span className="w-4 h-4 rounded-full text-[10px] font-bold text-white flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}>
                        {convo.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Center panel — thread */}
      <div className={`${showThreadMobile ? 'flex' : 'hidden'} md:flex flex-1 flex-col overflow-hidden bg-[#0d0d0f] min-w-0`}>
        {selectedConvo ? (
          <>
            {/* Thread header */}
            <div className="px-3 sm:px-5 py-3 sm:py-3.5 border-b border-[#2a2a30] flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                onClick={() => setSelectedUserId(null)}
                className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-[#8888a0] hover:text-white -ml-1 shrink-0"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
              <AvatarCircle name={selectedConvo.displayName} avatarUrl={selectedConvo.avatarUrl} online />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-white text-sm truncate">{selectedConvo.displayName}</div>
                  {isCreator && nickname && (
                    <span className="text-[#e040fb] text-xs font-bold">({nickname})</span>
                  )}
                </div>
                <div className="text-xs text-[#8888a0]">@{selectedConvo.username} · <span className="text-green-400">Online</span></div>
              </div>
              <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ background: '#1e1e21', border: '1px solid #2a2a30' }}>
                {(['messages', 'media'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-all ${activeTab === tab ? 'text-white' : 'text-[#8888a0] hover:text-white'}`}
                    style={activeTab === tab ? { background: 'linear-gradient(135deg, #e040fb, #7c4dff)' } : {}}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages / Media */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
              {activeTab === 'media' ? (
                <div className="grid grid-cols-3 gap-2">
                  {thread.filter(m => m.mediaUrl).map(m => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={m.id} src={m.mediaUrl!} alt="" className="w-full aspect-square object-cover rounded-xl" />
                  ))}
                  {thread.filter(m => m.mediaUrl).length === 0 && (
                    <p className="col-span-3 text-[#555568] text-sm text-center py-12">No media shared yet</p>
                  )}
                </div>
              ) : (
                thread.map((msg, idx) => {
                  const isMine = msg.senderId === currentUser?.id
                  const isLockedPPV = msg.isMediaLocked || (msg.mediaPrice && msg.mediaPrice > 0) || (!isMine && msg.price && msg.price > 0)
                  const prevMsg = thread[idx - 1]
                  const showDateSep = !prevMsg || !sameDay(prevMsg.createdAt, msg.createdAt)
                  // "Seen" indicator: last sent message that has been read by the other person
                  const isLastSentMessage = isMine && !msg._optimistic && !msg._error &&
                    thread.slice(idx + 1).every(m => m.senderId !== currentUser?.id || m._optimistic || m._error)
                  const showSeen = isLastSentMessage && msg.isRead

                  return (
                    <div key={msg.id}>
                      {showDateSep && (
                        <div className="flex items-center gap-3 my-4">
                          <div className="flex-1 h-px bg-[#2a2a30]" />
                          <span className="text-[10px] text-[#555568] font-medium shrink-0">{formatDateSep(msg.createdAt)}</span>
                          <div className="flex-1 h-px bg-[#2a2a30]" />
                        </div>
                      )}
                      <div className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'} mb-1`}>
                        {!isMine && <AvatarCircle name={msg.sender.displayName} avatarUrl={msg.sender.avatarUrl} size="xs" />}
                        <div className={`flex flex-col gap-0.5 ${isMine ? 'items-end' : 'items-start'}`}>
                          {isLockedPPV ? (
                            <LockedMessageBubble msg={msg} isMine={isMine} onUnlock={handleUnlockMessage} />
                          ) : msg.mediaUrl && !msg.isMediaLocked ? (
                            <div className="rounded-2xl overflow-hidden max-w-xs">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={msg.mediaUrl} alt="" className="w-full max-w-[220px] object-cover rounded-2xl" />
                            </div>
                          ) : (
                            <div
                              className={`max-w-xs px-4 py-2.5 text-sm leading-relaxed ${
                                isMine ? 'rounded-2xl rounded-br-sm text-white' : 'rounded-2xl rounded-bl-sm bg-[#1e1e21] text-white'
                              } ${msg._optimistic ? 'opacity-60' : ''} ${msg._error ? 'opacity-80' : ''}`}
                              style={isMine && !msg._error ? { background: 'linear-gradient(135deg, #e040fb, #7c4dff)' } : isMine && msg._error ? { background: '#7f1d1d', border: '1px solid #ef4444' } : {}}
                            >
                              {msg.content}
                            </div>
                          )}
                          <div className={`flex items-center gap-1 px-1 ${isMine ? 'flex-row-reverse' : ''}`}>
                            <span className="text-[10px] text-[#555568]">{formatTime(msg.createdAt)}</span>
                            {isMine && !msg._optimistic && !msg._error && (
                              <svg className="w-3 h-3 text-[#8888a0]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            )}
                            {isMine && msg._optimistic && (
                              <svg className="w-3 h-3 text-[#555568] animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                              </svg>
                            )}
                            {isMine && msg._error && (
                              <button onClick={() => handleRetryMessage(msg)} className="text-[10px] text-red-400 hover:text-red-300 font-semibold">
                                Retry
                              </button>
                            )}
                          </div>
                          {showSeen && (
                            <p className="text-[10px] text-[#555568] px-1">Seen</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={threadEndRef} />
            </div>

            {/* Send error */}
            {sendError && (
              <div className="px-5 py-2 bg-red-500/10 border-t border-red-500/20 text-red-400 text-xs">
                {sendError}
              </div>
            )}

            {/* PPV price indicator */}
            {ppvPrice && (
              <div className="px-5 py-2 bg-[#e040fb11] border-t border-[#e040fb22] flex items-center justify-between">
                <span className="text-xs text-[#e040fb]">Next media: ${ppvPrice.toFixed(2)} PPV</span>
                <button onClick={() => setPpvPrice(null)} className="text-[#8888a0] hover:text-white text-xs">Cancel</button>
              </div>
            )}

            {/* PPV price popup */}
            {showPriceInput && (
              <div className="px-5 py-2 bg-[#161618] border-t border-[#2a2a30] flex items-center gap-2">
                <span className="text-[#8888a0] text-xs">Price ($):</span>
                <input
                  autoFocus
                  type="number"
                  min="0.99"
                  step="0.01"
                  value={priceInputValue}
                  onChange={e => setPriceInputValue(e.target.value)}
                  placeholder="9.99"
                  className="w-20 px-2 py-1 rounded-lg bg-[#1e1e21] border border-[#2a2a30] text-white text-xs focus:outline-none focus:border-[#e040fb44]"
                />
                <button
                  onClick={() => {
                    const p = parseFloat(priceInputValue)
                    if (!isNaN(p) && p > 0) setPpvPrice(p)
                    setShowPriceInput(false)
                    setPriceInputValue('')
                  }}
                  className="px-3 py-1 rounded-lg text-xs font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
                >
                  Set
                </button>
                <button onClick={() => { setShowPriceInput(false); setPriceInputValue('') }} className="text-[#8888a0] hover:text-white text-xs">Cancel</button>
              </div>
            )}

            {/* Input bar */}
            <form onSubmit={handleSend} className="px-5 py-3.5 border-t border-[#2a2a30] flex items-center gap-2.5 shrink-0">
              {/* Attachment */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-8 h-8 flex items-center justify-center text-[#8888a0] hover:text-white transition-colors shrink-0"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                </svg>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} />

              {/* PPV price button (creators only) */}
              {isCreator && (
                <button
                  type="button"
                  onClick={() => setShowPriceInput(v => !v)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors shrink-0 text-sm ${ppvPrice ? 'text-[#e040fb]' : 'text-[#8888a0] hover:text-white'}`}
                  title="Set PPV price"
                >
                  💰
                </button>
              )}

              <input
                type="text"
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                placeholder="Send a message…"
                className="flex-1 rounded-2xl bg-[#161618] border border-[#2a2a30] text-white placeholder-[#555568] focus:outline-none focus:border-[#e040fb44] transition-all px-4 py-2.5 text-sm"
              />
              <button
                type="submit"
                disabled={sending || !messageInput.trim()}
                className="w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-opacity shrink-0"
                style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
              >
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, rgba(224,64,251,0.12), rgba(124,77,255,0.12))', border: '1px solid rgba(224,64,251,0.2)' }}>
              <svg className="w-7 h-7 text-[#e040fb]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <p className="text-white font-semibold mb-1">Select a conversation</p>
            <p className="text-[#8888a0] text-sm">Choose a conversation from the left</p>
          </div>
        )}
      </div>

      {/* Right panel — spending + nickname/notes (xl+) */}
      {selectedConvo && (
        <div className="hidden xl:block w-[280px] border-l border-[#2a2a30] bg-[#111113] overflow-auto shrink-0">
          <div className="p-5 space-y-5">
            {/* User info */}
            <div className="flex flex-col items-center text-center pt-2">
              <AvatarCircle name={selectedConvo.displayName} avatarUrl={selectedConvo.avatarUrl} size="md" online />
              <p className="text-white font-bold text-sm mt-2">{selectedConvo.displayName}</p>
              <p className="text-[#8888a0] text-xs">@{selectedConvo.username}</p>
            </div>

            <div className="h-px bg-[#1e1e21]" />

            {/* Spending behavior */}
            <div>
              <h3 className="text-[10px] font-bold text-[#8888a0] uppercase tracking-wider mb-3">Spending Behavior</h3>
              <div className="space-y-2">
                {[
                  { label: 'Total spent', value: spendingInfo ? `$${spendingInfo.totalSpent.toFixed(2)}` : '$0.00' },
                  { label: 'PPV purchases', value: spendingInfo ? `$${spendingInfo.ppvSpent.toFixed(2)}` : '$0.00' },
                  { label: 'Tips given', value: spendingInfo ? `$${spendingInfo.tipsGiven.toFixed(2)}` : '$0.00' },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="text-[#8888a0] text-xs">{row.label}</span>
                    <span className="text-white text-xs font-bold">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-px bg-[#1e1e21]" />

            {/* Subscription info */}
            <div>
              <h3 className="text-[10px] font-bold text-[#8888a0] uppercase tracking-wider mb-3">Subscription</h3>
              <div className="space-y-2">
                {[
                  { label: 'Status', value: spendingInfo?.subStatus ?? 'N/A' },
                  { label: 'Price', value: spendingInfo?.subPrice ? `$${spendingInfo.subPrice.toFixed(2)}/mo` : 'N/A' },
                  { label: 'Since', value: spendingInfo?.subSince ? new Date(spendingInfo.subSince).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A' },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="text-[#8888a0] text-xs">{row.label}</span>
                    <span className={`text-xs font-bold ${row.label === 'Status' && row.value === 'ACTIVE' ? 'text-green-400' : 'text-white'}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-px bg-[#1e1e21]" />

            {/* Nickname (creator only) */}
            {isCreator && (
              <div>
                <h3 className="text-[10px] font-bold text-[#8888a0] uppercase tracking-wider mb-2">Nickname</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={nickname}
                    onChange={e => setNickname(e.target.value)}
                    placeholder="Add nickname…"
                    className="flex-1 px-3 py-2 rounded-lg bg-[#1e1e21] border border-[#2a2a30] text-white placeholder-[#555568] focus:outline-none focus:border-[#e040fb44] text-xs transition-all"
                  />
                  <button
                    onClick={handleSaveNickname}
                    disabled={nicknameSaving}
                    className="px-2 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-50 hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
                  >
                    {nicknameSaving ? '…' : 'Save'}
                  </button>
                </div>
              </div>
            )}

            {/* Notes (creator only) */}
            {isCreator && (
              <div>
                <h3 className="text-[10px] font-bold text-[#8888a0] uppercase tracking-wider mb-2">Notes</h3>
                {/* Add note */}
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="text"
                    value={newNoteText}
                    onChange={e => setNewNoteText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddNote() }}
                    placeholder="Add note…"
                    className="flex-1 px-3 py-2 rounded-lg bg-[#1e1e21] border border-[#2a2a30] text-white placeholder-[#555568] focus:outline-none focus:border-[#e040fb44] text-xs transition-all"
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={savingNote || !newNoteText.trim()}
                    className="px-2 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-50 hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
                  >
                    Add
                  </button>
                </div>
                {/* Note list */}
                <div className="space-y-2">
                  {notes.length === 0 && (
                    <p className="text-[#555568] text-[10px] text-center py-2">No notes yet</p>
                  )}
                  {notes.map(note => (
                    <div key={note.id} className="rounded-lg bg-[#1a1a1d] border border-[#2a2a30] px-3 py-2">
                      {editingNoteId === note.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            autoFocus
                            type="text"
                            value={editingNoteText}
                            onChange={e => setEditingNoteText(e.target.value)}
                            className="flex-1 text-xs bg-transparent text-white outline-none"
                          />
                          <button onClick={() => handleEditNote(note.id)} className="text-[10px] text-[#e040fb] font-bold">Save</button>
                          <button onClick={() => { setEditingNoteId(null); setEditingNoteText('') }} className="text-[10px] text-[#555568]">×</button>
                        </div>
                      ) : (
                        <>
                          <p className="text-white text-[11px] leading-relaxed mb-1">{note.text}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-[#555568] text-[9px]">{new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            <div className="flex items-center gap-2">
                              <button onClick={() => { setEditingNoteId(note.id); setEditingNoteText(note.text) }} className="text-[10px] text-[#8888a0] hover:text-white">edit</button>
                              <button onClick={() => handleDeleteNote(note.id)} className="text-[10px] text-[#8888a0] hover:text-red-400">delete</button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 rounded-full border-2 border-[#e040fb] border-t-transparent animate-spin" /></div>}>
      <MessagesPageInner />
    </Suspense>
  )
}
