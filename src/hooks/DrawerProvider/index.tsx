import React, { createContext, useState, useCallback } from "react";

export interface DrawerContextContent {
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

export const DrawerContext = createContext<DrawerContextContent>(null);

export const DrawerProvider = ({ children }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setIsDrawerOpen((prev) => !prev), []);

  return (
    <DrawerContext.Provider
      value={{ isDrawerOpen, openDrawer, closeDrawer, toggleDrawer }}
    >
      {children}
    </DrawerContext.Provider>
  );
};
