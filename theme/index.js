import palette from "../utils/constants";

 
export const createTheme = (mode = 'light') => ({
  palette: palette[mode],
});