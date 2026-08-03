import { useEffect, useRef } from 'react'

export default function useWebSocket(conversationId, onMessage) {
  const wsRef = useRef(null)

  useEffect(() => {
    if (!conversationId) return

    const token = localStorage.getItem('access_token')
    const wsUrl = `ws://127.0.0.1:8000/ws/chat/${conversationId}/?token=${token}`

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('WebSocket connected')
    }

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        onMessage(data)
      } catch {
        console.error('WS parse error')
      }
    }

    ws.onerror = (err) => {
      console.error('WebSocket error:', err)
    }

    ws.onclose = () => {
      console.log('WebSocket disconnected')
    }

    return () => {
      ws.close()
    }
  }, [conversationId])

  const sendMessage = (data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
  }

  return { sendMessage }
}