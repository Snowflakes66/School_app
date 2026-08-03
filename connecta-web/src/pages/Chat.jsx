import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import ChatWindow from '../components/ChatWindow'
import useChatStore from '../store/chatStore'
import useAuthStore from '../store/authStore'
import api from '../api/axios'

export default function Chat() {
  const { setConversations, activeConversation } = useChatStore()
  const { user, setUser } = useAuthStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      try {
        // Fetch profile if not loaded
        if (!user) {
          const res = await api.get('/auth/me/')
          setUser(res.data)
        }
        // Fetch conversations
        const res = await api.get('/conversations/')
        setConversations(res.data)
      } catch (err) {
        console.error('Init error:', err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  if (loading) {
    return (
      <div style={styles.loading}>
        <p style={styles.loadingText}>Loading Connecta...</p>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <Sidebar />
      <main style={styles.main}>
        {activeConversation ? (
          <ChatWindow />
        ) : (
          <div style={styles.empty}>
            <h2 style={styles.emptyTitle}>Welcome to Connecta 👋</h2>
            <p style={styles.emptyText}>
              Select a conversation or start a new one
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    background: '#0f1117',
    overflow: 'hidden',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  empty: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: '#fff',
    fontSize: '22px',
    fontWeight: '600',
  },
  emptyText: {
    color: '#555',
    fontSize: '14px',
    marginTop: '8px',
  },
  loading: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0f1117',
  },
  loadingText: {
    color: '#555',
    fontSize: '14px',
  },
}