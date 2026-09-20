import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AuthForm from './components/AuthForm';
import FindTeammatesPage from './pages/FindTeammatesPage';
import ProfileFormPage from './pages/ProfileFormPage';
import TeamDashboardPage from './pages/TeamDashboardPage';
import BuildTeamPage from './pages/BuildTeamPage';
import './App.css';

// Guard: redirect to /auth if no token
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('hackmate_token');
  return token ? children : <Navigate to="/auth" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthForm />} />
        <Route path="/teammates" element={<FindTeammatesPage />} />
        
        {/* Team Routes */}
        <Route path="/team" element={<TeamDashboardPage />} />
        <Route path="/team/dashboard" element={<TeamDashboardPage />} />
        <Route path="/team/build" element={<BuildTeamPage />} />
        <Route path="/build-team" element={<BuildTeamPage />} />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfileFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/edit"
          element={
            <ProtectedRoute>
              <ProfileFormPage />
            </ProtectedRoute>
          }
        />
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

