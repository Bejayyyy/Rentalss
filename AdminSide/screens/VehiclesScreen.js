"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  Platform,
  Dimensions,
  Modal,
  TextInput,
  ScrollView,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { SafeAreaView } from "react-native-safe-area-context"
import { supabase } from '../services/supabase'

const { width } = Dimensions.get("window")
const isWeb = Platform.OS === "web"

export default function VehiclesScreen({ navigation }) {
  const [vehicles, setVehicles] = useState([])
  const [vehicleVariants, setVehicleVariants] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState("all")
  const [bookings, setBookings] = useState([])
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [vehicleToDelete, setVehicleToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  
  // New filter and search states
  const [searchText, setSearchText] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedSeats, setSelectedSeats] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [priceRange, setPriceRange] = useState("all")

  // Move getVehicleVariants function definition before it's used in useMemo
  const getVehicleVariants = useCallback((vehicleId) => {
    return vehicleVariants.filter(variant => variant.vehicle_id === vehicleId)
  }, [vehicleVariants])

  const filteredVehicles = useMemo(() => {
    let filtered = vehicles;

    switch (activeFilter) {
      case "available":
        filtered = filtered.filter(v =>
          !bookings.some(b => b.vehicle_id === v.id && b.status === "confirmed")
        );
        break;
      case "rented":
        filtered = filtered.filter(v =>
          bookings.some(b => b.vehicle_id === v.id && b.status === "confirmed")
        );
        break;
      case "maintenance":
        filtered = filtered.filter(v => v.status === "maintenance");
        break;
    }

    if (selectedSeats !== "all") {
      filtered = filtered.filter(v => v.seats?.toString() === selectedSeats);
    }

    if (selectedType !== "all") {
      filtered = filtered.filter(v => v.type?.toLowerCase() === selectedType.toLowerCase());
    }

    if (priceRange !== "all") {
      filtered = filtered.filter(v => {
        const price = parseFloat(v.price_per_day || 0);
        switch (priceRange) {
          case "under-1000": return price < 1000;
          case "1000-2000": return price >= 1000 && price <= 2000;
          case "2000-5000": return price > 2000 && price <= 5000;
          case "over-5000": return price > 5000;
          default: return true;
        }
      });
    }

    if (searchText.trim() !== "") {
      const search = searchText.toLowerCase().trim();
      filtered = filtered.filter(vehicle => {
        const variants = getVehicleVariants(vehicle.id);
        const colors = variants.map(v => v.color).join(' ').toLowerCase();
        return (
          vehicle.make?.toLowerCase().includes(search) ||
          vehicle.model?.toLowerCase().includes(search) ||
          vehicle.year?.toString().includes(search) ||
          vehicle.type?.toLowerCase().includes(search) ||
          vehicle.price_per_day?.toString().includes(search) ||
          colors.includes(search)
        );
      });
    }

    return filtered;
  }, [vehicles, bookings, vehicleVariants, searchText, activeFilter, selectedSeats, selectedType, priceRange, getVehicleVariants]);

  useEffect(() => {
    fetchVehicles()
    fetchVehicleVariants()
    fetchBookings()

    // Set up real-time subscriptions
    const vehiclesSubscription = supabase
      .channel('vehicles-channel')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'vehicles' 
        }, 
        (payload) => {
          console.log('Vehicle change:', payload)
          fetchVehicles()
        }
      )
      .subscribe()

    const variantsSubscription = supabase
      .channel('variants-channel')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'vehicle_variants' 
        }, 
        (payload) => {
          console.log('Variant change:', payload)
          fetchVehicleVariants()
        }
      )
      .subscribe()

    const bookingsSubscription = supabase
      .channel('bookings-channel')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'bookings' 
        }, 
        (payload) => {
          console.log('Booking change:', payload)
          fetchBookings()
        }
      )
      .subscribe()

    return () => {
      vehiclesSubscription.unsubscribe()
      variantsSubscription.unsubscribe()
      bookingsSubscription.unsubscribe()
    }
  }, [])

  const fetchVehicles = async () => {
    try {
      const { data: vehiclesData, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching vehicles:', error)
        Alert.alert('Error', 'Failed to fetch vehicles')
        return
      }

      setVehicles(vehiclesData || [])
    } catch (error) {
      console.error('Error in fetchVehicles:', error)
      Alert.alert('Error', 'Something went wrong while fetching vehicles')
    } finally {
      setLoading(false)
    }
  }

  const fetchVehicleVariants = async () => {
    try {
      const { data: variantsData, error } = await supabase
        .from('vehicle_variants')
        .select('*')
        .order('color', { ascending: true })

      if (error) {
        console.error('Error fetching vehicle variants:', error)
        return
      }

      setVehicleVariants(variantsData || [])
    } catch (error) {
      console.error('Error in fetchVehicleVariants:', error)
    }
  }

  const fetchBookings = async () => {
    try {
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching bookings:', error)
        return
      }

      setBookings(bookingsData || [])
    } catch (error) {
      console.error('Error in fetchBookings:', error)
    }
  }

  const refreshData = async () => {
    setLoading(true)
    await Promise.all([fetchVehicles(), fetchVehicleVariants(), fetchBookings()])
  }

  const getVehicleStats = () => {
    const totalBookings = bookings.length
    const activeRentals = bookings.filter(b => b.status === "confirmed").length
    const maintenanceVehicles = vehicles.filter(v => v.status === "maintenance").length
    const totalRevenue = bookings.filter(b => b.status === "completed")
      .reduce((sum, b) => sum + (parseFloat(b.total_price) || 0), 0)

    return {
      totalBookings,
      activeRentals,
      maintenanceVehicles,
      totalRevenue
    }
  }

  // Get unique values for filter options
  const getUniqueSeats = () => {
    const seats = [...new Set(vehicles.map(v => v.seats).filter(Boolean))]
    return seats.sort((a, b) => a - b)
  }

  const getUniqueTypes = () => {
    const types = [...new Set(vehicles.map(v => v.type).filter(Boolean))]
    return types.sort()
  }

  const clearAllFilters = () => {
    setSearchText("")
    setSelectedSeats("all")
    setSelectedType("all")
    setPriceRange("all")
    setActiveFilter("all")
  }

  const showDeleteConfirmation = (vehicle) => {
    setVehicleToDelete(vehicle)
    setDeleteModalVisible(true)
  }

  const hideDeleteConfirmation = () => {
    setDeleteModalVisible(false)
    setVehicleToDelete(null)
  }

  const confirmDeleteVehicle = async () => {
    if (!vehicleToDelete) return

    setDeleting(true)
    
    try {
      // Delete vehicle (variants will be deleted automatically due to cascade)
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleToDelete.id)

      if (error) {
        console.error('Error deleting vehicle:', error)
        Alert.alert("Error", "Failed to delete vehicle")
        return
      }

      Alert.alert("Success", "Vehicle deleted successfully")
      hideDeleteConfirmation()
      
      // Data will be updated automatically via real-time subscription
    } catch (error) {
      console.error('Error in confirmDeleteVehicle:', error)
      Alert.alert("Error", "Failed to delete vehicle")
    } finally {
      setDeleting(false)
    }
  }

  const renderVehicleItem = ({ item }) => {
    const variants = getVehicleVariants(item.id)
    const totalVariantQuantity = variants.reduce((sum, variant) => sum + variant.total_quantity, 0)
    const availableVariantQuantity = variants.reduce((sum, variant) => sum + variant.available_quantity, 0)

    return (
      <View style={styles.vehicleCard}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.image_url || "https://via.placeholder.com/400x240?text=No+Image" }}
            style={styles.vehicleImage}
            resizeMode="cover"
          />
          <View style={styles.imageOverlay}>
            <View style={[styles.statusBadge, { 
              backgroundColor: item.available ? "#10b981" : "#ef4444",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }]}>
              <Ionicons 
                name={item.available ? "checkmark-circle" : "time"} 
                size={14} 
                color="white" 
              />
              <Text style={styles.statusText}>
                {item.available ? "Available" : "Rented"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.vehicleContent}>
          <View style={styles.vehicleHeader}>
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleName}>
                {item.make} {item.model}
              </Text>
              <Text style={styles.vehicleYear}>{item.year} • {item.type}</Text>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.priceAmount}>₱{parseFloat(item.price_per_day || 0).toLocaleString()}</Text>
              <Text style={styles.priceLabel}>/day</Text>
            </View>
          </View>

          <View style={styles.vehicleFeatures}>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="people" size={14} color="#6b7280" />
              </View>
              <Text style={styles.featureText}>{item.seats} seats</Text>
            </View>
            
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="speedometer" size={14} color="#6b7280" />
              </View>
              <Text style={styles.featureText}>
                {item.mileage ? `${item.mileage.toLocaleString()} mi` : "N/A"}
              </Text>
            </View>
            
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="car" size={14} color="#6b7280" />
              </View>
              <Text style={styles.featureText}>{item.type}</Text>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="color-palette" size={14} color="#6b7280" />
              </View>
              <Text style={styles.featureText}>{variants.length} color{variants.length !== 1 ? 's' : ''}</Text>
            </View>
          </View>

          {/* Color Variants Preview */}
          {variants.length > 0 && (
            <View style={styles.variantsPreview}>
              <Text style={styles.variantsTitle}>Available Colors:</Text>
              <View style={styles.variantsList}>
                {variants.slice(0, 3).map((variant, index) => (
                  <View key={variant.id} style={styles.variantChip}>
                    <Text style={styles.variantColor}>{variant.color}</Text>
                    <Text style={styles.variantQuantity}>({variant.available_quantity})</Text>
                  </View>
                ))}
                {variants.length > 3 && (
                  <Text style={styles.moreVariants}>+{variants.length - 3} more</Text>
                )}
              </View>
            </View>
          )}

          {item.description && (
            <Text style={styles.vehicleDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.secondaryButton, styles.flexButton]}
              onPress={() => navigation.navigate("AddVehicle", { vehicle: item })}
            >
              <Ionicons name="create" size={16} color="black" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dangerButton, styles.flexButton]}
              onPress={() => showDeleteConfirmation(item)}
            >
              <Ionicons name="trash" size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }

  const renderFiltersModal = () => (
    <Modal
      visible={showFilters}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.filtersModalOverlay}>
        <View style={styles.filtersModalContainer}>
          <View style={styles.filtersHeader}>
            <Text style={styles.filtersTitle}>Advanced Filters</Text>
            <TouchableOpacity
              style={styles.filtersCloseButton}
              onPress={() => setShowFilters(false)}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filtersContent} showsVerticalScrollIndicator={false}>
            {/* Seats Filter */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupTitle}>Number of Seats</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[styles.filterOption, selectedSeats === "all" && styles.filterOptionActive]}
                  onPress={() => setSelectedSeats("all")}
                >
                  <Text style={[styles.filterOptionText, selectedSeats === "all" && styles.filterOptionTextActive]}>
                    All Seats
                  </Text>
                </TouchableOpacity>
                {getUniqueSeats().map(seats => (
                  <TouchableOpacity
                    key={seats}
                    style={[styles.filterOption, selectedSeats === seats.toString() && styles.filterOptionActive]}
                    onPress={() => setSelectedSeats(seats.toString())}
                  >
                    <Text style={[styles.filterOptionText, selectedSeats === seats.toString() && styles.filterOptionTextActive]}>
                      {seats} seats
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Vehicle Type Filter */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupTitle}>Vehicle Type</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[styles.filterOption, selectedType === "all" && styles.filterOptionActive]}
                  onPress={() => setSelectedType("all")}
                >
                  <Text style={[styles.filterOptionText, selectedType === "all" && styles.filterOptionTextActive]}>
                    All Types
                  </Text>
                </TouchableOpacity>
                {getUniqueTypes().map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.filterOption, selectedType === type && styles.filterOptionActive]}
                    onPress={() => setSelectedType(type)}
                  >
                    <Text style={[styles.filterOptionText, selectedType === type && styles.filterOptionTextActive]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Price Range Filter */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupTitle}>Price Range (per day)</Text>
              <View style={styles.filterOptions}>
                {[
                  { key: "all", label: "All Prices" },
                  { key: "under-1000", label: "Under ₱1,000" },
                  { key: "1000-2000", label: "₱1,000 - ₱2,000" },
                  { key: "2000-5000", label: "₱2,000 - ₱5,000" },
                  { key: "over-5000", label: "Over ₱5,000" }
                ].map(option => (
                  <TouchableOpacity
                    key={option.key}
                    style={[styles.filterOption, priceRange === option.key && styles.filterOptionActive]}
                    onPress={() => setPriceRange(option.key)}
                  >
                    <Text style={[styles.filterOptionText, priceRange === option.key && styles.filterOptionTextActive]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.filtersActions}>
            <TouchableOpacity
              style={styles.filtersClearButton}
              onPress={clearAllFilters}
            >
              <Text style={styles.filtersClearText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filtersApplyButton}
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.filtersApplyText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )

  const renderDeleteModal = () => (
    <Modal
      visible={deleteModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={hideDeleteConfirmation}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="warning" size={32} color="#ef4444" />
            </View>
            <Text style={styles.modalTitle}>Delete Vehicle</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete{' '}
              <Text style={styles.modalVehicleName}>
                {vehicleToDelete?.make} {vehicleToDelete?.model}
              </Text>
              ? This action cannot be undone and will also delete all associated color variants.
            </Text>
          </View>
          
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={hideDeleteConfirmation}
              disabled={deleting}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalDeleteButton, deleting && styles.modalButtonDisabled]}
              onPress={confirmDeleteVehicle}
              disabled={deleting}
            >
              {deleting ? (
                <Text style={styles.modalDeleteText}>Deleting...</Text>
              ) : (
                <>
                  <Ionicons name="trash" size={16} color="white" />
                  <Text style={styles.modalDeleteText}>Delete</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )

  const renderHeader = () => {
    const stats = getVehicleStats()
    const activeFiltersCount = [searchText, selectedSeats, selectedType, priceRange].filter(
      f => f && f !== "all"
    ).length
    
    return (
      <>
        {/* Header with Enhanced Design */}
        <View style={styles.headerContainer}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Vehicle</Text>
              <Text style={styles.headerSubtitle}>
                Manage your rental vehicles
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => navigation.navigate("AddVehicle")}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.addButtonText}>Add Vehicle</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Enhanced Stats Cards */}
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="car-sport" size={24} color="#222" />
              </View>
              <Text style={styles.statValue}>{vehicles.length}</Text>
              <Text style={styles.statLabel}>Total Fleet</Text>
              <View style={styles.statTrend}>
                <Ionicons name="trending-up" size={12} color="#10b981" />
                <Text style={styles.statTrendText}>Fleet size</Text>
              </View>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="color-palette" size={24} color="#222" />
              </View>
              <Text style={styles.statValue}>{vehicleVariants.length}</Text>
              <Text style={styles.statLabel}>Color Variants</Text>
              <View style={styles.statTrend}>
                <Ionicons name="options" size={12} color="#8b5cf6" />
                <Text style={[styles.statTrendText, { color: "#8b5cf6" }]}>Total options</Text>
              </View>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="time" size={24} color="#222" />
              </View>
              <Text style={styles.statValue}>{stats.activeRentals}</Text>
              <Text style={styles.statLabel}>Active Rentals</Text>
              <View style={styles.statTrend}>
                <Ionicons name="pulse" size={12} color="#3b82f6" />
                <Text style={[styles.statTrendText, { color: "#3b82f6" }]}>Currently active</Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="analytics" size={24} color="#222" />
              </View>
              <Text style={styles.statValue}>{stats.totalBookings}</Text>
              <Text style={styles.statLabel}>Total Bookings</Text>
              <View style={styles.statTrend}>
                <Ionicons name="bar-chart" size={12} color="#f59e0b" />
                <Text style={[styles.statTrendText, { color: "#f59e0b" }]}>All time</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search vehicles..."
                value={searchText}
                onChangeText={setSearchText}
                placeholderTextColor="#9ca3af"
                autoCorrect={false}
                autoCapitalize="none"
              />

              {searchText.length > 0 && (
                <TouchableOpacity
                  style={styles.searchClearButton}
                  onPress={() => setSearchText("")}
                >
                  <Ionicons name="close-circle" size={20} color="#6b7280" />
                </TouchableOpacity>
              )}
            </View>
            
            <TouchableOpacity
              style={[styles.filtersButton, activeFiltersCount > 0 && styles.filtersButtonActive]}
              onPress={() => setShowFilters(true)}
            >
              <Ionicons 
                name="options" 
                size={20} 
                color={activeFiltersCount > 0 ? "white" : "#6b7280"} 
              />
              {activeFiltersCount > 0 && (
                <View style={styles.filtersBadge}>
                  <Text style={styles.filtersBadgeText}>{activeFiltersCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Enhanced Filter Section */}
        <View style={styles.filterSection}>
          <View style={styles.filterHeader}>
            <Text style={styles.sectionTitle}>Vehicle Overview</Text>
            <Text style={styles.sectionSubtitle}>
              {filteredVehicles.length} vehicles
            </Text>
          </View>
          
          <View style={styles.filterTabs}>
            {[
              { key: "all", label: "All", count: vehicles.length },
              { key: "available", label: "Available", count: vehicles.filter(v => v.available).length },
              { key: "rented", label: "Rented", count: vehicles.filter(v => !v.available).length }
            ].map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterTab,
                  activeFilter === filter.key && styles.activeFilterTab
                ]}
                onPress={() => setActiveFilter(filter.key)}
              >
                <Text style={[
                  styles.filterTabText,
                  activeFilter === filter.key && styles.activeFilterTabText
                ]}>
                  {filter.label}
                </Text>
                <View style={[
                  styles.filterCount,
                  activeFilter === filter.key && styles.activeFilterCount
                ]}>
                  <Text style={[
                    styles.filterCountText,
                    activeFilter === filter.key && styles.activeFilterCountText
                  ]}>
                    {filter.count}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Active Filters Display */}
        {(searchText || selectedSeats !== "all" || selectedType !== "all" || priceRange !== "all") && (
          <View style={styles.activeFiltersSection}>
            <View style={styles.activeFiltersHeader}>
              <Text style={styles.activeFiltersTitle}>Active Filters</Text>
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={clearAllFilters}
              >
                <Text style={styles.clearFiltersText}>Clear All</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.activeFiltersList}>
              {searchText && (
                <View style={styles.activeFilter}>
                  <Text style={styles.activeFilterText}>Search: "{searchText}"</Text>
                  <TouchableOpacity onPress={() => setSearchText("")}>
                    <Ionicons name="close" size={16} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              )}
              {selectedSeats !== "all" && (
                <View style={styles.activeFilter}>
                  <Text style={styles.activeFilterText}>{selectedSeats} seats</Text>
                  <TouchableOpacity onPress={() => setSelectedSeats("all")}>
                    <Ionicons name="close" size={16} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              )}
              {selectedType !== "all" && (
                <View style={styles.activeFilter}>
                  <Text style={styles.activeFilterText}>{selectedType}</Text>
                  <TouchableOpacity onPress={() => setSelectedType("all")}>
                    <Ionicons name="close" size={16} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              )}
              {priceRange !== "all" && (
                <View style={styles.activeFilter}>
                  <Text style={styles.activeFilterText}>
                    {priceRange === "under-1000" && "Under ₱1,000"}
                    {priceRange === "1000-2000" && "₱1,000-₱2,000"}
                    {priceRange === "2000-5000" && "₱2,000-₱5,000"}
                    {priceRange === "over-5000" && "Over ₱5,000"}
                  </Text>
                  <TouchableOpacity onPress={() => setPriceRange("all")}>
                    <Ionicons name="close" size={16} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}
      </>
    )
  }

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="car-outline" size={64} color="#d1d5db" />
      </View>
      <Text style={styles.emptyStateTitle}>
        {activeFilter === "all" && !searchText && selectedSeats === "all" && selectedType === "all" && priceRange === "all" 
          ? "No vehicles yet" 
          : "No vehicles found"
        }
      </Text>
      <Text style={styles.emptyStateDescription}>
        {activeFilter === "all" && !searchText && selectedSeats === "all" && selectedType === "all" && priceRange === "all"
          ? "Add your first vehicle to get started with your rental business"
          : "Try adjusting your search or filters to find what you're looking for"
        }
      </Text>
      {(searchText || selectedSeats !== "all" || selectedType !== "all" || priceRange !== "all") ? (
        <TouchableOpacity
          style={styles.emptyStateButton}
          onPress={clearAllFilters}
        >
          <Ionicons name="refresh" size={18} color="white" />
          <Text style={styles.emptyStateButtonText}>Clear Filters</Text>
        </TouchableOpacity>
      ) : activeFilter === "all" && (
        <TouchableOpacity
          style={styles.emptyStateButton}
          onPress={() => navigation.navigate("AddVehicle")}
        >
          <Ionicons name="add" size={18} color="white" />
          <Text style={styles.emptyStateButtonText}>Add Your First Vehicle</Text>
        </TouchableOpacity>
      )}
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredVehicles}
        renderItem={renderVehicleItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl 
            refreshing={loading} 
            onRefresh={refreshData}
            colors={["#222"]}
            tintColor="#222"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        numColumns={1}
        ListEmptyComponent={!loading ? renderEmptyState : null}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
      />
      
      {renderDeleteModal()}
      {renderFiltersModal()}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  headerContainer: {
    backgroundColor: "white",
    paddingBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#222",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  addButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  statsSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  statTrend: {
    flexDirection: "row",
    alignItems: "center",
  },
  statTrendText: {
    fontSize: 11,
    color: "#10b981",
    fontWeight: "500",
    marginLeft: 4,
  },
  // Search Section Styles
  searchSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  searchContainer: {
    flexDirection: "row",
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },
  searchClearButton: {
    marginLeft: 8,
  },
  filtersButton: {
    width: 48,
    height: 48,
    backgroundColor: "white",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    position: "relative",
  },
  filtersButtonActive: {
    backgroundColor: "#222",
  },
  filtersBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#ef4444",
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  filtersBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
  },
  filterSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  filterTabs: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 4,
  },
  filterTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  activeFilterTab: {
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
    marginRight: 6,
  },
  activeFilterTabText: {
    color: "#111827",
  },
  filterCount: {
    backgroundColor: "#e5e7eb",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 20,
    alignItems: "center",
  },
  activeFilterCount: {
    backgroundColor: "#222",
  },
  filterCountText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6b7280",
  },
  activeFilterCountText: {
    color: "white",
  },
  // Active Filters Section
  activeFiltersSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  activeFiltersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  activeFiltersTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  clearFiltersButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
  },
  clearFiltersText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
  },
  activeFiltersList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  activeFilter: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e0f2fe",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  activeFilterText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#0369a1",
  },
  // Filters Modal Styles
  filtersModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  filtersModalContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    paddingBottom: 20,
  },
  filtersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  filtersTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  filtersCloseButton: {
    padding: 4,
  },
  filtersContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filterGroup: {
    marginBottom: 32,
  },
  filterGroupTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  filterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#f3f4f6",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "transparent",
  },
  filterOptionActive: {
    backgroundColor: "#222",
    borderColor: "#222",
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  filterOptionTextActive: {
    color: "white",
  },
  filtersActions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  filtersClearButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    alignItems: "center",
  },
  filtersClearText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  filtersApplyButton: {
    flex: 2,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#222",
    borderRadius: 12,
    alignItems: "center",
  },
  filtersApplyText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  vehicleCard: {
    backgroundColor: "white",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    overflow: "hidden",
  },
  imageContainer: {
    position: "relative",
    height: 200,
  },
  vehicleImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f3f4f6",
  },
  imageOverlay: {
    position: "absolute",
    top: 16,
    right: 16,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  vehicleContent: {
    padding: 20,
  },
  vehicleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  vehicleInfo: {
    flex: 1,
    marginRight: 12,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  vehicleYear: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  priceAmount: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },
  priceLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  vehicleFeatures: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: "30%",
  },
  featureIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  featureText: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },
  variantsPreview: {
    marginBottom: 16,
  },
  variantsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  variantsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  variantChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  variantColor: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "500",
  },
  variantQuantity: {
    fontSize: 11,
    color: "#6b7280",
    marginLeft: 4,
  },
  moreVariants: {
    fontSize: 12,
    color: "#6b7280",
    fontStyle: "italic",
    alignSelf: "center",
  },
  vehicleDescription: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  primaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#222",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  secondaryButton: {
    backgroundColor: "#f3f4f6",
  },
  dangerButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ef4444",
  },
  flexButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f9fafb",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#f1f5f9",
    borderStyle: "dashed",
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateDescription: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 32,
  },
  emptyStateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#222",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyStateButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  // Delete Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fef2f2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
  },
  modalVehicleName: {
    fontWeight: "600",
    color: "#111827",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  modalDeleteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#ef4444",
    gap: 6,
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  modalDeleteText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },
})