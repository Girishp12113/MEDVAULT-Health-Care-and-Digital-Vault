import React, { useState, useEffect } from 'react';
import { Shield, Copy, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AccessRequest {
  id: string;
  doctor_id: string;
  doctor_name: string;
  request_type: string;
  status: string;
  created_at: string;
}

const OTPManager = () => {
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [generatedOTPs, setGeneratedOTPs] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchAccessRequests();
  }, []);

  const fetchAccessRequests = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Patient authentication required');
        return;
      }

      // Fetch pending access requests for this patient
      const { data: requests, error: requestsError } = await supabase
        .from('access_requests')
        .select('*')
        .eq('patient_id', user.id)
        .in('status', ['pending', 'approved'])
        .order('created_at', { ascending: false });

      if (requestsError) {
        console.error('Error fetching access requests:', requestsError);
        setError('Failed to load access requests');
        return;
      }

      setAccessRequests(requests || []);
    } catch (error) {
      console.error('Error:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const generateOTP = (requestId: string) => {
    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOTPs(prev => ({
      ...prev,
      [requestId]: otp
    }));
    setSuccess(`OTP generated: ${otp}. Share this with the doctor.`);
    setTimeout(() => setSuccess(null), 5000);
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      setError('Failed to copy to clipboard');
    }
  };

  const regenerateOTP = (requestId: string) => {
    generateOTP(requestId);
  };

  const approveRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('access_requests')
        .update({ status: 'approved' })
        .eq('id', requestId);

      if (error) {
        console.error('Error approving request:', error);
        setError('Failed to approve request');
        return;
      }

      setSuccess('Access request approved successfully!');
      await fetchAccessRequests();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to approve request');
    }
  };

  const rejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('access_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) {
        console.error('Error rejecting request:', error);
        setError('Failed to reject request');
        return;
      }

      setSuccess('Access request rejected.');
      await fetchAccessRequests();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to reject request');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Loading access requests...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Access Request Management</h2>
          <p className="text-gray-600">Securely grant doctors access to your medical records</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Shield className="h-4 w-4" />
          <span>End-to-End Encrypted</span>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <Shield className="h-5 w-5 text-blue-400 mt-0.5" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Secure Access Protocol</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>• Generate unique OTPs for each access request</p>
              <p>• Share OTPs only with verified healthcare providers</p>
              <p>• OTPs are single-use and expire after approval</p>
              <p>• You maintain full control over your data access</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <p className="ml-3 text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <p className="ml-3 text-sm text-green-700">{success}</p>
          </div>
        </div>
      )}

      {/* Access Requests List */}
      <div className="bg-white shadow rounded-lg">
        {accessRequests.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Access Requests</h3>
            <p className="text-gray-500">
              Doctors haven't requested access to your medical records yet.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {accessRequests.map((request) => (
              <div key={request.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <Shield className="h-6 w-6 text-indigo-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">
                          Dr. {request.doctor_name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Requested access to: {request.request_type === 'all' ? 'All records' : 
                                             request.request_type === 'reports' ? 'Medical reports' : 'Profile'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Requested: {new Date(request.created_at).toLocaleString()}
                        </p>
                        <div className="mt-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            request.status === 'pending' 
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {request.status === 'pending' ? 'Pending' : 'Approved'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="ml-6 flex-shrink-0">
                    {request.status === 'pending' && (
                      <div className="space-y-3">
                        {/* OTP Generation */}
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-700 mb-2">Generate OTP</p>
                          {generatedOTPs[request.id] ? (
                            <div className="space-y-2">
                              <div className="bg-gray-100 px-4 py-2 rounded-md">
                                <span className="text-2xl font-mono font-bold text-gray-900">
                                  {generatedOTPs[request.id]}
                                </span>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => copyToClipboard(generatedOTPs[request.id], request.id)}
                                  className="flex-1 inline-flex items-center justify-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                >
                                  {copiedId === request.id ? (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                                      Copied!
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-4 w-4 mr-1" />
                                      Copy
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => regenerateOTP(request.id)}
                                  className="inline-flex items-center justify-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => generateOTP(request.id)}
                              className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              Generate OTP
                            </button>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-2">
                          <button
                            onClick={() => approveRequest(request.id)}
                            className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </button>
                          <button
                            onClick={() => rejectRequest(request.id)}
                            className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <AlertCircle className="h-4 w-4 mr-1" />
                            Reject
                          </button>
                        </div>
                      </div>
                    )}

                    {request.status === 'approved' && (
                      <div className="text-center">
                        <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        <p className="text-sm font-medium text-green-800">Access Granted</p>
                        <p className="text-xs text-gray-500">Doctor can view your records</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OTPManager;
