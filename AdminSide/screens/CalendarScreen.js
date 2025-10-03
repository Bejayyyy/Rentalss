import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';

const { width } = Dimensions.get('window');
const CELL_SIZE = (width - 40) / 7; // 7 days in a week, 40px padding

export default function CalendarComponent({ 
  showHeader = true,
  headerTitle = "Rental Calendar",
  headerSubtitle = "Tap any date to view bookings",
  showLegend = true,
  containerStyle,
  onDateSelect,
  onBookingSelect
}) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(today.toISOString().split('T')[0]);
  const [bookings, setBookings] = useState({});
  const [dayBookings, setDayBookings] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // NEW STATES for vehicle filter
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  useEffect(() => {
    fetchVehicles(); // NEW
    fetchBookings();
    
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

  // NEW: Separate useEffect for filter changes
  useEffect(() => {
    if (vehicles.length > 0 || selectedVehicle === null) {
      fetchBookings();
    }
  }, [selectedVehicle]);

  // NEW FUNCTION: Fetch vehicles
  const fetchVehicles = async () => {
    try {
      const { data: vehiclesData, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('make', { ascending: true });

      if (error) {
        console.error('Error fetching vehicles:', error);
        return;
      }

      setVehicles(vehiclesData || []);
    } catch (error) {
      console.error('Error processing vehicles:', error);
    }
  };

  // ORIGINAL FUNCTION with small modification for filter
  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      // Build query like your original
      let query = supabase
        .from('bookings')
        .select(`
          *,
          vehicles (
            make,
            model,
            year,
            image_url
          )
        `);
      
      // NEW: Apply filter only if vehicle is selected
      if (selectedVehicle) {
        query = query.eq('vehicle_id', selectedVehicle);
      }
      
      // Then order (like your original)
      const { data: bookingsData, error } = await query.order('rental_start_date', { ascending: true });

      if (error) {
        console.error('Error fetching bookings:', error);
        Alert.alert('Error', 'Failed to fetch bookings data');
        return;
      }

      // Your original processing logic
      const processedBookings = {};
      
      bookingsData?.forEach((booking) => {
        const startDate = booking.rental_start_date;
        const endDate = booking.rental_end_date;
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          
          if (!processedBookings[dateStr]) {
            processedBookings[dateStr] = {
              bookings: []
            };
          }
          
          processedBookings[dateStr].bookings.push(booking);
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

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push({ empty: true, key: `empty-${i}` });
    }

    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        day,
        dateStr,
        bookings: bookings[dateStr]?.bookings || [],
        key: dateStr
      });
    }

    return days;
  };

  const changeMonth = (direction) => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'confirmed': return '#10b981';
      case 'completed': return '#3b82f6';
      case 'cancelled': return '#ef4444';
      case 'declined': return '#ff4500';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return 'time-outline';
      case 'confirmed': return 'checkmark-circle-outline';
      case 'completed': return 'checkmark-done-circle-outline';
      case 'cancelled': return 'close-circle-outline';
      default: return 'help-circle-outline';
    }
  };

  // NEW FUNCTION: Get background color for a date cell based on bookings
  const getCellBackgroundColor = (dayBookings) => {
    if (dayBookings.length === 0) return '#fff';
    
    // If only one booking, return that status color with opacity
    if (dayBookings.length === 1) {
      const statusColor = getStatusColor(dayBookings[0].status);
      return statusColor + '20'; // Add 20 for 12.5% opacity (hex)
    }
    
    // If multiple bookings, use gradient or blend effect
    // For simplicity, we'll use the first booking's color
    const statusColor = getStatusColor(dayBookings[0].status);
    return statusColor + '20';
  };

  // NEW FUNCTION: Get border color for a date cell (stronger color)
  const getCellBorderColor = (dayBookings) => {
    if (dayBookings.length === 0) return '#e5e7eb';
    
    // Use the first booking's status color for the border
    return getStatusColor(dayBookings[0].status);
  };

  const onDayPress = (dateStr, dayBookings) => {
    if (!dateStr) return;
    
    setSelectedDate(dateStr);
    setDayBookings(dayBookings);
    setModalVisible(true);
    
    if (onDateSelect) {
      onDateSelect(dateStr, dayBookings);
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

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleBookingPress = (booking) => {
    if (onBookingSelect) {
      onBookingSelect(booking);
    }
  };

  // NEW FUNCTION: Handle vehicle selection
  const handleVehicleSelect = (vehicleId) => {
    setSelectedVehicle(vehicleId);
    setFilterModalVisible(false);
  };

  const renderBookingItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.bookingItem}
      onPress={() => handleBookingPress(item)}
      activeOpacity={onBookingSelect ? 0.7 : 1}
    >
      {/* NEW: Vehicle Image Section */}
      {item.vehicles?.image_url && (
        <View style={styles.bookingImageContainer}>
          <Image
            source={{ uri: item.vehicles.image_url }}
            style={styles.bookingVehicleImage}
            resizeMode="cover"
          />
          <View style={styles.vehicleOverlay}>
            <Text style={styles.vehicleName}>
              {item.vehicles.year} {item.vehicles.make} {item.vehicles.model}
            </Text>
          </View>
        </View>
      )}

      {/* ORIGINAL content wrapped in container */}
      <View style={styles.bookingContentContainer}>
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
      </View>
    </TouchableOpacity>
  );

  const renderDay = ({ item }) => {
    if (item.empty) {
      return <View style={styles.emptyCell} />;
    }

    const isToday = item.dateStr === today.toISOString().split('T')[0];
    const isSelected = item.dateStr === selectedDate;
    const hasBookings = item.bookings.length > 0;
    
    // Get the first booking's vehicle image
    const firstBooking = item.bookings[0];
    const vehicleImage = firstBooking?.vehicles?.image_url;

    // NEW: Get dynamic colors based on booking status
    const cellBackgroundColor = hasBookings ? getCellBackgroundColor(item.bookings) : '#fff';
    const cellBorderColor = hasBookings ? getCellBorderColor(item.bookings) : '#e5e7eb';

    return (
      <TouchableOpacity
        style={[
          styles.dayCell,
          { backgroundColor: cellBackgroundColor }, // NEW: Dynamic background
          { borderColor: cellBorderColor }, // NEW: Dynamic border
          hasBookings && { borderWidth: 1 }, // NEW: Thicker border for booked dates
          isToday && styles.todayCell,
          isSelected && styles.selectedCell,
        ]}
        onPress={() => onDayPress(item.dateStr, item.bookings)}
      >
        <Text style={[
          styles.dayNumber,
          isToday && styles.todayText,
          isSelected && styles.selectedText
        ]}>
          {item.day}
        </Text>
        
        {hasBookings && vehicleImage ? (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: vehicleImage }}
              style={styles.vehicleImage}
              resizeMode="cover"
            />
            {item.bookings.length > 1 && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>+{item.bookings.length - 1}</Text>
              </View>
            )}
          </View>
        ) : hasBookings ? (
          <View style={styles.dotsContainer}>
            {item.bookings.slice(0, 3).map((booking, index) => (
              <View
                key={index}
                style={[styles.dot, { backgroundColor: getStatusColor(booking.status) }]}
              />
            ))}
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, containerStyle]}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading calendar...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, containerStyle]}>
      {showHeader && (
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>{headerTitle}</Text>
            <Text style={styles.headerSubtitle}>{headerSubtitle}</Text>
          </View>
          
          {/* NEW: Vehicle Filter Button */}
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setFilterModalVisible(true)}
          >
            <Ionicons name="car" size={20} color="#222" />
            <Text style={styles.filterButtonText} numberOfLines={1}>
              {selectedVehicle 
                ? (vehicles.find(v => v.id === selectedVehicle)?.make || '') + ' ' + (vehicles.find(v => v.id === selectedVehicle)?.model || '')
                : 'All Cars'
              }
            </Text>
            <Ionicons name="chevron-down" size={16} color="#222" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.calendarContainer}>
        {/* Month Navigation */}
        <View style={styles.monthNavigation}>
          <TouchableOpacity onPress={() => changeMonth('prev')} style={styles.navButton}>
            <Ionicons name="chevron-back" size={24} color="#222" />
          </TouchableOpacity>
          
          <Text style={styles.monthText}>
            {monthNames[currentMonth]} {currentYear}
          </Text>
          
          <TouchableOpacity onPress={() => changeMonth('next')} style={styles.navButton}>
            <Ionicons name="chevron-forward" size={24} color="#222" />
          </TouchableOpacity>
        </View>

        {/* Day Headers */}
        <View style={styles.dayHeaders}>
          {dayNames.map((day) => (
            <View key={day} style={styles.dayHeader}>
              <Text style={styles.dayHeaderText}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {generateCalendarDays().map((day) => renderDay({ item: day }))}
        </View>
      </View>

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
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#ff4500' }]} />
            <Text style={styles.legendText}>Declined</Text>
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
                Bookings for {formatDate(selectedDate)}
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

      {/* NEW: Vehicle Filter Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={filterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Vehicle</Text>
              <TouchableOpacity 
                onPress={() => setFilterModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#222" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.vehicleList}>
              {/* All Cars Option */}
              <TouchableOpacity
                style={[
                  styles.vehicleOption,
                  selectedVehicle === null && styles.vehicleOptionSelected
                ]}
                onPress={() => handleVehicleSelect(null)}
              >
                <View style={styles.vehicleOptionContent}>
                  <Ionicons name="car" size={24} color="#222" />
                  <Text style={styles.vehicleOptionText}>All Cars</Text>
                </View>
                {selectedVehicle === null && (
                  <Ionicons name="checkmark-circle" size={24} color="#222" />
                )}
              </TouchableOpacity>

              {/* Individual Vehicles */}
              {vehicles.map((vehicle) => (
                <TouchableOpacity
                  key={vehicle.id}
                  style={[
                    styles.vehicleOption,
                    selectedVehicle === vehicle.id && styles.vehicleOptionSelected
                  ]}
                  onPress={() => handleVehicleSelect(vehicle.id)}
                >
                  <View style={styles.vehicleOptionContent}>
                    {vehicle.image_url ? (
                      <Image
                        source={{ uri: vehicle.image_url }}
                        style={styles.vehicleOptionImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.vehicleOptionImagePlaceholder}>
                        <Ionicons name="car" size={24} color="#999" />
                      </View>
                    )}
                    <View style={styles.vehicleOptionInfo}>
                      <Text style={styles.vehicleOptionText}>
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </Text>
                    </View>
                  </View>
                  {selectedVehicle === vehicle.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#222" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fcfcfc',
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
    backgroundColor: '#fcfcfc',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  // NEW styles
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#222',
    gap: 6,
  },
  filterButtonText: {
    color: '#222',
    fontSize: 14,
    fontWeight: '600',
    maxWidth: 100,
  },
  calendarContainer: {
    padding: 15,
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  dayHeader: {
    width: CELL_SIZE,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
  },
  dayCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 4,
    backgroundColor: '#fff',
  },
  todayCell: {
    borderColor: '#FF6B35',
    borderWidth: 2,
  },
 
  hasBookingsCell: {
    backgroundColor: '#f8f9fa',
  },
  dayNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  todayText: {
    color: '#FF6B35',
  },
  selectedText: {
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
    marginTop: 2,
  },
  vehicleImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  countBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    minWidth: 16,
    alignItems: 'center',
  },
  countText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
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
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  // NEW styles for vehicle image in booking card
  bookingImageContainer: {
    width: '100%',
    height: 150,
    position: 'relative',
  },
  bookingVehicleImage: {
    width: '100%',
    height: '100%',
  },
  vehicleOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
  },
  vehicleName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bookingContentContainer: {
    padding: 16,
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
  // NEW styles for filter modal
  filterModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    maxHeight: '70%',
    width: '85%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  vehicleList: {
    padding: 16,
    maxHeight: 400,
  },
  vehicleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  vehicleOptionSelected: {
    borderColor: '#222',
    backgroundColor: '#fcfcfc',
  },
  vehicleOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  vehicleOptionImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  vehicleOptionImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleOptionInfo: {
    flex: 1,
  },
  vehicleOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
});