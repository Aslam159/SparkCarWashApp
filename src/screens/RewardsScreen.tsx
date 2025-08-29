import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// 1. Import the LocationContext
import { LocationContext } from '../context/LocationContext';

// A simple component to render the point icons
const PointIcon = ({ filled }: { filled: boolean }) => (
  <View style={[styles.pointCircle, filled ? styles.pointFilled : styles.pointEmpty]} />
);

const RewardsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [rewardsData, setRewardsData] = useState({ loyaltyPoints: 0, freeWashes: 0 });

  // 2. Get the selected location from the global context
  const { selectedLocation } = useContext(LocationContext);

  // useFocusEffect will re-fetch data every time the screen is viewed
  useFocusEffect(
    React.useCallback(() => {
      const fetchRewards = async () => {
        // 3. Don't do anything if there's no user or selected location
        const currentUser = auth().currentUser;
        if (!currentUser || !selectedLocation) {
          setLoading(false);
          return;
        }

        try {
          const userDoc = await firestore().collection('users').doc(currentUser.uid).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            // 4. Get rewards for the SPECIFIC selected location
            const locationRewards = userData?.rewards?.[selectedLocation.id] || { loyaltyPoints: 0, freeWashes: 0 };
            setRewardsData(locationRewards);
          }
        } catch (error) {
          console.error("Failed to fetch rewards:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchRewards();
    }, [selectedLocation]) // Re-run the effect if the location changes
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>My Rewards</Text>
      <Text style={styles.locationTitle}>Showing rewards for: {selectedLocation?.name}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Loyalty Points</Text>
        <Text style={styles.cardSubtitle}>Earn 10 points for a free wash!</Text>
        <View style={styles.pointsContainer}>
          {/* Create an array of 10 items to map over for the point icons */}
          {Array.from({ length: 10 }).map((_, index) => (
            <PointIcon key={index} filled={index < rewardsData.loyaltyPoints} />
          ))}
        </View>
        <Text style={styles.pointsText}>{rewardsData.loyaltyPoints} / 10 Points</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Free Washes Available</Text>
        <Text style={styles.freeWashesCount}>{rewardsData.freeWashes}</Text>
      </View>
    </ScrollView>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  locationTitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
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
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
  },
  pointsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
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
  pointsText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 10,
  },
  freeWashesCount: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#28a745',
  },
});

export default RewardsScreen;