"use client"

import { useState, useEffect } from "react"
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
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { SafeAreaView } from "react-native-safe-area-context"
import { supabase } from '../services/supabase' // Adjust path as needed

const { width } = Dimensions.get("window")
const isWeb = Platform.OS === "web"

export default function VehiclesScreen({ navigation }) {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState("all")
  const [bookings, setBookings] = useState([])

  useEffect(() => {
    fetchVehicles()
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
    await Promise.all([fetchVehicles(), fetchBookings()])
  }

  const getFilteredVehicles = () => {
    switch (activeFilter) {
      case "available":
        return vehicles.filter(v => 
          !bookings.some(b => b.vehicle_id === v.id && b.status === "confirmed")
        )
      case "rented":
        return vehicles.filter(v => 
          bookings.some(b => b.vehicle_id === v.id && b.status === "confirmed")
        )
      case "maintenance":
        return vehicles.filter(v => v.status === "maintenance")
      default:
        return vehicles
    }
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

  const deleteVehicle = (vehicleId, vehicleName) => {
    Alert.alert("Delete Vehicle", `Are you sure you want to delete ${vehicleName}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase
              .from('vehicles')
              .delete()
              .eq('id', vehicleId)

            if (error) {
              console.error('Error deleting vehicle:', error)
              Alert.alert("Error", "Failed to delete vehicle")
              return
            }

            Alert.alert("Success", "Vehicle deleted successfully")
            // Data will be updated automatically via real-time subscription
          } catch (error) {
            console.error('Error in deleteVehicle:', error)
            Alert.alert("Error", "Failed to delete vehicle")
          }
        },
      },
    ])
  }

  const renderVehicleItem = ({ item }) => (
    <View style={styles.vehicleCard}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.image_url || item.imageUrl || "https://via.placeholder.com/400x240?text=No+Image" }}
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
            <Text style={styles.priceAmount}>₱{parseFloat(item.price_per_day || item.pricePerDay || 0).toLocaleString()}</Text>
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

          {item.license_plate && (
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="document-text" size={14} color="#6b7280" />
              </View>
              <Text style={styles.featureText}>{item.license_plate}</Text>
            </View>
          )}
        </View>

        {item.description && (
          <Text style={styles.vehicleDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate("VehicleDetails", { vehicle: item })}
          >
            <Ionicons name="eye" size={16} color="white" />
            <Text style={styles.primaryButtonText}>View Details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate("AddVehicle", { vehicle: item })}
          >
            <Ionicons name="create" size={16} color="#374151" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dangerButton}
            onPress={() => deleteVehicle(item.id, `${item.make} ${item.model}`)}
          >
            <Ionicons name="trash" size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )

  const renderHeader = () => {
    const stats = getVehicleStats()
    
    return (
      <>
        {/* Header with Enhanced Design */}
        <View style={styles.headerContainer}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Vehicle Fleet</Text>
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
                <Ionicons name="calendar" size={24} color="#222" />
              </View>
              <Text style={styles.statValue}>{stats.totalBookings}</Text>
              <Text style={styles.statLabel}>Total Bookings</Text>
              <View style={styles.statTrend}>
                <Ionicons name="trending-up" size={12} color="#10b981" />
                <Text style={styles.statTrendText}>All time</Text>
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
                <Ionicons name="cash" size={24} color="#222" />
              </View>
              <Text style={styles.statValue}>₱{stats.totalRevenue.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Total Revenue</Text>
              <View style={styles.statTrend}>
                <Ionicons name="trending-up" size={12} color="#10b981" />
                <Text style={styles.statTrendText}>All completed</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Enhanced Filter Section */}
        <View style={styles.filterSection}>
          <View style={styles.filterHeader}>
            <Text style={styles.sectionTitle}>Fleet Overview</Text>
            <Text style={styles.sectionSubtitle}>
              {getFilteredVehicles().length} vehicles
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
      </>
    )
  }

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="car-outline" size={64} color="#d1d5db" />
      </View>
      <Text style={styles.emptyStateTitle}>
        {activeFilter === "all" ? "No vehicles yet" : `No ${activeFilter} vehicles`}
      </Text>
      <Text style={styles.emptyStateDescription}>
        {activeFilter === "all" 
          ? "Add your first vehicle to get started with your rental business"
          : `You don't have any ${activeFilter} vehicles at the moment`
        }
      </Text>
      {activeFilter === "all" && (
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
        data={getFilteredVehicles()}
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
  filterSection: {
    paddingHorizontal: 20,
    paddingTop: 32,
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
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  dangerButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#fef2f2",
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
})