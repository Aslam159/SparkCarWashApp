import React from 'react';

// Define the shape of a location object
export interface Location {
  id: string;
  name: string;
  address: string;
}

// Define the shape of the context data
interface LocationContextType {
  selectedLocation: Location | null;
  setSelectedLocation: (location: Location | null) => void;
}

// Create the context with a default value
export const LocationContext = React.createContext<LocationContextType>({
  selectedLocation: null,
  setSelectedLocation: () => {},
});

// Create a provider component
export const LocationProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedLocation, setSelectedLocation] = React.useState<Location | null>(null);

  const value = { selectedLocation, setSelectedLocation };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};