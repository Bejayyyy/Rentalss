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
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

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

  // Fixed fetchDashboardData function - Monthly revenue based on when bookings were completed

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

    // FIXED: Monthly revenue calculation based on completion date
    // Revenue is counted when booking status was changed to 'completed' within current month
    const monthlyRevenue = bookings
      ?.filter(b => {
        // Must be completed status
        if (b.status !== 'completed') {
          return false;
        }
        
        // Must have total_price
        if (!b.total_price || parseFloat(b.total_price) <= 0) {
          return false;
        }
        
        // Must have updated_at timestamp
        if (!b.updated_at) {
          return false;
        }
        
        try {
          const completedDate = new Date(b.updated_at);
          // Check if the booking was completed within the current month
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

    // Calculate available vehicles (vehicles not currently rented)
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

    // Debug log for troubleshooting
    console.log('Monthly Revenue Debug:', {
      startOfMonth: startOfMonth.toISOString(),
      endOfMonth: endOfMonth.toISOString(),
      completedBookingsThisMonth: bookings?.filter(b => {
        if (b.status !== 'completed' || !b.updated_at) return false;
        const completedDate = new Date(b.updated_at);
        return completedDate >= startOfMonth && completedDate <= endOfMonth;
      }).length,
      monthlyRevenue: monthlyRevenue
    });

  } catch (err) {
    console.error('Dashboard fetch error:', err);
    Alert.alert('Error', 'Failed to fetch dashboard data');
  } finally {
    setLoading(false);
  }
};
  useEffect(() => {
    fetchDashboardData();

    // Set up real-time subscriptions
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
      }, fetchDashboardData)
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
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={28} color="#222" />
        </TouchableOpacity>
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
  logoutButton: { 
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
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
    marginBottom: 24 
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