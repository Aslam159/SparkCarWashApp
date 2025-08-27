// src/screens/BookingConfirmationScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, Button, ScrollView } from 'react-native';
import { format } from 'date-fns';

const BookingConfirmationScreen = ({ route, navigation }) => {
  // Get the booking details passed from the CheckoutScreen
  const { bookingId, serviceName, date, slot } = route.params;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.successTitle}>Booking Confirmed!</Text>
        <Text style={styles.subtitle}>
          Your appointment has been successfully scheduled.
        </Text>

        <View style={styles.separator} />

        <View style={styles.detailRow}>
          <Text style={styles.label}>Booking ID:</Text>
          <Text style={styles.value}>{bookingId}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Service:</Text>
          <Text style={styles.value}>{serviceName}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>{format(new Date(date), 'dd MMMM yyyy')}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Time:</Text>
          <Text style={styles.value}>{slot}</Text>
        </View>
      </View>

      <Button title="Done" onPress={() => navigation.navigate('Home')} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 25,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#28a745',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6c757d',
    marginBottom: 20,
  },
  separator: {
    height: 1,
    backgroundColor: '#dee2e6',
    marginVertical: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
    maxWidth: '60%',
    textAlign: 'right',
  },
});

export default BookingConfirmationScreen;