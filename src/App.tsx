import { useEffect, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Reports from './components/Reports';
import Medications from './components/Medications';
import Appointments from './components/Appointments';
import ProfileSimple from './components/ProfileSimple';
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
import LandingPage from './components/LandingPage';
import EmailConfirmation from './components/EmailConfirmation';
import OTPManager from './components/OTPManager';

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
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn('Supabase connection error, running in demo mode:', error.message);
          setIsLoading(false);
          return;
        }
        
        setIsAuthenticated(!!session);
        if (session?.user) {
          // Try to get role from metadata first
          let role = session.user.user_metadata?.role;
          
          if (!role) {
            // If no role in metadata, check database tables
            try {
              const { data: doctorData } = await supabase
                .from('doctors')
                .select('id')
                .eq('user_id', session.user.id)
                .maybeSingle();
              
              const { data: patientData } = await supabase
                .from('patients')
                .select('id')
                .eq('user_id', session.user.id)
                .maybeSingle();
              
              role = doctorData ? 'doctor' : patientData ? 'patient' : null;
              
              // Update user metadata with role if found
              if (role) {
                await supabase.auth.updateUser({
                  data: { role }
                });
              }
            } catch (dbError) {
              console.warn('Database tables not available, running in demo mode');
              role = 'patient'; // Default to patient for demo
            }
          }
          
          setUserRole(role);
        }
      } catch (error) {
        console.warn('Authentication initialization error:', error);
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
    if (!isAuthenticated) return '/';
    if (userRole === 'doctor') return '/doctor/dashboard';
    if (userRole === 'patient') return '/dashboard'; // Changed to /dashboard for patients
    return '/';
  };

  return (
    <Router>
      <MainLayout>
        {/* Add the FloatingHealthAssistant component here, outside of Routes */}
        {isAuthenticated && userRole === 'patient' && <FloatingHealthAssistant />}
        
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/confirm" element={<EmailConfirmation />} />
          
          {/* Protected Patient Routes */}
          <Route
            path="/dashboard"
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
          
          <Route
            path="/login"
            element={
              isAuthenticated && userRole ? (
                <Navigate to={userRole === 'doctor' ? '/doctor/dashboard' : '/dashboard'} replace />
              ) : (
                <Login />
              )
            }
          />
          <Route
            path="/doctor/login"
            element={
              isAuthenticated && userRole ? (
                <Navigate to={userRole === 'doctor' ? '/doctor/dashboard' : '/dashboard'} replace />
              ) : (
                <DoctorLogin />
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
                <Navigate to="/dashboard" replace />
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
                <Navigate to="/dashboard" replace />
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
                <Navigate to="/dashboard" replace />
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
                <Navigate to="/dashboard" replace />
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
                  <ProfileSimple />
                </>
              ) : isAuthenticated && userRole === 'doctor' ? (
                <Navigate to="/doctor/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/otp-manager"
            element={
              isAuthenticated && userRole === 'patient' ? (
                <>
                  <Navbar userRole={userRole} onLogout={handleLogout} />
                  <OTPManager />
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