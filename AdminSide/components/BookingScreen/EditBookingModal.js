import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  Animated, 
  ScrollView, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform 
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ActionModal from "../AlertModal/ActionModal";
import BookingForm from "./BookingForm";

export default function EditBookingModal({
  visible,
  booking,
  availableVehicles = [],
  closeEditModal,
  updateBooking,
  deleteBooking,
  modalAnimation,
  styles,
  formatDate,
  CalendarModalComponent
}) {
  // State management
  const [editableBooking, setEditableBooking] = useState(null);
  const [vehiclePickerVisible, setVehiclePickerVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [dateField, setDateField] = useState("");
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Initialize booking data when component mounts or booking changes
  useEffect(() => {
    if (booking && typeof booking === "object") {
      setEditableBooking({
        id: booking.id || null,
        customer_name: booking.customer_name || "",
        customer_email: booking.customer_email || "",
        customer_phone: booking.customer_phone || "",
        rental_start_date: booking.rental_start_date || "",
        rental_end_date: booking.rental_end_date || "",
        total_price: booking.total_price || 0,
        status: booking.status || "pending",
        pickup_location: booking.pickup_location || "",
        license_number: booking.license_number || "",
        gov_id_url: booking.gov_id_url || "",
        vehicle_variant_id: booking.vehicle_variant_id || null,
        vehicle_id: booking.vehicle_id || null,
        created_at: booking.created_at || new Date().toISOString(),
        updated_at: booking.updated_at || new Date().toISOString(),
        // Safely handle nested objects
        vehicles: booking.vehicles || null,
        vehicle_variants: booking.vehicle_variants || null,
      });
    } else {
      setEditableBooking(null);
    }
  }, [booking]);

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setDatePickerVisible(false);
      setVehiclePickerVisible(false);
      setDateField("");
      setConfirmVisible(false);
      setDeleteVisible(false);
    }
  }, [visible]);

  // Event handlers
  const handleSave = useCallback(() => {
    if (!editableBooking) {
      console.warn("Cannot save: editableBooking is null");
      return;
    }
    setConfirmVisible(true);
  }, [editableBooking]);

  const handleConfirmSave = useCallback(async () => {
    if (!editableBooking || !editableBooking.id) {
      console.error("Cannot save: editableBooking is null or missing ID");
      return;
    }
    
    setLoading(true);
    try {
      await updateBooking(editableBooking);
      setConfirmVisible(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error updating booking:", error);
      setErrorMessage("Failed to update booking");
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  }, [updateBooking, editableBooking]);

  const handleDelete = useCallback(() => {
    if (!editableBooking || !editableBooking.id) {
      console.warn("Cannot delete: editableBooking is null or missing ID");
      return;
    }
    setDeleteVisible(true);
  }, [editableBooking]);

  const handleConfirmDelete = useCallback(async () => {
    if (!editableBooking?.id) {
      console.error("Cannot delete: editableBooking is null or missing ID");
      return;
    }
    
    setDeleteLoading(true);
    try {
      await deleteBooking(editableBooking.id);
      setDeleteVisible(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error deleting booking:", error);
      setErrorMessage("Failed to delete booking");
      setShowErrorModal(true);
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteBooking, editableBooking]);

  const handleDatePickerClose = useCallback(() => {
    setDatePickerVisible(false);
    setDateField("");
  }, []);

  const handleDateSelect = useCallback((dateString) => {
    if (!editableBooking) {
      console.warn("Cannot select date: editableBooking is null");
      return;
    }
    
    if (dateField === "start") {
      setEditableBooking(prev => prev ? { ...prev, rental_start_date: dateString } : null);
    } else if (dateField === "end") {
      setEditableBooking(prev => prev ? { ...prev, rental_end_date: dateString } : null);
    }
    handleDatePickerClose();
  }, [dateField, handleDatePickerClose, editableBooking]);

  const handleVehicleSelect = useCallback((variant) => {
    if (!editableBooking) {
      console.warn("Cannot select vehicle: editableBooking is null");
      return;
    }
    
    setEditableBooking(prev => prev ? {
      ...prev,
      vehicle_id: variant?.vehicle_id || null,
      vehicle_variant_id: variant?.id || null,
      vehicles: variant?.vehicles || null,
      vehicle_variants: variant || null
    } : null);
    setVehiclePickerVisible(false);
  }, [editableBooking]);

  // Computed values with null checks
  const selectedDate = useMemo(() => {
    if (!dateField || !editableBooking) return "";
    return dateField === "start" ? 
      (editableBooking.rental_start_date || "") : 
      (editableBooking.rental_end_date || "");
  }, [dateField, editableBooking]);

  const datePickerTitle = useMemo(() => {
    if (!dateField) return "Select Date";
    return dateField === "start" ? "Select Start Date" : "Select End Date";
  }, [dateField]);

  const minDate = useMemo(() => {
    if (!editableBooking) return new Date().toISOString().split("T")[0];
    
    if (dateField === "end" && editableBooking.rental_start_date) {
      return editableBooking.rental_start_date;
    }
    return new Date().toISOString().split("T")[0];
  }, [dateField, editableBooking]);

  const shouldShowDeleteButton = useMemo(() => {
    return editableBooking?.status === 'cancelled';
  }, [editableBooking?.status]);

  // Render functions
  const renderHeader = () => (
    <View style={styles.modalHeader}>
      <TouchableOpacity onPress={closeEditModal} style={styles.modalHeaderButton}>
        <Ionicons name="close" size={24} color="#374151" />
      </TouchableOpacity>
      <Text style={styles.modalTitle}>Edit Booking</Text>
      <TouchableOpacity
        onPress={handleSave}
        style={[styles.modalHeaderButton, styles.saveButtonContainer]}
        disabled={!editableBooking}
      >
        <Text style={[styles.saveButton, !editableBooking && { opacity: 0.5 }]}>Save</Text>
      </TouchableOpacity>
    </View>
  );

  const renderBookingForm = () => {
    if (!editableBooking) return null;
    
    return (
      <BookingForm
        booking={editableBooking}
        setBooking={setEditableBooking}
        availableVehicles={availableVehicles}
        styles={styles}
        formatDate={formatDate}
        setDatePickerVisible={setDatePickerVisible}
        setDateField={setDateField}
        setVehiclePickerVisible={setVehiclePickerVisible}
        isEdit={true}
      />
    );
  };

  const renderDeleteButton = () => {
    if (!shouldShowDeleteButton || !editableBooking) return null;
    
    return (
      <View style={styles.section}>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
          <Text style={styles.deleteButtonText}>Delete Booking</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderVehiclePicker = () => (
    <Modal visible={vehiclePickerVisible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.vehiclePickerContainer}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Select Vehicle</Text>
            <TouchableOpacity onPress={() => setVehiclePickerVisible(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 300 }}>
            {availableVehicles.length > 0 ? (
              availableVehicles.map((variant) => (
                <TouchableOpacity
                  key={variant?.id || Math.random()}
                  style={[
                    styles.vehiclePickerItem,
                    editableBooking?.vehicle_variant_id === variant?.id && styles.vehiclePickerItemSelected
                  ]}
                  onPress={() => handleVehicleSelect(variant)}
                >
                  <View style={styles.vehiclePickerItemContent}>
                    <Text style={styles.vehiclePickerText}>
                      {variant?.vehicles?.year || 'N/A'} {variant?.vehicles?.make || 'N/A'} {variant?.vehicles?.model || 'N/A'}
                    </Text>
                    <Text style={styles.vehiclePickerType}>
                      {variant?.color || 'N/A'} • Available: {variant?.available_quantity || 0}
                    </Text>
                  </View>
                  {editableBooking?.vehicle_variant_id === variant?.id && (
                    <Ionicons name="checkmark" size={20} color="#3b82f6" />
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyVehicleText}>No vehicles available</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderLoadingState = () => (
    <View style={styles.modalContainer}>
      {renderHeader()}
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 16, color: "#6b7280" }}>Loading booking...</Text>
      </View>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.modalContainer}>
      {renderHeader()}
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={{ fontSize: 16, color: "#ef4444", marginTop: 12, textAlign: "center" }}>
          Unable to load booking details
        </Text>
        <Text style={{ fontSize: 14, color: "#6b7280", marginTop: 8, textAlign: "center" }}>
          Please try again or contact support if the problem persists.
        </Text>
        <TouchableOpacity
          onPress={closeEditModal}
          style={{
            marginTop: 20,
            backgroundColor: "#3b82f6",
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 8
          }}
        >
          <Text style={{ color: "white", fontWeight: "600" }}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Don't render if modal is not visible
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent={true} animationType="none">
      <SafeAreaView style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}>
        
          <Animated.View
            style={[
              styles.modalContainer,
              {
                opacity: modalAnimation,
                transform: [{
                  translateY: modalAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                }],
              },
            ]}
          >
            {/* Show different states based on booking status */}
            {!booking ? (
              renderErrorState()
            ) : !editableBooking ? (
              renderLoadingState()
            ) : (
              <>
                {renderHeader()}
                
                {/* Fixed: Make ScrollView fill remaining space and handle keyboard */}
                <ScrollView 
                  style={{ flex: 1 }}
                  contentContainerStyle={{ 
                    padding: 16,
                    paddingBottom: Platform.OS === "ios" ? 100 : 80 // Extra bottom padding
                  }}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  bounces={false}
                >
                  {renderBookingForm()}
                  {renderDeleteButton()}
                </ScrollView>

                {/* Always render these components, control visibility via props */}
                <CalendarModalComponent
                  visible={datePickerVisible && !!dateField}
                  onClose={handleDatePickerClose}
                  onDateSelect={handleDateSelect}
                  selectedDate={selectedDate}
                  title={datePickerTitle}
                  minDate={minDate}
                />

                {renderVehiclePicker()}

                <ActionModal
                  visible={confirmVisible}
                  type="confirm"
                  title="Confirm Changes"
                  message="Are you sure you want to save these changes?"
                  confirmText="Save"
                  loading={loading}
                  onClose={() => setConfirmVisible(false)}
                  onConfirm={handleConfirmSave}
                />

                <ActionModal
                  visible={deleteVisible}
                  type="delete"
                  title="Delete Booking"
                  message="Are you sure you want to delete this booking? This action cannot be undone."
                  confirmText="Delete"
                  loading={deleteLoading}
                  onClose={() => setDeleteVisible(false)}
                  onConfirm={handleConfirmDelete}
                />
                
                {/* SUCCESS MODAL */}
                <ActionModal
                  visible={showSuccessModal}
                  type="success"
                  title="Success"
                  message="Booking updated successfully!"
                  onClose={() => {
                    setShowSuccessModal(false);
                    closeEditModal();
                  }}
                  onConfirm={() => {
                    setShowSuccessModal(false);
                    closeEditModal();
                  }}
                />
                
                {/* ERROR MODAL */}
                <ActionModal
                  visible={showErrorModal}
                  type="error"
                  title="Error"
                  message={errorMessage}
                  confirmText="Close"
                  onClose={() => setShowErrorModal(false)}
                  onConfirm={() => setShowErrorModal(false)}
                />
              </>
            )}
          </Animated.View>
        
      </SafeAreaView>
    </Modal>
  );
}