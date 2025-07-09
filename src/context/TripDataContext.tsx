import React, { createContext, useContext } from "react";
import { useTripData } from "@/src/hooks/useTripData";

const TripDataContext = createContext(null);

export const TripDataProvider = ({ tripId, children }) => {
  const value = useTripData(tripId);
  return (
    <TripDataContext.Provider value={value}>
      {children}
    </TripDataContext.Provider>
  );
};

export const useTripDataContext = () => {
  const ctx = useContext(TripDataContext);
  if (!ctx) throw new Error("useTripDataContext must be used within a TripDataProvider");
  return ctx;
};
