import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';

import { supabase } from '../services/supabase';
import BookingOverviewChart from '../components/BookingOverviewChart';

export default function BookingsAnalyticsScreen() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    averageBookingValue: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
  });
  const [timeFilter, setTimeFilter] = useState('weekly'); // monthly, weekly, today

  useEffect(() => {
    fetchBookingsData();
  }, [timeFilter]);

  const getDateFilter = () => {
    const now = new Date();
    let startDate;

    switch (timeFilter) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    return startDate.toISOString();
  };

  const fetchBookingsData = async () => {
    try {
      setLoading(true);
      const startDate = getDateFilter();

      // Fetch bookings with vehicle information
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          vehicles (
            make,
            model,
            year,
            image_url
          )
        `)
        .gte('created_at', startDate)
        .order('created_at', { ascending: false });

      if (bookingsError) {
        throw bookingsError;
      }

      setBookings(bookingsData || []);

      // Calculate statistics
      const totalBookings = bookingsData?.length || 0;
      // ✅ Only completed bookings count towards revenue
      const totalRevenue =bookingsData?.filter((b) => b.status === "completed")
          .reduce((sum, booking) => sum + parseFloat(booking.total_price || 0), 0) || 0;     
      const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
        

      const statusCounts =
      bookingsData?.reduce((acc, booking) => {
        acc[booking.status] = (acc[booking.status] || 0) + 1;
        return acc;
      }, {}) || {};

      setStats({
        totalBookings,
        totalRevenue,
        averageBookingValue,
        pendingBookings: statusCounts.pending || 0,
        confirmedBookings: statusCounts.confirmed || 0,
        completedBookings: statusCounts.completed || 0,
        cancelledBookings: statusCounts.cancelled || 0,
      });

    } catch (error) {
      console.error('Error fetching bookings:', error);
      Alert.alert('Error', 'Failed to fetch bookings data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Ionicons name="time-outline" size={16} color="#f59e0b" />;
      case 'confirmed':
        return <Ionicons name="checkmark-circle-outline" size={16} color="#10b981" />;
      case 'completed':
        return <Ionicons name="checkmark-done-circle-outline" size={16} color="#3b82f6" />;
      case 'cancelled':
        return <Ionicons name="close-circle-outline" size={16} color="#ef4444" />;
      default:
        return <Ionicons name="help-circle-outline" size={16} color="#6b7280" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'confirmed':
        return '#10b981';
      case 'completed':
        return '#059669';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const FilterButton = ({ label, isActive, onPress }) => (
    <Text
      style={[styles.filterButton, isActive && styles.filterButtonActive]}
      onPress={onPress}
    >
      {label}
    </Text>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading bookings data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Bookings Analytics</Text>
              
            </View>

            {/* Stats Cards */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Ionicons name="car-outline" size={28} color="#222" style={styles.statIcon} />
                <Text style={styles.statValue}>{stats.totalBookings}</Text>
                <Text style={styles.statLabel}>Total Bookings</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="trending-up" size={28} color="#222" style={styles.statIcon} />
                <Text style={styles.statValue}>{formatCurrency(stats.totalRevenue)}</Text>
                <Text style={styles.statLabel}>Total Revenue</Text>
              </View>
            </View>

            {/* Additional Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Ionicons name="cash-outline" size={28} color="#222" style={styles.statIcon} />
                <Text style={styles.statValue}>{formatCurrency(stats.averageBookingValue)}</Text>
                <Text style={styles.statLabel}>Avg Booking Value</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="checkmark-done-outline" size={28} color="#10b981" style={styles.statIcon} />
                <Text style={styles.statValue}>{stats.completedBookings}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
            </View>

            {/*Booking Overview */}
            <BookingOverviewChart/>

           
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.bookingItem}>
            {item.vehicles?.image_url ? (
              <Image source={{ uri: item.vehicles.image_url }} style={styles.vehicleImage} />
            ) : (
              <View style={[styles.vehicleImage, styles.placeholderImage]}>
                <Ionicons name="car-outline" size={20} color="#9ca3af" />
              </View>
            )}
            
            <View style={styles.bookingInfo}>
              <Text style={styles.vehicleName}>
                {item.vehicles ? `${item.vehicles.year} ${item.vehicles.make} ${item.vehicles.model}` : 'Vehicle'}
              </Text>
              <Text style={styles.customerName}>{item.customer_name}</Text>
              <Text style={styles.rentalDates}>
                {formatDate(item.rental_start_date)} - {formatDate(item.rental_end_date)}
              </Text>
            </View>
            
            <View style={styles.bookingDetails}>
              <Text style={styles.bookingPrice}>{formatCurrency(parseFloat(item.total_price))}</Text>
              <View style={styles.statusContainer}>
                {getStatusIcon(item.status)}
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No Bookings Found</Text>
            <Text style={styles.emptySubtitle}>
              No bookings found for the selected time period.
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContainer}
        refreshing={loading}
        onRefresh={fetchBookingsData}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    flex: 1,
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
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  statLabel: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  chartContainer: {
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
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '800',
    fontSize: 18,
    letterSpacing: -0.5,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    marginTop: 12,
  },
  filterButton: {
    fontSize: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#f3f4f6',
    fontWeight: '600',
    textAlign: 'center',
  },
  filterButtonActive: {
    fontSize: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'black',
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'flex-end',
  },
  statusItem: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    gap: 8,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusLabel: {
    flex: 1,
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  trendingContainer: {
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
  trendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  bookingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  vehicleImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  placeholderImage: {
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingInfo: {
    flex: 1,
  },
  vehicleName: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 2,
    color: '#111827',
  },
  customerName: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  rentalDates: {
    fontSize: 12,
    color: '#9ca3af',
  },
  bookingDetails: {
    alignItems: 'flex-end',
  },
  bookingPrice: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 4,
    color: '#111827',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
});