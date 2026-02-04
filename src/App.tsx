import './utils/styles/global.scss'

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

import { getSalutation } from "./utils/scripts/utils";
import { useUser, useApp } from './hooks';

import Clock from './views/components/clock/Clock'
import Header from './views/components/header/Header'
import ProtectedRoute from './views/components/protectedRoute/ProtectedRoute'

import LandingPage from './views/layouts/landingPage/LandingPage'
import LoginPage from './views/layouts/loginPage/LoginPage'

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
              <Clock />
              {showHeader && <Header props={props} />}
              <LandingPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  )
}

export default App
