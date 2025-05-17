import { useState, useEffect } from 'react';
import { Calendar, Clock, User, Info, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

interface Appointment {
  id: string;
  doctor?: string;
  doctor_id?: string;
  patient?: string;
  patient_id?: string;
  patient_name?: string;
  date: string;
  time: string;
  status?: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

interface Patient {
  id: string;
  user_id: string;
  name: string;
  date_of_birth?: string;
  condition?: string;
}

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'appointments' | 'patients'>('appointments');

  // Function to fetch patients that this doctor has access to
  const fetchGenuinePatients = async () => {
    try {
      // Get patients with actual accounts
      const { data, error } = await supabase
        .from('patients')
        .select('*');
      
      if (error) {
        console.error('Error fetching patients:', error);
        return [];
      }
      
      return data as Patient[];
    } catch (err) {
      console.error('Error in fetchGenuinePatients:', err);
      return [];
    }
  };

  // Function to filter appointments by genuine patients
  const filterAppointmentsByRealPatients = async (
    appointments: Appointment[], 
    patients: Patient[]
  ) => {
    // Get patient IDs to verify against
    const patientUserIds = patients.map(patient => patient.user_id);
    
    // Only keep appointments where patient exists in the patients table
    return appointments.filter(appointment => {
      if (appointment.patient_id) {
        return patientUserIds.includes(appointment.patient_id);
      }
      // If no patient_id, can't verify it's real
      return false;
    });
  };

  // Update appointment status
  const updateAppointmentStatus = async (id: string, newStatus: 'scheduled' | 'completed' | 'cancelled') => {
    try {
      if (!userId) return;

      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', id)
        .eq(appointments[0]?.doctor_id ? 'doctor_id' : 'doctor', userId);

      if (error) throw error;
      
      // Update local state
      setAppointments(prev => 
        prev.map(apt => apt.id === id ? { ...apt, status: newStatus } : apt)
      );
    } catch (err) {
      console.error('Error updating appointment status:', err);
    }
  };

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setIsLoading(true);
        
        // Get the current logged-in user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }
        
        setUserId(user.id);
        
        // Get patients with real accounts
        const genuinePatients = await fetchGenuinePatients();
        
        // Save all patients for the patient list tab
        setPatients(genuinePatients);
        
        if (genuinePatients.length === 0) {
          // No genuine patients found
          setAppointments([]);
          setIsLoading(false);
          return;
        }

        // Try to fetch appointments
        try {
          // Try a select query appropriate for the table structure
          let query = supabase.from('appointments').select('*');
          
          // If doctor_id column exists
          if (user.id) {
            try {
              const { data, error } = await query.eq('doctor_id', user.id);
              
              if (error) {
                // If first query fails, try alternative column name
                try {
                  const { data: altData, error: altError } = await supabase
                    .from('appointments')
                    .select('*')
                    .eq('doctor', user.id);
                  
                  if (altError) throw altError;
                  
                  // Filter by genuine patients
                  const genuineAppointments = await filterAppointmentsByRealPatients(
                    altData || [],
                    genuinePatients
                  );
                  
                  setAppointments(genuineAppointments);
                } catch (alternativeError) {
                  console.error('Error with alternative query:', alternativeError);
                  setAppointments([]);
                }
              } else {
                // Filter by genuine patients
                const genuineAppointments = await filterAppointmentsByRealPatients(
                  data || [],
                  genuinePatients
                );
                
                setAppointments(genuineAppointments);
              }
            } catch (queryError) {
              console.error('Error querying appointments:', queryError);
              setAppointments([]);
            }
          } else {
            setAppointments([]);
          }
        } catch (dbError) {
          console.error('Database error:', dbError);
          setAppointments([]);
        }
      } catch (error) {
        console.error('Error in appointment fetch process:', error);
        setAppointments([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Doctor Portal</h1>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'appointments'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('appointments')}
        >
          Appointments
        </button>
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'patients'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('patients')}
        >
          Patient Profiles
        </button>
      </div>
      
      {activeTab === 'appointments' ? (
        <div className="grid gap-4">
          {appointments.length === 0 ? (
            <div className="bg-gray-50 p-6 rounded-lg shadow-md text-center">
              <div className="flex justify-center mb-4">
                <Info className="h-10 w-10 text-gray-400" />
              </div>
              <p className="text-gray-600 mb-2">No appointments with registered patients</p>
              <p className="text-sm text-gray-500">
                You don't have any scheduled appointments with registered patients yet.
              </p>
            </div>
          ) : (
            appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <User className="h-6 w-6 text-gray-400" />
                    <div>
                      <h3 className="font-semibold">
                        {appointment.patient_name || "Patient"}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{new Date(appointment.date).toLocaleDateString()}</span>
                        <Clock className="h-4 w-4 ml-3 mr-1" />
                        <span>{appointment.time}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                      {appointment.status 
                        ? appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)
                        : "Scheduled"}
                    </span>
                    
                    <div className="flex gap-1 mt-1">
                      <button
                        onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                        className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                        className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
                {appointment.notes && (
                  <div className="mt-3 pl-10 text-sm text-gray-600">
                    <p>Notes: {appointment.notes}</p>
                  </div>
                )}
                
                {/* Link to patient profile */}
                {appointment.patient_id && (
                  <div className="mt-3 pl-10">
                    <Link 
                      to={`/doctor/patient/${appointment.patient_id}`}
                      className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <FileText size={14} />
                      View Patient Records
                    </Link>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {patients.length === 0 ? (
            <div className="bg-gray-50 p-6 rounded-lg shadow-md text-center">
              <div className="flex justify-center mb-4">
                <Info className="h-10 w-10 text-gray-400" />
              </div>
              <p className="text-gray-600 mb-2">No patient profiles found</p>
              <p className="text-sm text-gray-500">
                There are no patients with registered profiles in the system yet.
              </p>
            </div>
          ) : (
            patients.map((patient) => (
              <div
                key={patient.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <User className="h-6 w-6 text-gray-400" />
                    <div>
                      <h3 className="font-semibold">
                        {patient.name || "Unknown Patient"}
                      </h3>
                      {patient.date_of_birth && (
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>Born: {new Date(patient.date_of_birth).toLocaleDateString()}</span>
                        </div>
                      )}
                      {patient.condition && (
                        <div className="text-sm text-gray-500 mt-1">
                          <span>Condition: {patient.condition}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <Link 
                      to={`/doctor/patient/${patient.user_id}`}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700"
                    >
                      <FileText size={14} className="mr-1" />
                      Patient Records
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;
