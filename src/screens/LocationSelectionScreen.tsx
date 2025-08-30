import React, { useState, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import axios from 'axios';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LocationContext, Location } from '../context/LocationContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';

type LocationSelectionNavigationProp = StackNavigationProp<RootStackParamList, 'LocationSelection'>;

const API_URL = 'https://spark-car-wash-api.onrender.com';

const LocationSelectionScreen = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const { setSelectedLocation } = useContext(LocationContext);
  const navigation = useNavigation<LocationSelectionNavigationProp>();

  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      let isActive = true;

      const fetchLocations = async () => {
        setLoading(true);
        try {
          const response = await axios.get(`${API_URL}/api/locations`, {
            signal: controller.signal,
            timeout: 15000,
          });
          if (isActive) {
            // Sort the locations alphabetically by name before displaying them
            const sortedLocations = response.data.sort((a: Location, b: Location) => a.name.localeCompare(b.name));
            setLocations(sortedLocations);
          }
        } catch (error: any) {
          if (isActive && error?.name !== 'CanceledError') {
            Alert.alert("Error", "Could not fetch locations.");
          }
        } finally {
          if (isActive) setLoading(false);
        }
      };

      fetchLocations();

      return () => {
        isActive = false;
        controller.abort();
      };
    }, [])
  );

  const handleSelectLocation = (location: Location) => {
    setSelectedLocation(location);
    // After selecting, navigate back to the Home screen
    navigation.navigate('Home');
  };

  const renderItem = ({ item }: { item: Location }) => (
    <TouchableOpacity style={styles.itemContainer} onPress={() => handleSelectLocation(item)}>
      <Text style={styles.itemTitle}>{item.name}</Text>
      <Text style={styles.itemAddress}>{item.address}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>Loading Locations...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={locations}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>No locations available.</Text>}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginVertical: 20,
  },
  itemContainer: {
    backgroundColor: '#fff',
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontStyle: 'italic',
  },
});

export default LocationSelectionScreen;