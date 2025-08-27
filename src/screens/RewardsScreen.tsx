// src/screens/RewardsScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// A simple component to render the point icons
const PointIcon = ({ filled }: { filled: boolean }) => (
  <View style={[styles.pointCircle, filled ? styles.pointFilled : styles.pointEmpty]} />
);

const RewardsScreen = () => {
  const [loyaltyData, setLoyaltyData] = useState<{ loyaltyPoints: number; freeWashes: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // useFocusEffect will re-fetch the data every time the user visits this screen
  useFocusEffect(
    useCallback(() => {
      const fetchUserData = async () => {
        const currentUser = auth().currentUser;
        if (!currentUser) {
          setIsLoading(false);
          return;
        }

        try {
          const userDoc = await firestore().collection('users').doc(currentUser.uid).get();
          if (userDoc.exists) {
            const data = userDoc.data();
            setLoyaltyData({
              loyaltyPoints: data?.loyaltyPoints || 0,
              freeWashes: data?.freeWashes || 0,
            });
          }
        } catch (error) {
          Alert.alert("Error", "Could not load your rewards data.");
        } finally {
          setIsLoading(false);
        }
      };

      fetchUserData();
    }, [])
  );

  if (isLoading) {
    return <ActivityIndicator size="large" style={styles.centered} />;
  }

  const points = loyaltyData?.loyaltyPoints || 0;
  const freeWashes = loyaltyData?.freeWashes || 0;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Your Loyalty Points</Text>
        <View style={styles.pointsContainer}>
          {/* Create an array of 10 elements to render the point icons */}
          {[...Array(10)].map((_, index) => (
            <PointIcon key={index} filled={index < points} />
          ))}
        </View>
        <Text style={styles.progressText}>
          {points} out of 10 points for your next free wash!
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Your Available Rewards</Text>
        <Text style={styles.freeWashesText}>{freeWashes}</Text>
        <Text style={styles.progressText}>
          {freeWashes === 1 ? 'Free Wash Available' : 'Free Washes Available'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  pointsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  pointCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
  pointEmpty: {
    borderColor: '#ccc',
  },
  pointFilled: {
    borderColor: '#007bff',
    backgroundColor: '#007bff',
  },
  progressText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6c757d',
  },
  freeWashesText: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#28a745',
  },
});

export default RewardsScreen;