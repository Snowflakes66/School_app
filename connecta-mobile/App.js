import { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { ActivityIndicator, View } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import useAuthStore from './src/store/authStore'
import LoginScreen from './src/screens/LoginScreen'
import ConversationsScreen from './src/screens/ConversationsScreen'
import ChatScreen from './src/screens/ChatScreen'

const Stack = createStackNavigator()

export default function App() {
  const { isAuthenticated, loadFromStorage, setUser } = useAuthStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      await loadFromStorage()
      setLoading(false)
    }
    init()
  }, [])

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f1117' }}>
        <ActivityIndicator size="large" color="#2e86ab" />
      </View>
    )
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Conversations" component={ConversationsScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}