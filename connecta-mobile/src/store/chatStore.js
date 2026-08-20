import { create } from 'zustand'

const useChatStore = create((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: {},

  setConversations: (conversations) => set({ conversations }),

  setActiveConversation: (conversation) =>
    set({ activeConversation: conversation }),

  addMessage: (conversationId, message) => {
    const existing = get().messages[conversationId] || []
    set({
      messages: {
        ...get().messages,
        [conversationId]: [...existing, message],
      },
    })
  },

  setMessages: (conversationId, messages) => {
    set({
      messages: {
        ...get().messages,
        [conversationId]: messages,
      },
    })
  },

  updateLastMessage: (conversationId, message) => {
    set({
      conversations: get().conversations.map((c) =>
        c.id === conversationId ? { ...c, last_message: message } : c
      ),
    })
  },
}))

export default useChatStore