import React, { useState, useEffect } from 'react';
import { User, Save, Edit2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ProfileData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  email: string;
  phone: string;
  address: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  medicalConditions: string;
  allergies: string;
}

const ProfileSimple = () => {
  console.log('ProfileSimple component rendering...');
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [componentError, setComponentError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    email: '',
    phone: '',
    address: '',
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    },
    medicalConditions: '',
    allergies: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    console.log('ProfileSimple useEffect running...');
    
    const loadProfile = async () => {
      try {
        console.log('Starting profile load...');
        setComponentError(null);
        
        // Test basic Supabase connection
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        console.log('User data:', user, 'Error:', userError);
        
        if (!user) {
          console.log('No user found, creating default profile...');
          setProfile(prev => ({
            ...prev,
            email: 'test@example.com'
          }));
          setIsLoading(false);
          return;
        }

        // Create basic profile with user email
        setProfile(prev => ({
          ...prev,
          email: user.email || 'user@example.com'
        }));
        setIsLoading(false);
        
      } catch (error) {
        console.error('Error in profile load:', error);
        setComponentError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('emergency')) {
      const field = name.split('.')[1];
      setProfile(prev => ({
        ...prev,
        emergencyContact: {
          ...prev.emergencyContact,
          [field]: value
        }
      }));
    } else {
      setProfile(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      // Save to local storage
      localStorage.setItem('userProfile', JSON.stringify(profile));
      setSuccess('Profile saved successfully!');
      setIsEditing(false);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('There was a problem saving your profile. Please try again.');
    }
  };

  // Show loading spinner while loading
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-gray-600">Loading profile...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-8">
          {componentError && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{componentError}</p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="mt-2 text-xs text-red-600 underline hover:text-red-800"
                  >
                    Reload Page
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <User className="h-6 w-6 text-indigo-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Patient Profile</h1>
            </div>
            <button
              onClick={isEditing ? handleSubmit : () => setIsEditing(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isEditing ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              ) : (
                <>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Profile
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={profile.firstName}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={profile.email}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="mr-3 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileSimple;
