import { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import api from '../api/axios'
import useChatStore from '../store/chatStore'
import useAuthStore from '../store/authStore'
import useWebSocket from '../hooks/useWebSocket'

export default function ChatScreen({ navigation }) {
  const { activeConversation, messages, setMessages, addMessage } = useChatStore()
  const { user } = useAuthStore()
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const flatListRef = useRef(null)

  const convoId = activeConversation?.id

  const getName = () => {
    if (!activeConversation) return ''
    if (activeConversation.is_group) return activeConversation.name
    const other = activeConversation.members?.find((m) => m.id !== user?.id)
    return other?.display_name || other?.username || 'Unknown'
  }

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
        status: event.status,
        created_at: event.created_at,
      })
    }
  })

  const handleSend = () => {
    if (!text.trim()) return
    sendMessage({ type: 'chat.message', content: text.trim() })
    setText('')
  }

  const formatTime = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const convoMessages = messages[convoId] || []

  const renderMessage = ({ item }) => {
    const isOwn = item.sender?.id === user?.id
    return (
      <View
        style={[
          styles.messageRow,
          isOwn ? styles.messageRowOwn : styles.messageRowOther,
        ]}
      >
        {!isOwn && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.sender?.display_name?.[0]?.toUpperCase() || '?'}
            </Text>
          </View>
        )}
        <View
          style={[
            styles.bubble,
            isOwn ? styles.bubbleOwn : styles.bubbleOther,
          ]}
        >
          {!isOwn && (
            <Text style={styles.senderName}>
              {item.sender?.display_name || item.sender?.username}
            </Text>
          )}
          {item.content ? (
            <Text style={styles.messageText}>{item.content}</Text>
          ) : null}
          <View style={styles.meta}>
            <Text style={styles.time}>{formatTime(item.created_at)}</Text>
            {isOwn && (
              <Text style={styles.status}>
                {item.status === 'read' ? '✓✓' : '✓'}
              </Text>
            )}
          </View>
        </View>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>
            {getName()?.[0]?.toUpperCase() || '?'}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{getName()}</Text>
          <Text style={styles.headerStatus}>○ Offline</Text>
        </View>
      </View>

      {/* Messages */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2e86ab" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={convoMessages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No messages yet. Say hello! 👋</Text>
            </View>
          }
        />
      )}

      {/* Input */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#555"
          value={text}
          onChangeText={setText}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !text.trim() && { opacity: 0.4 }]}
          onPress={handleSend}
          disabled={!text.trim()}
        >
          <Text style={styles.sendBtnText}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    paddingTop: 52,
    backgroundColor: '#1a1d27',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2d3a',
  },
  backBtn: { color: '#2e86ab', fontSize: 24, marginRight: 4 },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2e86ab',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: { color: '#fff', fontWeight: '600' },
  headerInfo: { flex: 1 },
  headerName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  headerStatus: { color: '#555', fontSize: 12, marginTop: 2 },
  messagesList: { padding: 16, gap: 8 },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 8,
  },
  messageRowOwn: { justifyContent: 'flex-end' },
  messageRowOther: { justifyContent: 'flex-start' },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2e86ab',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  bubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 18,
  },
  bubbleOwn: {
    backgroundColor: '#2e86ab',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#1e2130',
    borderBottomLeftRadius: 4,
  },
  senderName: {
    color: '#2e86ab',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  messageText: { color: '#fff', fontSize: 14, lineHeight: 20 },
  meta: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  time: { color: 'rgba(255,255,255,0.4)', fontSize: 10 },
  status: { color: '#aaa', fontSize: 11 },
  emptyText: { color: '#444', fontSize: 14 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    backgroundColor: '#1a1d27',
    borderTopWidth: 1,
    borderTopColor: '#2a2d3a',
  },
  input: {
    flex: 1,
    backgroundColor: '#0f1117',
    borderWidth: 1,
    borderColor: '#2a2d3a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2e86ab',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnText: { color: '#fff', fontSize: 16 },
})