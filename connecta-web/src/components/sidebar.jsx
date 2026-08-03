import { useState } from 'react'
import useChatStore from '../store/chatStore'
import useAuthStore from '../store/authStore'
import api from '../api/axios'
import NewConversationModal from './NewConversationModal'

export default function Sidebar() {
  const { conversations, activeConversation, setActiveConversation } =
    useChatStore()
  const { user, logout } = useAuthStore()
  const [showModal, setShowModal] = useState(false)

  const handleLogout = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token')
      await api.post('/auth/logout/', { refresh })
    } catch {
      // continue regardless
    }
    logout()
    window.location.href = '/login'
  }

  const getConversationName = (convo) => {
    if (convo.is_group) return convo.name
    const other = convo.members?.find((m) => m.id !== user?.id)
    return other?.display_name || other?.username || 'Unknown'
  }

  const getAvatar = (convo) => {
    if (convo.is_group) return convo.icon_url || null
    const other = convo.members?.find((m) => m.id !== user?.id)
    return other?.avatar_url || null
  }

  const getInitial = (convo) => {
    return getConversationName(convo)?.[0]?.toUpperCase() || '?'
  }

  const formatTime = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  return (
    <aside style={styles.sidebar}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.logo}>Connecta</h1>
        <button style={styles.iconBtn} onClick={() => setShowModal(true)} title="New conversation">
          ✏️
        </button>
      </div>

      {/* User info */}
      <div style={styles.userBar}>
        <div style={styles.userAvatar}>
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="me" style={styles.avatarImg} />
          ) : (
            <span>{user?.display_name?.[0]?.toUpperCase() || 'A'}</span>
          )}
        </div>
        <div style={styles.userInfo}>
          <p style={styles.userName}>{user?.display_name || user?.username}</p>
          <p style={styles.userStatus}>● Online</p>
        </div>
        <button style={styles.logoutBtn} onClick={handleLogout} title="Logout">
          ⎋
        </button>
      </div>

      {/* Conversation list */}
      <div style={styles.list}>
        {conversations.length === 0 ? (
          <div style={styles.emptyList}>
            <p style={styles.emptyText}>No conversations yet</p>
            <p style={styles.emptyHint}>Tap ✏️ to start one</p>
          </div>
        ) : (
          conversations.map((convo) => (
            <div
              key={convo.id}
              style={{
                ...styles.convoItem,
                ...(activeConversation?.id === convo.id
                  ? styles.convoItemActive
                  : {}),
              }}
              onClick={() => setActiveConversation(convo)}
            >
              {/* Avatar */}
              <div style={styles.convoAvatar}>
                {getAvatar(convo) ? (
                  <img
                    src={getAvatar(convo)}
                    alt="avatar"
                    style={styles.avatarImg}
                  />
                ) : (
                  <span style={styles.convoInitial}>{getInitial(convo)}</span>
                )}
              </div>

              {/* Info */}
              <div style={styles.convoInfo}>
                <div style={styles.convoTop}>
                  <span style={styles.convoName}>
                    {getConversationName(convo)}
                  </span>
                  <span style={styles.convoTime}>
                    {formatTime(convo.last_message?.created_at)}
                  </span>
                </div>
                <p style={styles.convoLast}>
                  {convo.last_message?.content || 'No messages yet'}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && <NewConversationModal onClose={() => setShowModal(false)} />}
    </aside>
  )
}

const styles = {
  sidebar: {
    width: '320px',
    minWidth: '320px',
    background: '#1a1d27',
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid #2a2d3a',
    height: '100vh',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 16px 12px',
    borderBottom: '1px solid #2a2d3a',
  },
  logo: {
    color: '#2e86ab',
    fontSize: '20px',
    fontWeight: '700',
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '18px',
    padding: '4px',
  },
  userBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    borderBottom: '1px solid #2a2d3a',
  },
  userAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: '#2e86ab',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: '600',
    fontSize: '14px',
    overflow: 'hidden',
    flexShrink: 0,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#fff',
    fontSize: '13px',
    fontWeight: '600',
  },
  userStatus: {
    color: '#4caf50',
    fontSize: '11px',
    marginTop: '2px',
  },
  logoutBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '18px',
    color: '#555',
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 0',
  },
  emptyList: {
    padding: '40px 16px',
    textAlign: 'center',
  },
  emptyText: {
    color: '#444',
    fontSize: '14px',
  },
  emptyHint: {
    color: '#333',
    fontSize: '12px',
    marginTop: '6px',
  },
  convoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    cursor: 'pointer',
    transition: 'background 0.15s',
    borderRadius: '8px',
    margin: '2px 8px',
  },
  convoItemActive: {
    background: '#2a2d3a',
  },
  convoAvatar: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: '#2e86ab',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  convoInitial: {
    color: '#fff',
    fontWeight: '600',
    fontSize: '16px',
  },
  convoInfo: {
    flex: 1,
    minWidth: 0,
  },
  convoTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  convoName: {
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
  },
  convoTime: {
    color: '#555',
    fontSize: '11px',
  },
  convoLast: {
    color: '#666',
    fontSize: '12px',
    marginTop: '3px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
}