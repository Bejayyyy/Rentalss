"use client"

import { useState ,useEffect} from "react"
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
import * as FileSystem from 'expo-file-system/legacy'
import ActionModal from "../components/AlertModal/ActionModal"
import * as ImageManipulator from 'expo-image-manipulator'

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
  })

  const [feedbackModal, setFeedbackModal] = useState({
    visible: false,
    type: "success", 
    message: ""
  })
  const handleFeedbackModalClose = () => {
    setFeedbackModal({ visible: false, type: "success", message: "" })
    
    // Navigate back only on success
    if (feedbackModal.type === "success") {
      navigation.goBack()
    }
  }
  // Color variants state
  const [colorVariants, setColorVariants] = useState([
    {
      id: Date.now(),
      color: "",
      totalQuantity: "1",
      availableQuantity: "1",
      imageUri: null,
      imageUrl: null
    }
  ])

  const [loading, setLoading] = useState(false)
  
  // Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showDeleteVariantModal, setShowDeleteVariantModal] = useState(false)
  const [variantToDelete, setVariantToDelete] = useState(null)

  const vehicleTypes = ["Sedan", "SUV", "Hatchback", "Convertible", "Truck", "Van", "Luxury"]

  // Load existing variants when editing
  useEffect(() => {
    if (isEditing && editingVehicle?.id) {
      loadExistingVariants()
    }
  }, [isEditing, editingVehicle?.id])

  const loadExistingVariants = async () => {
    try {
      const { data: variants, error } = await supabase
        .from('vehicle_variants')
        .select('*')
        .eq('vehicle_id', editingVehicle.id)

      if (error) {
        console.error('Error loading variants:', error)
        return
      }

      if (variants && variants.length > 0) {
        const formattedVariants = variants.map(variant => ({
          id: variant.id,
          color: variant.color,
          totalQuantity: variant.total_quantity.toString(),
          availableQuantity: variant.available_quantity.toString(),
          imageUri: variant.image_url,
          imageUrl: variant.image_url
        }))
        setColorVariants(formattedVariants)
      }
    } catch (error) {
      console.error('Error in loadExistingVariants:', error)
    }
  }

  const addColorVariant = () => {
    const newVariant = {
      id: Date.now(),
      color: "",
      totalQuantity: "1",
      availableQuantity: "1",
      imageUri: null,
      imageUrl: null
    }
    setColorVariants([...colorVariants, newVariant])
  }

  const handleRemoveVariant = (variantId) => {
    if (colorVariants.length > 1) {
      setVariantToDelete(variantId)
      setShowDeleteVariantModal(true)
    }
  }

  const confirmRemoveVariant = () => {
    if (variantToDelete) {
      setColorVariants(colorVariants.filter(variant => variant.id !== variantToDelete))
      setVariantToDelete(null)
    }
    setShowDeleteVariantModal(false)
  }

  const updateColorVariant = (variantId, field, value) => {
    setColorVariants(colorVariants.map(variant => 
      variant.id === variantId 
        ? { ...variant, [field]: value }
        : variant
    ))
  }

  const pickImageForVariant = async (variantId) => {
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
      updateColorVariant(variantId, 'imageUri', result.assets[0].uri)
    }
  }

// Fixed uploadImage function - replace your existing one with this
const uploadImage = async (uri) => {
  if (!uri) return null;

  try {
    let processedUri = uri;

    // Convert HEIC → JPEG on iOS if needed
    if (uri.toLowerCase().endsWith(".heic")) {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );
      processedUri = manipResult.uri;
    }

    const fileExt = processedUri.split(".").pop()?.toLowerCase() || "jpg";
    const safeExt = fileExt === "heic" ? "jpg" : fileExt;
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${safeExt}`;
    const filePath = `vehicle-variants/${fileName}`;
    const contentType = `image/${safeExt === "jpg" ? "jpeg" : safeExt}`;

    let fileData;

    if (Platform.OS === "web") {
      // Web: fetch blob directly
      const response = await fetch(processedUri);
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
      fileData = await response.blob();

      const { error } = await supabase.storage
        .from("vehicle-images")
        .upload(filePath, fileData, { contentType, upsert: false });

      if (error) throw error;
    } else {
      // Native: read as base64 string, then convert to ArrayBuffer
      const base64Data = await FileSystem.readAsStringAsync(processedUri, {
        encoding: "base64", // Use string instead of FileSystem.EncodingType.Base64
      });

      const { error } = await supabase.storage
        .from("vehicle-images")
        .upload(filePath, decode(base64Data), {
          contentType,
          upsert: false,
        });

      if (error) throw error;
    }

    // Return public URL
    const { data: publicData } = supabase.storage
      .from("vehicle-images")
      .getPublicUrl(filePath);

    return publicData.publicUrl;
  } catch (err) {
    console.error("Upload error:", err);
    throw err;
  }
};

  const validateForm = () => {
    if (!formData.make || !formData.model || !formData.year || !formData.pricePerDay || !formData.seats) {
      Alert.alert("Error", "Please fill in all required fields")
      return false
    }

    if (Number.parseInt(formData.seats) < 1 || Number.parseInt(formData.seats) > 50) {
      Alert.alert("Error", "Please enter a valid number of seats (1-50)")
      return false
    }

    // Validate color variants
    const validVariants = colorVariants.filter(variant => variant.color.trim() !== "")
    
    if (validVariants.length === 0) {
      Alert.alert("Error", "Please add at least one color variant")
      return false
    }

    for (let variant of validVariants) {
      if (Number.parseInt(variant.totalQuantity) < 1) {
        Alert.alert("Error", `Total quantity for ${variant.color} must be at least 1`)
        return false
      }
      if (Number.parseInt(variant.availableQuantity) > Number.parseInt(variant.totalQuantity)) {
        Alert.alert("Error", `Available quantity for ${variant.color} cannot exceed total quantity`)
        return false
      }
    }

    return true
  }

  const handleSubmitPress = () => {
    if (!validateForm()) return
    setShowConfirmModal(true)
  }

  const handleSubmit = async () => {
    setShowConfirmModal(false)
    setLoading(true)
  
    try {
      // Get valid variants
      const validVariants = colorVariants.filter(variant => variant.color.trim() !== "")
  
      // Upload images for variants
      const variantsWithImages = await Promise.all(
        validVariants.map(async (variant) => {
          let imageUrl = variant.imageUrl
  
          if (variant.imageUri && variant.imageUri !== variant.imageUrl) {
            try {
              imageUrl = await uploadImage(variant.imageUri)
            } catch (uploadError) {
              console.error('Image upload failed for variant:', variant.color, uploadError)
              // Continue without image for this variant
            }
          }
  
          return {
            ...variant,
            imageUrl
          }
        })
      )
  
      // Calculate total quantities across all variants
      const totalQuantity = variantsWithImages.reduce((sum, variant) => 
        sum + Number.parseInt(variant.totalQuantity), 0)
      const availableQuantity = variantsWithImages.reduce((sum, variant) => 
        sum + Number.parseInt(variant.availableQuantity), 0)
  
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
        total_quantity: totalQuantity,
        available_quantity: availableQuantity,
        image_url: variantsWithImages[0]?.imageUrl || null, // Use first variant's image as main image
        updated_at: new Date().toISOString(),
      }
  
      let vehicleId = editingVehicle?.id
  
      if (isEditing) {
        // Update existing vehicle
        const { error } = await supabase
          .from('vehicles')
          .update(vehicleData)
          .eq('id', editingVehicle.id)
  
        if (error) {
          console.error('Update error:', error)
          throw error
        }
  
        // Delete existing variants
        await supabase
          .from('vehicle_variants')
          .delete()
          .eq('vehicle_id', editingVehicle.id)
      } else {
        // Create new vehicle
        vehicleData.created_at = new Date().toISOString()
        
        const { data: newVehicle, error } = await supabase
          .from('vehicles')
          .insert([vehicleData])
          .select()
          .single()
  
        if (error) {
          console.error('Insert error:', error)
          throw error
        }
  
        vehicleId = newVehicle.id
      }
  
      // Insert variants
      const variantInserts = variantsWithImages.map(variant => ({
        vehicle_id: vehicleId,
        color: variant.color,
        image_url: variant.imageUrl,
        total_quantity: Number.parseInt(variant.totalQuantity),
        available_quantity: Number.parseInt(variant.availableQuantity),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
  
      const { error: variantError } = await supabase
        .from('vehicle_variants')
        .insert(variantInserts)
  
      if (variantError) {
        console.error('Variant insert error:', variantError)
        throw variantError
      }
  
      // Show success modal instead of Alert
      setFeedbackModal({
        visible: true,
        type: "success",
        message: isEditing ? "Vehicle updated successfully! All changes have been saved." : "Vehicle added successfully! Your new vehicle is now available in the fleet."
      })
  
    } catch (error) {
      console.error("Error saving vehicle:", error)
      
      // Show error modal instead of Alert
      setFeedbackModal({
        visible: true,
        type: "error",
        message: `Failed to ${isEditing ? 'update' : 'save'} vehicle: ${error.message}`
      })
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

  const renderColorVariant = (variant, index) => (
    <View key={variant.id} style={styles.variantCard}>
      <View style={styles.variantHeader}>
        <Text style={styles.variantTitle}>Color Variant {index + 1}</Text>
        {colorVariants.length > 1 && (
          <TouchableOpacity
            style={styles.removeVariantButton}
            onPress={() => handleRemoveVariant(variant.id)}
          >
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>

      {/* Color and Image Row */}
      <View style={[styles.inputRow, isWeb && styles.inputRowWeb]}>
        <View style={[styles.inputGroup, { flex: 2 }]}>
          <Text style={styles.label}>Color Name *</Text>
          <TextInput
            style={styles.input}
            value={variant.color}
            onChangeText={(text) => updateColorVariant(variant.id, 'color', text)}
            placeholder="e.g., Pearl White, Midnight Black"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.label}>Image</Text>
          <TouchableOpacity
            style={styles.variantImageUpload}
            onPress={() => pickImageForVariant(variant.id)}
          >
            {variant.imageUri ? (
              <Image source={{ uri: variant.imageUri }} style={styles.variantImage} />
            ) : (
              <View style={styles.variantImagePlaceholder}>
                <Ionicons name="camera" size={20} color="#9ca3af" />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Quantity Row */}
      <View style={[styles.inputRow, isWeb && styles.inputRowWeb]}>
        <View style={[styles.inputGroup, styles.inputHalf]}>
          <Text style={styles.label}>Total Quantity *</Text>
          <TextInput
            style={styles.input}
            value={variant.totalQuantity}
            onChangeText={(text) => {
              updateColorVariant(variant.id, 'totalQuantity', text)
              // Auto-adjust available quantity if it exceeds total
              if (Number.parseInt(text) < Number.parseInt(variant.availableQuantity)) {
                updateColorVariant(variant.id, 'availableQuantity', text)
              }
            }}
            placeholder="e.g., 2"
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
          />
        </View>

        <View style={[styles.inputGroup, styles.inputHalf]}>
          <Text style={styles.label}>Available Quantity *</Text>
          <TextInput
            style={styles.input}
            value={variant.availableQuantity}
            onChangeText={(text) => updateColorVariant(variant.id, 'availableQuantity', text)}
            placeholder="e.g., 2"
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
          />
        </View>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Feedback Modal */}
    <ActionModal
      visible={feedbackModal.visible}
      type={feedbackModal.type}
      title={feedbackModal.type === "success" ? "Success" : "Error"}
      message={feedbackModal.message}
      confirmText="OK"
      onClose={handleFeedbackModalClose}
      onConfirm={handleFeedbackModalClose}
    />
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
          </View>

          {/* Color Variants */}
          <View style={styles.card}>
            <View style={styles.variantsHeader}>
              <View style={styles.variantsHeaderContent}>
                <Text style={styles.sectionTitle}>Color Variants</Text>
                <Text style={styles.sectionSubtitle}>Add different color options for this vehicle</Text>
              </View>
              <TouchableOpacity style={styles.addVariantButton} onPress={addColorVariant}>
                <Ionicons name="add" size={16} color="#222" />
                <Text style={styles.addVariantText}>Add Variant</Text>
              </TouchableOpacity>
            </View>

            {colorVariants.map((variant, index) => renderColorVariant(variant, index))}
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleSubmitPress}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? "Saving..." : isEditing ? "Update Vehicle" : "Add Vehicle"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
      <ActionModal
        visible={showConfirmModal}
        type="confirm"
        title={isEditing ? "Update Vehicle" : "Add Vehicle"}
        message={isEditing 
          ? "Are you sure you want to update this vehicle with the changes you made?" 
          : "Are you sure you want to add this vehicle to your fleet?"
        }
        confirmText={isEditing ? "Update" : "Add"}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleSubmit}
        loading={loading}
      />

      {/* Delete Variant Modal */}
      <ActionModal
        visible={showDeleteVariantModal}
        type="delete"
        title="Remove Color Variant"
        message="Are you sure you want to remove this color variant? This action cannot be undone."
        confirmText="Remove"
        onClose={() => {
          setShowDeleteVariantModal(false)
          setVariantToDelete(null)
        }}
        onConfirm={confirmRemoveVariant}
      />
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
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
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
  // Color Variants Styles - Fixed Layout
  variantsHeader: {
    flexDirection: 'column',
    marginBottom: 20,
  },
  variantsHeaderContent: {
    marginBottom: 12,
  },
  addVariantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignSelf: 'flex-start',
    minWidth: 120,
  },
  addVariantText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
    marginLeft: 4,
  },
  variantCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  variantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  variantTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
  },
  removeVariantButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fef2f2',
  },
  variantImageUpload: {
    width: '100%',
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
  },
  variantImage: {
    width: '100%',
    height: '100%',
  },
  variantImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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