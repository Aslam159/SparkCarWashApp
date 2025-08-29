import React, { useState, useContext } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView
} from 'react-native';
import axios from 'axios';
import DatePicker from 'react-native-date-picker';
import { format } from 'date-fns';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// 1. Import the LocationContext
import { LocationContext } from '../context/LocationContext';
import { RootStackParamList } from '../../App'; // Assuming App.tsx exports this type

// Define the navigation prop type for this screen
type BookingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Booking'>;

const API_URL = 'https://spark-car-wash-api.onrender.com';

const BookingScreen = () => {
  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [date, setDate] = useState(new Date());
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation<BookingScreenNavigationProp>();

  // 2. Get the selected location from the global context
  const { selectedLocation } = useContext(LocationContext);

  const fetchData = React.useCallback(async () => {
    if (!selectedLocation) return; // Don't fetch if no location is selected

    setIsLoading(true);
    setSelectedService(null);
    setSelectedSlot(null);

    try {
      // 3. Pass the locationId when fetching services and availability
      const formattedDate = format(date, 'yyyy-MM-dd');
      const [servicesRes, availabilityRes] = await Promise.all([
        axios.get(`${API_URL}/api/services?locationId=${selectedLocation.id}`),
        axios.get(`${API_URL}/api/availability?date=${formattedDate}&locationId=${selectedLocation.id}`)
      ]);
      setServices(servicesRes.data);
      setAvailableSlots(availabilityRes.data);
    } catch (error) {
      Alert.alert("Error", "Could not load booking information for this location.");
    } finally {
      setIsLoading(false);
    }
  }, [date, selectedLocation]);

  useFocusEffect(fetchData);

  const handleProceedToCheckout = () => {
    if (selectedService && selectedSlot) {
      navigation.navigate('Checkout', {
        service: selectedService,
        slot: selectedSlot,
        date: format(date, 'yyyy-MM-dd'),
      });
    }
  };

  const renderServiceItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.itemContainer, selectedService?.id === item.id && styles.itemSelected]}
      onPress={() => setSelectedService(item)}>
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemPrice}>R{item.price}</Text>
    </TouchableOpacity>
  );

  const renderSlotItem = ({ item }: { item: string }) => {
     const isNextSlotDisabled = selectedService?.durationInMinutes === 30 && selectedSlot === item;
     const nextSlotIndex = availableSlots.indexOf(item) + 1;
     const nextSlot = availableSlots[nextSlotIndex];
     const nextSlotTime = nextSlot ? parseInt(nextSlot.split(':')[1], 10) : -1;
     const currentSlotTime = parseInt(item.split(':')[1], 10);
     const shouldDisableNext = isNextSlotDisabled && nextSlotIndex < availableSlots.length && (nextSlotTime - currentSlotTime === 15);

    return (
        <TouchableOpacity
            style={[
                styles.slotContainer,
                selectedSlot === item && styles.itemSelected,
                shouldDisableNext && { backgroundColor: '#e9ecef', borderColor: '#ced4da' }
            ]}
            onPress={() => setSelectedSlot(item)}
            disabled={shouldDisableNext}
        >
            <Text style={styles.slotText}>{item}</Text>
        </TouchableOpacity>
    );
  };
  
  const ListHeader = () => (
    <>
      <Text style={styles.header}>1. Select a Service at {selectedLocation?.name}</Text>
      <FlatList
        data={services}
        renderItem={renderServiceItem}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
      />
      <Text style={styles.header}>2. Select Date & Time</Text>
      <TouchableOpacity onPress={() => setOpenDatePicker(true)} style={styles.datePickerButton}>
        <Text style={styles.datePickerButtonText}>
            Selected Date: {format(date, 'dd MMMM yyyy')}
        </Text>
      </TouchableOpacity>
      <DatePicker
        modal
        open={openDatePicker}
        date={date}
        mode="date"
        onConfirm={(d) => { setOpenDatePicker(false); setDate(d); }}
        onCancel={() => setOpenDatePicker(false)}
        minimumDate={new Date()}
      />
    </>
  );

  const ListFooter = () => (
    <View style={{ paddingBottom: 50 }}>
        <TouchableOpacity
            style={[styles.button, (!selectedService || !selectedSlot) && styles.buttonDisabled]}
            onPress={handleProceedToCheckout}
            disabled={!selectedService || !selectedSlot}
        >
            <Text style={styles.buttonText}>Proceed to Checkout</Text>
        </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.centered}><ActivityIndicator size="large" /></View>
      ) : (
        <FlatList
            data={availableSlots}
            renderItem={renderSlotItem}
            keyExtractor={(item) => item}
            numColumns={4}
            ListHeaderComponent={ListHeader}
            ListFooterComponent={ListFooter}
            ListEmptyComponent={<Text style={styles.emptyText}>No available slots for this day.</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 10, backgroundColor: '#f5f5f5' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { fontSize: 22, fontWeight: 'bold', marginTop: 20, marginBottom: 10, paddingHorizontal: 10 },
    itemContainer: { marginHorizontal: 10, flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 10, backgroundColor: '#fff' },
    itemSelected: { borderColor: '#007bff', borderWidth: 2, backgroundColor: '#e6f0ff' },
    itemName: { fontSize: 16 },
    itemPrice: { fontSize: 16, fontWeight: 'bold' },
    datePickerButton: { backgroundColor: '#fff', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#ccc', alignItems: 'center', marginHorizontal: 10, marginBottom: 15 },
    datePickerButtonText: { fontSize: 16, color: '#007bff', fontWeight: 'bold' },
    slotContainer: { flex: 1, margin: 5, padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, alignItems: 'center', backgroundColor: '#fff' },
    slotText: { fontSize: 16 },
    emptyText: { textAlign: 'center', marginTop: 20, fontStyle: 'italic', paddingHorizontal: 10 },
    button: { backgroundColor: '#007bff', padding: 15, borderRadius: 8, alignItems: 'center', marginHorizontal: 10, marginTop: 20 },
    buttonDisabled: { backgroundColor: '#ced4da' },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default BookingScreen;
