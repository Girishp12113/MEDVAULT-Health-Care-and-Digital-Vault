import { useState } from 'react';
import { AlertCircle, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AccessRequestProps {
  id: string;
  doctorName: string;
  requestType: 'profile' | 'reports' | 'all';
  createdAt: string;
  onApprove: () => void;
  onReject: () => void;
}

const AccessRequestNotification = ({
  id,
  doctorName,
  requestType,
  createdAt,
  onApprove,
  onReject
}: AccessRequestProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [actionTaken, setActionTaken] = useState<'approved' | 'rejected' | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRequestTypeText = (type: string) => {
    switch (type) {
      case 'profile':
        return 'your profile';
      case 'reports':
        return 'your medical reports';
      case 'all':
        return 'your profile and medical reports';
      default:
        return 'your information';
    }
  };

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      await supabase
        .from('access_requests')
        .update({ status: 'approved' })
        .eq('id', id);
      
      setActionTaken('approved');
      onApprove();
    } catch (error) {
      console.error('Error approving request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      await supabase
        .from('access_requests')
        .update({ status: 'rejected' })
        .eq('id', id);
      
      setActionTaken('rejected');
      onReject();
    } catch (error) {
      console.error('Error rejecting request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (actionTaken) {
    return (
      <div className={`p-4 rounded-lg shadow-md ${actionTaken === 'approved' ? 'bg-green-50' : 'bg-red-50'}`}>
        <div className="flex items-center">
          {actionTaken === 'approved' ? (
            <Check className="h-5 w-5 text-green-500 mr-3" />
          ) : (
            <X className="h-5 w-5 text-red-500 mr-3" />
          )}
          <div>
            <p className="text-sm font-medium">
              {actionTaken === 'approved'
                ? `You have granted Dr. ${doctorName} access to ${getRequestTypeText(requestType)}.`
                : `You have denied Dr. ${doctorName} access to ${getRequestTypeText(requestType)}.`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-yellow-50 rounded-lg shadow-md">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3 flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Access Request</h3>
              <div className="mt-1 text-sm text-yellow-700">
                <p>Dr. {doctorName} is requesting access to {getRequestTypeText(requestType)}.</p>
                <p className="mt-1 text-xs text-yellow-600">Requested on {formatDate(createdAt)}</p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex space-x-3">
            <button
              type="button"
              disabled={isLoading}
              onClick={handleApprove}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Approve'}
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={handleReject}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Reject'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessRequestNotification;
