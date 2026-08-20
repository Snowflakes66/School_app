import { useEffect, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native'
import api from '../api/axios'
import useChatStore from '../store/chatStore'
import useAuthStore from '../store/authStore'

export default function ConversationsScreen({ navigation }) {
  const { conversations, setConversations, setActiveConversation } = useChatStore()
  const { user, setUser, logout } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [contacts, setContacts] = useState([])
  const [selected, setSelected] = useState([])
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    const init = async () => {
      try {
        if (!user) {
          const res = await api.get('/auth/me/')
          setUser(res.data)
        }
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

  const loadContacts = async () => {
    try {
      const res = await api.get('/auth/contacts/')
      setContacts(res.data)
    } catch (err) {
      console.error('Contacts error:', err)
    }
  }

  const openModal = () => {
    setSelected([])
    loadContacts()
    setShowModal(true)
  }

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const createConversation = async () => {
    if (selected.length === 0) return
    setCreating(true)
    try {
      const res = await api.post('/conversations/', {
        is_group: false,
        member_ids: selected,
      })
      const exists = conversations.find((c) => c.id === res.data.id)
      if (!exists) setConversations([res.data, ...conversations])
      setActiveConversation(res.data)
      setShowModal(false)
      navigation.navigate('Chat')
    } catch (err) {
      Alert.alert('Error', 'Could not create conversation')
    } finally {
      setCreating(false)
    }
  }

  const openChat = (convo) => {
    setActiveConversation(convo)
    navigation.navigate('Chat')
  }

  const getName = (convo) => {
    if (convo.is_group) return convo.name
    const other = convo.members?.find((m) => m.id !== user?.id)
    return other?.display_name || other?.username || 'Unknown'
  }

  const getInitial = (convo) => getName(convo)?.[0]?.toUpperCase() || '?'

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

  const handleLogout = async () => {
    try {
      const { default: SecureStore } = await import('expo-secure-store')
      const refresh = await SecureStore.getItemAsync('refresh_token')
      await api.post('/auth/logout/', { refresh })
    } catch {}
    await logout()
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2e86ab" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>Connecta</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn} onPress={openModal}>
            <Text style={styles.iconText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={handleLogout}>
            <Text style={styles.iconText}>⎋</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* User bar */}
      <View style={styles.userBar}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.display_name?.[0]?.toUpperCase() || 'A'}
          </Text>
        </View>
        <View>
          <Text style={styles.userName}>
            {user?.display_name || user?.username}
          </Text>
          <Text style={styles.onlineStatus}>● Online</Text>
        </View>
      </View>

      {/* Conversations */}
      {conversations.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No conversations yet</Text>
          <Text style={styles.emptyHint}>Tap ✏️ to start one</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.convoItem}
              onPress={() => openChat(item)}
            >
              <View style={styles.convoAvatar}>
                <Text style={styles.convoInitial}>{getInitial(item)}</Text>
              </View>
              <View style={styles.convoInfo}>
                <View style={styles.convoTop}>
                  <Text style={styles.convoName}>{getName(item)}</Text>
                  <Text style={styles.convoTime}>
                    {formatTime(item.last_message?.created_at)}
                  </Text>
                </View>
                <Text style={styles.convoLast} numberOfLines={1}>
                  {item.last_message?.content || 'No messages yet'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* New conversation modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Conversation</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {contacts.length === 0 ? (
              <Text style={styles.emptyText}>No contacts found</Text>
            ) : (
              <FlatList
                data={contacts}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.contactItem,
                      selected.includes(item.id) && styles.contactSelected,
                    ]}
                    onPress={() => toggleSelect(item.id)}
                  >
                    <View style={styles.convoAvatar}>
                      <Text style={styles.convoInitial}>
                        {item.display_name?.[0]?.toUpperCase() || '?'}
                      </Text>
                    </View>
                    <Text style={styles.contactName}>
                      {item.display_name || item.username}
                    </Text>
                    {selected.includes(item.id) && (
                      <Text style={styles.check}>✓</Text>
                    )}
                  </TouchableOpacity>
                )}
              />
            )}

            <TouchableOpacity
              style={[
                styles.createBtn,
                (selected.length === 0 || creating) && { opacity: 0.5 },
              ]}
              onPress={createConversation}
              disabled={selected.length === 0 || creating}
            >
              {creating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.createBtnText}>Start Conversation</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 52,
    backgroundColor: '#1a1d27',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2d3a',
  },
  logo: { fontSize: 20, fontWeight: '700', color: '#2e86ab' },
  headerRight: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 6 },
  iconText: { fontSize: 18 },
  userBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#1a1d27',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2d3a',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2e86ab',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  userName: { color: '#fff', fontSize: 13, fontWeight: '600' },
  onlineStatus: { color: '#4caf50', fontSize: 11, marginTop: 2 },
  emptyText: { color: '#444', fontSize: 14, textAlign: 'center' },
  emptyHint: { color: '#333', fontSize: 12, marginTop: 6 },
  convoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1d27',
  },
  convoAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2e86ab',
    justifyContent: 'center',
    alignItems: 'center',
  },
  convoInitial: { color: '#fff', fontWeight: '600', fontSize: 16 },
  convoInfo: { flex: 1 },
  convoTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  convoName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  convoTime: { color: '#555', fontSize: 11 },
  convoLast: { color: '#666', fontSize: 12, marginTop: 3 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#1a1d27',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  closeBtn: { color: '#666', fontSize: 18 },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 8,
  },
  contactSelected: { backgroundColor: '#2a2d3a' },
  contactName: { color: '#fff', fontSize: 14, flex: 1 },
  check: { color: '#2e86ab', fontWeight: '700', fontSize: 16 },
  createBtn: {
    backgroundColor: '#2e86ab',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  createBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
})