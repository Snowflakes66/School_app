import { useEffect, useRef, useState } from 'react'
import useChatStore from '../store/chatStore'
import useAuthStore from '../store/authStore'
import api from '../api/axios'
import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'
import useWebSocket from '../hooks/useWebSocket'

export default function ChatWindow() {
  const { activeConversation, messages, setMessages, addMessage } =
    useChatStore()
  const { user } = useAuthStore()
  const bottomRef = useRef(null)
  const [loading, setLoading] = useState(true)

  const convoId = activeConversation?.id

  // Load message history
  useEffect(() => {
    if (!convoId) return
    setLoading(true)
    api
      .get(`/conversations/${convoId}/messages/`)
      .then((res) => {
        const msgs = res.data.results || res.data
        setMessages(convoId, msgs)
      })
      .catch((err) => console.error('Load messages error:', err))
      .finally(() => setLoading(false))
  }, [convoId])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages[convoId]])

  // WebSocket for real-time
  const { sendMessage } = useWebSocket(convoId, (event) => {
    if (event.type === 'chat.message') {
      addMessage(convoId, {
        id: event.message_id,
        conversation: convoId,
        sender: {
          id: event.sender_id,
          display_name: event.sender_name,
          avatar_url: event.sender_avatar,
        },
        content: event.content,
        file_url: event.file_url,
        file_name: event.file_name,
        file_type: event.file_type,
        status: event.status,
        created_at: event.created_at,
      })
    }
  })

  const getHeaderName = () => {
    if (!activeConversation) return ''
    if (activeConversation.is_group) return activeConversation.name
    const other = activeConversation.members?.find((m) => m.id !== user?.id)
    return other?.display_name || other?.username || 'Unknown'
  }

  const getHeaderStatus = () => {
    if (activeConversation?.is_group) {
      return `${activeConversation.member_count} members`
    }
    const other = activeConversation?.members?.find((m) => m.id !== user?.id)
    return other?.is_online ? '● Online' : '○ Offline'
  }

  const isOnline = () => {
    if (activeConversation?.is_group) return false
    const other = activeConversation?.members?.find((m) => m.id !== user?.id)
    return other?.is_online
  }

  const convoMessages = messages[convoId] || []

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerAvatar}>
          <span>
            {getHeaderName()?.[0]?.toUpperCase() || '?'}
          </span>
        </div>
        <div style={styles.headerInfo}>
          <p style={styles.headerName}>{getHeaderName()}</p>
          <p
            style={{
              ...styles.headerStatus,
              color: isOnline() ? '#4caf50' : '#555',
            }}
          >
            {getHeaderStatus()}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div style={styles.messages}>
        {loading ? (
          <div style={styles.center}>
            <p style={styles.hint}>Loading messages...</p>
          </div>
        ) : convoMessages.length === 0 ? (
          <div style={styles.center}>
            <p style={styles.hint}>No messages yet. Say hello! 👋</p>
          </div>
        ) : (
          convoMessages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.sender?.id === user?.id}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <MessageInput convoId={convoId} sendMessage={sendMessage} />
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: '#0f1117',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 20px',
    borderBottom: '1px solid #2a2d3a',
    background: '#1a1d27',
  },
  headerAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: '#2e86ab',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: '600',
    fontSize: '16px',
    flexShrink: 0,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    color: '#fff',
    fontSize: '15px',
    fontWeight: '600',
  },
  headerStatus: {
    fontSize: '12px',
    marginTop: '2px',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  center: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  hint: {
    color: '#444',
    fontSize: '14px',
  },
}