import React, { useState, useEffect } from 'react';
import { Users, Eye, Lock, Search, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Patient {
  id: string;
  user_id: string;
  name: string;
  date_of_birth?: string;
  condition?: string;
  created_at: string;
  access_status?: 'pending' | 'approved' | 'none';
}

const PatientList = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [isRequestingAccess, setIsRequestingAccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    // Filter patients based on search term
    const filtered = patients.filter(patient =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.condition?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPatients(filtered);
  }, [searchTerm, patients]);

  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Doctor authentication required');
        return;
      }

      // Fetch all patients (basic info only)
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (patientsError) {
        console.error('Error fetching patients:', patientsError);
        setError('Failed to load patients');
        return;
      }

      // Check access requests for each patient
      const patientsWithStatus = await Promise.all(
        (patientsData || []).map(async (patient) => {
          const { data: accessRequests } = await supabase
            .from('access_requests')
            .select('status')
            .eq('doctor_id', user.id)
            .eq('patient_id', patient.user_id)
            .order('created_at', { ascending: false })
            .limit(1);

          const latestRequest = accessRequests?.[0];
          return {
            ...patient,
            access_status: latestRequest?.status || 'none'
          };
        })
      );

      setPatients(patientsWithStatus);
      setFilteredPatients(patientsWithStatus);
    } catch (error) {
      console.error('Error:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const requestAccess = async (patient: Patient) => {
    try {
      setIsRequestingAccess(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Doctor authentication required');
        return;
      }

      // Check if there's already a pending request
      const { data: existingRequests } = await supabase
        .from('access_requests')
        .select('*')
        .eq('doctor_id', user.id)
        .eq('patient_id', patient.user_id)
        .eq('status', 'pending')
        .maybeSingle();

      if (existingRequests) {
        setError('Access request already pending for this patient');
        return;
      }

      // Create new access request
      const { error: requestError } = await supabase
        .from('access_requests')
        .insert({
          patient_id: patient.user_id,
          doctor_id: user.id,
          doctor_name: user.user_metadata?.name || 'Doctor',
          request_type: 'all',
          status: 'pending'
        });

      if (requestError) {
        console.error('Error creating access request:', requestError);
        setError('Failed to request access');
        return;
      }

      setSuccess('Access request sent successfully! The patient will be notified.');
      setSelectedPatient(patient);
      setShowOtpModal(true);
      
      // Refresh patient list
      await fetchPatients();
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to request access');
    } finally {
      setIsRequestingAccess(false);
    }
  };

  const verifyOtpAndAccess = async () => {
    try {
      if (!selectedPatient || !otp) {
        setError('Please enter the OTP');
        return;
      }

      // For demo purposes, accept any 6-digit OTP
      // In production, you would verify this against a real OTP system
      if (otp.length !== 6) {
        setError('Please enter a valid 6-digit OTP');
        return;
      }

      // Update access request to approved
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Doctor authentication required');
        return;
      }

      const { error: updateError } = await supabase
        .from('access_requests')
        .update({ status: 'approved' })
        .eq('doctor_id', user.id)
        .eq('patient_id', selectedPatient.user_id)
        .eq('status', 'pending');

      if (updateError) {
        console.error('Error approving access:', updateError);
        setError('Failed to verify OTP');
        return;
      }

      setSuccess('Access granted! You can now view the patient details.');
      setShowOtpModal(false);
      setOtp('');
      
      // Navigate to patient records
      setTimeout(() => {
        window.location.href = `/doctor/patient/${selectedPatient.user_id}`;
      }, 1500);
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to verify OTP');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Access Granted</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Pending</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">No Access</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Loading patients...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Patient Directory</h2>
          <p className="text-gray-600">Secure access to patient medical records</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Users className="h-4 w-4" />
          <span>{patients.length} Total Patients</span>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search patients by name or condition..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Patient List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date of Birth
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Condition
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Access Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <Users className="h-6 w-6 text-indigo-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                        <div className="text-sm text-gray-500">ID: {patient.user_id.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'Not specified'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {patient.condition || 'No condition specified'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(patient.access_status || 'none')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {patient.access_status === 'approved' ? (
                      <button
                        onClick={() => window.location.href = `/doctor/patient/${patient.user_id}`}
                        className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </button>
                    ) : (
                      <button
                        onClick={() => requestAccess(patient)}
                        disabled={isRequestingAccess || patient.access_status === 'pending'}
                        className="text-indigo-600 hover:text-indigo-900 inline-flex items-center disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        <Lock className="h-4 w-4 mr-1" />
                        {patient.access_status === 'pending' ? 'Pending' : 'Request Access'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredPatients.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
            <p className="text-gray-500">
              {searchTerm ? 'Try adjusting your search terms' : 'No patients have registered yet'}
            </p>
          </div>
        )}
      </div>

      {/* OTP Modal */}
      {showOtpModal && selectedPatient && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-indigo-100 rounded-full">
                <Lock className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 text-center mt-4">
                Verify Access Request
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 text-center">
                  Request sent to <strong>{selectedPatient.name}</strong>
                </p>
                <p className="text-sm text-gray-500 text-center mt-2">
                  Enter the 6-digit OTP provided by the patient:
                </p>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="mt-4 w-full px-3 py-2 border border-gray-300 rounded-md text-center text-lg font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={verifyOtpAndAccess}
                  disabled={otp.length !== 6}
                  className="px-4 py-2 bg-indigo-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Verify & Access Patient
                </button>
                <button
                  onClick={() => {
                    setShowOtpModal(false);
                    setOtp('');
                    setSelectedPatient(null);
                  }}
                  className="mt-3 px-4 py-2 bg-gray-100 text-gray-700 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientList;
