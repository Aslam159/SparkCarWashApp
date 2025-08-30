import React, { useState, useEffect, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

// Import Context
import { LocationProvider, LocationContext } from './src/context/LocationContext';

// Import Screens
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import LocationSelectionScreen from './src/screens/LocationSelectionScreen';
import HomeScreen from './src/screens/HomeScreen';
import BookingScreen from './src/screens/BookingScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import BookingConfirmationScreen from './src/screens/BookingConfirmationScreen';
import RewardsScreen from './src/screens/RewardsScreen';
import ManagerDashboard from './src/screens/ManagerDashboard';

export type RootStackParamList = {
  Home: undefined;
  Booking: undefined;
  Rewards: undefined;
  Checkout: { service: any; slot: string; date: string; };
  BookingConfirmation: { service: any; slot: string; date: string; bookingId: string; };
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  LocationSelection: undefined;
  ManagerDashboard: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [isManager, setIsManager] = useState(false);
  const { setSelectedLocation } = useContext(LocationContext);

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(async (user) => {
      setUser(user);
      if (!user) {
        // When user logs out, clear the selected location
        setSelectedLocation(null);
      } else {
        const idTokenResult = await user.getIdTokenResult();
        setIsManager(idTokenResult.claims.role === 'manager');
      }
      if (initializing) setInitializing(false);
    });
    return subscriber;
  }, [initializing, setSelectedLocation]);

  if (initializing) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS }}>
        {!user ? (
          // Logged-out stack
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        ) : isManager ? (
           // Manager stack - managers are taken straight to their dashboard
           <Stack.Screen name="ManagerDashboard" component={ManagerDashboard} options={{ headerShown: false }} />
        ) : (
          // Customer stack - all customers start at the Home screen
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="LocationSelection" component={LocationSelectionScreen} options={{ title: 'Select a Location' }}/>
            <Stack.Screen name="Booking" component={BookingScreen} />
            <Stack.Screen name="Rewards" component={RewardsScreen} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} />
            <Stack.Screen name="BookingConfirmation" component={BookingConfirmationScreen} options={{ title: 'Booking Confirmed' }}/>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// The main App component remains the same, providing the context
function App() {
  return (
    <LocationProvider>
      <AppNavigator />
    </LocationProvider>
  );
}

export default App;
