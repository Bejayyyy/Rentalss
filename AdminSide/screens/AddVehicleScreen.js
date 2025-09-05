"use client"

import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Switch,
  Platform,
  Dimensions,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
import { supabase } from "../services/supabase"
import { SafeAreaView } from "react-native-safe-area-context"
import { decode } from 'base64-arraybuffer'
import * as FileSystem from 'expo-file-system'

const { width } = Dimensions.get("window")
const isWeb = Platform.OS === "web"

export default function AddVehicleScreen({ navigation, route }) {
  const editingVehicle = route?.params?.vehicle
  const isEditing = !!editingVehicle

  const [formData, setFormData] = useState({
    make: editingVehicle?.make || "",
    model: editingVehicle?.model || "",
    year: editingVehicle?.year?.toString() || "",
    type: editingVehicle?.type || "",
    seats: editingVehicle?.seats?.toString() || "",
    pricePerDay: editingVehicle?.price_per_day?.toString() || "",
    mileage: editingVehicle?.mileage?.toString() || "",
    description: editingVehicle?.description || "",
    available: editingVehicle?.available ?? true,
    totalQuantity: editingVehicle?.total_quantity?.toString() || "1",
    availableQuantity: editingVehicle?.available_quantity?.toString() || "1",
    imageUrl: editingVehicle?.image_url || null,
  })

  const [loading, setLoading] = useState(false)
  const [imageUri, setImageUri] = useState(editingVehicle?.image_url || null)

  const vehicleTypes = ["Sedan", "SUV", "Hatchback", "Convertible", "Truck", "Van", "Luxury"]

  const base64ToBlob = (base64, contentType = 'application/octet-stream') => {
    const byteArray = decode(base64);
    return new Blob([byteArray], { type: contentType });
  };
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (status !== "granted") {
      Alert.alert("Permission needed", "Please grant camera roll permissions to upload images.")
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    })

    if (!result.canceled) {
      setImageUri(result.assets[0].uri)
    }
  }
  const uploadImage = async (uri) => {
    if (!uri) return null;
  
    const fileExt = uri.split(".").pop()?.toLowerCase() || "jpg";
    const safeExt = fileExt === "heic" ? "jpg" : fileExt; // convert HEIC → JPG
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${safeExt}`;
    const filePath = `vehicles/${fileName}`;
    let contentType = `image/${safeExt === "jpg" ? "jpeg" : safeExt}`;
  
    try {
      if (isWeb) {
        // Web: Blob → File
        const response = await fetch(uri);
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
        const blob = await response.blob();
        if (blob.type) contentType = blob.type;
  
        const file = new File([blob], fileName, { type: contentType });
  
        const { error } = await supabase.storage
          .from("vehicle-images")
          .upload(filePath, file, { contentType, upsert: false });
  
        if (error) throw error;
      } else {
        // Mobile (iOS/Android): Base64 → ArrayBuffer
        const base64String = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
  
        const arrayBuffer = decode(base64String);
  
        const { error } = await supabase.storage
          .from("vehicle-images")
          .upload(filePath, arrayBuffer, { contentType, upsert: false });
  
        if (error) throw error;
      }
  
      // Get public URL
      const { data: publicData } = supabase.storage
        .from("vehicle-images")
        .getPublicUrl(filePath);
  
      return publicData.publicUrl;
    } catch (err) {
      console.error("Upload error:", err);
      throw err;
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.make || !formData.model || !formData.year || !formData.pricePerDay || !formData.seats || !formData.totalQuantity) {
      Alert.alert("Error", "Please fill in all required fields")
      return
    }

    if (Number.parseInt(formData.seats) < 1 || Number.parseInt(formData.seats) > 50) {
      Alert.alert("Error", "Please enter a valid number of seats (1-50)")
      return
    }

    if (Number.parseInt(formData.totalQuantity) < 1) {
      Alert.alert("Error", "Total quantity must be at least 1")
      return
    }

    if (Number.parseInt(formData.availableQuantity) > Number.parseInt(formData.totalQuantity)) {
      Alert.alert("Error", "Available quantity cannot exceed total quantity")
      return
    }

    setLoading(true)

    try {
      let imageUrl = formData.imageUrl

      // Upload new image if selected
      if (imageUri && imageUri !== formData.imageUrl) {
        console.log('Uploading new image...');
        try {
          imageUrl = await uploadImage(imageUri)
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError)
          
          // Ask user if they want to continue without image
          const continueWithoutImage = await new Promise((resolve) => {
            Alert.alert(
              "Image Upload Failed",
              `${uploadError.message}\n\nWould you like to save the vehicle without an image?`,
              [
                {
                  text: "Cancel",
                  style: "cancel",
                  onPress: () => resolve(false)
                },
                {
                  text: "Continue Without Image",
                  onPress: () => resolve(true)
                }
              ]
            )
          })
          
          if (!continueWithoutImage) {
            setLoading(false)
            return
          }
          
          // Keep existing image URL or set to null
          imageUrl = formData.imageUrl
        }
      }

      const vehicleData = {
        make: formData.make,
        model: formData.model,
        year: Number.parseInt(formData.year),
        type: formData.type,
        seats: Number.parseInt(formData.seats),
        price_per_day: Number.parseFloat(formData.pricePerDay),
        mileage: formData.mileage ? Number.parseInt(formData.mileage) : null,
        description: formData.description,
        available: formData.available,
        total_quantity: Number.parseInt(formData.totalQuantity),
        available_quantity: Number.parseInt(formData.availableQuantity),
        image_url: imageUrl,
        updated_at: new Date().toISOString(),
      }

      console.log('Saving vehicle data:', vehicleData);

      if (isEditing) {
        const { error } = await supabase
          .from('vehicles')
          .update(vehicleData)
          .eq('id', editingVehicle.id)

        if (error) {
          console.error('Update error:', error);
          throw error
        }

        Alert.alert("Success", "Vehicle updated successfully")
      } else {
        vehicleData.created_at = new Date().toISOString()
        
        const { error } = await supabase
          .from('vehicles')
          .insert([vehicleData])

        if (error) {
          console.error('Insert error:', error);
          throw error
        }

        Alert.alert("Success", "Vehicle added successfully")
      }

      navigation.goBack()
    } catch (error) {
      console.error("Error saving vehicle:", error)
      Alert.alert("Error", `Failed to save vehicle: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const renderTypeSelector = () => (
    <View style={styles.typeSelector}>
      <Text style={styles.label}>Vehicle Type *</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScrollView}>
        {vehicleTypes.map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.typeButton, formData.type === type && styles.selectedTypeButton]}
            onPress={() => setFormData({ ...formData, type })}
          >
            <Text style={[styles.typeButtonText, formData.type === type && styles.selectedTypeButtonText]}>{type}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContent,
          isWeb && styles.scrollContentWeb,
          { paddingBottom: isWeb ? 40 : 90 },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#222" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditing ? 'Edit Vehicle' : 'Add Vehicle'}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={[styles.form, isWeb && styles.formWeb]}>
          {/* Image Upload Section */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Vehicle Image</Text>
            <TouchableOpacity style={styles.imageUpload} onPress={pickImage}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.uploadedImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="camera" size={40} color="#9ca3af" />
                  <Text style={styles.imagePlaceholderText}>Tap to add image</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Basic Information */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <View style={[styles.inputRow, isWeb && styles.inputRowWeb]}>
              <View style={[styles.inputGroup, styles.inputHalf]}>
                <Text style={styles.label}>Make *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.make}
                  onChangeText={(text) => setFormData({ ...formData, make: text })}
                  placeholder="e.g., Toyota, Honda, BMW"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={[styles.inputGroup, styles.inputHalf]}>
                <Text style={styles.label}>Model *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.model}
                  onChangeText={(text) => setFormData({ ...formData, model: text })}
                  placeholder="e.g., Camry, Civic, X5"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            <View style={[styles.inputRow, isWeb && styles.inputRowWeb]}>
              <View style={[styles.inputGroup, styles.inputHalf]}>
                <Text style={styles.label}>Year *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.year}
                  onChangeText={(text) => setFormData({ ...formData, year: text })}
                  placeholder="e.g., 2023"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.inputGroup, styles.inputHalf]}>
                <Text style={styles.label}>Seats *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.seats}
                  onChangeText={(text) => setFormData({ ...formData, seats: text })}
                  placeholder="e.g., 5"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
              </View>
            </View>

            {renderTypeSelector()}
          </View>

          {/* Pricing & Details */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Pricing & Details</Text>

            <View style={[styles.inputRow, isWeb && styles.inputRowWeb]}>
              <View style={[styles.inputGroup, styles.inputHalf]}>
                <Text style={styles.label}>Price per Day ($) *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.pricePerDay}
                  onChangeText={(text) => setFormData({ ...formData, pricePerDay: text })}
                  placeholder="e.g., 50.00"
                  placeholderTextColor="#9ca3af"
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={[styles.inputGroup, styles.inputHalf]}>
                <Text style={styles.label}>Mileage</Text>
                <TextInput
                  style={styles.input}
                  value={formData.mileage}
                  onChangeText={(text) => setFormData({ ...formData, mileage: text })}
                  placeholder="e.g., 25000"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Additional details about the vehicle..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.switchGroup}>
              <Text style={styles.label}>Available for Rent</Text>
              <Switch
                value={formData.available}
                onValueChange={(value) => setFormData({ ...formData, available: value })}
                trackColor={{ false: "#e5e7eb", true: "#222" }}
                thumbColor={formData.available ? "#fff" : "#f4f3f4"}
              />
            </View>
          </View>

          {/* Inventory Management */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Inventory Management</Text>
            
            <View style={[styles.inputRow, isWeb && styles.inputRowWeb]}>
              <View style={[styles.inputGroup, styles.inputHalf]}>
                <Text style={styles.label}>Total Quantity *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.totalQuantity}
                  onChangeText={(text) => {
                    setFormData({ ...formData, totalQuantity: text });
                    // Auto-adjust available quantity if it exceeds total
                    if (Number.parseInt(text) < Number.parseInt(formData.availableQuantity)) {
                      setFormData(prev => ({ ...prev, totalQuantity: text, availableQuantity: text }));
                    }
                  }}
                  placeholder="e.g., 3"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
                <Text style={styles.helpText}>How many units of this vehicle do you have?</Text>
              </View>

              <View style={[styles.inputGroup, styles.inputHalf]}>
                <Text style={styles.label}>Available Quantity *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.availableQuantity}
                  onChangeText={(text) => setFormData({ ...formData, availableQuantity: text })}
                  placeholder="e.g., 2"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
                <Text style={styles.helpText}>How many are currently available for rent?</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? "Saving..." : isEditing ? "Update Vehicle" : "Add Vehicle"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "white",
  },
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backButton: {
    width: 28,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: '#222',
  },
  headerSpacer: {
    width: 28,
  },
  scrollContent: {
    paddingBottom: 90,
  },
  scrollContentWeb: {
    minHeight: "100vh",
    alignItems: "center",
    paddingVertical: 20,
    paddingBottom: 40,
  },
  form: {
    paddingHorizontal: 16,
  },
  formWeb: {
    maxWidth: 800,
    width: "100%",
    paddingHorizontal: 40,
  },
  card: {
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
  sectionTitle: {
    fontWeight: '800',
    fontSize: 18,
    letterSpacing: -0.5,
    color: '#222',
    marginBottom: 16,
  },
  imageUpload: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderStyle: "dashed",
  },
  uploadedImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholderText: {
    marginTop: 8,
    color: "#9ca3af",
    fontSize: 16,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: "column",
    gap: 16,
  },
  inputRowWeb: {
    flexDirection: "row",
    gap: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputHalf: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#222',
    fontWeight: '500',
  },
  helpText: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  typeSelector: {
    marginBottom: 16,
  },
  typeScrollView: {
    flexGrow: 0,
  },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedTypeButton: {
    backgroundColor: 'black',
    borderColor: 'black',
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  selectedTypeButtonText: {
    color: 'white',
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  submitButton: {
    backgroundColor: '#222',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
})