import { useState, useEffect } from 'react';
import { Activity, User, Calendar, FileText, Clock, ChevronRight, Check, AlertTriangle, Heart, Pill, BarChart3, TrendingUp, Thermometer, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface Appointment {
  id: string;
  date: string;
  time: string;
  doctor_name?: string;
  status?: string;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  bloodGroup?: string;
}

const Dashboard = () => {
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [profile, setProfile] = useState<UserProfile>({ firstName: '', lastName: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [healthMetrics, setHealthMetrics] = useState({
    heartRate: 0,
    bloodPressure: '-/-',
    bloodSugar: 0,
    temperature: '0.0',
  });
  
  const healthTips = [
    "Stay hydrated by drinking at least 8 glasses of water daily",
    "Try to get 7-8 hours of sleep each night for optimal health",
    "Incorporate at least 30 minutes of physical activity into your daily routine",
    "Add more colorful vegetables to your diet for essential nutrients",
    "Practice mindfulness or meditation to reduce stress levels",
    "Limit processed foods and added sugars in your diet"
  ];
  
  const [randomTip] = useState(healthTips[Math.floor(Math.random() * healthTips.length)]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        
        // Get user auth data
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }
        
        // Get user profile data from metadata
        const metadata = user.user_metadata;
        if (metadata?.profileData) {
          setProfile({
            firstName: metadata.profileData.firstName || '',
            lastName: metadata.profileData.lastName || '',
            dateOfBirth: metadata.profileData.dateOfBirth,
            bloodGroup: metadata.profileData.bloodGroup
          });
        }
        
        // Try to fetch health metrics from localStorage
        try {
          const savedHealthMetrics = localStorage.getItem('healthMetrics');
          if (savedHealthMetrics) {
            const metrics = JSON.parse(savedHealthMetrics);
            if (metrics.length > 0) {
              // Use most recent entry
              const latestMetric = metrics[0];
              setHealthMetrics({
                heartRate: latestMetric.heartRate || 0,
                bloodPressure: latestMetric.systolic && latestMetric.diastolic ? 
                  `${latestMetric.systolic}/${latestMetric.diastolic}` : '-/-',
                bloodSugar: latestMetric.bloodSugar || 0,
                temperature: latestMetric.temperature ? latestMetric.temperature.toString() : '0.0',
              });
            }
          }
        } catch (e) {
          console.error('Error parsing health metrics:', e);
        }
        
        // Try to fetch appointments from database
        try {
          const { data: appointmentsData, error } = await supabase
            .from('appointments')
            .select('*')
            .eq('patient_id', user.id)
            .eq('status', 'scheduled')
            .order('date', { ascending: true })
            .limit(3);
            
          if (!error && appointmentsData) {
            setUpcomingAppointments(appointmentsData);
          } else {
            // No demo data - just set empty array
            setUpcomingAppointments([]);
            console.log('No appointments found or error fetching appointments');
            
            // Try to load appointments from localStorage as fallback
            try {
              const localAppointments = localStorage.getItem('appointments');
              if (localAppointments) {
                const parsedAppointments = JSON.parse(localAppointments);
                if (Array.isArray(parsedAppointments) && parsedAppointments.length > 0) {
                  // Filter for upcoming appointments and sort by date
                  const today = new Date().toISOString().split('T')[0];
                  const upcoming = parsedAppointments
                    .filter(app => app.date >= today && (app.status !== 'cancelled'))
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .slice(0, 3);
                  
                  setUpcomingAppointments(upcoming);
                }
              }
            } catch (e) {
              console.error('Error parsing local appointments:', e);
            }
          }
        } catch (err) {
          console.error('Error fetching appointments:', err);
          setUpcomingAppointments([]);
        }
        
        // Check if we have any saved medical reports
        try {
          const savedReports = localStorage.getItem('reports');
          if (savedReports) {
            const parsedReports = JSON.parse(savedReports);
            setRecentReports(parsedReports.slice(0, 3)); // Get top 3 reports
          } else {
            // No demo data - just set empty array
            setRecentReports([]);
          }
        } catch (e) {
          console.error('Error parsing reports:', e);
          setRecentReports([]);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, []); // Removed dependency to prevent re-render issues
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const calculateAge = (birthDateString?: string) => {
    if (!birthDateString) return null;
    
    const birthDate = new Date(birthDateString);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
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

  return (
    <div className="bg-gradient-to-br from-indigo-500 via-purple-400 to-blue-500 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Dashboard content */}
        <div className="dashboard-header text-white">
          <div className="flex items-center">
            <div className="bg-white/20 p-3 rounded-full">
              <User className="h-10 w-10" />
            </div>
            <div className="ml-4">
              <h1 className="text-3xl font-bold">
                Welcome, {profile.firstName || 'Patient'}
              </h1>
              <p className="text-indigo-100">
                {profile.dateOfBirth && `${calculateAge(profile.dateOfBirth)} years old`}
                {profile.bloodGroup && ` • Blood Type: ${profile.bloodGroup}`}
                {!profile.dateOfBirth && !profile.bloodGroup && 'Complete your profile for personalized care'}
              </p>
            </div>
          </div>
        </div>

        {/* Health Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="health-metric-card flex items-center">
            <div className="p-3 bg-red-50 rounded-full mr-4">
              <Heart className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Heart Rate</p>
              <p className="text-2xl font-semibold">{healthMetrics.heartRate || '-'}</p>
              <p className="text-xs text-gray-400">BPM</p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 flex items-center">
            <div className="p-3 bg-blue-50 rounded-full mr-4">
              <TrendingUp className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Blood Pressure</p>
              <p className="text-2xl font-semibold">{healthMetrics.bloodPressure}</p>
              <p className="text-xs text-gray-400">mmHg</p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 flex items-center">
            <div className="p-3 bg-green-50 rounded-full mr-4">
              <BarChart3 className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Blood Sugar</p>
              <p className="text-2xl font-semibold">{healthMetrics.bloodSugar || '-'}</p>
              <p className="text-xs text-gray-400">mg/dL</p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 flex items-center">
            <div className="p-3 bg-orange-50 rounded-full mr-4">
              <Thermometer className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Temperature</p>
              <p className="text-2xl font-semibold">{healthMetrics.temperature}</p>
              <p className="text-xs text-gray-400">°C</p>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Quick Access Cards */}
          <div className="lg:col-span-1">
            <div className="glass-card overflow-hidden">
              <div className="p-4 bg-indigo-600 text-white">
                <h2 className="font-semibold text-lg">Quick Access</h2>
              </div>
              <div className="divide-y divide-gray-100">
                <Link to="/appointments" className="flex items-center justify-between p-4 hover:bg-gray-50">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-indigo-600 mr-3" />
                    <span>Appointments</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Link>
                <Link to="/reports" className="flex items-center justify-between p-4 hover:bg-gray-50">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-indigo-600 mr-3" />
                    <span>Medical Reports</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Link>
                <Link to="/medications" className="flex items-center justify-between p-4 hover:bg-gray-50">
                  <div className="flex items-center">
                    <Pill className="h-5 w-5 text-indigo-600 mr-3" />
                    <span>Medications</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Link>
                <Link to="/health-metrics" className="flex items-center justify-between p-4 hover:bg-gray-50">
                  <div className="flex items-center">
                    <Activity className="h-5 w-5 text-indigo-600 mr-3" />
                    <span>Health Metrics</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Link>
                <Link to="/ai-analysis" className="flex items-center justify-between p-4 hover:bg-gray-50">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-indigo-600 mr-3" />
                    <span>AI Report Analysis</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Link>
              </div>
            </div>
            
            {/* Health Tip Card */}
            <div className="bg-white rounded-xl shadow-md p-6 mt-6">
              <div className="flex items-center mb-4">
                <Award className="h-6 w-6 text-amber-500 mr-2" />
                <h2 className="font-semibold text-lg">Health Tip of the Day</h2>
              </div>
              <p className="text-gray-600 italic">"{randomTip}"</p>
            </div>
          </div>
          
          {/* Appointments Card */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-blue card-enhanced p-6 rounded-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Upcoming Appointments</h2>
                <Link to="/appointments" className="text-sm text-indigo-600 hover:text-indigo-800">View All</Link>
              </div>
              <div className="p-4 bg-indigo-600 text-white flex justify-between items-center">
                <h2 className="font-semibold text-lg">Upcoming Appointments</h2>
                <Link to="/appointments" className="text-xs text-indigo-100 hover:text-white">
                  View All
                </Link>
              </div>
              
              <div className="p-4">
                {upcomingAppointments.length === 0 ? (
                  <div className="text-center py-6">
                    <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No upcoming appointments</p>
                    <Link to="/appointments" className="mt-2 inline-block text-sm text-indigo-600 hover:underline">
                      Schedule an appointment
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingAppointments.map((appointment) => (
                      <div key={appointment.id} className="border border-gray-100 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{appointment.doctor_name || 'Doctor'}</p>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <Calendar className="h-3 w-3 mr-1" />
                              <span>{formatDate(appointment.date)}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>{appointment.time}</span>
                            </div>
                          </div>
                          <div className="flex items-center">
                            {appointment.status === 'scheduled' && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                <Clock className="h-3 w-3 mr-1" />
                                Scheduled
                              </span>
                            )}
                            {appointment.status === 'completed' && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                <Check className="h-3 w-3 mr-1" />
                                Completed
                              </span>
                            )}
                            {appointment.status === 'cancelled' && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Cancelled
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Recent Reports Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md h-full">
              <div className="p-4 bg-indigo-600 text-white flex justify-between items-center">
                <h2 className="font-semibold text-lg">Recent Medical Reports</h2>
                <Link to="/reports" className="text-xs text-indigo-100 hover:text-white">
                  View All
                </Link>
              </div>
              
              <div className="p-4">
                {recentReports.length === 0 ? (
                  <div className="text-center py-6">
                    <FileText className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No reports available</p>
                    <Link to="/reports" className="mt-2 inline-block text-sm text-indigo-600 hover:underline">
                      Upload your first report
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentReports.map((report) => (
                      <div key={report.id} className="border border-gray-100 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{report.name || report.fileName}</p>
                            <p className="text-sm text-gray-500 mt-1">{report.type || 'Medical Report'}</p>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <Calendar className="h-3 w-3 mr-1" />
                              <span>{formatDate(report.date)}</span>
                            </div>
                          </div>
                          <Link to="/reports" className="text-indigo-600 hover:text-indigo-800">
                            <FileText className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;