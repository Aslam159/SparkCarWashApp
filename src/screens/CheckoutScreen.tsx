// src/screens/CheckoutScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Alert, Modal, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { format } from 'date-fns';
import auth from '@react-native-firebase/auth';

const CheckoutScreen = ({ route, navigation }) => {
  const { service, slot, date } = route.params;
  const [isLoading, setIsLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [transactionRef, setTransactionRef] = useState<string | null>(null);

  const handlePayNow = async () => {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      Alert.alert("Error", "You must be logged in to make a payment.");
      return;
    }

    setIsLoading(true);
    try {
      const checkoutResponse = await fetch('https://spark-car-wash-api.onrender.com/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: service.price,
          email: currentUser.email,
        }),
      });

      if (!checkoutResponse.ok) {
        throw new Error('Failed to initialize payment.');
      }

      const { authorization_url, reference } = await checkoutResponse.json();
      setTransactionRef(reference); // Save the transaction reference
      setPaymentUrl(authorization_url);

    } catch (error: any) {
      Alert.alert("Payment Error", error.message || "Could not start the payment process.");
      setIsLoading(false);
    }
  };

  const onPaymentSuccess = async () => {
    setPaymentUrl(null);
    setIsLoading(true);
    try {
      const formattedDate = format(new Date(date), 'yyyy-MM-dd');
      const startTimeISO = `${formattedDate}T${slot}:00`;

      const bookingData = {
        userId: auth().currentUser!.uid,
        serviceId: service.id,
        startTime: startTimeISO,
      };

      const bookingResponse = await fetch('https://spark-car-wash-api.onrender.com/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });

      if (!bookingResponse.ok) {
        throw new Error('Your payment was successful, but we failed to save your booking. Please contact support.');
      }

      const result = await bookingResponse.json();
      
      navigation.navigate('BookingConfirmation', {
        bookingId: result.bookingId,
        serviceName: service.name,
        date: date,
        slot: slot,
      });

    } catch (error: any) {
      Alert.alert("Booking Error", error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // This effect runs when the paymentUrl is set, starting the verification polling
  useEffect(() => {
    if (transactionRef) {
      const interval = setInterval(async () => {
        try {
          const verifyResponse = await fetch(`https://spark-car-wash-api.onrender.com/api/payments/verify/${transactionRef}`);
          const { status } = await verifyResponse.json();

          if (status === 'success') {
            clearInterval(interval); // Stop polling
            onPaymentSuccess();
          }
        } catch (error) {
          console.error("Polling error:", error);
        }
      }, 3000); // Check every 3 seconds

      return () => clearInterval(interval); // Cleanup on component unmount or if transactionRef changes
    }
  }, [transactionRef]);


  if (paymentUrl) {
    return (
      <Modal visible={true} onRequestClose={() => setPaymentUrl(null)}>
        <WebView
          source={{ uri: paymentUrl }}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
        />
        {isLoading && <ActivityIndicator size="large" style={StyleSheet.absoluteFill} />}
      </Modal>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Confirm Your Booking</Text>
      <View style={styles.card}>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Service:</Text>
          <Text style={styles.value}>{service.name}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>{format(new Date(date), 'dd MMMM yyyy')}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Time:</Text>
          <Text style={styles.value}>{slot}</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.detailRow}>
          <Text style={styles.totalLabel}>Total Price:</Text>
          <Text style={styles.totalValue}>R{service.price}</Text>
        </View>
      </View>
      <Button
        title={isLoading ? 'Connecting...' : 'Pay Now'}
        onPress={handlePayNow}
        disabled={isLoading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 20, marginBottom: 20, elevation: 3 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  label: { fontSize: 16, color: '#6c757d' },
  value: { fontSize: 16, fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
  separator: { height: 1, backgroundColor: '#dee2e6', marginVertical: 15 },
  totalLabel: { fontSize: 18, fontWeight: 'bold' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: '#28a745' },
});

export default CheckoutScreen;

