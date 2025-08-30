import React, { useState, useContext, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Button, SafeAreaView
} from 'react-native';
import axios from 'axios';
import DatePicker from 'react-native-date-picker';
import { format } from 'date-fns';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { LocationContext } from '../context/LocationContext';
import { RootStackParamList } from '../../App';

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
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<BookingScreenNavigationProp>();

  const { selectedLocation } = useContext(LocationContext);

  const fetchData = useCallback(async () => {
    if (!selectedLocation) return;
    
    setIsLoading(true);
    setError(null);
    setSelectedService(null);
    setSelectedSlot(null);
    
    console.log(`[BookingScreen] Starting fetch for location: ${selectedLocation.id} and date: ${format(date, 'yyyy-MM-dd')}`);

    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      console.log(`[BookingScreen] Fetching services...`);
      const servicesRes = await axios.get(`${API_URL}/api/services`, {
        params: { locationId: selectedLocation.id },
        timeout: 20000,
      });
      console.log('[BookingScreen] Successfully fetched services.');

      console.log(`[BookingScreen] Fetching availability...`);
      const availabilityRes = await axios.get(`${API_URL}/api/availability`, {
        params: { date: formattedDate, locationId: selectedLocation.id },
        timeout: 20000,
      });
      console.log('[BookingScreen] Successfully fetched availability.');

      setServices(servicesRes.data);
      setAvailableSlots(availabilityRes.data);

    } catch (err: any) {
      console.error("[BookingScreen] --- FETCH ERROR ---");
      const errorMessage = err.response?.data?.error || err.message || 'Could not load booking information.';
      setError(errorMessage);
      console.error("ERROR DETAILS:", JSON.stringify(err, null, 2));
    } finally {
      setIsLoading(false);
    }
  }, [date, selectedLocation]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );
  
  const handleProceedToCheckout = () => {
    if (selectedService && selectedSlot) {
      navigation.navigate('Checkout', {
        service: selectedService,
        slot: selectedSlot,
        date: format(date, 'yyyy-MM-dd'),
      });
    }
  };

  const toMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const renderServiceItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.itemContainer, selectedService?.id === item.id && styles.itemSelected]}
      onPress={() => setSelectedService(item)}
    >
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemPrice}>R{item.price}</Text>
    </TouchableOpacity>
  );

  const renderSlotItem = ({ item }: { item: string }) => {
    const isThirtyMin = selectedService?.durationInMinutes === 30;
    const idx = availableSlots.indexOf(item);
    const nextSlot = availableSlots[idx + 1];

    const shouldDisableNext =
      isThirtyMin &&
      selectedSlot === item &&
      !!nextSlot &&
      toMinutes(nextSlot) - toMinutes(item) === 15;

    return (
      <TouchableOpacity
        style={[
          styles.slotContainer,
          selectedSlot === item && styles.itemSelected,
          shouldDisableNext && { backgroundColor: '#e9ecef', borderColor: '#ced4da' },
        ]}
        onPress={() => setSelectedSlot(item)}
        disabled={shouldDisableNext}
      >
        <Text style={styles.slotText}>{item}</Text>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>Loading Booking Info...</Text>
      </View>
    );
  }

  if (error) {
     return (
        <View style={styles.centered}>
            <Text style={styles.errorText}>Error: {error}</Text>
            <Button title="Retry" onPress={fetchData} />
        </View>
     )
  }

  const ListHeader = () => (
    <>
      <Text style={styles.header}>1. Select a Service at {selectedLocation?.name}</Text>
      <FlatList
        data={services}
        renderItem={renderServiceItem}
        keyExtractor={(item) => String(item.id)}
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
        onConfirm={(d) => {
          setOpenDatePicker(false);
          setDate(d);
        }}
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
    <SafeAreaView style={styles.container}>
        <FlatList
          data={availableSlots}
          renderItem={renderSlotItem}
          keyExtractor={(item) => item}
          numColumns={4}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={ListFooter}
          ListEmptyComponent={<Text style={styles.emptyText}>No available slots for this day.</Text>}
        />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 10, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { color: 'red', textAlign: 'center', marginBottom: 10, fontSize: 16 },
  header: { fontSize: 22, fontWeight: 'bold', marginTop: 20, marginBottom: 10, paddingHorizontal: 10 },
  itemContainer: {
    marginHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  itemSelected: { borderColor: '#007bff', borderWidth: 2, backgroundColor: '#e6f0ff' },
  itemName: { fontSize: 16 },
  itemPrice: { fontSize: 16, fontWeight: 'bold' },
  datePickerButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    marginHorizontal: 10,
    marginBottom: 15,
  },
  datePickerButtonText: { fontSize: 16, color: '#007bff', fontWeight: 'bold' },
  slotContainer: { flex: 1, margin: 5, padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, alignItems: 'center', backgroundColor: '#fff' },
  slotText: { fontSize: 16 },
  emptyText: { textAlign: 'center', marginTop: 20, fontStyle: 'italic', paddingHorizontal: 10 },
  button: { backgroundColor: '#007bff', padding: 15, borderRadius: 8, alignItems: 'center', marginHorizontal: 10, marginTop: 20 },
  buttonDisabled: { backgroundColor: '#ced4da' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default BookingScreen;

