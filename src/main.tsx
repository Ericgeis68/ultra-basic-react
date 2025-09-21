import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { Toaster as SonnerToaster } from "@/components/ui/sonner" // Renommé pour éviter les conflits
import { Toaster as ShadcnToaster } from "@/components/ui/toaster" // Renommé pour éviter les conflits
import { SettingsProvider } from './contexts/SettingsContext.tsx'
import { EquipmentProvider } from './contexts/EquipmentContext.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx' // Import de AuthProvider
import { CustomAuthProvider } from './hooks/useCustomAuth.tsx' // Import de CustomAuthProvider aussi
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"; // Import de QueryClientProvider
import { TooltipProvider } from "@/components/ui/tooltip"; // Import de TooltipProvider

const queryClient = new QueryClient(); // Initialisation de QueryClient ici

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}> {/* Déplacé ici */}
        <TooltipProvider> {/* Déplacé ici */}
          <SettingsProvider>
            <EquipmentProvider>
              <AuthProvider> {/* AuthProvider principal */}
                <CustomAuthProvider> {/* CustomAuthProvider pour compatibilité */}
                  <App />
                  <ShadcnToaster /> {/* Composants Toaster placés ici */}
                  <SonnerToaster />
                </CustomAuthProvider>
              </AuthProvider>
            </EquipmentProvider>
          </SettingsProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
