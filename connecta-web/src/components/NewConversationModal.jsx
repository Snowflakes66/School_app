import { useEffect, useState } from 'react'
import api from '../api/axios'
import useChatStore from '../store/chatStore'

export default function NewConversationModal({ onClose }) {
  const { conversations, setConversations, setActiveConversation } =
    useChatStore()
  const [contacts, setContacts] = useState([])
  const [selected, setSelected] = useState([])
  const [isGroup, setIsGroup] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    api
      .get('/auth/contacts/')
      .then((res) => setContacts(res.data))
      .finally(() => setFetching(false))
  }, [])

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleCreate = async () => {
    if (selected.length === 0) return
    setLoading(true)
    try {
      const payload = {
        is_group: isGroup,
        member_ids: selected,
        ...(isGroup && { name: groupName }),
      }
      const res = await api.post('/conversations/', payload)
      const exists = conversations.find((c) => c.id === res.data.id)
      if (!exists) {
        setConversations([res.data, ...conversations])
      }
      setActiveConversation(res.data)
      onClose()
    } catch (err) {
      console.error('Create conversation error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>New Conversation</h3>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Group toggle */}
        <div style={styles.toggleRow}>
          <span style={styles.toggleLabel}>Group chat</span>
          <div
            style={{
              ...styles.toggle,
              background: isGroup ? '#2e86ab' : '#2a2d3a',
            }}
            onClick={() => setIsGroup(!isGroup)}
          >
            <div
              style={{
                ...styles.toggleThumb,
                transform: isGroup ? 'translateX(20px)' : 'translateX(2px)',
              }}
            />
          </div>
        </div>

        {/* Group name */}
        {isGroup && (
          <input
            style={styles.input}
            placeholder="Group name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
        )}

        {/* Contacts */}
        <div style={styles.contactList}>
          {fetching ? (
            <p style={styles.hint}>Loading contacts...</p>
          ) : contacts.length === 0 ? (
            <p style={styles.hint}>No contacts found. Add users via admin.</p>
          ) : (
            contacts.map((c) => (
              <div
                key={c.id}
                style={{
                  ...styles.contactItem,
                  background: selected.includes(c.id) ? '#2a2d3a' : 'transparent',
                }}
                onClick={() => toggleSelect(c.id)}
              >
                <div style={styles.contactAvatar}>
                  {c.avatar_url ? (
                    <img src={c.avatar_url} alt="avatar" style={styles.avatarImg} />
                  ) : (
                    <span>{c.display_name?.[0]?.toUpperCase() || '?'}</span>
                  )}
                </div>
                <span style={styles.contactName}>
                  {c.display_name || c.username}
                </span>
                {selected.includes(c.id) && (
                  <span style={styles.check}>✓</span>
                )}
              </div>
            ))
          )}
        </div>

        <button
          style={{
            ...styles.createBtn,
            opacity: selected.length === 0 || loading ? 0.5 : 1,
          }}
          onClick={handleCreate}
          disabled={selected.length === 0 || loading}
        >
          {loading ? 'Creating...' : 'Start Conversation'}
        </button>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  modal: {
    background: '#1a1d27',
    borderRadius: '16px',
    padding: '24px',
    width: '360px',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    color: '#fff',
    fontSize: '16px',
    fontWeight: '600',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#666',
    fontSize: '16px',
    cursor: 'pointer',
  },
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    color: '#aaa',
    fontSize: '14px',
  },
  toggle: {
    width: '44px',
    height: '24px',
    borderRadius: '12px',
    cursor: 'pointer',
    position: 'relative',
    transition: 'background 0.2s',
  },
  toggleThumb: {
    position: 'absolute',
    top: '2px',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: '#fff',
    transition: 'transform 0.2s',
  },
  input: {
    background: '#0f1117',
    border: '1px solid #2a2d3a',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
  },
  contactList: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  hint: {
    color: '#555',
    fontSize: '13px',
    textAlign: 'center',
    padding: '20px 0',
  },
  contactItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  contactAvatar: {
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
  contactName: {
    color: '#fff',
    fontSize: '14px',
    flex: 1,
  },
  check: {
    color: '#2e86ab',
    fontWeight: '700',
  },
  createBtn: {
    background: '#2e86ab',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
}