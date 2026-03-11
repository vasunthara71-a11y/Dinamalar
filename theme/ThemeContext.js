import React, { createContext, useState } from "react";
import palette from "./palette";

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {

  const [mode, setMode] = useState("light");

  const toggleTheme = () => {
    setMode(prev => (prev === "light" ? "dark" : "light"));
  };

  const theme = palette[mode];

  return (
    <ThemeContext.Provider value={{ theme, mode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};