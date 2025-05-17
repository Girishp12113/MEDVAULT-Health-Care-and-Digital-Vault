import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Bell, User } from 'lucide-react';
import NotificationCenter from './NotificationCenter';

interface Report {
  id: string;
  title: string;
  date: string;
  type: string;
}

interface Patient {
  id: string;
  name: string;
  date_of_birth: string;
  user_id: string;
  reports?: Report[];
}

const DoctorDashboard = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [accessStatuses, setAccessStatuses] = useState<Record<string, string>>({});
  const [notificationCount, setNotificationCount] = useState<number>(0);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user.user_metadata || session.user.user_metadata.role !== 'doctor') {
        navigate('/doctor/login', { replace: true });
      }
    };

    checkAuth();
  }, [navigate]);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('Not authenticated');
        }

        // First, check if we need to fix the patients table
        const { error: checkError } = await supabase
          .from('patients')
          .select('count(*)')
          .single();
          
        if (checkError && checkError.code === '42P01') {
          // Table doesn't exist, show error
          setError('Database setup required. Please contact administrator.');
          return;
        }
        
        // Get all patients with their basic info - modified to handle different column structures
        const { data: patientData, error: patientError } = await supabase
          .from('patients')
          .select('*');  // Select all columns to ensure we get everything

        if (patientError) {
          if (patientError.code === '42P01') {
            setError('Database setup required. Please contact administrator.');
            return;
          }
          throw patientError;
        }

        // Get reports for patients with approved access
        const { data: reportsData, error: reportsError } = await supabase
          .from('reports')
          .select('id, patient_id, title, date, type');

        if (reportsError && reportsError.code !== '42P01') {
          throw reportsError;
        }

        // Get all access requests for this doctor
        const { data: accessRequests, error: accessError } = await supabase
          .from('access_requests')
          .select('*')
          .eq('doctor_id', user.id);

        if (accessError && accessError.code !== '42P01') {
          throw accessError;
        }

        // Create a map of patient_id to their reports
        const reportsMap: Record<string, Report[]> = {};
        reportsData?.forEach(report => {
          if (!reportsMap[report.patient_id]) {
            reportsMap[report.patient_id] = [];
          }
          reportsMap[report.patient_id].push({
            id: report.id,
            title: report.title,
            date: report.date,
            type: report.type
          });
        });

        // Create a map of patient_id to access status
        const statusMap: Record<string, string> = {};
        accessRequests?.forEach(request => {
          statusMap[request.patient_id] = request.status;
        });

        // Process patient data - handle different column structures
        const processedPatients = (patientData || []).map(patient => {
          // Handle different column structures
          let patientName = patient.name;
          if (!patientName && patient.first_name) {
            patientName = `${patient.first_name} ${patient.last_name || ''}`.trim();
          }
          if (!patientName && patient.email) {
            patientName = patient.email.split('@')[0]; // Use part of email as name
          }
          
          return {
            id: patient.id,
            name: patientName || 'Unknown',
            date_of_birth: patient.date_of_birth || '',
            user_id: patient.user_id || patient.id, // Fallback to id if user_id is missing
            reports: reportsMap[patient.user_id || patient.id] || []
          };
        });
        
        console.log('Processed patients:', processedPatients);
        setPatients(processedPatients);
        setAccessStatuses(statusMap);
        
        // Count pending requests for notification badge
        const pendingCount = accessRequests?.filter(req => req.status === 'pending').length || 0;
        setNotificationCount(pendingCount);

      } catch (error: any) {
        console.error('Error fetching patients:', error);
        setError(error.message || 'Failed to load patients. Please try again later.');
        setPatients([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatients();

    // Set up real-time subscription for access_requests, patients, and reports
    const subscription = supabase
      .channel('table_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'access_requests'
        },
        () => fetchPatients()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'patients'
        },
        () => fetchPatients()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reports'
        },
        () => fetchPatients()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/doctor/login', { replace: true });
  };

  const handlePatientClick = (patientId: string, status: string) => {
    if (status === 'approved') {
      navigate(`/patient/${patientId}`);
    } else {
      requestAccess(patientId);
    }
  };

  const requestAccess = async (patientId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error: accessError } = await supabase
        .from('access_requests')
        .insert([
          {
            doctor_id: user.id,
            patient_id: patientId,
            status: 'pending',
            request_type: 'all'
          }
        ]);

      if (accessError) {
        if (accessError.code === '42P01') {
          setError('System is being set up. Please try again in a few minutes.');
          return;
        }
        throw accessError;
      }

      // Update local state
      setAccessStatuses(prev => ({
        ...prev,
        [patientId]: 'pending'
      }));
      
      setNotificationCount(prev => prev + 1);
    } catch (error: any) {
      console.error('Error requesting access:', error);
      setError(error.message || 'Failed to request access. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gray-100">
      <div className="bg-indigo-600 text-white">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Doctor Portal</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-full hover:bg-indigo-700 transition-colors"
            >
              <Bell size={24} />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </button>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-indigo-700 rounded hover:bg-indigo-800 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
                {error.includes('Database setup') && (
                  <p className="mt-2 text-sm text-red-600">
                    The system is still being initialized. Please wait a few minutes and refresh the page.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patients.map((patient) => (
            <div
              key={patient.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{patient.name}</h3>
                    <div className="space-y-2">
                      <p className="text-gray-600">
                        Age: {patient.date_of_birth ? calculateAge(patient.date_of_birth) : 'N/A'}
                      </p>
                      <div className="text-gray-600">
                        <p>Reports: {patient.reports?.length || 0}</p>
                        {accessStatuses[patient.user_id] === 'approved' && patient.reports && patient.reports.length > 0 && (
                          <div className="mt-2 text-sm">
                            <p className="font-medium">Latest Reports:</p>
                            <ul className="list-disc list-inside">
                              {patient.reports.slice(0, 2).map(report => (
                                <li key={report.id} className="truncate">
                                  {report.title} ({new Date(report.date).toLocaleDateString()})
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-gray-600" />
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  {accessStatuses[patient.user_id] === 'approved' ? (
                    <button
                      onClick={() => handlePatientClick(patient.user_id, 'approved')}
                      className="w-full text-white px-4 py-2 rounded bg-green-600 hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <span>View Records</span>
                      {patient.reports && patient.reports.length > 0 && (
                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                          {patient.reports.length}
                        </span>
                      )}
                    </button>
                  ) : accessStatuses[patient.user_id] === 'pending' ? (
                    <button
                      disabled
                      className="w-full text-white px-4 py-2 rounded bg-yellow-500 opacity-75 cursor-not-allowed"
                    >
                      Access Request Pending
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePatientClick(patient.user_id, 'none')}
                      className="w-full text-white px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 transition-colors"
                    >
                      Request Access
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {patients.length === 0 && !error && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">No patients found</h3>
            <p className="mt-2 text-gray-600">There are currently no patients in the system.</p>
            <p className="mt-2 text-gray-600">Patients need to register and create profiles before they appear here.</p>
          </div>
        )}
      </div>

      {showNotifications && (
        <div className="absolute top-16 right-4 w-96 bg-white rounded-lg shadow-xl z-50">
          <NotificationCenter onClose={() => setShowNotifications(false)} />
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
