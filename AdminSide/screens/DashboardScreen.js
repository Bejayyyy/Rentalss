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
const NotificationItem = ({ notification, onMarkRead, onRemove }) => {
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
    Alert.alert(
      'Remove Notification',
      'Are you sure you want to remove this notification?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setShowActions(false),
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            onRemove(notification.id);
            setShowActions(false);
          },
        },
      ]
    );
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
const NotificationsModal = ({ visible, notifications, onClose, onMarkRead, onMarkAllRead, onRemove }) => {
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
  const [dismissedNotifications, setDismissedNotifications] = useState(new Set());
  const [showNotifications, setShowNotifications] = useState(false);

  // Generate notifications based on booking data, respecting user actions
  const generateNotifications = (bookings, existingNotifications, dismissed) => {
    const newNotifs = [];
    const today = new Date();
    
    // Create a map of existing notifications for quick lookup
    const existingMap = new Map(existingNotifications.map(n => [n.id, n]));
    
    bookings.forEach(booking => {
      
      const startDate = new Date(booking.rental_start_date);
      const endDate = new Date(booking.rental_end_date);
      const timeDiff = startDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      const endTimeDiff = endDate.getTime() - today.getTime();
      const endDaysDiff = Math.ceil(endTimeDiff / (1000 * 3600 * 24));

      const notificationConfigs = [];

      // Pickup notifications
      if (daysDiff === 0) {
        notificationConfigs.push({
          id: `pickup-today-${booking.id}`,
          type: 'pickup_today',
          title: 'Vehicle pickup today!',
          message: `${booking.customer_name} is picking up ${booking.vehicles?.year} ${booking.vehicles?.make} ${booking.vehicles?.model} today`,
          timeAgo: 'Today',
          priority: 'high'
        });
      } else if (daysDiff > 1 && daysDiff <= 3) {
        notificationConfigs.push({
          id: `pickup-upcoming-${booking.id}`,
          type: 'upcoming_pickup',
          title: `Vehicle pickup in ${daysDiff} days`,
          message: `${booking.customer_name} will pick up ${booking.vehicles?.year} ${booking.vehicles?.make} ${booking.vehicles?.model}`,
          timeAgo: `${daysDiff} days`,
          priority: 'low'
        });
      }

      // Always check status
        if (booking.status === 'pending') {
          notificationConfigs.push({
            id: `pending-${booking.id}`,
            type: 'new_booking',
            title: 'New Booking Request',
            message: `${booking.customer_name} requested ${booking.vehicles?.year} ${booking.vehicles?.make} ${booking.vehicles?.model}`,
            timeAgo: 'Just now',
            priority: 'high'
          });
        } else if (booking.status === 'confirmed') {
            if (daysDiff === 1) {
            notificationConfigs.push({
              id: `pickup-tomorrow-${booking.id}`,
              type: 'upcoming_pickup',
              title: 'Vehicle pickup tomorrow',
              message: `${booking.customer_name} will pick up ${booking.vehicles?.year} ${booking.vehicles?.make} ${booking.vehicles?.model} tomorrow`,
              timeAgo: 'Tomorrow',
              priority: 'medium'
            });
          }
          notificationConfigs.push({
            id: `confirmed-${booking.id}`,
            type: 'booking_confirmed',
            title: 'Booking Confirmed',
            message: `${booking.customer_name}'s booking for ${booking.vehicles?.year} ${booking.vehicles?.make} ${booking.vehicles?.model} is now confirmed`,
            timeAgo: 'Just now',
            priority: 'high'
          });
        }
        else if (booking.status === 'completed') {
          notificationConfigs.push({
            id: `completed-${booking.id}`,
            type: 'booking_completed',
            title: 'Booking completed',
            message: `${booking.customer_name}'s booking for ${booking.vehicles?.year} ${booking.vehicles?.make} ${booking.vehicles?.model} is now completed`,
            timeAgo: 'Just now',
            priority: 'high'
          });
        }
      // Return notifications
      if (endDaysDiff === 0) {
        notificationConfigs.push({
          id: `return-today-${booking.id}`,
          type: 'return_today',
          title: 'Vehicle return due today!',
          message: `${booking.customer_name} should return ${booking.vehicles?.year} ${booking.vehicles?.make} ${booking.vehicles?.model} today`,
          timeAgo: 'Today',
          priority: 'high'
        });
      } else if (endDaysDiff === 1) {
        notificationConfigs.push({
          id: `return-tomorrow-${booking.id}`,
          type: 'due_return',
          title: 'Vehicle return due tomorrow',
          message: `${booking.customer_name} should return ${booking.vehicles?.year} ${booking.vehicles?.make} ${booking.vehicles?.model} tomorrow`,
          timeAgo: 'Tomorrow',
          priority: 'medium'
        });
      } else if (endDaysDiff < 0) {
        const overdueDays = Math.abs(endDaysDiff);
        notificationConfigs.push({
          id: `overdue-${booking.id}`,
          type: 'overdue',
          title: 'Vehicle overdue!',
          message: `${booking.customer_name} is ${overdueDays} day${overdueDays > 1 ? 's' : ''} overdue returning ${booking.vehicles?.year} ${booking.vehicles?.make} ${booking.vehicles?.model}`,
          timeAgo: `${overdueDays} days overdue`,
          priority: 'critical'
        });
      } else if (endDaysDiff > 1 && endDaysDiff <= 3) {
        notificationConfigs.push({
          id: `return-upcoming-${booking.id}`,
          type: 'due_return',
          title: `Vehicle return in ${endDaysDiff} days`,
          message: `${booking.customer_name} should return ${booking.vehicles?.year} ${booking.vehicles?.make} ${booking.vehicles?.model}`,
          timeAgo: `${endDaysDiff} days`,
          priority: 'low'
        });
      }

      // Process each notification config
      notificationConfigs.forEach(config => {
        // Skip if this notification was dismissed
        if (dismissed.has(config.id)) return;

        // If notification already exists, preserve its read status
        const existing = existingMap.get(config.id);
        if (existing) {
          newNotifs.push({
            ...config,
            read: existing.read,
            bookingId: booking.id
          });
        } else {
          // New notification, mark as unread
          newNotifs.push({
            ...config,
            read: false,
            bookingId: booking.id,
            createdAt: new Date(booking.created_at).getTime()
          });
        }
      });
    });

      // Sort by priority, then newest first
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return newNotifs.sort((a, b) => {
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.createdAt - a.createdAt; // 🔹 newest first
    });
    

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

      // Generate notifications with state preservation
      const newNotifications = generateNotifications(bookings || [], notifications, dismissedNotifications);
      setNotifications(newNotifications);

    } catch (err) {
      console.error('Dashboard fetch error:', err);
      Alert.alert('Error', 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, (payload) => {
        const { eventType, new: newBooking, old: oldBooking } = payload;
    
        if (eventType === 'INSERT') {
          // New booking notification
          setNotifications(prev => [
            {
              id: `new-${newBooking.id}`,
              type: 'new_booking',
              title: 'New Booking Added',
              message: `${newBooking.customer_name} booked a vehicle`,
              timeAgo: 'Just now',
              priority: 'high',
              read: false,
              bookingId: newBooking.id
            },
            ...prev
          ]);
        }
    
        if (eventType === 'UPDATE' && oldBooking.status !== newBooking.status) {
          // Status change notification
          setNotifications(prev => [
            {
              id: `status-${newBooking.id}-${newBooking.status}`,
              type: 'status_change',
              title: `Booking ${newBooking.status}`,
              message: `${newBooking.customer_name}'s booking is now ${newBooking.status}`,
              timeAgo: 'Just now',
              priority: 'high',
              read: false,
              bookingId: newBooking.id
            },
            ...prev
          ]);
        }
    
        fetchDashboardData(); // still refresh stats & reminders
      })
      .subscribe();
    

    return () => {
      supabase.removeChannel(vehiclesSub);
      supabase.removeChannel(bookingsSub);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout');
    }
  };

  const handleMarkNotificationRead = async (notificationId) => {
    // Update local state
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  
    // Persist in Supabase
    const { error } = await supabase
      .from("notifications")
      .upsert({ id: notificationId, read: true });
    
    if (error) console.error("Error updating notification:", error);
  };
  

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    const { error } = await supabase.from("notifications").update({ read: true }).neq("read", true);
    if (error) console.error("Error marking all as read:", error);
  };
  

  const handleRemoveNotification = (notificationId) => {
    // Add to dismissed set to prevent it from coming back
    setDismissedNotifications(prev => new Set([...prev, notificationId]));
    // Remove from current notifications
    setNotifications(prev => 
      prev.filter(notif => notif.id !== notificationId)
    );
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
        onRemove={handleRemoveNotification}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: 'white', 
    paddingHorizontal: 16, 
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
  },
});