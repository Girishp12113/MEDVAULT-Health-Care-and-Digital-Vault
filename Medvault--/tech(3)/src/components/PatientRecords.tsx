import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, User, CalendarClock, FileLock2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Patient {
  id: string;
  name: string;
  date_of_birth: string;
  user_id: string;
}

interface Report {
  id: string;
  title: string;
  date: string;
  type: string;
  file_url: string;
}

const PatientRecords = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [accessStatus, setAccessStatus] = useState<'loading' | 'approved' | 'denied'>('loading');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAccessAndLoadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/doctor/login');
          return;
        }

        // Check if the doctor has access to this patient
        const { data: accessData, error: accessError } = await supabase
          .from('access_requests')
          .select('*')
          .eq('doctor_id', user.id)
          .eq('patient_id', patientId)
          .eq('status', 'approved')
          .maybeSingle();

        if (accessError) throw accessError;

        if (!accessData) {
          setAccessStatus('denied');
          setIsLoading(false);
          return;
        }

        setAccessStatus('approved');

        // Load patient details
        const { data: patientData, error: patientError } = await supabase
          .from('patients')
          .select('*')
          .eq('user_id', patientId)
          .single();

        if (patientError) throw patientError;
        setPatient(patientData);

        // Load patient reports
        const { data: reportsData, error: reportsError } = await supabase
          .from('reports')
          .select('*')
          .eq('patient_id', patientId)
          .order('date', { ascending: false });

        if (reportsError) throw reportsError;
        setReports(reportsData || []);

      } catch (error) {
        console.error('Error loading patient data:', error);
        setAccessStatus('denied');
      } finally {
        setIsLoading(false);
      }
    };

    checkAccessAndLoadData();

    // Set up real-time subscription for access_requests
    const accessSubscription = supabase
      .channel('access_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'access_requests'
        },
        () => {
          // Refresh the data when there are changes
          checkAccessAndLoadData();
        }
      )
      .subscribe();

    return () => {
      accessSubscription.unsubscribe();
    };
  }, [patientId, navigate]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateAge = (dateOfBirth: string | undefined) => {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (accessStatus === 'denied') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <FileLock2 className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-red-800">Access Required</h3>
              <p className="mt-2 text-red-700">
                You need permission to view this patient's records. Please request access from the dashboard.
              </p>
              <button
                onClick={() => navigate('/doctor/dashboard')}
                className="mt-4 px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {patient && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{patient.name}</h2>
              <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm">
                Access Granted
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Patient Information</h3>
                <div className="space-y-3">
                  <p className="flex items-center text-gray-600">
                    <User className="h-5 w-5 mr-2" />
                    Age: {calculateAge(patient.date_of_birth)}
                  </p>
                  <p className="flex items-center text-gray-600">
                    <CalendarClock className="h-5 w-5 mr-2" />
                    Date of Birth: {formatDate(patient.date_of_birth)}
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Medical Reports</h3>
                {reports.length > 0 ? (
                  <div className="space-y-3">
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-indigo-600 mr-2" />
                          <div>
                            <p className="font-medium text-gray-900">{report.title}</p>
                            <p className="text-sm text-gray-500">{formatDate(report.date)}</p>
                          </div>
                        </div>
                        {report.file_url && (
                          <a
                            href={report.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200"
                          >
                            View
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No medical reports available.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientRecords;
