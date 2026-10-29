import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import MapView from './pages/MapView';
import History from './pages/History';
import Geofence from './pages/Geofence';
import Watchlist from './pages/Watchlist';
import Analytics from './pages/Analytics';
import Incidents from './pages/Incidents';
import ATC from './pages/ATCv2';

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<ATC />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/history" element={<History />} />
            <Route path="/geofence" element={<Geofence />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/incidents" element={<Incidents />} />
          </Route>
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </Router>
      <Toaster />
    </QueryClientProvider>
  )
}

export default App
