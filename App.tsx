// App.tsx
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

// Import all of our screen components
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import HomeScreen from './src/screens/HomeScreen';
import BookingScreen from './src/screens/BookingScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import RewardsScreen from './src/screens/RewardsScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import BookingConfirmationScreen from './src/screens/BookingConfirmationScreen';
import ManagerDashboard from './src/screens/ManagerDashboard'; // Import the new manager screen

// Define the screens and their parameters for our navigator
type RootStackParamList = {
  Home: undefined;
  Booking: undefined;
  Checkout: {
    service: { id: string; name: string; price: number };
    slot: string;
    date: string;
  };
  BookingConfirmation: {
    bookingId: string;
    serviceName: string;
    date: string;
    slot: string;
  };
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  Rewards: undefined;
  ManagerDashboard: undefined; // Add the new screen to the list
};

const Stack = createStackNavigator<RootStackParamList>();

// --- NEW: Separate stacks for different user roles ---
const CustomerStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen name="Booking" component={BookingScreen} />
    <Stack.Screen name="Rewards" component={RewardsScreen} />
    <Stack.Screen name="Checkout" component={CheckoutScreen} />
    <Stack.Screen
      name="BookingConfirmation"
      component={BookingConfirmationScreen}
      options={{ title: 'Booking Confirmed', headerLeft: () => null }}
    />
  </Stack.Navigator>
);

const ManagerStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="ManagerDashboard" component={ManagerDashboard} options={{ title: 'Manager Dashboard' }}/>
    {/* We will add other manager screens here, e.g., ViewBookings */}
  </Stack.Navigator>
);

const AuthStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="SignUp" component={SignUpScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </Stack.Navigator>
);


function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [isManager, setIsManager] = useState(false);

  async function onAuthStateChanged(user: FirebaseAuthTypes.User | null) {
    setUser(user);
    if (user) {
      // If a user is logged in, check their custom claims for the 'manager' role
      const idTokenResult = await user.getIdTokenResult();
      setIsManager(idTokenResult.claims.role === 'manager');
    } else {
      setIsManager(false);
    }
    if (initializing) {
      setInitializing(false);
    }
  }

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
    return subscriber;
  }, []);

  if (initializing) {
    return null; // Or a loading spinner
  }

  return (
    <NavigationContainer>
      {user ? (isManager ? <ManagerStack /> : <CustomerStack />) : <AuthStack />}
    </NavigationContainer>
  );
}

export default App;
