import React from 'react';
import ReactDOM from 'react-dom/client'; // For React 18
import { ThemeProvider, createTheme } from '@mui/material/styles';
import App from './App';


const theme = createTheme({
  palette: {
    primary: {
      main: '#007BFF', // Blue for technology
    },
    secondary: {
      main: '#28A745', // Green for learning
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ThemeProvider theme={theme}>
    <App />
  </ThemeProvider>
);