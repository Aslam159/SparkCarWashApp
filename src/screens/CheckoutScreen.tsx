import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Alert, Modal, ActivityIndicator, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { format } from 'date-fns';
import axios from 'axios';
import auth from '@react-native-firebase/auth';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App'; 

import { LocationContext } from '../context/LocationContext';

type CheckoutScreenRouteProp = RouteProp<RootStackParamList, 'Checkout'>;
type CheckoutScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Checkout'>;

const API_URL = 'https://spark-car-wash-api.onrender.com';

const CheckoutScreen = () => {
  const navigation = useNavigation<CheckoutScreenNavigationProp>();
  const route = useRoute<CheckoutScreenRouteProp>();
  const { service, slot, date } = route.params;

  const [isLoading, setIsLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const [pollingIntervalId, setPollingIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [isBooking, setIsBooking] = useState(false);

  const { selectedLocation } = useContext(LocationContext);
  const currentUser = auth().currentUser;

  const handlePayNow = async () => {
    if (!currentUser || !selectedLocation) {
        Alert.alert("Error", "User or location not found.");
        return;
    }
    setIsLoading(true);

    // Create the robust payload for verification
    const verificationPayload = {
      startTime: `${date}T${slot}:00`,
      locationId: selectedLocation.id,
    };

    try {
        // 1. Verify the slot is still available
        await axios.post(`${API_URL}/api/bookings/verify-slot`, verificationPayload);

        // 2. If verification is successful, proceed to payment
        const paymentResponse = await axios.post(`${API_URL}/api/payments/checkout`, {
            amount: service.price,
            email: currentUser.email,
        });
        setPaymentUrl(paymentResponse.data.authorization_url);
        setPaymentReference(paymentResponse.data.reference);

    } catch (error: any) {
        if (error.response?.status === 409) {
            Alert.alert(
                "Slot Taken",
                "Sorry, this time slot was just booked by someone else. Please choose another time.",
                [{ text: "OK", onPress: () => navigation.goBack() }]
            );
        } else {
            Alert.alert("Error", "Could not verify the time slot. Please try again.");
        }
        setIsLoading(false);
    }
  };

  const handleSuccessfulPayment = async () => {
    if (isBooking) return;
    setIsBooking(true);

    if (pollingIntervalId) clearInterval(pollingIntervalId);
    if (!currentUser || !selectedLocation) return;
    
    try {
        // 3. Create the final booking payload after payment success
        const bookingPayload = {
            userId: currentUser.uid,
            serviceId: service.id,
            startTime: `${date}T${slot}:00`,
            locationId: selectedLocation.id,
        };
        const response = await axios.post(`${API_URL}/api/bookings`, bookingPayload);
        
        setPaymentUrl(null);
        setIsLoading(false);
        
        navigation.navigate('BookingConfirmation', {
            service, slot, date, bookingId: response.data.bookingId,
        });

    } catch (error: any) {
        setIsLoading(false);
        setPaymentUrl(null);
        Alert.alert("Booking Error", "Your payment was successful, but we failed to save your booking.");
    }
  };

  const verifyPaymentStatus = async (reference: string) => {
    try {
        const response = await axios.get(`${API_URL}/api/payments/verify/${reference}`);
        if (response.data.status === 'success') {
            handleSuccessfulPayment();
        }
    } catch (error) {
        console.error("Payment verification failed:", error);
    }
  };
  
  useEffect(() => {
    if (paymentReference) {
        const intervalId = setInterval(() => {
            verifyPaymentStatus(paymentReference);
        }, 3000);
        setPollingIntervalId(intervalId);
        return () => { if (intervalId) clearInterval(intervalId); };
    }
  }, [paymentReference]);


  if (paymentUrl) {
    return (
        <Modal visible={true} animationType="slide">
            <WebView source={{ uri: paymentUrl }} style={{ flex: 1 }} />
            <Button title="Cancel Payment" onPress={() => {
                if (pollingIntervalId) clearInterval(pollingIntervalId);
                setPaymentUrl(null);
                setIsLoading(false);
            }} />
        </Modal>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Booking Summary</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Location</Text>
        <Text style={styles.cardText}>{selectedLocation?.name}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Service</Text>
        <Text style={styles.cardText}>{service.name}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Date & Time</Text>
        <Text style={styles.cardText}>{format(new Date(date), 'dd MMMM yyyy')} at {slot}</Text>
      </View>
      <View style={styles.totalContainer}>
        <Text style={styles.totalText}>Total</Text>
        <Text style={styles.totalPrice}>R{service.price}</Text>
      </View>
      
      {isLoading ? (
        <ActivityIndicator size="large" style={{ marginTop: 20 }}/>
      ) : (
        <TouchableOpacity style={styles.button} onPress={handlePayNow}>
            <Text style={styles.buttonText}>Pay Now</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 15, marginBottom: 10 },
  cardTitle: { fontSize: 14, color: '#888' },
  cardText: { fontSize: 18, fontWeight: '500', marginTop: 5 },
  totalContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#eee' },
  totalText: { fontSize: 20, fontWeight: 'bold' },
  totalPrice: { fontSize: 20, fontWeight: 'bold', color: '#007bff' },
  button: { backgroundColor: '#28a745', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 30 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default CheckoutScreen;
