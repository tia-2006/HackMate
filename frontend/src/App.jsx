import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AuthForm from './components/AuthForm';
import FindTeammatesPage from './pages/FindTeammatesPage';
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
        <Route
          path="/teammates"
          element={
            <ProtectedRoute>
              <FindTeammatesPage />
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

