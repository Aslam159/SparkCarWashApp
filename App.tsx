import React, { useState, useEffect, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

// Import our new Context and Provider
import { LocationProvider, LocationContext } from './src/context/LocationContext';

// Import all screens
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import LocationSelectionScreen from './src/screens/LocationSelectionScreen';
import HomeScreen from './src/screens/HomeScreen';
import BookingScreen from './src/screens/BookingScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import BookingConfirmationScreen from './src/screens/BookingConfirmationScreen';
import RewardsScreen from './src/screens/RewardsScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ManagerDashboard from './src/screens/ManagerDashboard';

type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  LocationSelection: undefined;
  Home: undefined;
  Rewards: undefined;
  Booking: undefined;
  Checkout: { service: any; slot: string; date: string };
  BookingConfirmation: { service: any; slot: string; date: string; bookingId: string };
  ManagerDashboard: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

// A new component to handle the main app navigation logic
const AppNavigator = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const { selectedLocation } = useContext(LocationContext);
  const [isManager, setIsManager] = useState(false);

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(async (user) => {
      setUser(user);
      if (user) {
        const idTokenResult = await user.getIdTokenResult();
        setIsManager(idTokenResult.claims.role === 'manager');
      } else {
        setIsManager(false);
      }
      if (initializing) {
        setInitializing(false);
      }
    });
    return subscriber;
  }, []);

  if (initializing) {
    return null; // or a loading screen
  }

  // This is the core logic that decides which set of screens to show
  return (
    <Stack.Navigator>
      {!user ? (
        // Logged Out Flow
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </>
      ) : isManager ? (
        // Manager Flow
        <Stack.Screen name="ManagerDashboard" component={ManagerDashboard} options={{ title: 'Manager Dashboard' }}/>
      ) : !selectedLocation ? (
        // Logged In, but no location selected yet
        <Stack.Screen name="LocationSelection" component={LocationSelectionScreen} options={{ title: 'Select a Location' }}/>
      ) : (
        // Logged In Customer Flow (with a location selected)
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Rewards" component={RewardsScreen} />
          <Stack.Screen name="Booking" component={BookingScreen} />
          <Stack.Screen name="Checkout" component={CheckoutScreen} />
          <Stack.Screen name="BookingConfirmation" component={BookingConfirmationScreen} options={{ title: 'Booking Confirmed' }}/>
        </>
      )}
    </Stack.Navigator>
  );
};

// The main App component now just provides the context
function App() {
  return (
    <LocationProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </LocationProvider>
  );
}

export default App;
