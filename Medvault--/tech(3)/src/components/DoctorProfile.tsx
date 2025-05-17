import { useState, useEffect } from 'react';
import { User, Mail, Phone, Award, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DoctorProfile {
  id?: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  experience: number;
  qualifications: string[];
  user_id?: string;
}

// Mock profile for when database isn't available
const MOCK_PROFILE: DoctorProfile = {
  id: 'mock-id',
  name: 'Dr. John Doe',
  email: 'john.doe@example.com',
  phone: '(555) 123-4567',
  specialization: 'Cardiology',
  experience: 10,
  qualifications: ['MD - Cardiology', 'Board Certified', 'Fellowship in Interventional Cardiology']
};

const DoctorProfile = () => {
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<DoctorProfile>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
          const { data, error } = await supabase
            .from('doctors')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (error) {
            // Check if it's a table does not exist error
            if (error.code === '42P01') {
              console.log('Doctors table does not exist, using mock data');
              // Use mock data instead
              const mockProfileWithEmail = {
                ...MOCK_PROFILE,
                email: user.email || MOCK_PROFILE.email,
                user_id: user.id
              };
              setProfile(mockProfileWithEmail);
              setEditForm(mockProfileWithEmail);
              setUseMockData(true);
              return;
            }
            throw error;
          }

          // If we get here, we have real data
          setProfile(data);
          setEditForm(data);
        } catch (error) {
          console.error('Error fetching from doctors table:', error);
          // Fallback to user metadata or mock data
          const userData = user.user_metadata || {};
          
          const profileData: DoctorProfile = {
            name: userData.name || user.email?.split('@')[0] || 'Doctor',
            email: user.email || '',
            phone: userData.phone || '',
            specialization: userData.specialization || 'General Practice',
            experience: userData.experience || 0,
            qualifications: userData.qualifications || [],
            user_id: user.id
          };
          
          setProfile(profileData);
          setEditForm(profileData);
          setUseMockData(true);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Failed to load profile. Please try again later.');
        setProfile(MOCK_PROFILE);
        setEditForm(MOCK_PROFILE);
        setUseMockData(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to update your profile');
        return;
      }

      // Always update the user metadata regardless of database state
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          name: editForm.name,
          specialization: editForm.specialization,
          phone: editForm.phone,
          experience: editForm.experience,
          qualifications: editForm.qualifications,
          role: 'doctor'
        }
      });

      if (metadataError) {
        console.error('Error updating user metadata:', metadataError);
        setError('Failed to update profile metadata. Please try again.');
        return;
      }

      // If we're not using mock data, also try to update the doctors table
      if (!useMockData) {
        try {
          const { error: dbError } = await supabase
            .from('doctors')
            .update({
              name: editForm.name,
              specialization: editForm.specialization,
              phone: editForm.phone,
              experience: editForm.experience,
              qualifications: editForm.qualifications
            })
            .eq('user_id', user.id);

          if (dbError) throw dbError;
        } catch (error) {
          console.error('Error updating profile in database:', error);
          // Not critical if this fails since we updated user metadata
        }
      }

      // Update local state
      setProfile(editForm as DoctorProfile);
      setIsEditing(false);
      setSuccess('Profile updated successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again later.');
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
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Doctor Profile</h1>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="space-x-2">
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditForm(profile || {});
                      setError(null);
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {useMockData && (
              <div className="bg-blue-50 p-3 rounded mb-6">
                <p className="text-sm text-blue-700">
                  You're using local profile storage. Updates will be saved to your account metadata.
                </p>
              </div>
            )}

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

            <div className="space-y-6">
              <div className="flex items-center">
                <User className="h-5 w-5 text-gray-400 mr-3" />
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Your name"
                  />
                ) : (
                  <span>{profile?.name}</span>
                )}
              </div>

              <div className="flex items-center">
                <Mail className="h-5 w-5 text-gray-400 mr-3" />
                <span>{profile?.email}</span>
              </div>

              <div className="flex items-center">
                <Phone className="h-5 w-5 text-gray-400 mr-3" />
                {isEditing ? (
                  <input
                    type="tel"
                    value={editForm.phone || ''}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Your phone number"
                  />
                ) : (
                  <span>{profile?.phone || 'Not provided'}</span>
                )}
              </div>

              <div className="flex items-center">
                <Award className="h-5 w-5 text-gray-400 mr-3" />
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.specialization || ''}
                    onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
                    className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Your specialization"
                  />
                ) : (
                  <span>{profile?.specialization || 'Not provided'}</span>
                )}
              </div>

              <div className="flex items-center">
                <Clock className="h-5 w-5 text-gray-400 mr-3" />
                {isEditing ? (
                  <input
                    type="number"
                    value={editForm.experience || ''}
                    onChange={(e) => setEditForm({ ...editForm, experience: parseInt(e.target.value) || 0 })}
                    className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Years of experience"
                    min="0"
                  />
                ) : (
                  <span>{(profile?.experience || 0) > 0 ? `${profile?.experience} years of experience` : 'Experience not provided'}</span>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-2">Qualifications</h3>
                {isEditing ? (
                  <textarea
                    value={(editForm.qualifications || []).join('\n')}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      qualifications: e.target.value.split('\n').filter(q => q.trim())
                    })}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter qualifications (one per line)"
                    rows={4}
                  />
                ) : (
                  profile?.qualifications && profile.qualifications.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1">
                      {profile.qualifications.map((qualification, index) => (
                        <li key={index}>{qualification}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">No qualifications listed</p>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
