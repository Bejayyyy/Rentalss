import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';

export default function CalendarComponent({ 
  showHeader = true,
  headerTitle = "Rental Calendar",
  headerSubtitle = "Tap any date to view bookings",
  showLegend = true,
  containerStyle,
  calendarStyle,
  onDateSelect,
  onBookingSelect
}) {
  const today = new Date().toISOString().split('T')[0];
const [selectedDate, setSelectedDate] = useState(today);
  const [bookings, setBookings] = useState({});
  const [dayBookings, setDayBookings] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('bookings-calendar-channel')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'bookings' 
        }, 
        (payload) => {
          console.log('Booking change:', payload);
          fetchBookings();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      const { data: bookingsData, error } = await supabase
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
        .order('rental_start_date', { ascending: true });

      if (error) {
        console.error('Error fetching bookings:', error);
        Alert.alert('Error', 'Failed to fetch bookings data');
        return;
      }

      const processedBookings = {};
      
      bookingsData?.forEach((booking) => {
        // Use rental_start_date and rental_end_date from your table
        const startDate = booking.rental_start_date;
        const endDate = booking.rental_end_date;
        
        // Mark all dates between rental start and end
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          
          if (!processedBookings[dateStr]) {
            processedBookings[dateStr] = {
              marked: true,
              dotColor: getStatusColor(booking.status),
              bookings: []
            };
          }
          
          processedBookings[dateStr].bookings.push(booking);
          
          // If multiple bookings on same date, show multiple dots
          if (processedBookings[dateStr].bookings.length > 1) {
            processedBookings[dateStr].dots = processedBookings[dateStr].bookings.map(b => ({
              color: getStatusColor(b.status)
            }));
            delete processedBookings[dateStr].dotColor;
          }
        }
      });
      
      setBookings(processedBookings);
    } catch (error) {
      console.error('Error processing bookings:', error);
      Alert.alert('Error', 'An error occurred while processing bookings');
    } finally {
      setLoading(false);
    }
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return 'time-outline';
      case 'confirmed':
        return 'checkmark-circle-outline';
      case 'completed':
        return 'checkmark-done-circle-outline';
      case 'cancelled':
        return 'close-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const onDayPress = (day) => {
    setSelectedDate(day.dateString);
    const dayData = bookings[day.dateString];
    const selectedDayBookings = dayData ? dayData.bookings : [];
    
    setDayBookings(selectedDayBookings);
    setModalVisible(true);
    
    // Call parent callback if provided
    if (onDateSelect) {
      onDateSelect(day.dateString, selectedDayBookings);
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

  // Helper function to format date showing only month name
 // Helper function to format date showing only month and year
const formatDateMonthOnly = (dateString) => {
  const date = new Date(dateString + 'T00:00:00'); // Add time to avoid timezone issues
  return date.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long'
  });
};


  const handleBookingPress = (booking) => {
    if (onBookingSelect) {
      onBookingSelect(booking);
    }
  };

  const renderBookingItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.bookingItem}
      onPress={() => handleBookingPress(item)}
      activeOpacity={onBookingSelect ? 0.7 : 1}
    >
      <View style={styles.bookingHeader}>
        <Text style={styles.customerName}>{item.customer_name}</Text>
        <View style={[styles.statusBadge, { 
          backgroundColor: getStatusColor(item.status)
        }]}>
          <Ionicons 
            name={getStatusIcon(item.status)} 
            size={12} 
            color="white" 
            style={{ marginRight: 4 }}
          />
          <Text style={styles.statusText}>{item.status?.toUpperCase()}</Text>
        </View>
      </View>
      
      <View style={styles.bookingDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="car" size={16} color="#666" />
          <Text style={styles.detailText}>
            {item.vehicles ? `${item.vehicles.year} ${item.vehicles.make} ${item.vehicles.model}` : 'Vehicle Info Unavailable'}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={16} color="#666" />
          <Text style={styles.detailText}>
            {formatDate(item.rental_start_date)} - {formatDate(item.rental_end_date)}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="call" size={16} color="#666" />
          <Text style={styles.detailText}>{item.customer_phone}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="mail" size={16} color="#666" />
          <Text style={styles.detailText}>{item.customer_email}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="cash" size={16} color="#666" />
          <Text style={styles.detailText}>{formatCurrency(item.total_price)}</Text>
        </View>

        {item.pickup_location && (
          <View style={styles.detailRow}>
            <Ionicons name="location" size={16} color="#666" />
            <Text style={styles.detailText}>{item.pickup_location}</Text>
          </View>
        )}

        {item.license_number && (
          <View style={styles.detailRow}>
            <Ionicons name="card" size={16} color="#666" />
            <Text style={styles.detailText}>License: {item.license_number}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, containerStyle]}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading calendar...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, containerStyle]}>
      {showHeader && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{headerTitle}</Text>
          <Text style={styles.headerSubtitle}>{headerSubtitle}</Text>
        </View>
      )}

<Calendar
  onDayPress={onDayPress}
  markedDates={{
    ...bookings,
    [selectedDate]: {
      ...bookings[selectedDate],
      selected: true,
      selectedColor: '#FF6B35'
    }
  }}
  monthFormat={'MMMM yyyy'}   // 👈 Only month + year, no day, no time, no GMT
  theme={{
    backgroundColor: '#ffffff',
    calendarBackground: '#ffffff',
    textSectionTitleColor: '#b6c1cd',
    selectedDayBackgroundColor: '#FF6B35',
    selectedDayTextColor: '#ffffff',
    todayTextColor: '#FF6B35',
    dayTextColor: '#2d4150',
    textDisabledColor: '#d9e1e8',
    dotColor: '#FF6B35',
    selectedDotColor: '#ffffff',
    arrowColor: '#FF6B35',
    disabledArrowColor: '#d9e1e8',
    monthTextColor: '#2d4150',
    indicatorColor: '#FF6B35',
    textDayFontFamily: 'System',
    textMonthFontFamily: 'System',
    textDayHeaderFontFamily: 'System',
    textDayFontWeight: '300',
    textMonthFontWeight: 'bold',
    textDayHeaderFontWeight: '300',
    textDayFontSize: 16,
    textMonthFontSize: 16,
    textDayHeaderFontSize: 13
  }}
  style={[styles.calendar, calendarStyle]}
  showsVerticalScrollIndicator={false}
/>

      {showLegend && (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
            <Text style={styles.legendText}>Pending</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
            <Text style={styles.legendText}>Confirmed</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
            <Text style={styles.legendText}>Completed</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
            <Text style={styles.legendText}>Cancelled</Text>
          </View>
        </View>
      )}

      {/* Day Bookings Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Bookings for {formatDateMonthOnly(selectedDate)}
              </Text>

              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {dayBookings.length > 0 ? (
              <FlatList
                data={dayBookings}
                renderItem={renderBookingItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                style={styles.bookingsList}
              />
            ) : (
              <View style={styles.noBookings}>
                <Ionicons name="calendar-outline" size={48} color="#ccc" />
                <Text style={styles.noBookingsText}>No bookings for this date</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
   
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  calendar: {
    marginBottom: 20,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexWrap: 'wrap',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  bookingsList: {
    padding: 20,
  },
  bookingItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  bookingDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  noBookings: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noBookingsText: {
    fontSize: 16,
    color: '#ccc',
    marginTop: 12,
  },
});