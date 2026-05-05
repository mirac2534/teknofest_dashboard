import React from 'react';
import ReactDOM from 'react-dom/client';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter } from 'react-router-dom';
import { App } from './app/App';
import { AuthProvider } from './features/auth/AuthContext';
import { FlightSimulationProvider } from './features/simulation/FlightSimulationContext';
import { SynapseThemeProvider } from './features/theme/SynapseThemeProvider';
import './app/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <SynapseThemeProvider>
        <CssBaseline />
        <AuthProvider>
          <FlightSimulationProvider>
            <App />
          </FlightSimulationProvider>
        </AuthProvider>
      </SynapseThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
