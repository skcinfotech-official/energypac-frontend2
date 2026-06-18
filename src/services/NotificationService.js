// Simplified Notification Service
class NotificationService {
  constructor() {
    this.listeners = new Set();
  }

  init() {
    // Simplified - no WebSocket complexity
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  cleanup() {
    this.listeners.clear();
  }

  requestNotificationPermission() {
    if ('Notification' in window && Notification.permission !== 'granted') {
      return Notification.requestPermission();
    }
    return Promise.resolve('granted');
  }

  markAsRead(id) {
    return fetch(`/api/notifications/${id}/mark_as_read/`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
    });
  }

  markAllAsRead() {
    return fetch('/api/notifications/mark_all_as_read/', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
    });
  }

  deleteNotification(id) {
    return fetch(`/api/notifications/${id}/`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
    });
  }

  getUnreadCount() {
    return 0;
  }

  getConnectionStatus() {
    return { connected: true, method: 'polling' };
  }
}

export default new NotificationService();
