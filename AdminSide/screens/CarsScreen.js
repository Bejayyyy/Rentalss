import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, Alert, Modal, Platform } from 'react-native';
import { db } from '../services/firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import CarForm from '../components/CarForm';

export default function CarsScreen() {
  const [cars, setCars] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCar, setEditingCar] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'Cars'), (snapshot) => {
      setCars(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsub;
  }, []);

  const handleAddCar = async (carData) => {
    await addDoc(collection(db, 'Cars'), { ...carData, createdAt: serverTimestamp() });
    setModalVisible(false);
  };

  const handleEditCar = async (carData) => {
    if (!editingCar) return;
    await updateDoc(doc(db, 'Cars', editingCar.id), carData);
    setEditingCar(null);
    setModalVisible(false);
  };

  const handleDeleteCar = (carId) => {
    Alert.alert('Delete Car', 'Are you sure you want to delete this car?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteDoc(doc(db, 'Cars', carId));
      }},
    ]);
  };

  const openAddModal = () => {
    setEditingCar(null);
    setModalVisible(true);
  };

  const openEditModal = (car) => {
    setEditingCar(car);
    setModalVisible(true);
  };

  return (
    <View className="flex-1 bg-white px-4 pt-8 w-full max-w-2xl mx-auto">
      <TouchableOpacity className="bg-black rounded-xl py-3 mb-4" onPress={openAddModal}>
        <Text className="text-white text-center font-bold text-base">Add Car</Text>
      </TouchableOpacity>
      <FlatList
        data={cars}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View className="flex-row items-center mb-4 bg-white rounded-xl border border-gray-200 p-3">
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} className="w-20 h-16 rounded-lg mr-4" />
            ) : (
              <View className="w-20 h-16 bg-gray-100 rounded-lg mr-4 items-center justify-center">
                <Text className="text-gray-400">No Image</Text>
              </View>
            )}
            <View className="flex-1">
              <Text className="font-bold text-lg mb-1">{item.name}</Text>
              <Text className="text-gray-700">Seats: {item.seats}</Text>
              <Text className="text-xs text-gray-500">Status: {item.availability ? 'Available' : 'Not Available'}</Text>
            </View>
            <TouchableOpacity onPress={() => openEditModal(item)} className="px-2">
              <Text className="text-blue-600 font-semibold">Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteCar(item.id)} className="px-2">
              <Text className="text-red-500 font-semibold">Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
      <Modal visible={modalVisible} animationType="slide">
        <View className="flex-1 bg-white px-4 justify-center w-full max-w-lg mx-auto">
          <CarForm
            onSubmit={editingCar ? handleEditCar : handleAddCar}
            initialValues={editingCar}
            submitLabel={editingCar ? 'Update Car' : 'Add Car'}
          />
          <TouchableOpacity className="mt-4 bg-gray-200 rounded-xl py-3" onPress={() => { setModalVisible(false); setEditingCar(null); }}>
            <Text className="text-center text-gray-700 font-bold">Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}
