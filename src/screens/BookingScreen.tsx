// src/screens/BookingScreen.tsx
import React, { useCallback, useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Button, ActivityIndicator
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import DatePicker from 'react-native-date-picker';
import { format, parse } from 'date-fns';
import auth from '@react-native-firebase/auth';

interface Service {
  id: string;
  name: string;
  price: number;
  durationInMinutes: number;
}

export default function BookingScreen({ navigation }) {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [date, setDate] = useState(new Date());
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // This function only runs once to fetch the list of services
  useEffect(() => {
    const loadServices = async () => {
      if (services.length > 0) return;
      setIsLoading(true);
      try {
        const res = await fetch('https://spark-car-wash-api.onrender.com/api/services');
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const json = await res.json();
        setServices(json);
      } catch (e: any) {
        Alert.alert('Error', 'Could not load services. Please try again later.');
      }
      setIsLoading(false);
    };
    loadServices();
  }, []); // Empty dependency array ensures this runs only once

  // --- THIS IS THE FIX ---
  // useFocusEffect runs every time the user navigates to this screen,
  // ensuring the availability data is always fresh.
  useFocusEffect(
    useCallback(() => {
      const loadAvailability = async () => {
        setIsLoading(true);
        setAvailableSlots([]);
        setSelectedSlot(null); // Clear previous selection
        try {
          const formattedDate = format(date, 'yyyy-MM-dd');
          const res = await fetch(`https://spark-car-wash-api.onrender.com/api/availability?date=${formattedDate}`);
          if (!res.ok) throw new Error(`Server error: ${res.status}`);
          const json = await res.json();
          setAvailableSlots(json);
        } catch (e: any) {
          Alert.alert('Error', 'Could not load available slots for this date.');
        } finally {
          setIsLoading(false);
        }
      };

      loadAvailability();
    }, [date]) // It also re-runs if the user changes the date
  );

  const handleProceedToCheckout = () => {
    if (!selectedService || !selectedSlot) {
      Alert.alert("Error", "Please select a service and time slot.");
      return;
    }
    navigation.navigate('Checkout', {
      service: selectedService,
      slot: selectedSlot,
      date: date.toISOString(),
    });
  };

  const renderSlotItem = ({ item }: { item: string }) => {
    let isDisabled = false;
    if (selectedService && selectedSlot) {
      const serviceDuration = selectedService.durationInMinutes;
      if (serviceDuration > 15) {
        const selectedTime = parse(selectedSlot, 'HH:mm', new Date());
        const currentTime = parse(item, 'HH:mm', new Date());
        if (currentTime > selectedTime && currentTime < new Date(selectedTime.getTime() + serviceDuration * 60000)) {
          isDisabled = true;
        }
      }
    }
    return (
      <TouchableOpacity
        style={[styles.slotContainer, selectedSlot === item && styles.itemSelected, isDisabled && styles.slotDisabled]}
        onPress={() => setSelectedSlot(item)}
        disabled={isDisabled}>
        <Text style={[styles.slotText, isDisabled && styles.slotTextDisabled]}>{item}</Text>
      </TouchableOpacity>
    );
  };

  const isButtonDisabled = !selectedService || !selectedSlot;

  return (
    <FlatList
      style={styles.container}
      data={availableSlots}
      renderItem={renderSlotItem}
      keyExtractor={(item) => item}
      numColumns={4}
      ListEmptyComponent={
        isLoading ? null : <Text style={styles.emptyText}>No available slots for this day.</Text>
      }
      ListHeaderComponent={
        <>
          <Text style={styles.header}>1. Select a Service</Text>
          {services.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.itemContainer, selectedService?.id === item.id && styles.itemSelected]}
              onPress={() => setSelectedService(item)}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>R{item.price}</Text>
            </TouchableOpacity>
          ))}
          <Text style={styles.header}>2. Select Date & Time</Text>
          <Button title={`Selected Date: ${format(date, 'dd MMMM yyyy')}`} onPress={() => setOpenDatePicker(true)} />
          <DatePicker
            modal
            open={openDatePicker}
            date={date}
            mode="date"
            minimumDate={new Date()}
            onConfirm={(selectedDate) => {
              setOpenDatePicker(false);
              setDate(selectedDate);
            }}
            onCancel={() => setOpenDatePicker(false)}
          />
          {isLoading && <ActivityIndicator size="large" style={{ marginVertical: 20 }} />}
        </>
      }
      ListFooterComponent={
        <View style={{ marginTop: 20, marginBottom: 40 }}>
          <TouchableOpacity
            style={[styles.button, isButtonDisabled && styles.buttonDisabled]}
            onPress={handleProceedToCheckout}
            disabled={isButtonDisabled}
          >
            <Text style={styles.buttonText}>Proceed to Checkout</Text>
          </TouchableOpacity>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#f5f5f5' },
  header: { fontSize: 22, fontWeight: 'bold', marginTop: 15, marginBottom: 10 },
  itemContainer: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 10, backgroundColor: '#fff' },
  itemSelected: { borderColor: '#007bff', borderWidth: 2, backgroundColor: '#e6f0ff' },
  itemName: { fontSize: 16, flex: 1 },
  itemPrice: { fontSize: 16, fontWeight: 'bold' },
  slotContainer: { flex: 1, margin: 5, padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, alignItems: 'center', backgroundColor: '#fff' },
  slotText: { fontSize: 16 },
  slotDisabled: { backgroundColor: '#e9ecef', borderColor: '#dee2e6' },
  slotTextDisabled: { color: '#adb5bd' },
  emptyText: { textAlign: 'center', marginTop: 20, fontStyle: 'italic', color: '#6c757d' },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: 'grey',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
