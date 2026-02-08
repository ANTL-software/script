import './utils/styles/global.scss'

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

import { getSalutation } from "./utils/scripts/utils";
import { useUser, useApp } from './hooks';

import Header from './views/components/header/Header'
import ProtectedRoute from './views/components/protectedRoute/ProtectedRoute'

import LandingPage from './views/layouts/landingPage/LandingPage'
import LoginPage from './views/layouts/loginPage/LoginPage'
import PlanAppelPage from './views/layouts/planAppelPage/PlanAppelPage'
import ObjectionsPage from './views/layouts/objectionsPage/ObjectionsPage'

function App() {
  const { user } = useUser();
  const { currentView } = useApp();

  const props = {
    pageTitle: user ? `${getSalutation()} ${user.prenom} !` : `${getSalutation()} !`,
  }

  const showHeader = currentView !== 'commande' && currentView !== 'rendez-vous';

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
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
