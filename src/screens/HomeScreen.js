// src/screens/HomeScreen.js
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import auth from '@react-native-firebase/auth';

const HomeScreen = ({ navigation }) => {
  const handleLogout = () => {
    auth().signOut();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Spark Car Wash!</Text>
      
      <Button 
        title="Book a Wash"
        onPress={() => navigation.navigate('Booking')}
      />

      <View style={styles.separator} />

      {/* NEW: Button to navigate to the Rewards Screen */}
      <Button 
        title="View My Rewards"
        onPress={() => navigation.navigate('Rewards')}
      />

      <View style={styles.separator} />
      
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  separator: {
    marginVertical: 10,
  },
});

export default HomeScreen;