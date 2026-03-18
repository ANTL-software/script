import './utils/styles/global.scss'

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

import { getSalutation } from "./utils/scripts/utils";
import { useUser, useApp } from './hooks';

import Header from './views/components/header/Header'
import ProtectedRoute from './views/components/protectedRoute/ProtectedRoute'
import IncomingCallBanner from './views/components/incomingCallBanner/IncomingCallBanner'

import DashboardPage from './views/layouts/dashboardPage/DashboardPage'
import LandingPage from './views/layouts/landingPage/LandingPage'
import LoginPage from './views/layouts/loginPage/LoginPage'
import PlanAppelPage from './views/layouts/planAppelPage/PlanAppelPage'
import ObjectionsPage from './views/layouts/objectionsPage/ObjectionsPage'

function App() {
  const { user } = useUser();
  const { currentView } = useApp();

  const props = {
    pageTitle: getSalutation(user?.prenom),
  }

  const showHeader = currentView !== 'commande' && currentView !== 'rendez-vous';

  return (
    <Router>
      <audio id="remoteAudio" autoPlay />
      <IncomingCallBanner />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Header props={props} />
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/prospect/:id"
          element={
            <ProtectedRoute>
              {showHeader && <Header props={props} />}
              <LandingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/plan-appel"
          element={
            <ProtectedRoute>
              <PlanAppelPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/objections"
          element={
            <ProtectedRoute>
              <ObjectionsPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  )
}

export default App
