import React, { createContext, useState } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [location, setLocation] = useState(null);
  const [hospitals, setHospitals] = useState([]);

  return (
    <AppContext.Provider value={{ location, setLocation, hospitals, setHospitals }}>
      {children}
    </AppContext.Provider>
  );
};