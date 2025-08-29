import React, from 'react';

// Define the shape of a location object
export interface Location {
  id: string;
  name: string;
  address: string;
}

// Define the shape of our context state
interface LocationContextType {
  selectedLocation: Location | null;
  selectLocation: (location: Location | null) => void;
}

// Create the context with a default value
export const LocationContext = React.createContext<LocationContextType>({
  selectedLocation: null,
  selectLocation: () => {},
});

// Create a provider component that will wrap our app
export const LocationProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedLocation, setSelectedLocation] = React.useState<Location | null>(null);

  const selectLocation = (location: Location | null) => {
    setSelectedLocation(location);
  };

  return (
    <LocationContext.Provider value={{ selectedLocation, selectLocation }}>
      {children}
    </LocationContext.Provider>
  );
};