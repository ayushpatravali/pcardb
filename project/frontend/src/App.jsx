import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import SignUp from './pages/SignUp';
import Home from './pages/Home';
import NewApplication from './pages/NewApplication';
import SelectScheme from './pages/SelectScheme';
import ApplicationsList from './pages/ApplicationsList';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import PrintApplication from './pages/PrintApplication';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/select-scheme" element={<SelectScheme />} />
                <Route path="/application/new" element={<NewApplication />} />
                <Route path="/applications/:id/edit" element={<NewApplication />} /> {/* Reuse for Edit */}
                <Route path="/applications" element={<ApplicationsList />} />
              </Route>

              {/* Print Route: Protected (requires auth) but outside Layout (no sidebar) */}
              <Route path="/applications/:id/print" element={<PrintApplication />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
