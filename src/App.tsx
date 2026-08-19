import './utils/styles/global.scss'

import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom'

import { getGreetingName, getSalutation } from './utils/scripts/index.ts';
import { useUser, useApp, useClosing, useForceClosing, useScriptCallAccessGuard } from './hooks';
import { ClosingModal, Header, IncomingCallBanner, ProtectedRoute } from './views/components';
import { DashboardPage, LandingPage, LoginPage, ObjectionsPage, PlanAppelPage } from './views/layouts';

function AppRouter() {
  const { user } = useUser();
  const { currentView } = useApp();
  const { pendingClosing, forceMode } = useForceClosing();
  const { clearPending } = useClosing();
  const navigate = useNavigate();
  const location = useLocation();
  useScriptCallAccessGuard(location.pathname === '/');

  const props = {
    pageTitle: getSalutation(getGreetingName(user?.prenom, user?.id_employe)),
  }

  const showHeader = currentView !== 'commande' && currentView !== 'rendez-vous';

  return (
    <>
      <IncomingCallBanner />

      {/* ClosingModal global (mode force si nécessaire) */}
      {pendingClosing && (
        <ClosingModal
          isOpen={true}
          prospectId={pendingClosing.prospectId}
          prospectName={pendingClosing.prospectName}
          campagneId={pendingClosing.campagneId}
          campaignVariant={pendingClosing.campaignVariant ?? null}
          appelId={pendingClosing.appelId ?? undefined}
          origineAppel={pendingClosing.origineAppel ?? undefined}
          rendezVousSourceId={pendingClosing.rendezVousSourceId ?? undefined}
          dureeAppel={pendingClosing.dureeAppel}
          forceMode={forceMode}
          onComplete={() => {
            clearPending();
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
