import { useEffect, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Reports from './components/Reports';
import Medications from './components/Medications';
import Appointments from './components/Appointments';
import Profile from './components/Profile';
import MainLayout from './components/MainLayout';
import AIReportAnalysis from './components/AIReportAnalysis';
import ReminderService from './components/ReminderService';
import DoctorLogin from './components/DoctorLogin';
import DoctorDashboard from './components/DoctorDashboard';
import DoctorProfile from './components/DoctorProfile';
import DoctorAppointments from './components/DoctorAppointments';
import PatientRecords from './components/PatientRecords';
import HealthMetrics from './components/HealthMetrics';
import VirtualHealthAssistant from './components/VirtualHealthAssistant';
import FloatingHealthAssistant from './components/FloatingHealthAssistant';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<'patient' | 'doctor' | null>(null);

  // Use useCallback to memoize the logout function
  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUserRole(null);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      if (session?.user) {
        // Try to get role from metadata first
        let role = session.user.user_metadata?.role;
        
        if (!role) {
          // If no role in metadata, check database tables
          const { data: doctorData } = await supabase
            .from('doctors')
            .select('id')
            .eq('user_id', session.user.id)
            .single();
          
          const { data: patientData } = await supabase
            .from('patients')
            .select('id')
            .eq('user_id', session.user.id)
            .single();
          
          role = doctorData ? 'doctor' : patientData ? 'patient' : null;
          
          // Update user metadata with role if found
          if (role) {
            await supabase.auth.updateUser({
              data: { role }
            });
          }
        }
        
        setUserRole(role);
      }
      setIsLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (session?.user) {
        setUserRole(session.user.user_metadata?.role || null);
      } else {
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Define redirect path outside of route rendering to avoid render loops
  const getRedirectPath = () => {
    if (!isAuthenticated) return '/login';
    if (userRole === 'doctor') return '/doctor/dashboard';
    if (userRole === 'patient') return '/';
    return '/login';
  };

  return (
    <Router>
      <MainLayout>
        {/* Add the FloatingHealthAssistant component here, outside of Routes */}
        {isAuthenticated && userRole === 'patient' && <FloatingHealthAssistant />}
        
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              isAuthenticated && userRole ? (
                <Navigate to={userRole === 'doctor' ? '/doctor/dashboard' : '/'} replace />
              ) : (
                <Login />
              )
            }
          />
          <Route
            path="/doctor/login"
            element={
              isAuthenticated && userRole ? (
                <Navigate to={userRole === 'doctor' ? '/doctor/dashboard' : '/'} replace />
              ) : (
                <DoctorLogin />
              )
            }
          />
          
          {/* Protected Patient Routes */}
          <Route
            path="/"
            element={
              isAuthenticated && userRole === 'patient' ? (
                <>
                  <Navbar userRole={userRole} onLogout={handleLogout} />
                  <Dashboard />
                </>
              ) : isAuthenticated && userRole === 'doctor' ? (
                <Navigate to="/doctor/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          
          {/* Protected Doctor Routes */}
          <Route
            path="/doctor/dashboard"
            element={
              isAuthenticated && userRole === 'doctor' ? (
                <>
                  <Navbar userRole={userRole} onLogout={handleLogout} />
                  <DoctorDashboard />
                </>
              ) : isAuthenticated && userRole === 'patient' ? (
                <Navigate to="/" replace />
              ) : (
                <Navigate to="/doctor/login" replace />
              )
            }
          />

          <Route
            path="/doctor/appointments"
            element={
              isAuthenticated && userRole === 'doctor' ? (
                <>
                  <Navbar userRole={userRole} onLogout={handleLogout} />
                  <DoctorAppointments />
                </>
              ) : isAuthenticated && userRole === 'patient' ? (
                <Navigate to="/" replace />
              ) : (
                <Navigate to="/doctor/login" replace />
              )
            }
          />

          <Route
            path="/doctor/profile"
            element={
              isAuthenticated && userRole === 'doctor' ? (
                <>
                  <Navbar userRole={userRole} onLogout={handleLogout} />
                  <DoctorProfile />
                </>
              ) : isAuthenticated && userRole === 'patient' ? (
                <Navigate to="/" replace />
              ) : (
                <Navigate to="/doctor/login" replace />
              )
            }
          />

          {/* Patient Records Route - Protected and requires access approval */}
          <Route
            path="/doctor/patient/:patientId"
            element={
              isAuthenticated && userRole === 'doctor' ? (
                <>
                  <Navbar userRole={userRole} onLogout={handleLogout} />
                  <PatientRecords />
                </>
              ) : isAuthenticated && userRole === 'patient' ? (
                <Navigate to="/" replace />
              ) : (
                <Navigate to="/doctor/login" replace />
              )
            }
          />

          {/* Protected Patient Routes */}
          <Route
            path="/reports"
            element={
              isAuthenticated && userRole === 'patient' ? (
                <>
                  <Navbar userRole={userRole} onLogout={handleLogout} />
                  <Reports />
                </>
              ) : isAuthenticated && userRole === 'doctor' ? (
                <Navigate to="/doctor/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/medications"
            element={
              isAuthenticated && userRole === 'patient' ? (
                <>
                  <Navbar userRole={userRole} onLogout={handleLogout} />
                  <Medications />
                </>
              ) : isAuthenticated && userRole === 'doctor' ? (
                <Navigate to="/doctor/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/appointments"
            element={
              isAuthenticated && userRole === 'patient' ? (
                <>
                  <Navbar userRole={userRole} onLogout={handleLogout} />
                  <Appointments />
                </>
              ) : isAuthenticated && userRole === 'doctor' ? (
                <Navigate to="/doctor/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/profile"
            element={
              isAuthenticated && userRole === 'patient' ? (
                <>
                  <Navbar userRole={userRole} onLogout={handleLogout} />
                  <Profile />
                </>
              ) : isAuthenticated && userRole === 'doctor' ? (
                <Navigate to="/doctor/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/ai-analysis"
            element={
              isAuthenticated && userRole === 'patient' ? (
                <>
                  <Navbar userRole={userRole} onLogout={handleLogout} />
                  <AIReportAnalysis />
                </>
              ) : isAuthenticated && userRole === 'doctor' ? (
                <Navigate to="/doctor/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/reminders"
            element={
              isAuthenticated && userRole === 'patient' ? (
                <>
                  <Navbar userRole={userRole} onLogout={handleLogout} />
                  <ReminderService />
                </>
              ) : isAuthenticated && userRole === 'doctor' ? (
                <Navigate to="/doctor/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/virtual-assistant"
            element={
              isAuthenticated && userRole === 'patient' ? (
                <>
                  <Navbar userRole={userRole} onLogout={handleLogout} />
                  <VirtualHealthAssistant />
                </>
              ) : isAuthenticated && userRole === 'doctor' ? (
                <Navigate to="/doctor/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/health-metrics"
            element={
              isAuthenticated && userRole === 'patient' ? (
                <>
                  <Navbar userRole={userRole} onLogout={handleLogout} />
                  <HealthMetrics />
                </>
              ) : isAuthenticated && userRole === 'doctor' ? (
                <Navigate to="/doctor/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to={getRedirectPath()} replace />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;