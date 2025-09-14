import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Dimensions,
  SafeAreaView,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Line, Stop, LinearGradient, Defs } from 'react-native-svg';
import { Calendar } from 'react-native-calendars';
import { supabase } from '../services/supabase';
import { Dropdown } from 'react-native-element-dropdown';
import { Button } from 'react-native';
import BookingForm from '../components/BookingScreen/BookingForm';
import ActionModal from '../components/AlertModal/ActionModal';
import CalendarScreen from './CalendarScreen';

const { width } = Dimensions.get('window');

export default function BookingsScreen() {
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);

  
  // Enhanced overview filters with proper cascading
  const [overviewFilter, setOverviewFilter] = useState('Weekly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedWeekRange, setSelectedWeekRange] = useState(null);
  
  // List filters
  const [listStatusFilter, setListStatusFilter] = useState('All');
  const [listDateFilter, setListDateFilter] = useState('All');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('All');
  
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addBookingModalVisible, setAddBookingModalVisible] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [totalPages, setTotalPages] = useState(1);

  const [chartData, setChartData] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  
  // Modal states
  const [yearDropdownVisible, setYearDropdownVisible] = useState(false);
  const [monthDropdownVisible, setMonthDropdownVisible] = useState(false);
  const [weekDropdownVisible, setWeekDropdownVisible] = useState(false);
  const [statusDropdownVisible, setStatusDropdownVisible] = useState(false);
  const [dateDropdownVisible, setDateDropdownVisible] = useState(false);
  const [vehicleTypeDropdownVisible, setVehicleTypeDropdownVisible] = useState(false);

  // Animation values
  const modalAnimation = useState(new Animated.Value(0))[0];

  // Generate available years (2023 to current year)
  const generateAvailableYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = 2023; year <= currentYear; year++) {
      years.push(year);
    }
    return years.reverse(); // Show newest first
  };

  const availableYears = generateAvailableYears();

  // Generate month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  useEffect(() => {
    fetchBookings();
    fetchAvailableVehicles();
  }, []);

  useEffect(() => {
    filterBookings();
    generateChartData();
  }, [bookings, listStatusFilter, listDateFilter, vehicleTypeFilter, overviewFilter, selectedYear, selectedMonth, selectedWeekRange]);

  useEffect(() => {
    setTotalPages(Math.ceil(filteredBookings.length / itemsPerPage));
    if (currentPage > Math.ceil(filteredBookings.length / itemsPerPage)) {
      setCurrentPage(1);
    }
  }, [filteredBookings, itemsPerPage, currentPage]);

  // Reset dependent filters when parent filters change
  useEffect(() => {
    // When year changes, reset month to January and clear week selection
    setSelectedMonth(0);
    setSelectedWeekRange(null);
  }, [selectedYear]);

  useEffect(() => {
    // When month changes, clear week selection
    setSelectedWeekRange(null);
  }, [selectedMonth]);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          customer_name,
          customer_email,
          customer_phone,
          rental_start_date,
          rental_end_date,
          total_price,
          status,
          created_at,
          pickup_location,
          license_number,
          vehicle_id,
          vehicle_variant_id,
          gov_id_url, 
          vehicles (
            make,
            model,
            year
          ),
          vehicle_variants (
            color,
            available_quantity,
            total_quantity
          )
        `)
        .order('created_at', { ascending: false });
  
      if (error) {
        console.error('Error fetching bookings:', error);
        Alert.alert('Error', 'Failed to fetch bookings');
        return;
      }
  
      setBookings(data || []);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  

  const fetchAvailableVehicles = async () => {
    const { data, error } = await supabase
      .from('vehicle_variants')
      .select(`
        id,
        color,
        image_url,
        available_quantity,
        total_quantity,
        vehicle_id,
        vehicles (
          make,
          model,
          year
        )
      `)
      .gt('available_quantity', 0); // only show available ones
  
    if (error) {
      console.error('Error fetching variants:', error);
      return;
    }
  
    setAvailableVehicles(data || []);
    const types = [...new Set(data?.map(variant => variant.vehicles?.make) || [])];
    setVehicleTypes(types);
  };
  

  const addNewBooking = async (newBookingData) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          ...newBookingData,
          created_at: new Date().toISOString()
        })
        .select(`
          id,
          customer_name,
          customer_email,
          customer_phone,
          rental_start_date,
          rental_end_date,
          total_price,
          status,
          created_at,
          pickup_location,
          license_number,
          vehicle_id,
          vehicles (
            make,
            model,
            year
          )
        `);

      if (error) {
        console.error('Add booking error:', error);
        Alert.alert('Error', 'Failed to add booking');
        return false;
      }

      // Add to local state
      setBookings(prev => [data[0], ...prev]);
      await fetchAvailableVehicles();
      Alert.alert('Success', 'Booking added successfully');
      return true;
    } catch (error) {
      console.error('Add booking error:', error);
      Alert.alert('Error', 'Something went wrong while adding booking');
      return false;
    }
  };

  const deleteBooking = async (bookingId) => {
    setActionModalConfig({
      type: "delete",
      title: "Delete Booking",
      message: "Are you sure you want to delete this booking? This action cannot be undone.",
      onConfirm: async () => {
        try {
          setActionModalVisible(false);
          const { data: booking, error: fetchError } = await supabase
            .from("bookings")
            .select("status, vehicle_variant_id")
            .eq("id", bookingId)
            .single();

          if (fetchError) {
            console.error("Fetch error:", fetchError);
            return;
          }

          const { error } = await supabase
            .from("bookings")
            .delete()
            .eq("id", bookingId);

          if (error) {
            console.error("Delete error:", error);
            return;
          }

          if (booking.status === "confirmed" && booking.vehicle_variant_id) {
            await supabase.rpc("adjust_variant_quantity", {
              variant_id: booking.vehicle_variant_id,
              change: +1,
            });
          }

          await fetchBookings();
          await fetchAvailableVehicles();
          closeEditModal();
        } catch (err) {
          console.error("Delete booking error:", err);
        }
      },
      onClose: () => setActionModalVisible(false),
    });
    setActionModalVisible(true);
  };

  

  const filterBookings = () => {
    let filtered = [...bookings];
    const now = new Date();

    // Combined filtering logic
    if (listStatusFilter !== 'All') {
      filtered = filtered.filter(booking => booking.status === listStatusFilter);
    }

    if (vehicleTypeFilter !== 'All') {
      filtered = filtered.filter(booking => 
        booking.vehicles?.make === vehicleTypeFilter
      );
    }

    // Date filtering with overview consideration
    let dateFiltered = filtered;
    
    // Apply overview filter first
    switch (overviewFilter) {
      case 'Today':
        const today = now.toDateString();
        dateFiltered = dateFiltered.filter(booking => 
          new Date(booking.created_at).toDateString() === today
        );
        break;
      case 'Weekly':
        if (selectedWeekRange) {
          dateFiltered = dateFiltered.filter(booking => {
            const bookingDate = new Date(booking.created_at);
            return bookingDate >= selectedWeekRange.start && bookingDate <= selectedWeekRange.end;
          });
        }
        break;
      case 'Monthly':
        const monthStart = new Date(selectedYear, selectedMonth, 1);
        const monthEnd = new Date(selectedYear, selectedMonth + 1, 0);
        dateFiltered = dateFiltered.filter(booking => {
          const bookingDate = new Date(booking.created_at);
          return bookingDate >= monthStart && bookingDate <= monthEnd;
        });
        break;
    }

    // Then apply list date filter
    switch (listDateFilter) {
      case 'Recent':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFiltered = dateFiltered.filter(booking => new Date(booking.created_at) >= weekAgo);
        break;
      case 'Today':
        const todayString = now.toDateString();
        dateFiltered = dateFiltered.filter(booking => 
          new Date(booking.created_at).toDateString() === todayString
        );
        break;
      case 'This Week':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        dateFiltered = dateFiltered.filter(booking => new Date(booking.created_at) >= startOfWeek);
        break;
      case 'This Month':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFiltered = dateFiltered.filter(booking => new Date(booking.created_at) >= startOfMonth);
        break;
      case 'This Year':
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        dateFiltered = dateFiltered.filter(booking => new Date(booking.created_at) >= startOfYear);
        break;
    }

    setFilteredBookings(dateFiltered);
  };

  const getPaginatedBookings = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredBookings.slice(startIndex, endIndex);
  };

  const generateChartData = () => {
    const now = new Date();
    let data = [];
    let filteredData = [...bookings];

    // Apply year filter
    filteredData = filteredData.filter(booking => 
      new Date(booking.created_at).getFullYear() === selectedYear
    );

    switch (overviewFilter) {
      case 'Monthly':
        const monthStart = new Date(selectedYear, selectedMonth, 1);
        const monthEnd = new Date(selectedYear, selectedMonth + 1, 0);
        const daysInMonth = monthEnd.getDate();
        
        for (let day = 1; day <= daysInMonth; day++) {
          const dayStart = new Date(selectedYear, selectedMonth, day);
          const dayEnd = new Date(selectedYear, selectedMonth, day + 1);
          const dayBookings = filteredData.filter(booking => {
            const bookingDate = new Date(booking.created_at);
            return bookingDate >= dayStart && bookingDate < dayEnd;
          });
          data.push({
            period: `${selectedMonth + 1}/${day}`,
            bookings: dayBookings.length,
            revenue: dayBookings.reduce((sum, b) => sum + parseFloat(b.total_price), 0)
          });
        }
        break;
        
      case 'Weekly':
        if (selectedWeekRange) {
          const startDate = selectedWeekRange.start;
          const endDate = selectedWeekRange.end;
          const totalDays = Math.ceil((endDate - startDate) / (24 * 60 * 60 * 1000)) + 1;
          
          for (let i = 0; i < totalDays; i++) {
            const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
            const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
            const dayBookings = filteredData.filter(booking => {
              const bookingDate = new Date(booking.created_at);
              return bookingDate >= date && bookingDate < nextDate;
            });
            data.push({
              period: `${date.getMonth() + 1}/${date.getDate()}`,
              bookings: dayBookings.length,
              revenue: dayBookings.reduce((sum, b) => sum + parseFloat(b.total_price), 0)
            });
          }
        } else {
          // Default to current week
          for (let i = 6; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
            const dayBookings = filteredData.filter(booking => {
              const bookingDate = new Date(booking.created_at);
              return bookingDate >= date && bookingDate < nextDate;
            });
            data.push({
              period: `${date.getMonth() + 1}/${date.getDate()}`,
              bookings: dayBookings.length,
              revenue: dayBookings.reduce((sum, b) => sum + parseFloat(b.total_price), 0)
            });
          }
        }
        break;
        
      case 'Today':
        const todayStart = new Date(selectedYear, now.getMonth(), now.getDate());
        for (let i = 0; i < 24; i++) {
          const hourDate = new Date(todayStart.getTime() + i * 60 * 60 * 1000);
          const nextHour = new Date(hourDate.getTime() + 60 * 60 * 1000);
          const hourBookings = filteredData.filter(booking => {
            const bookingDate = new Date(booking.created_at);
            return bookingDate >= hourDate && bookingDate < nextHour;
          });
          data.push({
            period: hourDate.getHours().toString().padStart(2, '0') + ':00',
            bookings: hourBookings.length,
            revenue: hourBookings.reduce((sum, b) => sum + parseFloat(b.total_price), 0)
          });
        }
        break;
    }
    setChartData(data);
  };

  // Generate week ranges for the selected month and year
  const getWeekRangesForMonth = (year, month) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const weeks = [];
    
    let currentWeekStart = new Date(firstDay);
    
    while (currentWeekStart <= lastDay) {
      const weekEnd = new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
      const actualEnd = weekEnd > lastDay ? lastDay : weekEnd;
      
      weeks.push({
        start: new Date(currentWeekStart),
        end: new Date(actualEnd),
        label: `${monthNames[month].slice(0, 3)} ${currentWeekStart.getDate()}–${actualEnd.getDate()}`
      });
      
      currentWeekStart = new Date(actualEnd.getTime() + 24 * 60 * 60 * 1000);
    }
    
    return weeks;
  };

  const showConfirmation = (title, message, onConfirm) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: onConfirm, style: 'default' }
    ]);
  };

  const updateBookingStatus = async (bookingId, newStatus) => {
    // EDITED: Now uses `setActionModalConfig` to set up your custom modal
    setActionModalConfig({
      type: "confirm",
      title: "Update Status",
      message: `Are you sure you want to change the status to "${newStatus}"?`,
      onConfirm: async () => {
        try {
          setActionModalVisible(false);
          const { error } = await supabase
            .from('bookings')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', bookingId);

          if (error) {
            console.error('Status update error:', error);
            return;
          }

          setBookings(prev => prev.map(booking =>
            booking.id === bookingId ? { ...booking, status: newStatus } : booking
          ));

          if (selectedBooking && selectedBooking.id === bookingId) {
            setSelectedBooking(prev => ({ ...prev, status: newStatus }));
          }

          if (newStatus === 'completed' || newStatus === 'cancelled') {
            await fetchAvailableVehicles();
          }
        } catch (error) {
          console.error('Status update error:', error);
        }
      },
      onClose: () => setActionModalVisible(false),
    });
    setActionModalVisible(true);
  };

  const updateBooking = async (updatedBooking) => {
    // EDITED: Now uses `setActionModalConfig` to set up your custom modal
    setActionModalConfig({
      type: "confirm",
      title: "Save Changes",
      message: "Are you sure you want to save these changes to the booking?",
      onConfirm: async () => {
        try {
          setActionModalVisible(false);
          const { data: existingBooking, error: fetchError } = await supabase
            .from('bookings')
            .select('status, vehicle_variant_id')
            .eq('id', updatedBooking.id)
            .single();

          if (fetchError) {
            console.error('Fetch error:', fetchError);
            return;
          }

          const { error } = await supabase
            .from('bookings')
            .update({
              customer_name: updatedBooking.customer_name,
              customer_email: updatedBooking.customer_email,
              customer_phone: updatedBooking.customer_phone,
              rental_start_date: updatedBooking.rental_start_date,
              rental_end_date: updatedBooking.rental_end_date,
              total_price: updatedBooking.total_price,
              pickup_location: updatedBooking.pickup_location,
              license_number: updatedBooking.license_number,
              vehicle_id: updatedBooking.vehicle_id,
              vehicle_variant_id: updatedBooking.vehicle_variant_id,
              status: updatedBooking.status,
              updated_at: new Date().toISOString(),
            })
            .eq('id', updatedBooking.id);
          if (error) {
            console.error('Booking update error:', error);
            return;
          }

          await fetchBookings();
          await fetchAvailableVehicles();
          closeEditModal();
        } catch (error) {
          console.error('Booking update error:', error);
        }
      },
      onClose: () => setActionModalVisible(false),
    });
    setActionModalVisible(true);
  };


  
  

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
    fetchAvailableVehicles();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatAmount = (amount) => {
    return `₱${parseFloat(amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

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
      default:
        return '#6b7280';
    }
  };

  const openEditModal = useCallback((booking) => {
    setSelectedBooking(booking);
    setEditModalVisible(true);
    Animated.timing(modalAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [modalAnimation]);

  const closeEditModal = useCallback(() => {
    Animated.timing(modalAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setEditModalVisible(false);
      setSelectedBooking(null);
    });
  }, [modalAnimation]);


  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Enhanced Dropdown Components
  const EnhancedDropdown = ({ visible, onClose, children, title }) => {
    const [dropdownAnimation] = useState(new Animated.Value(0));

    useEffect(() => {
      if (visible) {
        Animated.spring(dropdownAnimation, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.timing(dropdownAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    }, [visible]);

    if (!visible) return null;

    return (
      <Modal visible={visible} transparent animationType="none">
        <TouchableOpacity 
          style={styles.enhancedDropdownOverlay} 
          activeOpacity={1}
          onPress={onClose}
        >
          <Animated.View 
            style={[
              styles.enhancedDropdownContainer,
              {
                transform: [
                  {
                    scale: dropdownAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    }),
                  },
                ],
                opacity: dropdownAnimation,
              },
            ]}
          >
            {title && (
              <View style={styles.dropdownTitleContainer}>
                <Text style={styles.dropdownTitle}>{title}</Text>
              </View>
            )}
            <ScrollView style={styles.dropdownScrollContainer}>
              {children}
            </ScrollView>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    );
  };

  // Year Dropdown
  const YearDropdown = () => (
    <EnhancedDropdown 
      visible={yearDropdownVisible} 
      onClose={() => setYearDropdownVisible(false)}
      title="Select Year"
    >
      {availableYears.map(year => (
        <TouchableOpacity
          key={year}
          style={[
            styles.enhancedDropdownItem,
            selectedYear === year && styles.enhancedDropdownItemSelected
          ]}
          onPress={() => {
            setSelectedYear(year);
            setYearDropdownVisible(false);
          }}
        >
          <Text style={[
            styles.enhancedDropdownItemText,
            selectedYear === year && styles.enhancedDropdownItemTextSelected
          ]}>
            {year}
          </Text>
          {selectedYear === year && (
            <Ionicons name="checkmark" size={18} color="#3b82f6" />
          )}
        </TouchableOpacity>
      ))}
    </EnhancedDropdown>
  );

  // Month Dropdown
  const MonthDropdown = () => (
    <EnhancedDropdown 
      visible={monthDropdownVisible} 
      onClose={() => setMonthDropdownVisible(false)}
      title="Select Month"
    >
      {monthNames.map((month, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.enhancedDropdownItem,
            selectedMonth === index && styles.enhancedDropdownItemSelected
          ]}
          onPress={() => {
            setSelectedMonth(index);
            setMonthDropdownVisible(false);
          }}
        >
          <Text style={[
            styles.enhancedDropdownItemText,
            selectedMonth === index && styles.enhancedDropdownItemTextSelected
          ]}>
            {month} {selectedYear}
          </Text>
          {selectedMonth === index && (
            <Ionicons name="checkmark" size={18} color="#3b82f6" />
          )}
        </TouchableOpacity>
      ))}
    </EnhancedDropdown>
  );

  // Week Dropdown
  const WeekDropdown = () => {
    const weekRanges = getWeekRangesForMonth(selectedYear, selectedMonth);
    
    return (
      <EnhancedDropdown 
        visible={weekDropdownVisible} 
        onClose={() => setWeekDropdownVisible(false)}
        title="Select Week Range"
      >
        {weekRanges.map((range, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.enhancedDropdownItem,
              selectedWeekRange?.label === range.label && styles.enhancedDropdownItemSelected
            ]}
            onPress={() => {
              setSelectedWeekRange(range);
              setWeekDropdownVisible(false);
            }}
          >
            <View>
              <Text style={[
                styles.enhancedDropdownItemText,
                selectedWeekRange?.label === range.label && styles.enhancedDropdownItemTextSelected
              ]}>
                {range.label}
              </Text>
              <Text style={[
                styles.enhancedDropdownItemSubtext,
                selectedWeekRange?.label === range.label && styles.enhancedDropdownItemTextSelected
              ]}>
                {range.start.toLocaleDateString()} - {range.end.toLocaleDateString()}
              </Text>
            </View>
            {selectedWeekRange?.label === range.label && (
              <Ionicons name="checkmark" size={18} color="#3b82f6" />
            )}
          </TouchableOpacity>
        ))}
      </EnhancedDropdown>
    );
  };

  const StatusDropdown = () => {
    const statusOptions = ['All', 'pending', 'confirmed', 'completed', 'cancelled'];
    
    return (
      <EnhancedDropdown 
        visible={statusDropdownVisible} 
        onClose={() => setStatusDropdownVisible(false)}
        title="Filter by Status"
      >
        {statusOptions.map(status => (
          <TouchableOpacity
            key={status}
            style={[
              styles.enhancedDropdownItem,
              listStatusFilter === status && styles.enhancedDropdownItemSelected
            ]}
            onPress={() => {
              setListStatusFilter(status);
              setStatusDropdownVisible(false);
              setCurrentPage(1);
            }}
          >
            <Text style={[
              styles.enhancedDropdownItemText,
              listStatusFilter === status && styles.enhancedDropdownItemTextSelected
            ]}>
              {status === 'All' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
            {listStatusFilter === status && (
              <Ionicons name="checkmark" size={18} color="#3b82f6" />
            )}
          </TouchableOpacity>
        ))}
      </EnhancedDropdown>
    );
  };

  const DateDropdown = () => {
    const dateOptions = ['All', 'Today', 'This Week', 'This Month', 'This Year', 'Recent'];
    
    return (
      <EnhancedDropdown 
        visible={dateDropdownVisible} 
        onClose={() => setDateDropdownVisible(false)}
        title="Filter by Date"
      >
        {dateOptions.map(dateOption => (
          <TouchableOpacity
            key={dateOption}
            style={[
              styles.enhancedDropdownItem,
              listDateFilter === dateOption && styles.enhancedDropdownItemSelected
            ]}
            onPress={() => {
              setListDateFilter(dateOption);
              setDateDropdownVisible(false);
              setCurrentPage(1);
            }}
          >
            <Text style={[
              styles.enhancedDropdownItemText,
              listDateFilter === dateOption && styles.enhancedDropdownItemTextSelected
            ]}>
              {dateOption === 'All' ? 'All Dates' : dateOption}
            </Text>
            {listDateFilter === dateOption && (
              <Ionicons name="checkmark" size={18} color="#3b82f6" />
            )}
          </TouchableOpacity>
        ))}
      </EnhancedDropdown>
    );
  };


  

  const VehicleTypeDropdown = () => {
    const vehicleTypeOptions = ['All', ...vehicleTypes];
    
    return (
      <EnhancedDropdown 
        visible={vehicleTypeDropdownVisible} 
        onClose={() => setVehicleTypeDropdownVisible(false)}
        title="Filter by Vehicle Type"
      >
        {vehicleTypeOptions.map(vehicleType => (
          <TouchableOpacity
            key={vehicleType}
            style={[
              styles.enhancedDropdownItem,
              vehicleTypeFilter === vehicleType && styles.enhancedDropdownItemSelected
            ]}
            onPress={() => {
              setVehicleTypeFilter(vehicleType);
              setVehicleTypeDropdownVisible(false);
              setCurrentPage(1);
            }}
          >
            <Text style={[
              styles.enhancedDropdownItemText,
              vehicleTypeFilter === vehicleType && styles.enhancedDropdownItemTextSelected
            ]}>
              {vehicleType === 'All' ? 'All Vehicle Types' : vehicleType}
            </Text>
            {vehicleTypeFilter === vehicleType && (
              <Ionicons name="checkmark" size={18} color="#3b82f6" />
            )}
          </TouchableOpacity>
        ))}
      </EnhancedDropdown>
    );
  };

  // Add Booking Modal Component
  
  const AddBookingModal = ({ isVisible, onClose, refreshBookings }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [govIdFile, setGovIdFile] = useState(null);
    const [cars, setCars] = useState([]);
    const [variants, setVariants] = useState([]);
    const [selectedCar, setSelectedCar] = useState(null);
  
    const [vehiclePickerVisible, setVehiclePickerVisible] = useState(false);
    const [datePickerVisible, setDatePickerVisible] = useState(false);
    const [dateField, setDateField] = useState(null);

    const [confirmVisible, setConfirmVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
    const [formData, setFormData] = useState({
      customer_name: "",
      customer_email: "",
      customer_phone: "",
      pickup_location: "",
      license_number: "",
      rental_start_date: "",
      rental_end_date: "",
      vehicle_id: "",
      vehicle_variant_id: "",
      total_price: 0,
      status: "pending",
    });
    
  
    // Fetch vehicles
    useEffect(() => {
      const fetchCars = async () => {
        const { data, error } = await supabase.from("vehicles").select("*");
        if (!error) setCars(data);
      };
      fetchCars();
    }, []);
  
    // Fetch variants
    useEffect(() => {
      const fetchVariants = async () => {
        const { data, error } = await supabase.from("vehicle_variants").select("*");
        if (!error) setVariants(data);
      };
      fetchVariants();
    }, []);
  
    // Pick Gov ID
    const pickGovIdFile = async () => {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission required", "Allow access to photos.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });
      if (!result.canceled) setGovIdFile(result.assets[0]);
    };
  
    // Calculate total price
    let totalPrice = 0;
    if (selectedCar && formData.pickupDate && formData.returnDate) {
      const start = new Date(formData.pickupDate);
      const end = new Date(formData.returnDate);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      if (days > 0) totalPrice = days * Number(selectedCar.price_per_day);
    }
  
    // Submit booking
    const handleSubmit = async () => {
      if (!formData.fullName || !formData.email || !formData.phone) {
        Alert.alert("Validation Error", "Fill out all required fields.");
        return;
      }
      if (!formData.vehicleId) {
        Alert.alert("Validation Error", "Select a vehicle.");
        return;
      }
      if (!formData.pickupDate || !formData.returnDate) {
        Alert.alert("Validation Error", "Select rental dates.");
        return;
      }
      if (!govIdFile) {
        Alert.alert("Validation Error", "Upload Government ID.");
        return;
      }
  
      setIsSubmitting(true);
      try {
        const fileName = `${Date.now()}_${govIdFile.fileName || "govid.jpg"}`;
        const { error: uploadError } = await supabase.storage
          .from("gov_ids")
          .upload(fileName, {
            uri: govIdFile.uri,
            type: "image/jpeg",
            name: fileName,
          });
        if (uploadError) throw uploadError;
  
        const { data: urlData } = supabase.storage.from("gov_ids").getPublicUrl(fileName);
        const govIdUrl = urlData?.publicUrl || "";
  
        const bookingRow = {
          vehicle_id: formData.vehicleId,
          vehicle_variant_id: formData.vehicleVariantId || null,
          customer_name: formData.fullName,
          customer_email: formData.email,
          customer_phone: formData.phone,
          rental_start_date: formData.pickupDate,
          rental_end_date: formData.returnDate,
          pickup_location: formData.pickupLocation,
          license_number: formData.licenseNumber,
          total_price: totalPrice,
          gov_id_url: govIdUrl,
          status: "pending",
        };
  
        const { error } = await supabase.from("bookings").insert([bookingRow]);
        if (error) throw error;
  
        Alert.alert("Success", "Booking submitted!");
        refreshBookings?.();
        onClose();
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Booking failed.");
      } finally {
        setIsSubmitting(false);
      }
    };
  
    const selectedVehicle = cars.find(v => v.id === formData.vehicleId);
  
    return (
      <Modal visible={isVisible} animationType="none" transparent>
        <SafeAreaView style={styles.modalContainer}>
          
          {/* 🔹 Same HEADER as EditBookingModal */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose} style={styles.modalHeaderButton}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
  
            <Text style={styles.modalTitle}>Add Booking</Text>
  
            <TouchableOpacity
              onPress={handleSubmit}
              style={[styles.modalHeaderButton, styles.saveButtonContainer]}
              disabled={isSubmitting}
            >
              <Text style={styles.saveButton}>
                {isSubmitting ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
          </View>
          {/* 🔹 END HEADER */}
  
          {/* FORM */}
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <BookingForm
            booking={formData}
            setBooking={setFormData}
            availableVehicles={variants}
            styles={styles}
            formatDate={formatDate}
            setDatePickerVisible={setDatePickerVisible}
            setDateField={setDateField}
            setVehiclePickerVisible={setVehiclePickerVisible}
            isEdit={false} // ✅ hide status selector
          />
</ScrollView>

  
          {/* Vehicle Picker Modal, Date Picker Modal ... (keep your same logic here) */}
  
        </SafeAreaView>
      </Modal>
    );
  };
  


  // Enhanced Edit Booking Modal
  const EditBookingModal = () => {
    if (!selectedBooking) return null;

    const [editableBooking, setEditableBooking] = useState({ ...selectedBooking });
    const [vehiclePickerVisible, setVehiclePickerVisible] = useState(false);
    const [datePickerVisible, setDatePickerVisible] = useState(false);
    const [dateField, setDateField] = useState(null);

    const [confirmVisible, setConfirmVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);


    useEffect(() => {
      if (selectedBooking) {
        setEditableBooking({ ...selectedBooking });
      }
    }, [selectedBooking]);

    const handleSave = () => setConfirmVisible(true);
    const handleConfirmSave = () => {
      updateBooking(editableBooking);
      setConfirmVisible(false);
    };

    const handleDelete = () => setDeleteVisible(true);
  const handleConfirmDelete = () => {
    deleteBooking(editableBooking.id);
    setDeleteVisible(false);
  };


    const selectedVehicle = availableVehicles.find(v => v.vehicle_id === editableBooking.vehicle_id)?.vehicles || editableBooking.vehicles || null;

    // dedupe vehicles so the vehicle picker shows actual vehicles (one entry per vehicle)
const uniqueVehicles = React.useMemo(() => {
  const map = {};
  (availableVehicles || []).forEach(variant => {
    const vid = variant.vehicle_id;
    if (!vid) return;
    // variant.vehicles is the nested vehicles object from the supabase select
    if (!map[vid]) {
      map[vid] = {
        vehicle_id: vid,
        make: variant.vehicles?.make,
        model: variant.vehicles?.model,
        year: variant.vehicles?.year,
      };
    }
  });
  return Object.values(map);
}, [availableVehicles]);

    return (
      <Modal
        visible={editModalVisible}
        animationType="none"
        transparent
      >
        <Animated.View style={[
          styles.modalContainer,
          {
            opacity: modalAnimation,
            transform: [
              {
                translateY: modalAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}>
          {/* HEADER with Exit and Save */}
          <View style={styles.modalHeader}>
          <TouchableOpacity onPress={closeEditModal} style={styles.modalHeaderButton}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Edit Booking</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.modalHeaderButton, styles.saveButtonContainer]}
          >
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* FORM */}
        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
        <BookingForm
          booking={editableBooking}
          setBooking={setEditableBooking}
          availableVehicles={availableVehicles}
          styles={styles}
          formatDate={formatDate}
          setDatePickerVisible={setDatePickerVisible}
          setDateField={setDateField}
          setVehiclePickerVisible={setVehiclePickerVisible}
          isEdit={true} // ✅ show status selector
        />


          {/* Delete Button */}
          <View style={styles.section}>
            <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
              <Text style={styles.deleteButtonText}>Delete Booking</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        <ActionModal
          visible={confirmVisible}
          type="confirm"
          onClose={() => setConfirmVisible(false)}
          onConfirm={handleConfirmSave}
        />
      <ActionModal
        visible={deleteVisible}
        type="delete"
        onClose={() => setDeleteVisible(false)}
        onConfirm={handleConfirmDelete}
      />



        </Animated.View>
      </Modal>
    );
  };



  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <View style={styles.paginationContainer}>
        <View style={styles.paginationInfo}>
          <Text style={styles.paginationText}>
            Page {currentPage} of {totalPages} ({filteredBookings.length} total)
          </Text>
        </View>
        
        <View style={styles.paginationControls}>
          <TouchableOpacity
            style={[
              styles.paginationButton,
              currentPage === 1 && styles.paginationButtonDisabled
            ]}
            onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <Ionicons 
              name="chevron-back" 
              size={20} 
              color={currentPage === 1 ? "#d1d5db" : "#3b82f6"} 
            />
          </TouchableOpacity>

          <View style={styles.pageNumbers}>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNumber;
              if (totalPages <= 5) {
                pageNumber = i + 1;
              } else if (currentPage <= 3) {
                pageNumber = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNumber = totalPages - 4 + i;
              } else {
                pageNumber = currentPage - 2 + i;
              }

              return (
                <TouchableOpacity
                  key={pageNumber}
                  style={[
                    styles.pageNumberButton,
                    currentPage === pageNumber && styles.pageNumberButtonActive
                  ]}
                  onPress={() => setCurrentPage(pageNumber)}
                >
                  <Text
                    style={[
                      styles.pageNumberText,
                      currentPage === pageNumber && styles.pageNumberTextActive
                    ]}
                  >
                    {pageNumber}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[
              styles.paginationButton,
              currentPage === totalPages && styles.paginationButtonDisabled
            ]}
            onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color={currentPage === totalPages ? "#d1d5db" : "#3b82f6"} 
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bookings</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => setAddModalVisible(true)}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={28} color="#222" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ alignItems: 'center' }}>
  <View style={styles.calendarContainer}>
    <CalendarScreen
      showHeader={true}
      headerTitle="Rental Calendar"
      headerSubtitle="Tap any date to view bookings"
      showLegend={true}
      containerStyle={{ backgroundColor: "transparent" }}
      calendarStyle={{ backgroundColor: "transparent" }}
    />
  </View>
</View>


      

      <View style={styles.listHeaderCard}>
        <Text style={styles.sectionTitle}>All Bookings</Text>
        <View style={styles.filtersSection}>
          <View style={styles.filterRow}>
            <TouchableOpacity 
              style={styles.dropdownButton}
              onPress={() => setStatusDropdownVisible(true)}
            >
              <Text style={styles.dropdownButtonText}>
                {listStatusFilter === 'All' ? 'All Statuses' : listStatusFilter.charAt(0).toUpperCase() + listStatusFilter.slice(1)}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#6b7280" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.dropdownButton}
              onPress={() => setDateDropdownVisible(true)}
            >
              <Text style={styles.dropdownButtonText}>
                {listDateFilter === 'All' ? 'All Dates' : listDateFilter}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#6b7280" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.dropdownButton}
              onPress={() => setVehicleTypeDropdownVisible(true)}
            >
              <Text style={styles.dropdownButtonText}>
                {vehicleTypeFilter === 'All' ? 'All Vehicle Types' : vehicleTypeFilter}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => openEditModal(item)}
      style={styles.bookingItemTouchable}
    >
      <View style={styles.bookingItem}>
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status) }]} />
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{getInitials(item.customer_name)}</Text>
        </View>

        <View style={styles.bookingInfo}>
          <Text style={styles.customerName}>{item.customer_name}</Text>
          <Text style={styles.bookingDate}>{formatDate(item.created_at)}</Text>

          {item.vehicles && (
            <>
              <Text style={styles.vehicleInfo}>
                {item.vehicles.year} {item.vehicles.make} {item.vehicles.model}
              </Text>
              {item.vehicles.make && (
                <Text style={styles.vehicleType}>{item.vehicles.make}</Text>
              )}
            </>
          )}

            {item.vehicle_variants && (
              <Text style={styles.vehicleInfo}>
                Color: {item.vehicle_variants.color} 
                ({item.vehicle_variants.available_quantity}/{item.vehicle_variants.total_quantity})
              </Text>
            )}

        </View>

        <View style={styles.rightSection}>
          <Text style={styles.bookingAmount}>{formatAmount(item.total_price)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + "20" }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={16} color="#9ca3af" style={styles.chevron} />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" />
      ) : (
        <>
          <Ionicons name="document-text-outline" size={48} color="#d1d5db" />
          <Text style={styles.emptyStateText}>No bookings found</Text>
          <Text style={styles.emptyStateSubtext}>
            Bookings matching your filters will appear here
          </Text>
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Enhanced Dropdowns */}
      <YearDropdown />
      <MonthDropdown />
      <WeekDropdown />
      <StatusDropdown />
      <DateDropdown />
      <VehicleTypeDropdown />
  
      {/* Modals */}
      <AddBookingModal
        isVisible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        refreshBookings={fetchBookings}
      />
  
      <EditBookingModal />
      
      {/* Main Content */}
      <FlatList
        data={getPaginatedBookings()}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={renderEmptyState}
        onRefresh={onRefresh}
        refreshing={refreshing}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            {/* Calendar Component */}
            
            
            {/* Original Header Content */}
            {renderHeader()}
          </View>
        }
        ListFooterComponent={
          <View style={styles.paginationFooter}>
            {renderPagination()}
          </View>
        }
      />
    </SafeAreaView>
  );
  
 
  
}
 // Add these styles to your existing StyleSheet
 const additionalStyles = StyleSheet.create({
  calendarContainer: {
    width: '100%',
    maxWidth: 400,
    minHeight: 450,   // 👈 enough to fit header + month + days + legend
    alignSelf: 'center',
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  
  embeddedCalendar: {
    flex: 0, // Override flex: 1 from the component
    backgroundColor: 'transparent',
  },
});

const styles = StyleSheet.create({
  ...additionalStyles,
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  listContent: {
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
  },
  summaryCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listHeaderCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  overviewFilters: {
    marginBottom: 16,
  },
  overviewFilterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  overviewFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    flex: 1,
    alignItems: 'center',
  },
  overviewFilterButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  overviewFilterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  overviewFilterButtonTextActive: {
    color: 'white',
  },
  secondaryFilterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 6,
  },
  secondaryFilterButtonText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  filtersSection: {
    marginTop: 8,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 100,
    flex: 1,
  },
  dropdownButtonText: {
    fontSize: 14,
    color: '#1f2937',
    marginRight: 8,
    flex: 1,
  },
  // Enhanced Dropdown Styles
  enhancedDropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  enhancedDropdownContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    minWidth: 250,
    maxWidth: width - 40,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  dropdownTitleContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  dropdownScrollContainer: {
    maxHeight: 300,
  },
  enhancedDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  enhancedDropdownItemSelected: {
    backgroundColor: '#f0f9ff',
  },
  enhancedDropdownItemText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
    flex: 1,
  },
  enhancedDropdownItemTextSelected: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  enhancedDropdownItemSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  // Pagination styles
  paginationContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginTop: 16,
    padding: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  paginationFooter: {
    paddingBottom: 20,
  },
  paginationInfo: {
    alignItems: 'center',
    marginBottom: 12,
  },
  paginationText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  paginationControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  paginationButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: 'white',
  },
  paginationButtonDisabled: {
    backgroundColor: '#f9fafb',
    borderColor: '#f3f4f6',
  },
  pageNumbers: {
    flexDirection: 'row',
    gap: 4,
  },
  pageNumberButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: 'white',
  },
  pageNumberButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  pageNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  pageNumberTextActive: {
    color: 'white',
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  chartStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  lineChartContainer: {
    position: 'relative',
    width: '100%',
    height: 150,
    alignItems: 'center',
  },
  svgChart: {
    marginVertical: 10,
  },
  xAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: 0,
    left: 30,
    right: 30,
  },
  axisLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  bookingItemTouchable: {
    marginBottom: 12,
  },
  bookingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
    marginHorizontal: 16,
  },
  statusIndicator: {
    width: 4,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  bookingInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  bookingDate: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
  },
  vehicleInfo: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 1,
  },
  vehicleType: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '500',
  },
  rightSection: {
    alignItems: 'flex-end',
    marginLeft: 16,
  },
  bookingAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 4,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  chevron: {
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalHeaderButton: {
    padding: 8,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  saveButtonContainer: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  modalContent: {
    padding: 16,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  inputHalf: {
    flex: 1,
    marginBottom: 0,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateInputText: {
    fontSize: 16,
    color: '#1f2937',
  },
  placeholderText: {
    color: '#9ca3af',
  },
  vehicleInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vehicleInputContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  vehicleInputText: {
    fontSize: 16,
    color: '#1f2937',
  },
  vehicleInputType: {
    fontSize: 12,
    color: '#6366f1',
    marginTop: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  statusOptionSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  statusOptionText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  statusOptionTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  calendarContainer: {
    marginTop: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '90%',
    maxWidth: 400,
    
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  vehiclePickerContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '90%',
    maxHeight: '70%',
    maxWidth: 400,
  },
  vehiclePickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  vehiclePickerItemSelected: {
    backgroundColor: '#f0f9ff',
  },
  vehiclePickerItemContent: {
    flex: 1,
  },
  vehiclePickerText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  vehiclePickerType: {
    fontSize: 12,
    color: '#6366f1',
    marginTop: 4,
    fontWeight: '500',
  },
  emptyVehicleText: {
    textAlign: 'center',
    color: '#9ca3af',
    padding: 20,
    fontSize: 16,
  },
});