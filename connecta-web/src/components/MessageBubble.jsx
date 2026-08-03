export default function MessageBubble({ message, isOwn }) {
  const formatTime = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const renderStatus = (status) => {
    if (!isOwn) return null
    if (status === 'read') return '✓✓'
    if (status === 'delivered') return '✓✓'
    return '✓'
  }

  return (
    <div
      style={{
        ...styles.wrapper,
        justifyContent: isOwn ? 'flex-end' : 'flex-start',
      }}
    >
      {/* Avatar for others */}
      {!isOwn && (
        <div style={styles.avatar}>
          {message.sender?.avatar_url ? (
            <img
              src={message.sender.avatar_url}
              alt="avatar"
              style={styles.avatarImg}
            />
          ) : (
            <span>
              {message.sender?.display_name?.[0]?.toUpperCase() || '?'}
            </span>
          )}
        </div>
      )}

      <div style={{ maxWidth: '65%' }}>
        {/* Sender name for group chats */}
        {!isOwn && (
          <p style={styles.senderName}>
            {message.sender?.display_name || message.sender?.username}
          </p>
        )}

        {/* Bubble */}
        <div
          style={{
            ...styles.bubble,
            background: isOwn ? '#2e86ab' : '#1e2130',
            borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          }}
        >
          {/* File attachment */}
          {message.file_url && message.file_type === 'image' && (
            <img
              src={message.file_url}
              alt="attachment"
              style={styles.imageAttachment}
            />
          )}

          {message.file_url && message.file_type !== 'image' && (
            <a
              href={message.file_url}
              target="_blank"
              rel="noreferrer"
              style={styles.fileLink}
            >
              📎 {message.file_name || 'Download file'}
            </a>
          )}

          {/* Text content */}
          {message.content && <p style={styles.content}>{message.content}</p>}

          {/* Time + status */}
          <div style={styles.meta}>
            <span style={styles.time}>{formatTime(message.created_at)}</span>
            {isOwn && (
              <span
                style={{
                  ...styles.status,
                  color: message.status === 'read' ? '#90caf9' : '#aaa',
                }}
              >
                {renderStatus(message.status)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  wrapper: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
    marginBottom: '8px',
  },
  avatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: '#2e86ab',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '11px',
    fontWeight: '600',
    flexShrink: 0,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  senderName: {
    color: '#2e86ab',
    fontSize: '11px',
    fontWeight: '600',
    marginBottom: '4px',
    paddingLeft: '4px',
  },
  bubble: {
    padding: '10px 14px',
    maxWidth: '100%',
  },
  content: {
    color: '#fff',
    fontSize: '14px',
    lineHeight: '1.5',
    wordBreak: 'break-word',
  },
  imageAttachment: {
    maxWidth: '100%',
    borderRadius: '8px',
    marginBottom: '6px',
    display: 'block',
  },
  fileLink: {
    color: '#90caf9',
    fontSize: '13px',
    textDecoration: 'none',
    display: 'block',
    marginBottom: '4px',
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '4px',
    marginTop: '4px',
  },
  time: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: '10px',
  },
  status: {
    fontSize: '11px',
  },
}
