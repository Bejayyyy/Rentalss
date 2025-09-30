import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Platform,
  Alert,
  Modal,
  Animated,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';
import ActionModal from '../components/AlertModal/ActionModal';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

// Notification Bell Component
const NotificationBell = ({ notifications, onPress }) => {
  const [bellAnimation] = useState(new Animated.Value(0));
  

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (unreadCount > 0) {
      Animated.sequence([
        Animated.timing(bellAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(bellAnimation, {
          toValue: -1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(bellAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [unreadCount]);

  const bellRotate = bellAnimation.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-15deg', '15deg'],
  });

  return (
    <TouchableOpacity style={styles.notificationBell} onPress={onPress}>
      <Animated.View style={{ transform: [{ rotate: bellRotate }] }}>
        <Ionicons 
          name={unreadCount > 0 ? "notifications" : "notifications-outline"} 
          size={24} 
          color={unreadCount > 0 ? "#FF6B35" : "#666"} 
        />
      </Animated.View>
      {unreadCount > 0 && (
        <View style={styles.notificationBadge}>
          <Text style={styles.notificationBadgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// Notification Item Component
const NotificationItem = ({ notification, onMarkRead, onRemove, setActionModalConfig }) => {
  const [showActions, setShowActions] = useState(false);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'upcoming_pickup':
        return { name: 'car-sport', color: '#4CAF50' };
      case 'due_return':
        return { name: 'return-up-back', color: '#FF9800' };
      case 'overdue':
        return { name: 'alert-circle', color: '#F44336' };
      case 'pickup_today':
        return { name: 'today', color: '#2196F3' };
      case 'return_today':
        return { name: 'calendar-today', color: '#9C27B0' };
      case 'new_booking':
        return { name: 'add-circle', color: '#FF6B35' };
      case 'booking_confirmed':
        return { name: 'checkmark-circle', color: '#10b981' };
      case 'booking_completed':
        return { name: 'flag', color: '#3b82f6' };
      case 'status_change':
        return { name: 'swap-horizontal', color: '#8b5cf6' };
      default:
        return { name: 'information-circle', color: '#666' };
    }
  };

  const icon = getNotificationIcon(notification.type);

  const handleLongPress = () => {
    setShowActions(true);
  };

  const handleMarkRead = () => {
    onMarkRead(notification.id);
    setShowActions(false);
  };

  const handleRemove = () => {
    setActionModalConfig({
      title: 'Remove Notification',
      message: 'Are you sure you want to remove this notification?',
      onConfirm: () => {
        onRemove(notification.id);
        setShowActions(false);
      }
    });
  };

  return (
    <View style={styles.notificationWrapper}>
      <TouchableOpacity 
        style={[
          styles.notificationItem, 
          !notification.read && styles.unreadNotification,
          showActions && styles.notificationItemActive
        ]}
        onPress={handleMarkRead}
        onLongPress={handleLongPress}
        delayLongPress={500}
      >
        <View style={[styles.notificationIconContainer, { backgroundColor: `${icon.color}20` }]}>
          <Ionicons name={icon.name} size={20} color={icon.color} />
        </View>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{notification.title}</Text>
          <Text style={styles.notificationMessage}>{notification.message}</Text>
          <Text style={styles.notificationTime}>{notification.timeAgo}</Text>
        </View>
        {!notification.read && <View style={styles.unreadDot} />}
        
        {/* Quick action button */}
        <TouchableOpacity 
          style={styles.notificationMenuButton}
          onPress={() => setShowActions(!showActions)}
        >
          <Ionicons name="ellipsis-vertical" size={16} color="#9ca3af" />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Action buttons */}
      {showActions && (
        <View style={styles.notificationActions}>
          {!notification.read && (
            <TouchableOpacity 
              style={[styles.notificationActionButton, styles.markReadButton]}
              onPress={handleMarkRead}
            >
              <Ionicons name="checkmark-circle-outline" size={16} color="#10b981" />
              <Text style={[styles.notificationActionText, { color: '#10b981' }]}>
                Mark as read
              </Text>
            </TouchableOpacity>
            
            
          )}
          <TouchableOpacity 
            style={[styles.notificationActionButton, styles.removeButton]}
            onPress={handleRemove}
          >
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
            <Text style={[styles.notificationActionText, { color: '#ef4444' }]}>
              Remove
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.notificationActionButton, styles.cancelButton]}
            onPress={() => setShowActions(false)}
          >
            <Ionicons name="close-outline" size={16} color="#6b7280" />
            <Text style={[styles.notificationActionText, { color: '#6b7280' }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// Notifications Modal Component
const NotificationsModal = ({ visible, notifications, onClose, onMarkRead, onMarkAllRead, onRemove,setActionModalConfig,onClearAll}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Notifications</Text>
          <View style={styles.modalHeaderActions}>
            <TouchableOpacity 
              style={styles.markAllReadButton} 
              onPress={onMarkAllRead}
            >
              <Text style={styles.markAllReadText}>Mark all read</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.clearAllButton} 
              onPress={onClearAll}
            >
              <Text style={styles.clearAllText}>Clear all</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
        
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationItem 
              notification={item} 
              onMarkRead={onMarkRead}
              onRemove={onRemove}
              setActionModalConfig={setActionModalConfig}
            />
          )}
          contentContainerStyle={styles.notificationsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyNotifications}>
              <Ionicons name="notifications-off-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyNotificationsText}>No notifications</Text>
              <Text style={styles.emptyNotificationsSubtext}>You're all caught up!</Text>
            </View>
          }
        />
      </SafeAreaView>
    </Modal>
  );
};

export default function DashboardScreen({ navigation }) {
  const [dashboardData, setDashboardData] = useState({
    totalVehicles: 0,
    availableVehicles: 0,
    activeBookings: 0,
    todayBookings: 0,
    monthlyRevenue: 0,
    pendingBookings: 0,
    completedBookings: 0,
    recentBookings: []
  });
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [feedbackModal, setFeedbackModal] = useState({ visible: false, type: "success", message: "" });
  const [actionModalConfig, setActionModalConfig] = useState(null);



  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id);
    };
    getCurrentUser();
  }, []);

  // Create notification in database
  const createNotification = async (notificationData) => {
    if (!currentUserId) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: currentUserId,
          booking_id: notificationData.bookingId,
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type,
          read: false,
          dismissed: false
        });

      if (error) {
        console.error('Error creating notification:', error);
      }
    } catch (err) {
      console.error('Error creating notification:', err);
    }
  };

  // Generate notifications based on booking data
  const generateNotifications = async (bookings) => {
    if (!currentUserId) return;

    const today = new Date();
    const notificationPromises = [];

    for (const booking of bookings) {
      const startDate = new Date(booking.rental_start_date);
      const endDate = new Date(booking.rental_end_date);
      const timeDiff = startDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      const endTimeDiff = endDate.getTime() - today.getTime();
      const endDaysDiff = Math.ceil(endTimeDiff / (1000 * 3600 * 24));

      // Check if notifications already exist for this booking to avoid duplicates
      const { data: existingNotifications } = await supabase
        .from('notifications')
        .select('id, type')
        .eq('booking_id', booking.id)
        .eq('user_id', currentUserId)
        .eq('dismissed', false);

      const existingTypes = new Set(existingNotifications?.map(n => n.type) || []);

      // Pickup notifications (only for confirmed bookings)
      if (booking.status === 'confirmed') {
        if (daysDiff === 0 && !existingTypes.has('pickup_today')) {
          notificationPromises.push(createNotification({
            bookingId: booking.id,
            type: 'pickup_today',
            title: 'Vehicle pickup today!',
            message: `${booking.customer_name} is picking up ${booking.vehicles?.year} ${booking.vehicles?.make} ${booking.vehicles?.model} today`
          }));
        } else if (daysDiff === 1 && !existingTypes.has('pickup_tomorrow')) {
          notificationPromises.push(createNotification({
            bookingId: booking.id,
            type: 'pickup_tomorrow',
            title: 'Vehicle pickup tomorrow',
            message: `${booking.customer_name} will pick up ${booking.vehicles?.year} ${booking.vehicles?.make} ${booking.vehicles?.model} tomorrow`
          }));
        } else if (daysDiff > 1 && daysDiff <= 3 && !existingTypes.has('upcoming_pickup')) {
          notificationPromises.push(createNotification({
            bookingId: booking.id,
            type: 'upcoming_pickup',
            title: `Vehicle pickup in ${daysDiff} days`,
            message: `${booking.customer_name} will pick up ${booking.vehicles?.year} ${booking.vehicles?.make} ${booking.vehicles?.model}`
          }));
        }
      }

      // Status-based notifications
      if (booking.status === 'pending' && !existingTypes.has('new_booking')) {
        notificationPromises.push(createNotification({
          bookingId: booking.id,
          type: 'new_booking',
          title: 'New Booking Request',
          message: `${booking.customer_name} requested ${booking.vehicles?.year} ${booking.vehicles?.make} ${booking.vehicles?.model}`
        }));
      }

      // Return notifications (for confirmed and active bookings)
      if (booking.status === 'confirmed') {
        if (endDaysDiff === 0 && !existingTypes.has('return_today')) {
          notificationPromises.push(createNotification({
            bookingId: booking.id,
            type: 'return_today',
            title: 'Vehicle return due today!',
            message: `${booking.customer_name} should return ${booking.vehicles?.year} ${booking.vehicles?.make} ${booking.vehicles?.model} today`
          }));
        } else if (endDaysDiff === 1 && !existingTypes.has('return_tomorrow')) {
          notificationPromises.push(createNotification({
            bookingId: booking.id,
            type: 'return_tomorrow',
            title: 'Vehicle return due tomorrow',
            message: `${booking.customer_name} should return ${booking.vehicles?.year} ${booking.vehicles?.make} ${booking.vehicles?.model} tomorrow`
          }));
        } else if (endDaysDiff < 0 && !existingTypes.has('overdue')) {
          const overdueDays = Math.abs(endDaysDiff);
          notificationPromises.push(createNotification({
            bookingId: booking.id,
            type: 'overdue',
            title: 'Vehicle overdue!',
            message: `${booking.customer_name} is ${overdueDays} day${overdueDays > 1 ? 's' : ''} overdue returning ${booking.vehicles?.year} ${booking.vehicles?.make} ${booking.vehicles?.model}`
          }));
        } else if (endDaysDiff > 1 && endDaysDiff <= 3 && !existingTypes.has('return_upcoming')) {
          notificationPromises.push(createNotification({
            bookingId: booking.id,
            type: 'return_upcoming',
            title: `Vehicle return in ${endDaysDiff} days`,
            message: `${booking.customer_name} should return ${booking.vehicles?.year} ${booking.vehicles?.make} ${booking.vehicles?.model}`
          }));
        }
      }
    }

    // Wait for all notifications to be created
    await Promise.all(notificationPromises);
    
    // Fetch updated notifications from database
    await fetchNotifications();
  };

  // Fetch notifications from database
  const fetchNotifications = async () => {
    if (!currentUserId) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          id,
          title,
          message,
          type,
          read,
          dismissed,
          created_at,
          booking_id,
          bookings (
            customer_name,
            vehicles (
              make,
              model,
              year
            )
          )
        `)
        .eq('user_id', currentUserId)
        .eq('dismissed', false)
        .order('created_at', { ascending: false }); // Newest first (descending order)

      if (error) throw error;

      // Format notifications with time ago
      const formattedNotifications = data.map(notification => {
        const createdAt = new Date(notification.created_at);
        const now = new Date();
        const diffInMinutes = Math.floor((now - createdAt) / (1000 * 60));
        
        let timeAgo;
        if (diffInMinutes < 1) {
          timeAgo = 'Just now';
        } else if (diffInMinutes < 60) {
          timeAgo = `${diffInMinutes}m ago`;
        } else if (diffInMinutes < 1440) {
          const hours = Math.floor(diffInMinutes / 60);
          timeAgo = `${hours}h ago`;
        } else {
          const days = Math.floor(diffInMinutes / 1440);
          timeAgo = `${days}d ago`;
        }

        return {
          ...notification,
          timeAgo,
          bookingId: notification.booking_id
        };
      });

      setNotifications(formattedNotifications);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const todayStr = today.toISOString().split('T')[0];

      // Fetch vehicles
      const { data: vehicles, error: vehicleError } = await supabase
        .from('vehicles')
        .select('*');
      if (vehicleError) throw vehicleError;

      // Fetch bookings with vehicle information
      const { data: bookings, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          *,
          vehicles (
            make,
            model,
            year
          )
        `)
        .order('created_at', { ascending: false });
      if (bookingError) throw bookingError;

      // Calculate metrics
      const activeBookings = bookings?.filter(b => 
        b.status === 'confirmed' || b.status === 'pending'
      ).length || 0;

      const todayBookings = bookings?.filter(b => {
        const createdDate = new Date(b.created_at).toISOString().split('T')[0];
        return createdDate === todayStr;
      }).length || 0;

      const monthlyRevenue = bookings
        ?.filter(b => {
          if (b.status !== 'completed') return false;
          if (!b.total_price || parseFloat(b.total_price) <= 0) return false;
          if (!b.updated_at) return false;
          
          try {
            const completedDate = new Date(b.updated_at);
            return completedDate >= startOfMonth && completedDate <= endOfMonth;
          } catch (error) {
            console.error('Error parsing completion date for booking:', b.id, error);
            return false;
          }
        })
        .reduce((sum, b) => {
          const price = parseFloat(b.total_price) || 0;
          return sum + price;
        }, 0) || 0;

      const pendingBookings = bookings?.filter(b => b.status === 'pending').length || 0;
      const completedBookings = bookings?.filter(b => b.status === 'completed').length || 0;

      const currentlyRentedVehicleIds = new Set(
        bookings?.filter(b => {
          const today = new Date();
          const startDate = new Date(b.rental_start_date);
          const endDate = new Date(b.rental_end_date);
          return (
            (b.status === 'confirmed' || b.status === 'pending') &&
            startDate <= today && 
            endDate >= today
          );
        }).map(b => b.vehicle_id) || []
      );
      
      const availableVehicles = vehicles?.filter(v => 
        !currentlyRentedVehicleIds.has(v.id)
      ).length || 0;

      const recentBookings = bookings?.slice(0, 5) || [];

      setDashboardData({
        totalVehicles: vehicles?.length || 0,
        availableVehicles,
        activeBookings,
        todayBookings,
        monthlyRevenue,
        pendingBookings,
        completedBookings,
        recentBookings
      });

      // Generate notifications
      await generateNotifications(bookings || []);

    } catch (err) {
      console.error('Dashboard fetch error:', err);
      Alert.alert('Error', 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserId) {
      fetchDashboardData();
    }
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;

    const vehiclesSub = supabase
      .channel('dashboard-vehicles-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'vehicles' 
      }, fetchDashboardData)
      .subscribe();

    const bookingsSub = supabase
      .channel('dashboard-bookings-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'bookings' 
      }, (payload) => {
        const { eventType, new: newBooking, old: oldBooking } = payload;

        if (eventType === 'INSERT') {
          // Create notification for new booking
          createNotification({
            bookingId: newBooking.id,
            type: 'new_booking',
            title: 'New Booking Added',
            message: `${newBooking.customer_name} booked a vehicle`
          });
        }

        if (eventType === 'UPDATE' && oldBooking.status !== newBooking.status) {
          // Create notification for status change
          createNotification({
            bookingId: newBooking.id,
            type: 'status_change',
            title: `Booking ${newBooking.status}`,
            message: `${newBooking.customer_name}'s booking is now ${newBooking.status}`
          });
        }

        fetchDashboardData();
      })
      .subscribe();

    const notificationsSub = supabase
      .channel('dashboard-notifications-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${currentUserId}`
      }, fetchNotifications)
      .subscribe();

    return () => {
      supabase.removeChannel(vehiclesSub);
      supabase.removeChannel(bookingsSub);
      supabase.removeChannel(notificationsSub);
    };
  }, [currentUserId]);

  const handleLogout = async () => {
    setActionModalConfig({
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      onConfirm: async () => {
        try {
          await supabase.auth.signOut();
        } catch (error) {
          console.error('Logout error:', error);
          setFeedbackModal({ 
            visible: true, 
            type: "error", 
            message: "Failed to logout. Please try again." 
          });
        }
      }
    });
  };

  const handleMarkNotificationRead = async (notificationId) => {
    try {
      // Update local state immediately for responsiveness
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );

      // Update in database
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', currentUserId);

      if (error) {
        console.error('Error updating notification:', error);
        // Revert local state if database update fails
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === notificationId ? { ...notif, read: false } : notif
          )
        );
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };
  const handleClearAll = async () => {
    setActionModalConfig({
      title: 'Clear All Notifications',
      message: 'Are you sure you want to clear all notifications? This action cannot be undone.',
      onConfirm: async () => {
        try {
          // Clear from local state immediately
          setNotifications([]);
  
          // Mark all as dismissed in database
          const { error } = await supabase
            .from('notifications')
            .update({ dismissed: true })
            .eq('user_id', currentUserId)
            .eq('dismissed', false);
  
          if (error) {
            console.error('Error clearing all notifications:', error);
            // Fetch fresh data if update fails
            fetchNotifications();
          } else {
            // Show success feedback
            setFeedbackModal({ 
              visible: true, 
              type: "success", 
              message: "All notifications cleared successfully!" 
            });
          }
        } catch (err) {
          console.error('Error clearing all notifications:', err);
          setFeedbackModal({ 
            visible: true, 
            type: "error", 
            message: "Failed to clear notifications. Please try again." 
          });
        }
      }
    });
  };

  const handleMarkAllRead = async () => {
    try {
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));

      // Update database
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', currentUserId)
        .eq('read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        // Fetch fresh data if update fails
        fetchNotifications();
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const handleRemoveNotification = async (notificationId) => {
    try {
      // Remove from local state immediately
      setNotifications(prev => 
        prev.filter(notif => notif.id !== notificationId)
      );
  
      // Mark as dismissed in database (don't delete to preserve history)
      const { error } = await supabase
        .from('notifications')
        .update({ dismissed: true })
        .eq('id', notificationId)
        .eq('user_id', currentUserId);
  
      if (error) {
        console.error('Error dismissing notification:', error);
        // Fetch fresh data if update fails
        fetchNotifications();
      } else {
        // Show success feedback
        setFeedbackModal({ 
          visible: true, 
          type: "success", 
          message: "Notification removed successfully!" 
        });
      }
    } catch (err) {
      console.error('Error removing notification:', err);
    }
  };

  const formatCurrency = (amount) => {
    return `₱${parseFloat(amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'confirmed':
        return '#10b981';
      case 'completed':
        return '#3b82f6';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const StatCard = ({ title, value, icon, color, onPress }) => (
    <TouchableOpacity
      style={styles.statCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.statContent}>
        <Ionicons name={icon} size={28} color={color} style={styles.statIcon} />
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </TouchableOpacity>
  );

  const QuickActionCard = ({ title, description, icon, color, onPress }) => (
    <TouchableOpacity
      style={styles.actionCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.actionIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={20} color="#fff" />
      </View>
      <View style={styles.actionContent}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSubtitle}>Welcome back!</Text>
        </View>
        <View style={styles.headerActions}>
          <NotificationBell
            notifications={notifications}
            onPress={() => setShowNotifications(true)}
          />
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={28} color="#222" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchDashboardData} />
        }
        contentContainerStyle={styles.scrollContainer}
      >
        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <StatCard
            title="Total Vehicles"
            value={dashboardData.totalVehicles}
            icon="car"
            color="#4CAF50"
            onPress={() => navigation?.navigate?.('Vehicles')}
          />
          <StatCard
            title="Available"
            value={dashboardData.availableVehicles}
            icon="checkmark-circle"
            color="#2196F3"
            onPress={() => navigation?.navigate?.('Vehicles')}
          />
          <StatCard
            title="Active Rentals"
            value={dashboardData.activeBookings}
            icon="time"
            color="#FF9800"
            onPress={() => navigation?.navigate?.('Bookings')}
          />
          <StatCard
            title="Today's Bookings"
            value={dashboardData.todayBookings}
            icon="calendar"
            color="#9C27B0"
            onPress={() => navigation?.navigate?.('Bookings')}
          />
        </View>

        {/* Revenue Card */}
        <View style={styles.revenueCard}>
          <View style={styles.revenueHeader}>
            <Text style={styles.sectionTitle}>Monthly Revenue</Text>
          </View>
          <View style={styles.revenueContent}>
            <View>
              <Text style={styles.revenueValue}>
                {formatCurrency(dashboardData.monthlyRevenue)}
              </Text>
              <Text style={styles.revenueSubtext}>
                {new Date().toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })}
              </Text>
            </View>
            <View style={styles.revenueIconContainer}>
              <Ionicons name="trending-up" size={32} color="#4CAF50" />
            </View>
          </View>
        </View>

        {/* Booking Status Overview */}
        <View style={styles.statusOverviewCard}>
          <Text style={styles.sectionTitle}>Booking Status Overview</Text>
          <View style={styles.statusGrid}>
            <View style={styles.statusItem}>
              <View style={[styles.statusIndicator, { backgroundColor: '#f59e0b' }]} />
              <View>
                <Text style={styles.statusValue}>{dashboardData.pendingBookings}</Text>
                <Text style={styles.statusLabel}>Pending</Text>
              </View>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusIndicator, { backgroundColor: '#059669' }]} />
              <View>
                <Text style={styles.statusValue}>{dashboardData.completedBookings}</Text>
                <Text style={styles.statusLabel}>Completed</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          <View style={styles.actionsGrid}>
            <QuickActionCard
              title="Add Vehicle"
              description="Add new vehicle to fleet"
              icon="add-circle"
              color="#FF6B35"
              onPress={() => navigation?.navigate?.('Vehicles', { screen: 'AddVehicle' })}
            />
            <QuickActionCard
              title="View Calendar"
              description="Check rental schedule"
              icon="calendar"
              color="#2196F3"
              onPress={() => navigation?.navigate?.('Calendar')}
            />
            <QuickActionCard
              title="Analytics"
              description="View booking analytics"
              icon="analytics"
              color="#9C27B0"
              onPress={() => navigation?.navigate?.('Reports')}
            />
            <QuickActionCard
              title="New Booking"
              description="Create new rental booking"
              icon="add"
              color="#4CAF50"
              onPress={() => navigation?.navigate?.('Bookings', { screen: 'AddBooking' })}
            />
          </View>
        </View>

        {/* Recent Bookings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Bookings</Text>
            <TouchableOpacity onPress={() => navigation?.navigate?.('Bookings')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {dashboardData.recentBookings.length > 0 ? (
            dashboardData.recentBookings.map((booking) => (
              <View key={booking.id} style={styles.bookingItem}>
                <View style={styles.bookingLeft}>
                  <View
                    style={[
                      styles.bookingStatus,
                      { backgroundColor: getStatusColor(booking.status) }
                    ]}
                  />
                  <View style={styles.bookingInfo}>
                    <Text style={styles.bookingCustomer}>{booking.customer_name}</Text>
                    <Text style={styles.bookingVehicle}>
                      {booking.vehicles ? `${booking.vehicles.year} ${booking.vehicles.make} ${booking.vehicles.model}` : 'Vehicle Info'}
                    </Text>
                    <Text style={styles.bookingDate}>
                      {formatDate(booking.rental_start_date)} - {formatDate(booking.rental_end_date)}
                    </Text>
                  </View>
                </View>
                <View style={styles.bookingRight}>
                  <Text style={styles.bookingAmount}>
                    {formatCurrency(booking.total_price)}
                  </Text>
                  <Text
                    style={[
                      styles.bookingStatusText,
                      { color: getStatusColor(booking.status) }
                    ]}
                  >
                    {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyStateText}>No recent bookings</Text>
              <Text style={styles.emptyStateSubtext}>
                New bookings will appear here
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Notifications Modal */}
      <NotificationsModal
        visible={showNotifications}
        notifications={notifications}
        onClose={() => setShowNotifications(false)}
        onMarkRead={handleMarkNotificationRead}
        onMarkAllRead={handleMarkAllRead}
        onClearAll={handleClearAll} 
        onRemove={handleRemoveNotification}
        setActionModalConfig={setActionModalConfig}
      />

      {/* Action Modal */}
      {actionModalConfig && (
        <ActionModal
          visible={!!actionModalConfig}
          type="confirm"
          title={actionModalConfig.title}
          message={actionModalConfig.message}
          onClose={() => setActionModalConfig(null)}
          onConfirm={() => {
            actionModalConfig.onConfirm();
            setActionModalConfig(null);
          }}
        />
      )}

      {/* Feedback Modal */}
      <ActionModal
        visible={feedbackModal.visible}
        type={feedbackModal.type}
        title={feedbackModal.type === "success" ? "Success" : "Error"}
        message={feedbackModal.message}
        confirmText="OK"
        onClose={() => setFeedbackModal({ visible: false, type: "success", message: "" })}
        onConfirm={() => setFeedbackModal({ visible: false, type: "success", message: "" })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: 'white', 
    paddingHorizontal: 18, 
    paddingTop: 8 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 24, 
    marginTop: 8 
  },
  headerLeft: { 
    flex: 1 
  },
  headerTitle: { 
    fontSize: 28, 
    fontWeight: '800', 
    letterSpacing: -0.5 
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationBell: {
    position: 'relative',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  logoutButton: { 
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  markAllReadButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
  },
  markAllReadText: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '500',
  },
  closeButton: {
    padding: 4,
  },
  notificationsList: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  notificationWrapper: {
    marginBottom: 12,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    position: 'relative',
  },
  unreadNotification: {
    backgroundColor: '#fff7ed',
    borderColor: '#fed7aa',
  },
  notificationItemActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B35',
    position: 'absolute',
    top: 16,
    right: 16,
  },
  notificationMenuButton: {
    padding: 8,
    borderRadius: 6,
  },
  notificationActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginTop: 4,
    gap: 8,
  },
  notificationActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
  },
  markReadButton: {
    backgroundColor: '#dcfce7',
  },
  removeButton: {
    backgroundColor: '#fee2e2',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  notificationActionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyNotifications: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyNotificationsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 12,
  },
  emptyNotificationsSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  scrollView: { 
    flex: 1 
  },
  scrollContainer: { 
    paddingBottom: Platform.OS === 'ios' ? 100 : 80 
  },
  statsContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 16, 
    marginBottom: 24,
  },
  statCard: { 
    backgroundColor: 'white', 
    borderRadius: 16, 
    padding: 16, 
    width: '47%', 
    borderWidth: 1, 
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    alignItems: 'center' 
  },
  statContent: { 
    alignItems: 'center' 
  },
  statIcon: { 
    marginBottom: 8 
  },
  statValue: { 
    fontSize: 28, 
    fontWeight: '800', 
    marginBottom: 4 
  },
  statTitle: { 
    color: '#374151', 
    fontSize: 12, 
    fontWeight: '500',
    textAlign: 'center',
  },
  revenueCard: { 
    backgroundColor: 'white', 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 24, 
    borderWidth: 1, 
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  revenueHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 16 
  },
  revenueContent: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  revenueValue: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#4CAF50', 
    marginBottom: 4 
  },
  revenueSubtext: { 
    fontSize: 14, 
    color: '#9ca3af', 
    fontWeight: '500' 
  },
  revenueIconContainer: { 
    backgroundColor: '#4CAF5020', 
    padding: 12, 
    borderRadius: 12 
  },
  statusOverviewCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusGrid: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },
  statusItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    gap: 12,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  statusLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  section: { 
    backgroundColor: 'white', 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 24, 
    borderWidth: 1, 
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 16 
  },
  sectionTitle: { 
    fontWeight: '800', 
    fontSize: 18, 
    letterSpacing: -0.5 
  },
  viewAllText: { 
    fontSize: 14, 
    color: '#FF6B35', 
    fontWeight: '600' 
  },
  actionsGrid: { 
    gap: 12 
  },
  actionCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f9fafb', 
    padding: 12, 
    borderRadius: 8, 
    marginBottom: 8, 
    borderWidth: 1, 
    borderColor: '#e5e7eb' 
  },
  actionIcon: { 
    width: 40, 
    height: 40, 
    borderRadius: 8, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 12 
  },
  actionContent: { 
    flex: 1 
  },
  actionTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#333', 
    marginBottom: 2 
  },
  actionDescription: { 
    fontSize: 12, 
    color: '#6b7280' 
  },
  bookingItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12, 
    backgroundColor: '#f9fafb', 
    borderRadius: 8, 
    padding: 12, 
    borderWidth: 1, 
    borderColor: '#e5e7eb' 
  },
  bookingLeft: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    flex: 1 
  },
  bookingStatus: { 
    width: 4, 
    height: 48, 
    borderRadius: 8, 
    marginRight: 12 
  },
  bookingInfo: { 
    flex: 1 
  },
  bookingCustomer: { 
    fontWeight: 'bold', 
    fontSize: 16, 
    marginBottom: 2,
    color: '#111827',
  },
  bookingVehicle: { 
    fontSize: 14, 
    color: '#6b7280',
    marginBottom: 2,
  },
  bookingDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  bookingRight: {
    alignItems: 'flex-end',
  },
  bookingAmount: { 
    fontWeight: 'bold', 
    fontSize: 16,
    color: '#111827',
    marginBottom: 2,
  },
  bookingStatusText: { 
    fontSize: 12, 
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  emptyState: { 
    alignItems: 'center', 
    paddingVertical: 40 
  },
  emptyStateText: { 
    color: '#6b7280', 
    fontWeight: '500',
    fontSize: 16,
    marginTop: 12,
  },
  emptyStateSubtext: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 4,
  },clearAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fee2e2',
    borderRadius: 6,
  },
  clearAllText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '500',
  },
});