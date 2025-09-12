import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { supabase } from "../services/supabase";

// screen width for scaling
const { width } = Dimensions.get("window");

const monthNames = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

export default function BookingOverviewChart() {
  // filter states
  const [overviewFilter, setOverviewFilter] = useState("Weekly");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedWeekRange, setSelectedWeekRange] = useState(null);

  // dropdown modals
  const [yearDropdownVisible, setYearDropdownVisible] = useState(false);
  const [monthDropdownVisible, setMonthDropdownVisible] = useState(false);
  const [weekDropdownVisible, setWeekDropdownVisible] = useState(false);

  const [chartData, setChartData] = useState([]);

  // simulate chart data generation (replace with supabase fetch if needed)
  useEffect(() => {
    generateChartData();
  }, [overviewFilter, selectedYear, selectedMonth, selectedWeekRange]);

  useEffect(() => {
    fetchChartData();
  }, [overviewFilter, selectedYear, selectedMonth, selectedWeekRange]);

  // ✅ Real fetch from bookings
  const fetchChartData = async () => {
    try {
      let startDate, endDate;

      if (overviewFilter === "Today") {
        startDate = new Date(selectedYear, selectedMonth, new Date().getDate());
        endDate = new Date(startDate);
      } else if (overviewFilter === "Weekly") {
        const now = new Date();
        const firstDay = now.getDate() - now.getDay() + 1; // Monday
        startDate = new Date(now.setDate(firstDay));
        endDate = new Date(now.setDate(firstDay + 6));
      } else if (overviewFilter === "Monthly") {
        startDate = new Date(selectedYear, selectedMonth, 1);
        endDate = new Date(selectedYear, selectedMonth + 1, 0);
      } else {
        // Yearly
        startDate = new Date(selectedYear, 0, 1);
        endDate = new Date(selectedYear, 11, 31);
      }

      // Query bookings from Supabase
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .gte("rental_start_date", startDate.toISOString().split("T")[0])
        .lte("rental_start_date", endDate.toISOString().split("T")[0]);

      if (error) throw error;

      // Group bookings by filter
      let grouped = [];
      if (overviewFilter === "Today") {
        grouped = Array.from({ length: 24 }, (_, i) => ({
          label: `${i}h`,
          bookings: data.filter(
            (b) => new Date(b.rental_start_date).getHours() === i
          ).length,
          revenue: data
            .filter(
              (b) =>
                new Date(b.rental_start_date).getHours() === i &&
                b.status === "completed"
            )
            .reduce((sum, b) => sum + Number(b.total_price), 0),
        }));
      } else if (overviewFilter === "Weekly") {
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        grouped = days.map((d, i) => {
          const target = new Date(startDate);
          target.setDate(startDate.getDate() + i);
          const dayStr = target.toISOString().split("T")[0];

          return {
            label: d,
            bookings: data.filter((b) => b.rental_start_date === dayStr).length,
            revenue: data
              .filter(
                (b) =>
                  b.rental_start_date === dayStr && b.status === "completed"
              )
              .reduce((sum, b) => sum + Number(b.total_price), 0),
          };
        });
      } else if (overviewFilter === "Monthly") {
        const daysInMonth = new Date(
          selectedYear,
          selectedMonth + 1,
          0
        ).getDate();
        grouped = Array.from({ length: daysInMonth }, (_, i) => {
          const dayStr = new Date(
            selectedYear,
            selectedMonth,
            i + 1
          ).toISOString().split("T")[0];

          return {
            label: `${i + 1}`,
            bookings: data.filter((b) => b.rental_start_date === dayStr).length,
            revenue: data
              .filter(
                (b) => b.rental_start_date === dayStr && b.status === "completed"
              )
              .reduce((sum, b) => sum + Number(b.total_price), 0),
          };
        });
      } else {
        // Yearly
        grouped = monthNames.map((m, i) => {
          return {
            label: m.slice(0, 3),
            bookings: data.filter(
              (b) => new Date(b.rental_start_date).getMonth() === i
            ).length,
            revenue: data
              .filter(
                (b) =>
                  new Date(b.rental_start_date).getMonth() === i &&
                  b.status === "completed"
              )
              .reduce((sum, b) => sum + Number(b.total_price), 0),
          };
        });
      }

      setChartData(grouped);
    } catch (err) {
      console.error("Error fetching chart data:", err);
    }
  };
  const generateChartData = () => {
    let data = [];
    if (overviewFilter === "Today") {
      data = Array.from({ length: 12 }, (_, i) => ({
        label: `${i + 1}h`,
        bookings: Math.floor(Math.random() * 5),
      }));
    } else if (overviewFilter === "Weekly") {
      data = Array.from({ length: 7 }, (_, i) => ({
        label: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
        bookings: Math.floor(Math.random() * 10),
      }));
    } else if (overviewFilter === "Monthly") {
      const days = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      data = Array.from({ length: days }, (_, i) => ({
        label: `${i + 1}`,
        bookings: Math.floor(Math.random() * 8),
      }));
    }
    setChartData(data);
  };

  const getTrendColor = () => {
    if (chartData.length < 2) return "#6b7280";
    const recent = chartData.slice(-2);
    return recent[1].bookings > recent[0].bookings ? "#10b981" : "#ef4444";
  };

  const getTrendPercentage = () => {
    if (chartData.length < 2) return "0%";
    const recent = chartData.slice(-2);
    if (recent[0].bookings === 0) return recent[1].bookings > 0 ? "+100%" : "0%";
    const percentage =
      ((recent[1].bookings - recent[0].bookings) / recent[0].bookings) * 100;
    return percentage > 0
      ? `+${percentage.toFixed(1)}%`
      : `${percentage.toFixed(1)}%`;
  };

  // render line chart
  const renderLineChart = () => {
    if (chartData.length === 0) return null;
  
    const maxBookings = Math.max(...chartData.map((d) => d.bookings), 1);
    const chartHeight = 140;
    const chartWidth = width - 64;
    const stepX = chartWidth / (chartData.length - 1);
  
    const points = chartData.map((d, i) => {
      const x = i * stepX;
      const y = chartHeight - (d.bookings / maxBookings) * chartHeight;
      return { ...d, x, y };
    });
  
    const pathData = points
      .map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`))
      .join(" ");
  
    // Summary
    const totalBookings = chartData.reduce((sum, d) => sum + d.bookings, 0);
    const totalRevenue = chartData.reduce(
      (sum, d) => sum + (d.status === "completed" ? d.revenue : 0),
      0
    );
    const trendPercentage = getTrendPercentage();
  
    return (
      <View style={styles.chartContainer}>
        <View style={{ flexDirection: "row" }}>
          {/* Y-Axis labels */}
          <View style={styles.yAxis}>
            <Text style={styles.yAxisLabel}>{maxBookings}</Text>
            <Text style={styles.yAxisLabel}>{Math.floor(maxBookings / 2)}</Text>
            <Text style={styles.yAxisLabel}>0</Text>
          </View>
  
          {/* Chart */}
          <Svg height={chartHeight + 20} width={chartWidth}>
            <Defs>
              <LinearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={getTrendColor()} stopOpacity="1" />
                <Stop offset="1" stopColor={getTrendColor()} stopOpacity="0.2" />
              </LinearGradient>
            </Defs>
  
            {/* Line Path */}
            <Path d={pathData} fill="none" stroke="url(#lineGradient)" strokeWidth={2} />
  
            {/* Points */}
            {points.map((p, i) => (
              <Circle key={i} cx={p.x} cy={p.y} r={3} fill={getTrendColor()} />
            ))}
          </Svg>
        </View>
  
        {/* X-axis */}
        <View style={styles.xAxis}>
          {points.map((p, i) => (
            <Text key={i} style={styles.xAxisLabel}>
              {p.label}
            </Text>
          ))}
        </View>
  
        {/* Chart Stats */}
        <View style={styles.chartStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalBookings}</Text>
            <Text style={styles.statLabel}>Total Bookings</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>₱{totalRevenue.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Total Revenue</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: getTrendColor() }]}>
              {trendPercentage}
            </Text>
            <Text style={styles.statLabel}>Trend</Text>
          </View>
        </View>
      </View>
    );
  };
  
  
  return (
    <View style={styles.summaryCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.sectionTitle}>Booking Overview</Text>
        <Text style={[styles.trendText, { color: getTrendColor() }]}>
          {getTrendPercentage()}
        </Text>
      </View>

      {/* Primary Filters */}
      <View style={styles.overviewFilters}>
        <View style={styles.overviewFilterRow}>
          {["Today", "Weekly", "Monthly"].map((label) => (
            <TouchableOpacity
              key={label}
              onPress={() => setOverviewFilter(label)}
              style={[
                styles.overviewFilterButton,
                overviewFilter === label && styles.overviewFilterButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.overviewFilterButtonText,
                  overviewFilter === label && styles.overviewFilterButtonTextActive,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Secondary Filters */}
        <View style={styles.secondaryFilterRow}>
          <TouchableOpacity
            style={styles.secondaryFilterButton}
            onPress={() => setYearDropdownVisible(true)}
          >
            <Text style={styles.secondaryFilterButtonText}>{selectedYear}</Text>
            <Ionicons name="chevron-down" size={14} color="#6b7280" />
          </TouchableOpacity>

          {overviewFilter === "Monthly" && (
            <TouchableOpacity
              style={styles.secondaryFilterButton}
              onPress={() => setMonthDropdownVisible(true)}
            >
              <Text style={styles.secondaryFilterButtonText}>
                {monthNames[selectedMonth]}
              </Text>
              <Ionicons name="chevron-down" size={14} color="#6b7280" />
            </TouchableOpacity>
          )}

          {overviewFilter === "Weekly" && (
            <TouchableOpacity
              style={styles.secondaryFilterButton}
              onPress={() => setWeekDropdownVisible(true)}
            >
              <Text style={styles.secondaryFilterButtonText}>
                {selectedWeekRange
                  ? selectedWeekRange.label
                  : `${monthNames[selectedMonth]} weeks`}
              </Text>
              <Ionicons name="chevron-down" size={14} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {renderLineChart()}

      {/* Year Dropdown */}
      <Modal visible={yearDropdownVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.dropdownContainer}>
            <FlatList
              data={[2023, 2024, 2025]}
              keyExtractor={(item) => item.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedYear(item);
                    setYearDropdownVisible(false);
                  }}
                >
                  <Text style={styles.dropdownText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Month Dropdown */}
      <Modal visible={monthDropdownVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.dropdownContainer}>
            <FlatList
              data={monthNames}
              keyExtractor={(item, idx) => idx.toString()}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedMonth(index);
                    setMonthDropdownVisible(false);
                  }}
                >
                  <Text style={styles.dropdownText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: "800",
    fontSize: 18,
  },
  trendText: {
    fontWeight: "600",
    fontSize: 14,
  },
  overviewFilters: { marginBottom: 16 },
  overviewFilterRow: { flexDirection: "row", gap: 12 },
  overviewFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  overviewFilterButtonActive: { backgroundColor: "#3b82f6" },
  overviewFilterButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  overviewFilterButtonTextActive: { color: "white" },
  secondaryFilterRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  secondaryFilterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    backgroundColor: "#f9fafb",
    gap: 4,
  },
  secondaryFilterButtonText: { fontSize: 14, fontWeight: "500" },
  chartWrapper: { marginTop: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    width: "80%",
    maxHeight: "60%",
  },
  dropdownItem: { padding: 12 },
  dropdownText: { fontSize: 16, fontWeight: "500" },chartStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    paddingHorizontal: 8,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },chartContainer: {
    marginTop: 16,
  },
  yAxis: {
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginRight: 6,
    height: 140,
  },
  yAxisLabel: {
    fontSize: 10,
    color: "#6b7280",
  },
  xAxis: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  xAxisLabel: {
    fontSize: 10,
    color: "#6b7280",
  },
  
  
});
