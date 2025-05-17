import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AccessRequestNotification from './AccessRequestNotification';

interface AccessRequest {
  id: string;
  doctor_id: string;
  doctor_name: string;
  request_type: 'profile' | 'reports' | 'all';
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface NotificationCenterProps {
  onClose: () => void;
}

// Mock data for testing without the database table
const MOCK_REQUESTS: AccessRequest[] = [
  {
    id: 'mock-1',
    doctor_id: 'mock-doctor-id',
    doctor_name: 'Dr. Smith',
    request_type: 'profile',
    created_at: new Date().toISOString(),
    status: 'pending'
  }
];

const NotificationCenter = ({ onClose }: NotificationCenterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState(false);

  const fetchAccessRequests = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      try {
        // Get all pending access requests for this patient
        const { data: requestsData, error: requestsError } = await supabase
          .from('access_requests')
          .select('*')
          .eq('patient_id', user.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (requestsError) {
          // If the error is that the table doesn't exist, use mock data
          if (requestsError.code === '42P01') {
            console.log('Using mock data for access requests');
            setAccessRequests(MOCK_REQUESTS);
            setUseMockData(true);
            return;
          }
          throw requestsError;
        }

        // Fetch doctor details for each request
        const requestsWithDoctorDetails = await Promise.all(
          requestsData.map(async (request) => {
            try {
              const { data: doctorData, error: doctorError } = await supabase
                .from('doctors')
                .select('name')
                .eq('user_id', request.doctor_id)
                .single();

              if (doctorError) {
                return {
                  ...request,
                  doctor_name: 'Unknown Doctor'
                };
              }

              return {
                ...request,
                doctor_name: doctorData.name || 'Unknown Doctor'
              };
            } catch (error) {
              // If doctors table doesn't exist
              return {
                ...request,
                doctor_name: 'Unknown Doctor'
              };
            }
          })
        );

        setAccessRequests(requestsWithDoctorDetails);
      } catch (error) {
        console.error('Error fetching access requests:', error);
        // If database tables don't exist, use mock data for testing
        setAccessRequests(MOCK_REQUESTS);
        setUseMockData(true);
      }
    } catch (error) {
      console.error('Error fetching access requests:', error);
      setError('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccessRequests();

    // Only set up subscription if not using mock data
    if (!useMockData) {
      try {
        // Subscribe to realtime updates for access_requests table
        const accessRequestsSubscription = supabase
          .channel('access_requests_changes')
          .on(
            'postgres_changes', 
            { 
              event: '*', 
              schema: 'public', 
              table: 'access_requests' 
            },
            () => {
              fetchAccessRequests();
            }
          )
          .subscribe();

        return () => {
          accessRequestsSubscription.unsubscribe();
        };
      } catch (error) {
        console.log('Error setting up realtime subscription:', error);
        // Silently fail for demo purposes
      }
    }
  }, [useMockData]);

  const handleApprove = () => {
    // In mock mode, just remove the notification
    if (useMockData) {
      setAccessRequests([]);
      return;
    }
    
    // Refresh the list after approval
    fetchAccessRequests();
  };

  const handleReject = () => {
    // In mock mode, just remove the notification
    if (useMockData) {
      setAccessRequests([]);
      return;
    }
    
    // Refresh the list after rejection
    fetchAccessRequests();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative inline-flex items-center justify-center p-2 text-indigo-600 bg-white rounded-full hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <Bell className="h-6 w-6" />
        {accessRequests.length > 0 && (
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
        )}
      </button>
      
      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-96 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-2 px-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
            {useMockData && (
              <p className="text-xs text-gray-500">Demo mode: Using sample data</p>
            )}
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 absolute top-2 right-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
              </div>
            ) : error ? (
              <div className="px-4 py-3 text-red-500 text-sm">{error}</div>
            ) : accessRequests.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-500">
                No new notifications
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {accessRequests.map((request) => (
                  <AccessRequestNotification
                    key={request.id}
                    id={request.id}
                    doctorName={request.doctor_name}
                    requestType={request.request_type}
                    createdAt={request.created_at}
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
