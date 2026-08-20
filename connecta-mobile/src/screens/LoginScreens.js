import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import api from '../api/axios'
import useAuthStore from '../store/authStore'

export default function LoginScreen() {
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!form.username || !form.password) {
      Alert.alert('Error', 'Please enter username and password')
      return
    }
    setLoading(true)
    try {
      const res = await api.post('/auth/login/', form)
      const { access, refresh } = res.data
      const profileRes = await api.get('/auth/me/', {
        headers: { Authorization: `Bearer ${access}` },
      })
      await setAuth(profileRes.data, access, refresh)
    } catch (err) {
      Alert.alert('Error', err.response?.data?.detail || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.card}>
        <Text style={styles.logo}>Connecta</Text>
        <Text style={styles.tagline}>Stay Close. No Matter the Distance.</Text>

        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#555"
          value={form.username}
          onChangeText={(val) => setForm({ ...form, username: val })}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#555"
          value={form.password}
          onChangeText={(val) => setForm({ ...form, password: val })}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1117',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#1a1d27',
    borderRadius: 16,
    padding: 32,
  },
  logo: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2e86ab',
    textAlign: 'center',
    marginBottom: 8,
  },
  tagline: {
    color: '#555',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#0f1117',
    borderWidth: 1,
    borderColor: '#2a2d3a',
    borderRadius: 10,
    padding: 14,
    color: '#fff',
    fontSize: 15,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#2e86ab',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})