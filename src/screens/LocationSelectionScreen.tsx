import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import axios from 'axios';
import { LocationContext, Location } from '../context/LocationContext';

const API_URL = 'https://spark-car-wash-api.onrender.com';

const LocationSelectionScreen = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectLocation } = useContext(LocationContext);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/locations`);
        setLocations(response.data);
      } catch (error) {
        Alert.alert('Error', 'Could not fetch car wash locations.');
        console.error("Fetch locations error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  const handleSelectLocation = (location: Location) => {
    selectLocation(location);
    // The navigation to the main app will be handled by the logic in App.tsx
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>Loading Locations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select a Car Wash</Text>
      <FlatList
        data={locations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.itemContainer} onPress={() => handleSelectLocation(item)}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemAddress}>{item.address}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  itemContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
});

export default LocationSelectionScreen;