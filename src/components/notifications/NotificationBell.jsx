import { useState, useEffect } from 'react';
import { Badge, IconButton, Popover, Box, Typography, Button, CircularProgress } from '@mui/material';
import { Notifications as BellIcon, Close as CloseIcon } from '@mui/icons-material';
import { apiGet, apiPatch } from '../../services/api';

const NotificationBell = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    if (!token) return;
    loadNotifications();
    const interval = setInterval(loadNotifications, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [token]);

  const loadNotifications = async () => {
    try {
      const data = await apiGet('/api/notifications/?limit=10');
      setNotifications(data.results || []);
      setUnreadCount(data.unread_count || 0);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await apiPatch(`/api/notifications/${id}/mark_as_read/`, {});
      loadNotifications();
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{ color: unreadCount > 0 ? '#ef4444' : '#64748b' }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <BellIcon />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              width: '350px',
              maxHeight: '400px',
              overflow: 'auto',
              borderRadius: '8px'
            }
          }
        }}
      >
        <Box sx={{ p: 2, bgcolor: '#1a1a2e', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontWeight: 900 }}>
            🔔 Notifications ({unreadCount})
          </Typography>
          <IconButton size="small" onClick={() => setAnchorEl(null)} sx={{ color: 'white' }}>
            <CloseIcon sx={{ fontSize: '18px' }} />
          </IconButton>
        </Box>

        {notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center', color: '#64748b' }}>
            <Typography sx={{ fontSize: '13px' }}>No notifications</Typography>
          </Box>
        ) : (
          notifications.map((notif) => (
            <Box
              key={notif.id}
              sx={{
                p: 2,
                borderBottom: '1px solid #e2e8f0',
                bgcolor: notif.is_read ? '#fff' : '#f0f9ff',
                '&:hover': { bgcolor: '#f8fafc' }
              }}
            >
              <Typography sx={{ fontWeight: 700, fontSize: '13px', color: '#1e293b', mb: 0.5 }}>
                {notif.title}
              </Typography>
              <Typography sx={{ fontSize: '12px', color: '#64748b', mb: 1 }}>
                {notif.message}
              </Typography>
              {!notif.is_read && (
                <Button
                  size="small"
                  onClick={() => handleMarkAsRead(notif.id)}
                  sx={{ fontSize: '11px', color: '#0ea5e9' }}
                >
                  Mark as read
                </Button>
              )}
            </Box>
          ))
        )}

        <Box sx={{ p: 2, textAlign: 'center', borderTop: '1px solid #e2e8f0' }}>
          <Button
            size="small"
            href="/notifications"
            sx={{ color: '#0ea5e9', textTransform: 'none' }}
          >
            View All →
          </Button>
        </Box>
      </Popover>
    </>
  );
};

export default NotificationBell;
