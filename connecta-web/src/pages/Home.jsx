import useAuthStore from '../store/authStore'

export default function Home() {
  const { user } = useAuthStore()

  return (
    <div style={styles.container}>
      <h2 style={styles.text}>
        Welcome back, {user?.display_name || user?.username} 👋
      </h2>
      <p style={styles.sub}>Connecta is loading...</p>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0f1117',
  },
  text: {
    color: '#fff',
    fontSize: '24px',
    fontWeight: '600',
  },
  sub: {
    color: '#666',
    fontSize: '14px',
    marginTop: '8px',
  },
}