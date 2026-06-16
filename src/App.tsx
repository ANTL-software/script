import './utils/styles/global.scss'

import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'

import { getGreetingName, getSalutation } from "./utils/scripts/utils";
import { useUser, useApp, useForceClosing } from './hooks';
import { closingService } from './API/services';
import ClosingModal from './views/components/closingModal/ClosingModal';

import Header from './views/components/header/Header'
import ProtectedRoute from './views/components/protectedRoute/ProtectedRoute'
import IncomingCallBanner from './views/components/incomingCallBanner/IncomingCallBanner'

import DashboardPage from './views/layouts/dashboardPage/DashboardPage'
import LandingPage from './views/layouts/landingPage/LandingPage'
import LoginPage from './views/layouts/loginPage/LoginPage'
import PlanAppelPage from './views/layouts/planAppelPage/PlanAppelPage'
import ObjectionsPage from './views/layouts/objectionsPage/ObjectionsPage'

function AppRouter() {
  const { user } = useUser();
  const { currentView } = useApp();
  const { pendingClosing, forceMode } = useForceClosing();
  const navigate = useNavigate();

  const props = {
    pageTitle: getSalutation(getGreetingName(user?.prenom, user?.id_employe)),
  }

  const showHeader = currentView !== 'commande' && currentView !== 'rendez-vous';

  return (
    <>
      <audio id="remoteAudio" autoPlay />
      <IncomingCallBanner />

      {/* ClosingModal global (mode force si nécessaire) */}
      {pendingClosing && (
        <ClosingModal
          isOpen={true}
          prospectId={pendingClosing.prospectId}
          prospectName={pendingClosing.prospectName}
          campagneId={pendingClosing.campagneId}
          appelId={pendingClosing.appelId ?? undefined}
          origineAppel={pendingClosing.origineAppel ?? undefined}
          rendezVousSourceId={pendingClosing.rendezVousSourceId ?? undefined}
          dureeAppel={pendingClosing.dureeAppel}
          forceMode={forceMode}
          onComplete={() => {
            closingService.clearPending();
            navigate('/');
          }}
        />
      )}

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
    </>
  );
}

function App() {
  return (
    <Router>
      <AppRouter />
    </Router>
  );
}

export default App
