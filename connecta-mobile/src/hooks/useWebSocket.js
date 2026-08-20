import { useEffect, useRef } from 'react'
import * as SecureStore from 'expo-secure-store'

export default function useWebSocket(conversationId, onMessage) {
  const wsRef = useRef(null)

  // Replace with your PC's IP address
  const WS_BASE = 'ws://192.168.X.X:8000'

  useEffect(() => {
    if (!conversationId) return

    let ws

    const connect = async () => {
      const token = await SecureStore.getItemAsync('access_token')
      ws = new WebSocket(
        `${WS_BASE}/ws/chat/${conversationId}/?token=${token}`
      )
      wsRef.current = ws

      ws.onopen = () => console.log('WS connected')

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          onMessage(data)
        } catch {
          console.error('WS parse error')
        }
      }

      ws.onerror = (err) => console.error('WS error:', err)
      ws.onclose = () => console.log('WS disconnected')
    }

    connect()

    return () => {
      ws?.close()
    }
  }, [conversationId])

  const sendMessage = (data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
  }

  return { sendMessage }
}