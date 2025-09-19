import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css' // <-- THIS LINE IS CRITICAL
import { populateDb } from './lib/db.ts'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext';

const queryClient = new QueryClient()

async function enableMocking() {
  // We've removed the environment check to allow MSW to run on the deployed site
  const { worker } = await import('./mocks/browser')
 
  return worker.start()
}

enableMocking().then(async () => {
  await populateDb();
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider> {/* <-- WRAP HERE */}
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </React.StrictMode>,
  )
})
