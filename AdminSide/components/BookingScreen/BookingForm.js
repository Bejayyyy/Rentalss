import React, { useMemo, useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Dropdown } from "react-native-element-dropdown";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../../services/supabase";
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

export default function BookingForm({
  booking,
  setBooking,
  availableVehicles,
  styles,
  formatDate,
  setDatePickerVisible,
  setDateField,
  setVehiclePickerVisible,
  isEdit = false,
}) {
  const [allVehicles, setAllVehicles] = useState([]);

  // Fetch ALL vehicles when editing (not just available ones)
  useEffect(() => {
    if (isEdit && booking.vehicle_id) {
      fetchAllVehicles();
    }
  }, [isEdit, booking.vehicle_id]);

  const fetchAllVehicles = async () => {
    try {
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
        `);
      
      if (error) {
        console.error('Error fetching all vehicles:', error);
        return;
      }
      
      setAllVehicles(data || []);
    } catch (error) {
      console.error('Error fetching all vehicles:', error);
    }
  };

  // Use allVehicles for edit mode, availableVehicles for add mode
  const vehicleSource = isEdit ? allVehicles : availableVehicles;

  // Deduped list of vehicles
  const uniqueVehicles = useMemo(() => {
    const map = {};
    (vehicleSource || []).forEach((variant) => {
      const vid = variant.vehicle_id;
      if (!vid) return;
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
  }, [vehicleSource]);

  const selectedVehicle = uniqueVehicles.find(
    (v) => v.vehicle_id === booking.vehicle_id
  );

  // Variants for the selected vehicle
  const variants = useMemo(() => {
    if (!booking.vehicle_id) return [];
    return vehicleSource
      .filter((v) => v.vehicle_id === booking.vehicle_id)
      .map((v) => ({
        label: `${v.color} (${v.available_quantity}/${v.total_quantity})`,
        value: v.id,
      }));
  }, [vehicleSource, booking.vehicle_id]);

  // Upload Gov ID
  const pickGovIdFile = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert("Permission required to select an ID.");
      return;
    }
  
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
  
    if (!result.canceled) {
      try {
        const file = result.assets[0];
        const uri = file.uri;
        const fileExt = uri.split(".").pop()?.toLowerCase() || "jpg";
        const safeExt = fileExt === "heic" ? "jpg" : fileExt;
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${safeExt}`;
        const filePath = `gov_ids/${fileName}`;
        let contentType = `image/${safeExt === "jpg" ? "jpeg" : safeExt}`;
  
        const isWeb = Platform.OS === 'web';
  
        if (isWeb) {
          const response = await fetch(uri);
          if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
          const blob = await response.blob();
          if (blob.type) contentType = blob.type;
  
          const fileObj = new File([blob], fileName, { type: contentType });
  
          const { error } = await supabase.storage
            .from("gov_ids")
            .upload(filePath, fileObj, { contentType, upsert: false });
  
          if (error) throw error;
        } else {
          const base64String = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
  
          const arrayBuffer = decode(base64String);
  
          const { error } = await supabase.storage
            .from("gov_ids")
            .upload(filePath, arrayBuffer, { contentType, upsert: false });
  
          if (error) throw error;
        }
  
        const { data: urlData } = supabase.storage
          .from("gov_ids")
          .getPublicUrl(filePath);
  
        const govIdUrl = urlData?.publicUrl || "";
        setBooking((prev) => ({ ...prev, gov_id_url: govIdUrl }));
      } catch (err) {
        console.error("Gov ID upload error:", err);
        alert("Failed to upload government ID. Please try again.");
      }
    }
  };

  return (
    <View>
      {/* Customer Info */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person-circle-outline" size={20} color="#3b82f6" />
          <Text style={styles.sectionTitle}>Customer Information</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Customer Name</Text>
          <TextInput
            style={styles.input}
            value={booking.customer_name}
            onChangeText={(text) =>
              setBooking((prev) => ({ ...prev, customer_name: text }))
            }
            placeholder="Enter customer name"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            value={booking.customer_email}
            onChangeText={(text) =>
              setBooking((prev) => ({ ...prev, customer_email: text }))
            }
            keyboardType="email-address"
            placeholder="Enter email"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Phone</Text>
          <TextInput
            style={styles.input}
            value={booking.customer_phone}
            onChangeText={(text) =>
              setBooking((prev) => ({ ...prev, customer_phone: text }))
            }
            keyboardType="phone-pad"
            placeholder="+63 xxx xxxx xxx"
          />
        </View>
      </View>

      {/* Rental Details */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="car-outline" size={20} color="#3b82f6" />
          <Text style={styles.sectionTitle}>Rental Details</Text>
        </View>

        {/* Dates */}
        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, styles.inputHalf]}>
            <Text style={styles.inputLabel}>Start Date</Text>
            <TouchableOpacity
              onPress={() => {
                setDatePickerVisible(true);
                setDateField("start");
              }}
              style={[styles.input, styles.dateInput]}
            >
              <Text style={styles.dateInputText}>
                {booking.rental_start_date
                  ? formatDate(booking.rental_start_date)
                  : "Select start date"}
              </Text>
              <Ionicons name="calendar-outline" size={16} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={[styles.inputGroup, styles.inputHalf]}>
            <Text style={styles.inputLabel}>End Date</Text>
            <TouchableOpacity
              onPress={() => {
                setDatePickerVisible(true);
                setDateField("end");
              }}
              style={[styles.input, styles.dateInput]}
            >
              <Text style={styles.dateInputText}>
                {booking.rental_end_date
                  ? formatDate(booking.rental_end_date)
                  : "Select end date"}
              </Text>
              <Ionicons name="calendar-outline" size={16} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Total Price */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Total Price</Text>
          <TextInput
            style={styles.input}
            value={booking.total_price?.toString()}
            onChangeText={(text) =>
              setBooking((prev) => ({ ...prev, total_price: text }))
            }
            keyboardType="numeric"
            placeholder="Enter total price"
          />
        </View>

        {/* Vehicle Dropdown */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Vehicle</Text>
          <Dropdown
            style={styles.input}
            data={uniqueVehicles.map((v) => ({
              label: `${v.year} ${v.make} ${v.model}`,
              value: v.vehicle_id,
            }))}
            labelField="label"
            valueField="value"
            placeholder="Select vehicle"
            value={booking.vehicle_id}
            onChange={(item) =>
              setBooking((prev) => ({
                ...prev,
                vehicle_id: item.value,
                vehicle_variant_id: null, // reset variant when vehicle changes
              }))
            }
            search
            maxHeight={300}
            renderItem={(item) => (
              <View style={{ padding: 10 }}>
                <Text>{item.label}</Text>
              </View>
            )}
          />
        </View>
            
        {/* Variant Dropdown */}
        {variants.length > 0 && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Variant Color</Text>
            <Dropdown
              style={styles.input}
              data={variants}
              labelField="label"
              valueField="value"
              placeholder="Select color"
              value={booking.vehicle_variant_id}
              onChange={(item) =>
                setBooking((prev) => ({
                  ...prev,
                  vehicle_variant_id: item.value,
                }))
              }
              renderItem={(item) => (
                <View style={{ padding: 10 }}>
                  <Text>{item.label}</Text>
                </View>
              )}
            />
          </View>
        )}

       

        {/* License */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>License Number</Text>
          <TextInput
            style={styles.input}
            value={booking.license_number}
            onChangeText={(text) =>
              setBooking((prev) => ({ ...prev, license_number: text }))
            }
            placeholder="Enter license number"
          />
        </View>

        {/* Gov ID */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Government ID</Text>
          <TouchableOpacity style={styles.uploadButton} onPress={pickGovIdFile}>
            <Text style={styles.uploadButtonText}>Upload Government ID</Text>
          </TouchableOpacity>
          {booking.gov_id_url ? (
            <View style={{ marginTop: 10, alignItems: "center" }}>
              <Image
                key={booking.gov_id_url}
                source={{ uri: booking.gov_id_url }}
                style={{ width: 200, height: 120, borderRadius: 8 }}
                resizeMode="cover"
              />
              <Text style={styles.uploadedText}>Preview of uploaded ID</Text>
            </View>
          ) : null}
        </View>

        {/* Status (Edit only) */}
        {isEdit && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Booking Status</Text>
            <Dropdown
              style={styles.input}
              data={[
                { label: "Pending", value: "pending" },
                { label: "Confirmed", value: "confirmed" },
                { label: "Completed", value: "completed" },
                { label: "Cancelled", value: "cancelled" },
              ]}
              labelField="label"
              valueField="value"
              placeholder="Select status"
              value={booking.status}
              onChange={(item) =>
                setBooking((prev) => ({ ...prev, status: item.value }))
              }
              renderItem={(item) => (
                <View style={{ padding: 10 }}>
                  <Text>{item.label}</Text>
                </View>
              )}
            />
          </View>
        )}
      </View>
    </View>
  );
}