import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Platform,
  Alert,
  Modal,
  Animated,
  FlatList,
  TextInput,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';
import ActionModal from '../components/AlertModal/ActionModal';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

// Notification Bell Component
const NotificationBell = ({ notifications, onPress }) => {
  const [bellAnimation] = useState(new Animated.Value(0));
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (unreadCount > 0) {
      Animated.sequence([
        Animated.timing(bellAnimation, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(bellAnimation, { toValue: -1, duration: 200, useNativeDriver: true }),
        Animated.timing(bellAnimation, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [unreadCount]);

  const bellRotate = bellAnimation.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-15deg', '15deg'],
  });

  return (
    <TouchableOpacity style={styles.notificationBell} onPress={onPress}>
      <Animated.View style={{ transform: [{ rotate: bellRotate }] }}>
        <Ionicons 
          name={unreadCount > 0 ? "notifications" : "notifications-outline"} 
          size={24} 
          color={unreadCount > 0 ? "#FF6B35" : "#666"} 
        />
      </Animated.View>
      {unreadCount > 0 && (
        <View style={styles.notificationBadge}>
          <Text style={styles.notificationBadgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// Notification Item Component
const NotificationItem = ({ notification, onMarkRead, onRemove, setActionModalConfig }) => {
  const [showActions, setShowActions] = useState(false);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'upcoming_pickup': return { name: 'car-sport', color: '#4CAF50' };
      case 'due_return': return { name: 'return-up-back', color: '#FF9800' };
      case 'overdue': return { name: 'alert-circle', color: '#F44336' };
      case 'pickup_today': return { name: 'today', color: '#2196F3' };
      case 'return_today': return { name: 'calendar-today', color: '#9C27B0' };
      case 'new_booking': return { name: 'add-circle', color: '#FF6B35' };
      case 'booking_confirmed': return { name: 'checkmark-circle', color: '#10b981' };
      case 'booking_completed': return { name: 'flag', color: '#3b82f6' };
      case 'status_change': return { name: 'swap-horizontal', color: '#8b5cf6' };
      default: return { name: 'information-circle', color: '#666' };
    }
  };

  const icon = getNotificationIcon(notification.type);

  return (
    <View style={styles.notificationWrapper}>
      <TouchableOpacity 
        style={[
          styles.notificationItem, 
          !notification.read && styles.unreadNotification,
          showActions && styles.notificationItemActive
        ]}
        onPress={() => onMarkRead(notification.id)}
        onLongPress={() => setShowActions(true)}
        delayLongPress={500}
      >
        <View style={[styles.notificationIconContainer, { backgroundColor: `${icon.color}20` }]}>
          <Ionicons name={icon.name} size={20} color={icon.color} />
        </View>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{notification.title}</Text>
          <Text style={styles.notificationMessage}>{notification.message}</Text>
          <Text style={styles.notificationTime}>{notification.timeAgo}</Text>
        </View>
        {!notification.read && <View style={styles.unreadDot} />}
        
        <TouchableOpacity 
          style={styles.notificationMenuButton}
          onPress={() => setShowActions(!showActions)}
        >
          <Ionicons name="ellipsis-vertical" size={16} color="#9ca3af" />
        </TouchableOpacity>
      </TouchableOpacity>

      {showActions && (
        <View style={styles.notificationActions}>
          {!notification.read && (
            <TouchableOpacity 
              style={[styles.notificationActionButton, styles.markReadButton]}
              onPress={() => { onMarkRead(notification.id); setShowActions(false); }}
            >
              <Ionicons name="checkmark-circle-outline" size={16} color="#10b981" />
              <Text style={[styles.notificationActionText, { color: '#10b981' }]}>Mark as read</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={[styles.notificationActionButton, styles.removeButton]}
            onPress={() => {
              setActionModalConfig({
                title: 'Remove Notification',
                message: 'Are you sure you want to remove this notification?',
                onConfirm: () => { onRemove(notification.id); setShowActions(false); }
              });
            }}
          >
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
            <Text style={[styles.notificationActionText, { color: '#ef4444' }]}>Remove</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.notificationActionButton, styles.cancelButton]}
            onPress={() => setShowActions(false)}
          >
            <Ionicons name="close-outline" size={16} color="#6b7280" />
            <Text style={[styles.notificationActionText, { color: '#6b7280' }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// Notifications Modal
const NotificationsModal = ({ visible, notifications, onClose, onMarkRead, onMarkAllRead, onRemove, setActionModalConfig, onClearAll }) => {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Notifications</Text>
          <View style={styles.modalHeaderActions}>
            <TouchableOpacity style={styles.markAllReadButton} onPress={onMarkAllRead}>
              <Text style={styles.markAllReadText}>Mark all read</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.clearAllButton} onPress={onClearAll}>
              <Text style={styles.clearAllText}>Clear all</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
        
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationItem 
              notification={item} 
              onMarkRead={onMarkRead}
              onRemove={onRemove}
              setActionModalConfig={setActionModalConfig}
            />
          )}
          contentContainerStyle={styles.notificationsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyNotifications}>
              <Ionicons name="notifications-off-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyNotificationsText}>No notifications</Text>
              <Text style={styles.emptyNotificationsSubtext}>You're all caught up!</Text>
            </View>
          }
        />
      </SafeAreaView>
    </Modal>
  );
};

// Website Content Editor Modal
// Website Content Editor Modal - FIXED WITH PROPER ERROR HANDLING
const WebsiteContentModal = ({ visible, onClose, section, onSave }) => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible && section) {
      fetchContent();
    }
  }, [visible, section]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('website_content')
        .select('*')
        .eq('section', section)
        .single();

      if (error) throw error;
      
      // Ensure proper data structure
      if (data && data.content) {
        // Add safety checks for each section type
        if (section === 'about_us') {
          if (!data.content.stats) {
            data.content.stats = { happyCustomers: 0, dailyBookings: 0 };
          }
        } else if (section === 'how_it_works') {
          if (!data.content.steps || !Array.isArray(data.content.steps)) {
            data.content.steps = [];
          }
        } else if (section === 'faqs') {
          if (!data.content.questions || !Array.isArray(data.content.questions)) {
            data.content.questions = [];
          }
        }
        setContent(data);
      } else {
        throw new Error('Invalid data structure');
      }
    } catch (err) {
      console.error('Error fetching content:', err);
      Alert.alert('Error', 'Failed to load content. Please try again.');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!content || !content.content) {
      Alert.alert('Error', 'No content to save');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('website_content')
        .update({
          content: content.content,
          updated_at: new Date().toISOString(),
          updated_by: user?.id
        })
        .eq('section', section);

      if (error) throw error;

      Alert.alert('Success', 'Content updated successfully! Changes will appear on your website.');
      onSave();
      onClose();
    } catch (err) {
      console.error('Error saving content:', err);
      Alert.alert('Error', 'Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setContent(prev => ({
      ...prev,
      content: { ...prev.content, [field]: value }
    }));
  };

  const updateArrayItem = (arrayName, index, field, value) => {
    setContent(prev => {
      const currentArray = prev.content[arrayName];
      if (!Array.isArray(currentArray)) return prev;
      
      const newArray = [...currentArray];
      if (newArray[index]) {
        newArray[index] = { ...newArray[index], [field]: value };
      }
      return {
        ...prev,
        content: { ...prev.content, [arrayName]: newArray }
      };
    });
  };

  const addArrayItem = (arrayName, template) => {
    setContent(prev => {
      const currentArray = prev.content[arrayName];
      if (!Array.isArray(currentArray)) {
        return {
          ...prev,
          content: { ...prev.content, [arrayName]: [template] }
        };
      }
      return {
        ...prev,
        content: {
          ...prev.content,
          [arrayName]: [...currentArray, template]
        }
      };
    });
  };

  const removeArrayItem = (arrayName, index) => {
    setContent(prev => {
      const currentArray = prev.content[arrayName];
      if (!Array.isArray(currentArray)) return prev;
      
      return {
        ...prev,
        content: {
          ...prev.content,
          [arrayName]: currentArray.filter((_, i) => i !== index)
        }
      };
    });
  };

  const renderAboutUsForm = () => {
    if (!content || !content.content) return null;

    const stats = content.content.stats || { happyCustomers: 0, dailyBookings: 0 };

    return (
      <View>
        <Text style={styles.sectionHeaderText}>About Us Content</Text>
        
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={content.content.title || ''}
          onChangeText={(text) => updateField('title', text)}
          placeholder="Section Title"
          placeholderTextColor="#9ca3af"
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={content.content.description || ''}
          onChangeText={(text) => updateField('description', text)}
          placeholder="Description"
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={6}
        />

        <Text style={styles.sectionHeaderText}>Statistics</Text>
        
        <Text style={styles.label}>Happy Customers</Text>
        <TextInput
          style={styles.input}
          value={stats.happyCustomers.toString()}
          onChangeText={(text) => {
            const num = parseInt(text) || 0;
            setContent(prev => ({
              ...prev,
              content: {
                ...prev.content,
                stats: { ...prev.content.stats, happyCustomers: num }
              }
            }));
          }}
          keyboardType="numeric"
          placeholderTextColor="#9ca3af"
        />

        <Text style={styles.label}>Daily Bookings</Text>
        <TextInput
          style={styles.input}
          value={stats.dailyBookings.toString()}
          onChangeText={(text) => {
            const num = parseInt(text) || 0;
            setContent(prev => ({
              ...prev,
              content: {
                ...prev.content,
                stats: { ...prev.content.stats, dailyBookings: num }
              }
            }));
          }}
          keyboardType="numeric"
          placeholderTextColor="#9ca3af"
        />
      </View>
    );
  };

  const renderHowItWorksForm = () => {
    if (!content || !content.content) return null;

    const steps = content.content.steps || [];

    return (
      <View>
        <Text style={styles.sectionHeaderText}>How It Works Content</Text>
        
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={content.content.title || ''}
          onChangeText={(text) => updateField('title', text)}
          placeholder="Section Title"
          placeholderTextColor="#9ca3af"
        />

        <View style={styles.arrayHeader}>
          <Text style={styles.sectionHeaderText}>Steps</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => addArrayItem('steps', {
              number: `0${steps.length + 1}`,
              title: '',
              description: ''
            })}
          >
            <Ionicons name="add-circle" size={35} color="#222" />
          </TouchableOpacity>
        </View>

        {steps.length > 0 ? (
          steps.map((step, index) => (
            <View key={index} style={styles.arrayItemContainer}>
              <View style={styles.arrayItemHeader}>
                <Text style={styles.arrayItemTitle}>Step {index + 1}</Text>
                <TouchableOpacity onPress={() => removeArrayItem('steps', index)}>
                  <Ionicons name="trash" size={22} color="#ef4444" />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Number</Text>
              <TextInput
                style={styles.input}
                value={step.number || ''}
                onChangeText={(text) => updateArrayItem('steps', index, 'number', text)}
                placeholderTextColor="#9ca3af"
              />

              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                value={step.title || ''}
                onChangeText={(text) => updateArrayItem('steps', index, 'title', text)}
                placeholderTextColor="#9ca3af"
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={step.description || ''}
                onChangeText={(text) => updateArrayItem('steps', index, 'description', text)}
                multiline
                numberOfLines={4}
                placeholderTextColor="#9ca3af"
              />
            </View>
          ))
        ) : (
          <View style={styles.emptyArrayState}>
            <Ionicons name="list-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyArrayText}>No steps added yet</Text>
            <Text style={styles.emptyArraySubtext}>Click the + button to add your first step</Text>
          </View>
        )}
      </View>
    );
  };

  const renderFaqsForm = () => {
    if (!content || !content.content) return null;

    const questions = content.content.questions || [];

    return (
      <View>
        <Text style={styles.sectionHeaderText}>FAQs Content</Text>
        
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={content.content.title || ''}
          onChangeText={(text) => updateField('title', text)}
          placeholderTextColor="#9ca3af"
        />

        <Text style={styles.label}>Subtitle</Text>
        <TextInput
          style={styles.input}
          value={content.content.subtitle || ''}
          onChangeText={(text) => updateField('subtitle', text)}
          placeholderTextColor="#9ca3af"
        />

        <View style={styles.arrayHeader}>
          <Text style={styles.sectionHeaderText}>Questions</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => addArrayItem('questions', {
              question: '',
              answer: ''
            })}
          >
            <Ionicons name="add-circle" size={28} color="#222" />
          </TouchableOpacity>
        </View>

        {questions.length > 0 ? (
          questions.map((item, index) => (
            <View key={index} style={styles.arrayItemContainer}>
              <View style={styles.arrayItemHeader}>
                <Text style={styles.arrayItemTitle}>FAQ {index + 1}</Text>
                <TouchableOpacity onPress={() => removeArrayItem('questions', index)}>
                  <Ionicons name="trash" size={22} color="#ef4444" />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Question</Text>
              <TextInput
                style={styles.input}
                value={item.question || ''}
                onChangeText={(text) => updateArrayItem('questions', index, 'question', text)}
                placeholderTextColor="#9ca3af"
              />

              <Text style={styles.label}>Answer</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={item.answer || ''}
                onChangeText={(text) => updateArrayItem('questions', index, 'answer', text)}
                multiline
                numberOfLines={4}
                placeholderTextColor="#9ca3af"
              />
            </View>
          ))
        ) : (
          <View style={styles.emptyArrayState}>
            <Ionicons name="help-circle-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyArrayText}>No questions added yet</Text>
            <Text style={styles.emptyArraySubtext}>Click the + button to add your first FAQ</Text>
          </View>
        )}
      </View>
    );
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            Edit {section === 'about_us' ? 'About Us' : section === 'how_it_works' ? 'How It Works' : 'FAQs'}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text>Loading...</Text>
            </View>
          ) : content && content.content ? (
            <>
              {section === 'about_us' && renderAboutUsForm()}
              {section === 'how_it_works' && renderHowItWorksForm()}
              {section === 'faqs' && renderFaqsForm()}

              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No content available</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

// Gallery Management Modal
// Gallery Management Modal - FIXED WITH UPLOAD DATE
const GalleryModal = ({ visible, onClose, onRefresh }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadData, setUploadData] = useState({
    image: null,
    preview: null,
    title: '',
    description: '',
    uploadedDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (visible) {
      fetchImages();
    }
  }, [visible]);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('gallery_images')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setImages(data || []);
    } catch (err) {
      console.error('Error fetching images:', err);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setUploadData({
        ...uploadData,
        image: result.assets[0],
        preview: result.assets[0].uri
      });
      setShowUploadForm(true);
    }
  };

  const handleUpload = async () => {
    if (!uploadData.image) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Upload to storage
      const fileExt = uploadData.image.uri.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      
      // Create form data for upload
      const formData = new FormData();
      formData.append('file', {
        uri: uploadData.image.uri,
        name: fileName,
        type: `image/${fileExt}`
      });

      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(fileName, formData);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('gallery')
        .getPublicUrl(fileName);

      // Save to database with uploaded_date
      const { error: dbError } = await supabase
        .from('gallery_images')
        .insert({
          image_url: urlData.publicUrl,
          title: uploadData.title || '',
          description: uploadData.description || '',
          uploaded_date: uploadData.uploadedDate,
          display_order: images.length,
          is_active: true,
          uploaded_by: user?.id
        });

      if (dbError) throw dbError;

      Alert.alert('Success', 'Image uploaded successfully!');
      
      // Reset form
      setShowUploadForm(false);
      setUploadData({
        image: null,
        preview: null,
        title: '',
        description: '',
        uploadedDate: new Date().toISOString().split('T')[0]
      });
      
      fetchImages();
      onRefresh();
    } catch (err) {
      console.error('Error uploading image:', err);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (imageId, imageUrl) => {
    Alert.alert(
      'Delete Image',
      'Are you sure you want to delete this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const fileName = imageUrl.split('/').pop();

              const { error: storageError } = await supabase.storage
                .from('gallery')
                .remove([fileName]);

              if (storageError) throw storageError;

              const { error: dbError } = await supabase
                .from('gallery_images')
                .delete()
                .eq('id', imageId);

              if (dbError) throw dbError;

              Alert.alert('Success', 'Image deleted successfully!');
              fetchImages();
              onRefresh();
            } catch (err) {
              console.error('Error deleting image:', err);
              Alert.alert('Error', 'Failed to delete image');
            }
          }
        }
      ]
    );
  };

  const toggleActive = async (imageId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('gallery_images')
        .update({ is_active: !currentStatus })
        .eq('id', imageId);

      if (error) throw error;

      fetchImages();
      onRefresh();
    } catch (err) {
      console.error('Error updating status:', err);
      Alert.alert('Error', 'Failed to update image status');
    }
  };

  const cancelUpload = () => {
    setShowUploadForm(false);
    setUploadData({
      image: null,
      preview: null,
      title: '',
      description: '',
      uploadedDate: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Gallery Management</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {!showUploadForm && (
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={pickImage}
                disabled={uploading}
              >
                <Ionicons name="cloud-upload" size={20} color="#fff" />
                <Text style={styles.uploadButtonText}>Upload</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          style={styles.modalContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Upload Form */}
          {showUploadForm && uploadData.preview && (
            <View style={styles.uploadFormContainer}>
              <Text style={styles.uploadFormTitle}>Upload Image Details</Text>
              
              {/* Image Preview */}
              <View style={styles.imagePreviewContainer}>
                <Image
                  source={{ uri: uploadData.preview }}
                  style={styles.imagePreview}
                />
              </View>

              {/* Title Input */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Title (Optional)</Text>
                <TextInput
                  style={styles.formInput}
                  value={uploadData.title}
                  onChangeText={(text) => setUploadData({ ...uploadData, title: text })}
                  placeholder="Enter image title"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              {/* Description Input */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description (Optional)</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={uploadData.description}
                  onChangeText={(text) => setUploadData({ ...uploadData, description: text })}
                  placeholder="Enter image description"
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Upload Date Input */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Upload Date *</Text>
                <TextInput
                  style={styles.formInput}
                  value={uploadData.uploadedDate}
                  onChangeText={(text) => setUploadData({ ...uploadData, uploadedDate: text })}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9ca3af"
                />
                <Text style={styles.formHint}>
                  Format: YYYY-MM-DD (e.g., 2024-01-15)
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.uploadFormActions}>
                <TouchableOpacity
                  style={[styles.uploadFormButton, styles.confirmButton]}
                  onPress={handleUpload}
                  disabled={uploading}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.uploadFormButtonText}>
                    {uploading ? 'Uploading...' : 'Confirm Upload'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.uploadFormButton, styles.cancelUploadButton]}
                  onPress={cancelUpload}
                  disabled={uploading}
                >
                  <Ionicons name="close-circle" size={20} color="#ef4444" />
                  <Text style={[styles.uploadFormButtonText, { color: '#ef4444' }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Gallery Grid */}
          {!showUploadForm && (
            <>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <Text>Loading images...</Text>
                </View>
              ) : images.length === 0 ? (
                <View style={styles.emptyGallery}>
                  <Ionicons name="images-outline" size={64} color="#d1d5db" />
                  <Text style={styles.emptyGalleryText}>No images yet</Text>
                  <Text style={styles.emptyGallerySubtext}>Upload your first image</Text>
                </View>
              ) : (
                <View style={styles.galleryGrid}>
                  {images.map((img) => (
                    <View key={img.id} style={styles.galleryItem}>
                      <Image source={{ uri: img.image_url }} style={styles.galleryImage} />
                      
                      {/* Action Buttons */}
                      <View style={styles.galleryItemActions}>
                        <TouchableOpacity
                          style={[styles.galleryActionBtn, img.is_active && styles.activeBtn]}
                          onPress={() => toggleActive(img.id, img.is_active)}
                        >
                          <Ionicons 
                            name={img.is_active ? "eye" : "eye-off"} 
                            size={16} 
                            color="#fff" 
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.galleryActionBtn, styles.deleteBtn]}
                          onPress={() => deleteImage(img.id, img.image_url)}
                        >
                          <Ionicons name="trash" size={16} color="#fff" />
                        </TouchableOpacity>
                      </View>

                      {/* Image Info */}
                      <View style={styles.galleryItemInfo}>
                        {img.title && (
                          <Text style={styles.galleryItemTitle} numberOfLines={1}>
                            {img.title}
                          </Text>
                        )}
                        <View style={styles.galleryItemMeta}>
                          <Ionicons name="calendar-outline" size={12} color="#6b7280" />
                          <Text style={styles.galleryItemDate}>
                            {new Date(img.uploaded_date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </Text>
                        </View>
                        <View style={styles.galleryItemStatus}>
                          <View style={[
                            styles.statusBadge,
                            { backgroundColor: img.is_active ? '#dcfce7' : '#f3f4f6' }
                          ]}>
                            <Text style={[
                              styles.statusBadgeText,
                              { color: img.is_active ? '#16a34a' : '#6b7280' }
                            ]}>
                              {img.is_active ? 'Visible' : 'Hidden'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

// After NotificationsModal, WebsiteContentModal, and GalleryModal components
// Around line 600-800 in your file

// 👇 PASTE THE ENTIRE ContactModal COMPONENT HERE 👇
const ContactModal = ({ visible, onClose, onRefresh }) => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchContent();
    }
  }, [visible]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('website_content')
        .select('*')
        .eq('section', 'contact')
        .single();

      if (error) throw error;
      
      if (data && data.content) {
        if (!data.content.social_media || !Array.isArray(data.content.social_media)) {
          data.content.social_media = [];
        }
        setContent(data);
      }
    } catch (err) {
      console.error('Error fetching contact content:', err);
      Alert.alert('Error', 'Failed to load contact information');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!content || !content.content) {
      Alert.alert('Error', 'No content to save');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('website_content')
        .update({
          content: content.content,
          updated_at: new Date().toISOString(),
          updated_by: user?.id
        })
        .eq('section', 'contact');

      if (error) throw error;

      Alert.alert('Success', 'Contact information updated successfully! Changes will appear on your website.');
      onRefresh();
      onClose();
    } catch (err) {
      console.error('Error saving contact:', err);
      Alert.alert('Error', 'Failed to save contact information');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setContent(prev => ({
      ...prev,
      content: { ...prev.content, [field]: value }
    }));
  };

  const updateSocialMedia = (index, field, value) => {
    setContent(prev => {
      const newSocial = [...prev.content.social_media];
      newSocial[index] = { ...newSocial[index], [field]: value };
      return {
        ...prev,
        content: { ...prev.content, social_media: newSocial }
      };
    });
  };

  const addSocialMedia = () => {
    setContent(prev => ({
      ...prev,
      content: {
        ...prev.content,
        social_media: [
          ...prev.content.social_media,
          { platform: '', url: '', icon: 'facebook' }
        ]
      }
    }));
  };

  const removeSocialMedia = (index) => {
    setContent(prev => ({
      ...prev,
      content: {
        ...prev.content,
        social_media: prev.content.social_media.filter((_, i) => i !== index)
      }
    }));
  };

  const socialIconOptions = [
    { label: 'Facebook', value: 'facebook' },
    { label: 'Instagram', value: 'instagram' },
    { label: 'Twitter', value: 'twitter' },
    { label: 'LinkedIn', value: 'linkedin' },
    { label: 'YouTube', value: 'youtube' },
    { label: 'TikTok', value: 'tiktok' },
  ];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Edit Contact Information</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text>Loading...</Text>
            </View>
          ) : content && content.content ? (
            <>
              {/* Section Titles */}
              <Text style={styles.sectionHeaderText}>Section Titles</Text>
              
              <Text style={styles.label}>Main Title</Text>
              <TextInput
                style={styles.input}
                value={content.content.title || ''}
                onChangeText={(text) => updateField('title', text)}
                placeholder="Contact Us"
                placeholderTextColor="#9ca3af"
              />

              <Text style={styles.label}>Subtitle</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={content.content.subtitle || ''}
                onChangeText={(text) => updateField('subtitle', text)}
                placeholder="Section subtitle"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
              />

              <Text style={styles.label}>Details Title</Text>
              <TextInput
                style={styles.input}
                value={content.content.details_title || ''}
                onChangeText={(text) => updateField('details_title', text)}
                placeholder="Contact Details"
                placeholderTextColor="#9ca3af"
              />

              <Text style={styles.label}>Details Subtitle</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={content.content.details_subtitle || ''}
                onChangeText={(text) => updateField('details_subtitle', text)}
                placeholder="Details subtitle"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
              />

              {/* Contact Information */}
              <Text style={styles.sectionHeaderText}>Contact Information</Text>

              <Text style={styles.label}>Address</Text>
              <TextInput
                style={styles.input}
                value={content.content.address || ''}
                onChangeText={(text) => updateField('address', text)}
                placeholder="Cebu City, Philippines"
                placeholderTextColor="#9ca3af"
              />

              <Text style={styles.label}>Mobile Number</Text>
              <TextInput
                style={styles.input}
                value={content.content.mobile || ''}
                onChangeText={(text) => updateField('mobile', text)}
                placeholder="+63 900 000 0000"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>Availability</Text>
              <TextInput
                style={styles.input}
                value={content.content.availability || ''}
                onChangeText={(text) => updateField('availability', text)}
                placeholder="Daily 09 am – 05 pm"
                placeholderTextColor="#9ca3af"
              />

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={content.content.email || ''}
                onChangeText={(text) => updateField('email', text)}
                placeholder="hello@rentalden.com"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {/* Map Embed */}
              <Text style={styles.sectionHeaderText}>Google Maps</Text>
              <Text style={styles.label}>Map Embed URL</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={content.content.map_embed || ''}
                onChangeText={(text) => updateField('map_embed', text)}
                placeholder="Paste Google Maps embed URL here"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
              />
              <Text style={styles.formHint}>
                Get this from Google Maps → Share → Embed a map → Copy the src URL
              </Text>

              {/* Social Media */}
              <View style={styles.arrayHeader}>
                <Text style={styles.sectionHeaderText}>Social Media Links</Text>
                <TouchableOpacity style={styles.addButton} onPress={addSocialMedia}>
                  <Ionicons name="add-circle" size={28} color="#222" />
                </TouchableOpacity>
              </View>

              {content.content.social_media && content.content.social_media.length > 0 ? (
                content.content.social_media.map((social, index) => (
                  <View key={index} style={styles.arrayItemContainer}>
                    <View style={styles.arrayItemHeader}>
                      <Text style={styles.arrayItemTitle}>Social Media {index + 1}</Text>
                      <TouchableOpacity onPress={() => removeSocialMedia(index)}>
                        <Ionicons name="trash" size={22} color="#ef4444" />
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.label}>Platform Name</Text>
                    <TextInput
                      style={styles.input}
                      value={social.platform || ''}
                      onChangeText={(text) => updateSocialMedia(index, 'platform', text)}
                      placeholder="e.g., Facebook"
                      placeholderTextColor="#9ca3af"
                    />

                    <Text style={styles.label}>Icon</Text>
                    <View style={styles.pickerContainer}>
                      {socialIconOptions.map((option) => (
                        <TouchableOpacity
                          key={option.value}
                          style={[
                            styles.iconOption,
                            social.icon === option.value && styles.iconOptionSelected
                          ]}
                          onPress={() => updateSocialMedia(index, 'icon', option.value)}
                        >
                          <Text style={[
                            styles.iconOptionText,
                            social.icon === option.value && styles.iconOptionTextSelected
                          ]}>
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={styles.label}>URL</Text>
                    <TextInput
                      style={styles.input}
                      value={social.url || ''}
                      onChangeText={(text) => updateSocialMedia(index, 'url', text)}
                      placeholder="https://..."
                      placeholderTextColor="#9ca3af"
                      autoCapitalize="none"
                      keyboardType="url"
                    />
                  </View>
                ))
              ) : (
                <View style={styles.emptyArrayState}>
                  <Ionicons name="share-social-outline" size={48} color="#d1d5db" />
                  <Text style={styles.emptyArrayText}>No social media links added</Text>
                  <Text style={styles.emptyArraySubtext}>Click the + button to add social media</Text>
                </View>
              )}

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};
// 👆 END OF ContactModal COMPONENT 👆

// Main Dashboard Component
export default function DashboardScreen({ navigation }) {
  const [dashboardData, setDashboardData] = useState({
    totalVehicles: 0,
    availableVehicles: 0,
    activeBookings: 0,
    todayBookings: 0,
    monthlyRevenue: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    declinedBookings: 0,
    recentBookings: []
  });
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [feedbackModal, setFeedbackModal] = useState({ visible: false, type: "success", message: "" });
  const [actionModalConfig, setActionModalConfig] = useState(null);

  
  // Website management modals
  const [showContentModal, setShowContentModal] = useState(false);
  const [contentSection, setContentSection] = useState(null);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [contactModalVisible, setContactModalVisible] = useState(false);


  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id);
    };
    getCurrentUser();
  }, []);

  const createNotification = async (notificationData) => {
    if (!currentUserId) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: currentUserId,
          booking_id: notificationData.bookingId,
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type,
          read: false,
          dismissed: false
        });

      if (error) console.error('Error creating notification:', error);
    } catch (err) {
      console.error('Error creating notification:', err);
    }
  };

  const generateNotifications = async (bookings) => {
    if (!currentUserId) return;

    const today = new Date();
    const notificationPromises = [];

    for (const booking of bookings) {
      const startDate = new Date(booking.rental_start_date);
      const endDate = new Date(booking.rental_end_date);
      const timeDiff = startDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      const endTimeDiff = endDate.getTime() - today.getTime();
      const endDaysDiff = Math.ceil(endTimeDiff / (1000 * 3600 * 24));

      const { data: existingNotifications } = await supabase
        .from('notifications')
        .select('id, type')
        .eq('booking_id', booking.id)
        .eq('user_id', currentUserId)
        .eq('dismissed', false);

      const existingTypes = new Set(existingNotifications?.map(n => n.type) || []);

      if (booking.status === 'confirmed') {
        if (daysDiff === 0 && !existingTypes.has('pickup_today')) {
          notificationPromises.push(createNotification({
            bookingId: booking.id,
            type: 'pickup_today',
            title: 'Vehicle pickup today!',
            message: `${booking.customer_name} is picking up ${booking.vehicles?.year} ${booking.vehicles?.make} ${booking.vehicles?.model} today`
          }));
        }
      }

      if (booking.status === 'pending' && !existingTypes.has('new_booking')) {
        notificationPromises.push(createNotification({
          bookingId: booking.id,
          type: 'new_booking',
          title: 'New Booking Request',
          message: `${booking.customer_name} requested ${booking.vehicles?.year} ${booking.vehicles?.make} ${booking.vehicles?.model}`
        }));
      }
    }

    await Promise.all(notificationPromises);
    await fetchNotifications();
  };

  const fetchNotifications = async () => {
    if (!currentUserId) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          id,
          title,
          message,
          type,
          read,
          dismissed,
          created_at,
          booking_id,
          bookings (
            customer_name,
            vehicles (
              make,
              model,
              year
            )
          )
        `)
        .eq('user_id', currentUserId)
        .eq('dismissed', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedNotifications = data.map(notification => {
        const createdAt = new Date(notification.created_at);
        const now = new Date();
        const diffInMinutes = Math.floor((now - createdAt) / (1000 * 60));
        
        let timeAgo;
        if (diffInMinutes < 1) {
          timeAgo = 'Just now';
        } else if (diffInMinutes < 60) {
          timeAgo = `${diffInMinutes}m ago`;
        } else if (diffInMinutes < 1440) {
          const hours = Math.floor(diffInMinutes / 60);
          timeAgo = `${hours}h ago`;
        } else {
          const days = Math.floor(diffInMinutes / 1440);
          timeAgo = `${days}d ago`;
        }

        return {
          ...notification,
          timeAgo,
          bookingId: notification.booking_id
        };
      });

      setNotifications(formattedNotifications);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const todayStr = today.toISOString().split('T')[0];

      const { data: vehicles, error: vehicleError } = await supabase
        .from('vehicles')
        .select('*');
      if (vehicleError) throw vehicleError;

      const { data: bookings, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          *,
          vehicles (
            make,
            model,
            year
          ),
          vehicle_variants (
            color,
            plate_number
          )
        `)
        .order('created_at', { ascending: false });
      if (bookingError) throw bookingError;

      const activeBookings = bookings?.filter(b => 
        b.status === 'confirmed' || b.status === 'pending'
      ).length || 0;

      const todayBookings = bookings?.filter(b => {
        const createdDate = new Date(b.created_at).toISOString().split('T')[0];
        return createdDate === todayStr;
      }).length || 0;

      const monthlyRevenue = bookings
        ?.filter(b => {
          if (b.status !== 'completed') return false;
          if (!b.total_price || parseFloat(b.total_price) <= 0) return false;
          if (!b.updated_at) return false;
          
          try {
            const completedDate = new Date(b.updated_at);
            return completedDate >= startOfMonth && completedDate <= endOfMonth;
          } catch (error) {
            return false;
          }
        })
        .reduce((sum, b) => {
          const price = parseFloat(b.total_price) || 0;
          return sum + price;
        }, 0) || 0;

      const pendingBookings = bookings?.filter(b => b.status === 'pending').length || 0;
      const confirmedBookings = bookings?.filter(b => b.status === 'confirmed').length || 0;
      const completedBookings = bookings?.filter(b => b.status === 'completed').length || 0;
      const cancelledBookings = bookings?.filter(b => b.status === 'cancelled').length || 0;
      const declinedBookings = bookings?.filter(b => b.status === 'declined').length || 0;

      const currentlyRentedVehicleIds = new Set(
        bookings?.filter(b => {
          const today = new Date();
          const startDate = new Date(b.rental_start_date);
          const endDate = new Date(b.rental_end_date);
          return (
            (b.status === 'confirmed' || b.status === 'pending') &&
            startDate <= today && 
            endDate >= today
          );
        }).map(b => b.vehicle_id) || []
      );
      
      const availableVehicles = vehicles?.filter(v => 
        !currentlyRentedVehicleIds.has(v.id)
      ).length || 0;

      const recentBookings = bookings?.slice(0, 5) || [];

      setDashboardData({
        totalVehicles: vehicles?.length || 0,
        availableVehicles,
        activeBookings,
        todayBookings,
        monthlyRevenue,
        pendingBookings,
        confirmedBookings,
        completedBookings,
        cancelledBookings,
        declinedBookings,
        recentBookings
      });

      await generateNotifications(bookings || []);

    } catch (err) {
      console.error('Dashboard fetch error:', err);
      Alert.alert('Error', 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserId) {
      fetchDashboardData();
    }
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;

    const vehiclesSub = supabase
      .channel('dashboard-vehicles-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'vehicles' 
      }, fetchDashboardData)
      .subscribe();

    const bookingsSub = supabase
      .channel('dashboard-bookings-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'bookings' 
      }, (payload) => {
        const { eventType, new: newBooking, old: oldBooking } = payload;

        if (eventType === 'INSERT') {
          createNotification({
            bookingId: newBooking.id,
            type: 'new_booking',
            title: 'New Booking Added',
            message: `${newBooking.customer_name} booked a vehicle`
          });
        }

        if (eventType === 'UPDATE' && oldBooking.status !== newBooking.status) {
          createNotification({
            bookingId: newBooking.id,
            type: 'status_change',
            title: `Booking ${newBooking.status}`,
            message: `${newBooking.customer_name}'s booking is now ${newBooking.status}`
          });
        }

        fetchDashboardData();
      })
      .subscribe();

    const notificationsSub = supabase
      .channel('dashboard-notifications-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${currentUserId}`
      }, fetchNotifications)
      .subscribe();

    return () => {
      supabase.removeChannel(vehiclesSub);
      supabase.removeChannel(bookingsSub);
      supabase.removeChannel(notificationsSub);
    };
  }, [currentUserId]);

  const handleLogout = async () => {
    setActionModalConfig({
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      onConfirm: async () => {
        try {
          await supabase.auth.signOut();
        } catch (error) {
          console.error('Logout error:', error);
          setFeedbackModal({ 
            visible: true, 
            type: "error", 
            message: "Failed to logout. Please try again." 
          });
        }
      }
    });
  };

  const handleMarkNotificationRead = async (notificationId) => {
    try {
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', currentUserId);

      if (error) {
        console.error('Error updating notification:', error);
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === notificationId ? { ...notif, read: false } : notif
          )
        );
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleClearAll = async () => {
    setActionModalConfig({
      title: 'Clear All Notifications',
      message: 'Are you sure you want to clear all notifications? This action cannot be undone.',
      onConfirm: async () => {
        try {
          setNotifications([]);
  
          const { error } = await supabase
            .from('notifications')
            .update({ dismissed: true })
            .eq('user_id', currentUserId)
            .eq('dismissed', false);
  
          if (error) {
            console.error('Error clearing all notifications:', error);
            fetchNotifications();
          } else {
            setFeedbackModal({ 
              visible: true, 
              type: "success", 
              message: "All notifications cleared successfully!" 
            });
          }
        } catch (err) {
          console.error('Error clearing all notifications:', err);
          setFeedbackModal({ 
            visible: true, 
            type: "error", 
            message: "Failed to clear notifications. Please try again." 
          });
        }
      }
    });
  };

  const handleMarkAllRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', currentUserId)
        .eq('read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        fetchNotifications();
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const handleRemoveNotification = async (notificationId) => {
    try {
      setNotifications(prev => 
        prev.filter(notif => notif.id !== notificationId)
      );
  
      const { error } = await supabase
        .from('notifications')
        .update({ dismissed: true })
        .eq('id', notificationId)
        .eq('user_id', currentUserId);
  
      if (error) {
        console.error('Error dismissing notification:', error);
        fetchNotifications();
      } else {
        setFeedbackModal({ 
          visible: true, 
          type: "success", 
          message: "Notification removed successfully!" 
        });
      }
    } catch (err) {
      console.error('Error removing notification:', err);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'completed': return '#3b82f6';
      case 'cancelled': return '#ef4444';
      case 'declined': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const StatCard = ({ title, value, icon, color, onPress }) => (
    <TouchableOpacity style={styles.statCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.statContent}>
        <Ionicons name={icon} size={28} color={color} style={styles.statIcon} />
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </TouchableOpacity>
  );

  const openContentEditor = (section) => {
    setContentSection(section);
    setShowContentModal(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSubtitle}>Welcome back!</Text>
        </View>
        <View style={styles.headerActions}>
          <NotificationBell
            notifications={notifications}
            onPress={() => setShowNotifications(true)}
          />
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={28} color="#222" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchDashboardData} />
        }
        contentContainerStyle={styles.scrollContainer}
      >
        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <StatCard
            title="Total Vehicles"
            value={dashboardData.totalVehicles}
            icon="car"
            color="#222"
            onPress={() => navigation?.navigate?.('Vehicles')}
          />
          <StatCard
            title="Available"
            value={dashboardData.availableVehicles}
            icon="checkmark-circle"
            color="#222"
            onPress={() => navigation?.navigate?.('Vehicles')}
          />
          <StatCard
            title="Active Rentals"
            value={dashboardData.activeBookings}
            icon="time"
            color="#222"
            onPress={() => navigation?.navigate?.('Bookings')}
          />
          <StatCard
            title="Today's Bookings"
            value={dashboardData.todayBookings}
            icon="calendar"
            color="#222"
            onPress={() => navigation?.navigate?.('Bookings')}
          />
        </View>

        {/* Revenue Card */}
        <View style={styles.revenueCard}>
          <View style={styles.revenueHeader}>
            <Text style={styles.sectionTitle}>Monthly Revenue</Text>
          </View>
          <View style={styles.revenueContent}>
            <View>
              <Text style={styles.revenueValue}>
                {formatCurrency(dashboardData.monthlyRevenue)}
              </Text>
              <Text style={styles.revenueSubtext}>
                {new Date().toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })}
              </Text>
            </View>
            <View style={styles.revenueIconContainer}>
              <Ionicons name="trending-up" size={32} color="#4CAF50" />
            </View>
          </View>
        </View>

        {/* Booking Status Overview */}
        <View style={styles.statusOverviewCard}>
          <Text style={styles.sectionTitle}>Booking Status Overview</Text>
          <View style={styles.statusGrid}>
            <View style={styles.statusItem}>
              <View style={[styles.statusIndicator, { backgroundColor: '#f59e0b' }]} />
              <View>
                <Text style={styles.statusValue}>{dashboardData.pendingBookings}</Text>
                <Text style={styles.statusLabel}>Pending</Text>
              </View>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusIndicator, { backgroundColor: '#10b981' }]} />
              <View>
                <Text style={styles.statusValue}>{dashboardData.confirmedBookings}</Text>
                <Text style={styles.statusLabel}>Confirmed</Text>
              </View>
            </View>
          </View>
          <View style={styles.statusGrid}>
            <View style={styles.statusItem}>
              <View style={[styles.statusIndicator, { backgroundColor: '#3b82f6' }]} />
              <View>
                <Text style={styles.statusValue}>{dashboardData.completedBookings}</Text>
                <Text style={styles.statusLabel}>Completed</Text>
              </View>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusIndicator, { backgroundColor: '#ef4444' }]} />
              <View>
                <Text style={styles.statusValue}>{dashboardData.cancelledBookings}</Text>
                <Text style={styles.statusLabel}>Cancelled</Text>
              </View>
            </View>
          </View>
          <View style={styles.statusGrid}>
            <View style={styles.statusItem}>
              <View style={[styles.statusIndicator, { backgroundColor: '#8b5cf6' }]} />
              <View>
                <Text style={styles.statusValue}>{dashboardData.declinedBookings}</Text>
                <Text style={styles.statusLabel}>Declined</Text>
              </View>
            </View>
          </View>
        </View>

       

        {/* Recent Bookings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Bookings</Text>
            <TouchableOpacity onPress={() => navigation?.navigate?.('Bookings')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {dashboardData.recentBookings.length > 0 ? (
            dashboardData.recentBookings.map((booking) => (
              <View key={booking.id} style={styles.bookingItem}>
                <View style={styles.bookingLeft}>
                  <View
                    style={[
                      styles.bookingStatus,
                      { backgroundColor: getStatusColor(booking.status) }
                    ]}
                  />
                  <View style={styles.bookingInfo}>
                    <View style={styles.bookingNameRow}>
                      <Ionicons name="person" size={14} color="#6b7280" />
                      <Text style={styles.bookingCustomer}>{booking.customer_name}</Text>
                    </View>
                    
                    {booking.vehicles && (
                      <View style={styles.bookingVehicleRow}>
                        <Ionicons name="car" size={12} color="#6b7280" />
                        <Text style={styles.bookingVehicle}>
                          {`${booking.vehicles.year} ${booking.vehicles.make} ${booking.vehicles.model}`}
                        </Text>
                      </View>
                    )}
                    
                    {booking.vehicle_variants?.plate_number && (
                      <View style={styles.bookingPlateRow}>
                        <Ionicons name="card" size={12} color="#6b7280" />
                        <Text style={styles.bookingVehicle}>
                          {booking.vehicle_variants.plate_number}
                        </Text>
                      </View>
                    )}
                    
                    <View style={styles.bookingDateRow}>
                      <Ionicons name="calendar-outline" size={12} color="#6b7280" />
                      <Text style={styles.bookingDate}>
                        {formatDate(booking.rental_start_date)} - {formatDate(booking.rental_end_date)}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.bookingRight}>
                  <Text style={styles.bookingAmount}>
                    {formatCurrency(booking.total_price)}
                  </Text>
                  <Text
                    style={[
                      styles.bookingStatusText,
                      { color: getStatusColor(booking.status) }
                    ]}
                  >
                    {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyStateText}>No recent bookings</Text>
              <Text style={styles.emptyStateSubtext}>
                New bookings will appear here
              </Text>
            </View>
          )}
        </View>


         {/* Website Management Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Website Management</Text>
          </View>
          
          {/* About Us Editor */}
          <TouchableOpacity
            style={styles.websiteCard}
            onPress={() => openContentEditor('about_us')}
          >
            <View style={styles.websiteCardHeader}>
              <Ionicons name="information-circle" size={24} color="#222" />
              <Text style={styles.websiteCardTitle}>About Us Section</Text>
            </View>
            <Text style={styles.websiteCardDesc}>
              Edit title, description, and statistics
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#999" style={styles.websiteCardIcon} />
          </TouchableOpacity>

          {/* How It Works Editor */}
          <TouchableOpacity
            style={styles.websiteCard}
            onPress={() => openContentEditor('how_it_works')}
          >
            <View style={styles.websiteCardHeader}>
              <Ionicons name="list" size={24} color="#222" />
              <Text style={styles.websiteCardTitle}>How It Works Section</Text>
            </View>
            <Text style={styles.websiteCardDesc}>
              Manage rental process steps
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#999" style={styles.websiteCardIcon} />
          </TouchableOpacity>

          {/* FAQs Editor */}
          <TouchableOpacity
            style={styles.websiteCard}
            onPress={() => openContentEditor('faqs')}
          >
            <View style={styles.websiteCardHeader}>
              <Ionicons name="help-circle" size={24} color="#222" />
              <Text style={styles.websiteCardTitle}>FAQs Section</Text>
            </View>
            <Text style={styles.websiteCardDesc}>
              Update frequently asked questions
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#999" style={styles.websiteCardIcon} />
          </TouchableOpacity>

          {/* Gallery Manager */}
          <TouchableOpacity
            style={styles.websiteCard}
            onPress={() => setShowGalleryModal(true)}
          >
            <View style={styles.websiteCardHeader}>
              <Ionicons name="images" size={24} color="#222" />
              <Text style={styles.websiteCardTitle}>Gallery</Text>
            </View>
            <Text style={styles.websiteCardDesc}>
              Upload and manage gallery images
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#999" style={styles.websiteCardIcon} />
          </TouchableOpacity>


            {/* 👇 ADD THIS NEW CONTACT CARD HERE 👇 */}
    <TouchableOpacity
      style={styles.websiteCard}
      onPress={() => setContactModalVisible(true)}
    >
      <View style={styles.websiteCardHeader}>
        <Ionicons name="call" size={24} color="#222" />
        <Text style={styles.websiteCardTitle}>Contact Information</Text>
      </View>
      <Text style={styles.websiteCardDesc}>
      Edit contact details and social media
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#999" style={styles.websiteCardIcon} />
          </TouchableOpacity>

              </View>
            </ScrollView>

      {/* Notifications Modal */}
      <NotificationsModal
        visible={showNotifications}
        notifications={notifications}
        onClose={() => setShowNotifications(false)}
        onMarkRead={handleMarkNotificationRead}
        onMarkAllRead={handleMarkAllRead}
        onClearAll={handleClearAll} 
        onRemove={handleRemoveNotification}
        setActionModalConfig={setActionModalConfig}
      />

      {/* Website Content Editor Modal */}
      <WebsiteContentModal
        visible={showContentModal}
        onClose={() => {
          setShowContentModal(false);
          setContentSection(null);
        }}
        section={contentSection}
        onSave={fetchDashboardData}
      />

      {/* Gallery Modal */}
      <GalleryModal
        visible={showGalleryModal}
        onClose={() => setShowGalleryModal(false)}
        onRefresh={fetchDashboardData}
      />

<ContactModal
  visible={contactModalVisible}
  onClose={() => setContactModalVisible(false)}
  onRefresh={fetchDashboardData}  // ✅ CORRECT
/>

      {/* Action Modal */}
      {actionModalConfig && (
        <ActionModal
          visible={!!actionModalConfig}
          type="confirm"
          title={actionModalConfig.title}
          message={actionModalConfig.message}
          onClose={() => setActionModalConfig(null)}
          onConfirm={() => {
            actionModalConfig.onConfirm();
            setActionModalConfig(null);
          }}
        />
      )}

      {/* Feedback Modal */}
      <ActionModal
        visible={feedbackModal.visible}
        type={feedbackModal.type}
        title={feedbackModal.type === "success" ? "Success" : "Error"}
        message={feedbackModal.message}
        confirmText="OK"
        onClose={() => setFeedbackModal({ visible: false, type: "success", message: "" })}
        onConfirm={() => setFeedbackModal({ visible: false, type: "success", message: "" })}
      />
    </View>
  )
}


  const styles = StyleSheet.create({
    container: { 
      flex: 1, 
      backgroundColor: '#fcfcfc', 
      paddingHorizontal: 18, 
      justifyContent: 'space-between', 
      paddingTop: 8 
    },
    header: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: 24, 
      marginTop: 8 
    },
    headerLeft: { flex: 1 },
    headerTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
    headerSubtitle: { fontSize: 14, color: '#6b7280', marginTop: 2 },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    notificationBell: { position: 'relative', padding: 10, borderRadius: 8 },
    notificationBadge: {
      position: 'absolute', top: 4, right: 4, backgroundColor: '#222',
      borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center',
      alignItems: 'center', paddingHorizontal: 4
    },
    notificationBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
    logoutButton: { padding: 8, borderRadius: 8, backgroundColor: '#f3f4f6' },
    
    // Modals
    modalContainer: { flex: 1, backgroundColor: 'white' },
    modalHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb'
    },
    modalTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
    modalHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    markAllReadButton: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#f3f4f6', borderRadius: 6 },
    markAllReadText: { fontSize: 14, color: '#4b5563', fontWeight: '500' },
    clearAllButton: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#fee2e2', borderRadius: 6 },
    clearAllText: { fontSize: 14, color: '#ef4444', fontWeight: '500' },
    closeButton: { padding: 4 },
    modalContent: { flex: 1, padding: 20 },
    
    // Notifications
    notificationsList: { paddingHorizontal: 20, paddingVertical: 16 },
    notificationWrapper: { marginBottom: 12 },
    notificationItem: {
      flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 16, paddingHorizontal: 16,
      backgroundColor: '#f9fafb', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', position: 'relative'
    },
    unreadNotification: { backgroundColor: '#fff7ed', borderColor: '#fed7aa' },
    notificationItemActive: { borderColor: '#3b82f6', backgroundColor: '#eff6ff' },
    notificationIconContainer: {
      width: 40, height: 40, borderRadius: 20, justifyContent: 'center',
      alignItems: 'center', marginRight: 12
    },
    notificationContent: { flex: 1 },
    notificationTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
    notificationMessage: { fontSize: 14, color: '#6b7280', marginBottom: 8, lineHeight: 20 },
    notificationTime: { fontSize: 12, color: '#9ca3af', fontWeight: '500' },
    unreadDot: {
      width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF6B35',
      position: 'absolute', top: 16, right: 16
    },
    notificationMenuButton: { padding: 8, borderRadius: 6 },
    notificationActions: {
      flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16,
      paddingVertical: 8, backgroundColor: '#f8fafc', borderRadius: 8, marginTop: 4, gap: 8
    },
    notificationActionButton: {
      flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12,
      paddingVertical: 6, borderRadius: 6, gap: 6
    },
    markReadButton: { backgroundColor: '#dcfce7' },
    removeButton: { backgroundColor: '#fee2e2' },
    cancelButton: { backgroundColor: '#f3f4f6' },
    notificationActionText: { fontSize: 12, fontWeight: '500' },
    emptyNotifications: { alignItems: 'center', paddingVertical: 60 },
    emptyNotificationsText: { fontSize: 16, fontWeight: '500', color: '#6b7280', marginTop: 12 },
    emptyNotificationsSubtext: { fontSize: 14, color: '#9ca3af', marginTop: 4 },
    
    // Form inputs
    label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 12 },
    input: {
      borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12,
      paddingVertical: 10, fontSize: 14, backgroundColor: 'white', color: '#111827'
    },
    textArea: { minHeight: 100, textAlignVertical: 'top' },
    sectionHeader: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 20, marginBottom: 8 },
    arrayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
    addButton: { padding: 4 },
    arrayItemContainer: {
      backgroundColor: '#f9fafb', borderRadius: 8, padding: 12, marginTop: 12,
      borderWidth: 1, borderColor: '#e5e7eb'
    },
    arrayItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    arrayItemTitle: { fontSize: 14, fontWeight: '600', color: '#374151' },
    saveButton: {
      backgroundColor: '#222', borderRadius: 8, paddingVertical: 14, alignItems: 'center',
      marginTop: 24, marginBottom: 40
    },
    saveButtonDisabled: { backgroundColor: '#9ca3af', opacity: 0.6 },
    saveButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
    
    // Gallery
    uploadButton: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: '#222', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6
    },
    uploadButtonText: { color: 'white', fontSize: 14, fontWeight: '500' },
    emptyGallery: { alignItems: 'center', paddingVertical: 60 },
    emptyGalleryText: { fontSize: 16, fontWeight: '500', color: '#6b7280', marginTop: 12 },
    emptyGallerySubtext: { fontSize: 14, color: '#9ca3af', marginTop: 4 },
    galleryGrid: {
      flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 20
    },
    galleryItem: {
      width: (width - 64) / 2, backgroundColor: 'white', borderRadius: 8,
      borderWidth: 1, borderColor: '#e5e7eb', overflow: 'hidden'
    },
    galleryImage: { width: '100%', height: 120, resizeMode: 'cover' },
    galleryItemActions: {
      position: 'absolute', top: 8, right: 8, flexDirection: 'row', gap: 6
    },
    galleryActionBtn: {
      width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center', alignItems: 'center'
    },
    activeBtn: { backgroundColor: 'rgba(34,197,94,0.8)' },
    deleteBtn: { backgroundColor: 'rgba(239,68,68,0.8)' },
    galleryItemInfo: { padding: 8 },
    galleryItemDate: { fontSize: 11, color: '#6b7280' },

    pickerContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 16,
    },
    iconOption: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#d1d5db',
      backgroundColor: 'white',
    },
    iconOptionSelected: {
      backgroundColor: '#222',
      borderColor: '#222',
    },
    iconOptionText: {
      fontSize: 13,
      color: '#6b7280',
      fontWeight: '500',
    },
    iconOptionTextSelected: {
      color: 'white',
    },

    uploadFormContainer: {
      backgroundColor: '#f0f9ff',
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: '#bfdbfe',
    },
    uploadFormTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#111827',
      marginBottom: 16,
    },
    imagePreviewContainer: {
      width: '100%',
      height: 200,
      borderRadius: 8,
      overflow: 'hidden',
      marginBottom: 16,
      backgroundColor: '#f3f4f6',
    },
    imagePreview: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    formGroup: {
      marginBottom: 16,
    },
    formLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: '#374151',
      marginBottom: 8,
    },
    formInput: {
      borderWidth: 1,
      borderColor: '#d1d5db',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      backgroundColor: 'white',
      color: '#111827',
    },
    formTextArea: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    formHint: {
      fontSize: 12,
      color: '#6b7280',
      marginTop: 4,
      fontStyle: 'italic',
    },
    uploadFormActions: {
      flexDirection: 'column',
      gap: 10,
      marginTop: 8,
    },
    uploadFormButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      gap: 8,
    },
    confirmButton: {
      backgroundColor: '#16a34a',
    },
    cancelUploadButton: {
      backgroundColor: 'white',
      borderWidth: 1,
      borderColor: '#e5e7eb',
    },
    uploadFormButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: 'white',
    },
    
    // Gallery Item Styles (Updated)
    galleryItemTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: '#111827',
      marginBottom: 4,
    },
    galleryItemMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 4,
    },
    galleryItemDate: {
      fontSize: 11,
      color: '#6b7280',
    },
    galleryItemStatus: {
      marginTop: 6,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: 'flex-start',
    },
    statusBadgeText: {
      fontSize: 10,
      fontWeight: '600',
    },
  
    
    // Dashboard
    scrollView: { flex: 1 },
    scrollContainer: { paddingBottom: Platform.OS === 'ios' ? 100 : 80 },
    statsContainer: {
      flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24
    },
    statCard: {
      backgroundColor: 'white', borderRadius: 16, padding: 16, width: '49%', marginBottom: 16,
      borderWidth: 1, borderColor: '#e5e7eb', shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84,
      elevation: 5, alignItems: 'center'
    },
    statContent: { alignItems: 'center' },
    statIcon: { marginBottom: 8 },
    statValue: { fontSize: 28, fontWeight: '800', marginBottom: 4 },
    statTitle: { color: '#374151', fontSize: 12, fontWeight: '500', textAlign: 'center' },
    
    revenueCard: {
      backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 24,
      borderWidth: 1, borderColor: '#e5e7eb', shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5
    },
    revenueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    revenueContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    revenueValue: { fontSize: 28, fontWeight: 'bold', color: '#4CAF50', marginBottom: 4 },
    revenueSubtext: { fontSize: 14, color: '#9ca3af', fontWeight: '500' },
    revenueIconContainer: { backgroundColor: '#4CAF5020', padding: 12, borderRadius: 12 },
    
    statusOverviewCard: {
      backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 24,
      borderWidth: 1, borderColor: '#e5e7eb', shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5
    },
    statusGrid: { flexDirection: 'row', gap: 16, marginTop: 16 },
    statusItem: {
      flex: 1, flexDirection: 'row', alignItems: 'center', padding: 12,
      backgroundColor: '#f9fafb', borderRadius: 8, gap: 12
    },
    statusIndicator: { width: 12, height: 12, borderRadius: 6 },
    statusValue: { fontSize: 20, fontWeight: '700', color: '#111827' },
    statusLabel: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
    
    section: {
      backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 24,
      borderWidth: 1, borderColor: '#e5e7eb', shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5
    },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontWeight: '800', fontSize: 18, letterSpacing: -0.5 },
    viewAllText: { fontSize: 14, color: '#222', fontWeight: '600' },
    
    // Website Management Cards
    websiteCard: {
      backgroundColor: '#f9fafb', borderRadius: 12, padding: 16, marginBottom: 12,
      borderWidth: 1, borderColor: '#e5e7eb', position: 'relative'
    },
    websiteCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
    websiteCardTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
    websiteCardDesc: { fontSize: 13, color: '#6b7280', lineHeight: 18 },
    websiteCardIcon: { position: 'absolute', right: 16, top: '50%', marginTop: -10 },
    
    // Bookings
    bookingItem: {
      flexDirection: 'row', alignItems: 'stretch', marginBottom: 12,
      backgroundColor: '#f9fafb', borderRadius: 8, padding: 12,
      borderWidth: 1, borderColor: '#e5e7eb', minHeight: 80
    },
    bookingLeft: { flexDirection: 'row', alignItems: 'stretch', flex: 1, marginRight: 12, minWidth: 0 },
    bookingStatus: { width: 4, alignSelf: 'stretch', borderRadius: 8, marginRight: 12, flexShrink: 0 },
    bookingInfo: { flex: 1, justifyContent: 'center', minWidth: 0 },
    bookingNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    bookingCustomer: { fontWeight: 'bold', fontSize: 16, marginBottom: 2, color: '#111827', flexWrap: 'wrap' },
    bookingVehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
    bookingPlateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
    bookingVehicle: { fontSize: 14, color: '#6b7280', marginBottom: 2 },
    bookingDateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    bookingDate: { fontSize: 12, color: '#9ca3af' },
    bookingRight: { alignItems: 'flex-end' },
    bookingAmount: { fontWeight: 'bold', fontSize: 16, color: '#111827', marginBottom: 2 },
    bookingStatusText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
    
    emptyState: { alignItems: 'center', paddingVertical: 40 },
    emptyStateText: { color: '#6b7280', fontWeight: '500', fontSize: 16, marginTop: 12 },
    emptyStateSubtext: { color: '#9ca3af', fontSize: 14, marginTop: 4 },
  });