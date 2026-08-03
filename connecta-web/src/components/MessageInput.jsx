import { useRef, useState } from 'react'
import api from '../api/axios'

export default function MessageInput({ convoId, sendMessage }) {
  const [text, setText] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  const handleSend = () => {
    if (!text.trim()) return
    sendMessage({
      type: 'chat.message',
      content: text.trim(),
    })
    setText('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post('/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      sendMessage({
        type: 'chat.message',
        content: '',
        file_url: res.data.file_url,
        file_name: res.data.file_name,
        file_type: res.data.file_type,
      })
    } catch (err) {
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div style={styles.container}>
      {/* File upload button */}
      <button
        style={styles.attachBtn}
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        title="Attach file"
      >
        {uploading ? '⏳' : '📎'}
      </button>
      <input
        type="file"
        ref={fileRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
        accept="image/*,.pdf,.doc,.docx"
      />

      {/* Text input */}
      <textarea
        style={styles.input}
        placeholder="Type a message..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
      />

      {/* Send button */}
      <button
        style={{
          ...styles.sendBtn,
          opacity: text.trim() ? 1 : 0.4,
        }}
        onClick={handleSend}
        disabled={!text.trim()}
      >
        ➤
      </button>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '16px 20px',
    borderTop: '1px solid #2a2d3a',
    background: '#1a1d27',
  },
  attachBtn: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '4px',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    background: '#0f1117',
    border: '1px solid #2a2d3a',
    borderRadius: '12px',
    padding: '12px 16px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    resize: 'none',
    fontFamily: 'inherit',
    lineHeight: '1.5',
    maxHeight: '120px',
    overflowY: 'auto',
  },
  sendBtn: {
    background: '#2e86ab',
    border: 'none',
    borderRadius: '50%',
    width: '42px',
    height: '42px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '16px',
    cursor: 'pointer',
    flexShrink: 0,
  },
}