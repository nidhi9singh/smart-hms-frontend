// src/api/topnav.ts
import api from '@/lib/axios'

export const topnavApi = {
  // Branches (Switch Branch modal)
  listBranches:  () => api.get('/multi-branch/branches'),

  // Notifications feed (Bell)
  listFeed:      (limit = 50) => api.get('/messaging/notifications/feed', { params: { limit } }),
  clearFeed:     () => api.delete('/messaging/notifications/feed'),

  // Bed status (Bed icon)
  bedStatus:     () => api.get('/ipd/bed-status'),

  // Chat
  chatContacts:  (search?: string) => api.get('/chat/contacts', { params: search ? { search } : undefined }),
  chatMessages:  (userId: number) => api.get(`/chat/messages/${userId}`),
  sendMessage:   (recipientId: number, body: string) =>
    api.post('/chat/messages', { recipient_id: recipientId, body }),
  deleteMessage: (id: number) => api.delete(`/chat/messages/${id}`),
  unreadCount:   () => api.get('/chat/unread-count'),
}
