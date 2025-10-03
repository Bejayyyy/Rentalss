import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';

export default function OwnerProfileScreen({ navigation, route }) {
  const { ownerId } = route.params;
  const [owner, setOwner] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOwnerData();
  }, [ownerId]);

  const fetchOwnerData = async () => {
    try {
      // Fetch owner details
      const { data: ownerData, error: ownerError } = await supabase
        .from('car_owners')
        .select('*')
        .eq('id', ownerId)
        .single();

      if (ownerError) throw ownerError;

      // Fetch owner's vehicles
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('owner_id', ownerId);

      if (vehiclesError) throw vehiclesError;

      // Fetch bookings for owner's vehicles
      const vehicleIds = vehiclesData?.map(v => v.id) || [];
      let allBookings = [];

      if (vehicleIds.length > 0) {
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select(`
            *,
            vehicles (
              make,
              model,
              year
            )
          `)
          .in('vehicle_id', vehicleIds)
          .order('created_at', { ascending: false });

        if (!bookingsError) {
          allBookings = bookingsData || [];
        }
      }

      // Calculate vehicle earnings
      const vehiclesWithEarnings = vehiclesData?.map(vehicle => {
        const vehicleBookings = allBookings.filter(b => b.vehicle_id === vehicle.id);
        const totalEarned = vehicleBookings
          .filter(b => b.status === 'completed')
          .reduce((sum, b) => sum + parseFloat(b.total_price || 0), 0);

        return {
          ...vehicle,
          totalEarned,
          bookingsCount: vehicleBookings.length
        };
      }) || [];

      // Calculate stats
      const totalEarnings = allBookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + parseFloat(b.total_price || 0), 0);

      const pendingPayments = allBookings
        .filter(b => b.status === 'confirmed')
        .reduce((sum, b) => sum + parseFloat(b.total_price || 0), 0);

      const activeBookings = allBookings.filter(b => b.status === 'confirmed').length;

      setOwner({
        ...ownerData,
        totalEarnings,
        pendingPayments,
        activeBookings
      });
      setVehicles(vehiclesWithEarnings);
      setBookings(allBookings);
    } catch (error) {
      console.error('Error fetching owner data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOwnerData();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric"
    });
  };

  if (loading || !owner) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Owner Profile</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>{owner.name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.ownerName}>{owner.name}</Text>
          <Text style={styles.ownerEmail}>{owner.email}</Text>
          
          <View style={[styles.statusBadge, { 
            backgroundColor: owner.status === 'active' ? '#10b981' : '#6b7280',
            alignSelf: 'center',
            marginTop: 12
          }]}>
            <Text style={styles.statusText}>{owner.status}</Text>
          </View>

          <View style={styles.profileInfo}>
            <View style={styles.profileInfoRow}>
              <Text style={styles.profileInfoLabel}>Phone:</Text>
              <Text style={styles.profileInfoValue}>{owner.phone}</Text>
            </View>
            <View style={styles.profileInfoRow}>
              <Text style={styles.profileInfoLabel}>Joined:</Text>
              <Text style={styles.profileInfoValue}>{formatDate(owner.created_at)}</Text>
            </View>
            <View style={styles.profileInfoRow}>
              <Text style={styles.profileInfoLabel}>Vehicles:</Text>
              <Text style={styles.profileInfoValue}>{vehicles.length}</Text>
            </View>
            <View style={styles.profileInfoRow}>
              <Text style={styles.profileInfoLabel}>Active Bookings:</Text>
              <Text style={styles.profileInfoValue}>{owner.activeBookings}</Text>
            </View>
          </View>
        </View>

        {/* Earnings Cards */}
        <View style={styles.earningsContainer}>
          <View style={styles.earningCard}>
            <View style={styles.earningIconContainer}>
              <Ionicons name="cash" size={24} color="#222" />
            </View>
            <Text style={[styles.earningAmount, { color: '#222' }]}>
              ₱{owner.totalEarnings.toLocaleString()}
            </Text>
            <Text style={styles.earningLabel}>Total Earnings</Text>
          </View>

          <View style={styles.earningCard}>
            <View style={styles.earningIconContainer}>
              <Ionicons name="calendar" size={24} color="#222" />
            </View>
            <Text style={[styles.earningAmount, { color: '#222' }]}>
              ₱{owner.pendingPayments.toLocaleString()}
            </Text>
            <Text style={styles.earningLabel}>Pending Payments</Text>
          </View>
        </View>

        {/* Vehicle Earnings Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Earnings Breakdown</Text>
          <Text style={styles.sectionSubtitle}>Revenue generated by each vehicle</Text>

          {vehicles.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="car-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyStateText}>No vehicles found</Text>
            </View>
          ) : (
            vehicles.map(vehicle => (
              <View key={vehicle.id} style={styles.vehicleEarningCard}>
                <View style={styles.vehicleEarningIcon}>
                  <Ionicons name="car" size={24} color="#6b7280" />
                </View>
                <View style={styles.vehicleEarningInfo}>
                  <Text style={styles.vehicleEarningName}>
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </Text>
                  <Text style={styles.vehicleEarningId}>Vehicle ID: {vehicle.id}</Text>
                </View>
                <View style={styles.vehicleEarningAmount}>
                  <Text style={[styles.earningAmount, { color: '#10b981', fontSize: 18 }]}>
                    ₱{vehicle.totalEarned.toLocaleString()}
                  </Text>
                  <Text style={styles.earningLabel}>Total earned</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Recent Bookings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Bookings</Text>
          <Text style={styles.sectionSubtitle}>Latest bookings for this owner's vehicles</Text>

          {bookings.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyStateText}>No bookings found</Text>
            </View>
          ) : (
            bookings.slice(0, 5).map(booking => (
              <View key={booking.id} style={styles.bookingCard}>
                <View style={styles.bookingHeader}>
                  <Text style={styles.bookingCustomer}>{booking.customer_name}</Text>
                  <View style={[styles.bookingStatusBadge, { 
                    backgroundColor: getStatusColor(booking.status) + '20' 
                  }]}>
                    <Text style={[styles.bookingStatusText, { 
                      color: getStatusColor(booking.status) 
                    }]}>
                      {booking.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.bookingVehicle}>
                  {booking.vehicles?.year} {booking.vehicles?.make} {booking.vehicles?.model}
                </Text>
                <View style={styles.bookingFooter}>
                  <Text style={styles.bookingDate}>{formatDate(booking.created_at)}</Text>
                  <Text style={styles.bookingAmount}>₱{parseFloat(booking.total_price).toLocaleString()}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStatusColor = (status) => {
  switch (status) {
    case 'confirmed':
      return '#10b981';
    case 'pending':
      return '#f59e0b';
    case 'completed':
      return '#3b82f6';
    case 'cancelled':
      return '#ef4444';
    case 'declined':
      return '#dc2626';
    default:
      return '#6b7280';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fcfcfc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,

  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backText: {
    fontSize: 16,
    color: '#222',
    marginLeft: 8,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  profileCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarLargeText: {
    fontSize: 32,
    fontWeight: '600',
    color: 'white',
  },
  ownerName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  ownerEmail: {
    fontSize: 16,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    textTransform: 'capitalize',
  },
  profileInfo: {
    width: '100%',
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  profileInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  profileInfoLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  profileInfoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  earningsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  earningCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  earningIconContainer: {
    marginBottom: 12,
  },
  earningAmount: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  earningLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  vehicleEarningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  vehicleEarningIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  vehicleEarningInfo: {
    flex: 1,
  },
  vehicleEarningName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  vehicleEarningId: {
    fontSize: 12,
    color: '#6b7280',
  },
  vehicleEarningAmount: {
    alignItems: 'flex-end',
  },
  bookingCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingCustomer: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  bookingStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bookingStatusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  bookingVehicle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingDate: {
    fontSize: 13,
    color: '#6b7280',
  },
  bookingAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10b981',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 12,
  },
});