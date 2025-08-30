import React, { useContext } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { LocationContext } from '../context/LocationContext';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { selectedLocation } = useContext(LocationContext);

  const handleLogout = () => auth().signOut();

  const navigateTo = (screen: keyof RootStackParamList) => {
    if (selectedLocation) {
      navigation.navigate(screen);
    } else {
      Alert.alert(
        "Location Required",
        "Please select a car wash location first.",
        [
          { text: "OK", onPress: () => navigation.navigate('LocationSelection') }
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome!</Text>

      <View style={styles.locationCard}>
        <Text style={styles.locationLabel}>Current Location:</Text>
        <Text style={styles.locationName}>{selectedLocation ? selectedLocation.name : 'None Selected'}</Text>
        <Button title="Change Location" onPress={() => navigation.navigate('LocationSelection')} />
      </View>
      
      <View style={styles.buttonContainer}>
        <Button title="Book a Wash" onPress={() => navigateTo('Booking')} />
        <View style={{ marginVertical: 10 }} />
        <Button title="My Rewards" onPress={() => navigateTo('Rewards')} />
        <View style={{ marginVertical: 10 }} />
        <Button title="Logout" onPress={handleLogout} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 30,
    },
    locationCard: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 40,
    },
    locationLabel: {
        fontSize: 16,
        color: '#666',
    },
    locationName: {
        fontSize: 20,
        fontWeight: 'bold',
        marginVertical: 10,
    },
    buttonContainer: {
        width: '100%',
    }
});

export default HomeScreen;