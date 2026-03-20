import { useState, useEffect } from 'react';
import { Heart, TrendingUp, BarChart3, Thermometer, Plus, X, Calendar, Save, Activity, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface HealthMetric {
  id: string;
  date: string;
  time: string;
  heartRate?: number;
  systolic?: number;
  diastolic?: number;
  bloodSugar?: number;
  temperature?: number;
  notes?: string;
  user_id?: string;
}

const HealthMetrics = () => {
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMetric, setNewMetric] = useState<Omit<HealthMetric, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].substring(0, 5),
    heartRate: undefined,
    systolic: undefined,
    diastolic: undefined,
    bloodSugar: undefined,
    temperature: undefined,
    notes: ''
  });

  // Summary stats
  const [stats, setStats] = useState({
    averageHeartRate: 0,
    averageBloodPressure: { systolic: 0, diastolic: 0 },
    averageBloodSugar: 0,
    averageTemperature: 0
  });

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Try to get data from Supabase if available
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        try {
          const { data, error } = await supabase
            .from('health_metrics')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false });
              
          if (!error) {
            setMetrics(data || []);
            if (data && data.length > 0) {
              calculateStats(data);
              
              // Also update localStorage as backup
              localStorage.setItem('healthMetrics', JSON.stringify(data));
            }
          } else {
            console.error('Error fetching data from Supabase:', error);
            // Fall back to localStorage
            const savedMetrics = localStorage.getItem('healthMetrics');
            if (savedMetrics) {
              const parsedMetrics = JSON.parse(savedMetrics);
              setMetrics(parsedMetrics);
              calculateStats(parsedMetrics);
            } else {
              setMetrics([]);
            }
          }
        } catch (err) {
          console.error('Error fetching from Supabase:', err);
          // Fall back to localStorage
          const savedMetrics = localStorage.getItem('healthMetrics');
          if (savedMetrics) {
            const parsedMetrics = JSON.parse(savedMetrics);
            setMetrics(parsedMetrics);
            calculateStats(parsedMetrics);
          } else {
            setMetrics([]);
          }
        }
      } else {
        // Not logged in - check if we have localStorage data
        const savedMetrics = localStorage.getItem('healthMetrics');
        if (savedMetrics) {
          const parsedMetrics = JSON.parse(savedMetrics);
          setMetrics(parsedMetrics);
          calculateStats(parsedMetrics);
        } else {
          setMetrics([]);
        }
      }
    } catch (error) {
      console.error('Error in fetching health metrics:', error);
      setError('Failed to load health metrics');
      setMetrics([]);
    } finally {
      setLoading(false);
    }
  };
  
  const calculateStats = (data: HealthMetric[]) => {
    if (data.length === 0) {
      setStats({
        averageHeartRate: 0,
        averageBloodPressure: { systolic: 0, diastolic: 0 },
        averageBloodSugar: 0,
        averageTemperature: 0
      });
      return;
    }
    
    let totalHeartRate = 0;
    let countHeartRate = 0;
    let totalSystolic = 0;
    let totalDiastolic = 0;
    let countBloodPressure = 0;
    let totalBloodSugar = 0;
    let countBloodSugar = 0;
    let totalTemperature = 0;
    let countTemperature = 0;
    
    data.forEach(metric => {
      if (metric.heartRate) {
        totalHeartRate += metric.heartRate;
        countHeartRate++;
      }
      
      if (metric.systolic && metric.diastolic) {
        totalSystolic += metric.systolic;
        totalDiastolic += metric.diastolic;
        countBloodPressure++;
      }
      
      if (metric.bloodSugar) {
        totalBloodSugar += metric.bloodSugar;
        countBloodSugar++;
      }
      
      if (metric.temperature) {
        totalTemperature += metric.temperature;
        countTemperature++;
      }
    });
    
    setStats({
      averageHeartRate: countHeartRate > 0 ? Math.round(totalHeartRate / countHeartRate) : 0,
      averageBloodPressure: {
        systolic: countBloodPressure > 0 ? Math.round(totalSystolic / countBloodPressure) : 0,
        diastolic: countBloodPressure > 0 ? Math.round(totalDiastolic / countBloodPressure) : 0
      },
      averageBloodSugar: countBloodSugar > 0 ? Math.round(totalBloodSugar / countBloodSugar) : 0,
      averageTemperature: countTemperature > 0 ? parseFloat((totalTemperature / countTemperature).toFixed(1)) : 0
    });
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewMetric(prev => ({
      ...prev,
      [name]: name === 'notes' ? value : (value === '' ? undefined : 
        name === 'temperature' ? parseFloat(parseFloat(value).toFixed(1)) : parseInt(value))
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError("You must be logged in to add health metrics");
        return;
      }
      
      const metricToAdd: HealthMetric = {
        ...newMetric,
        id: Date.now().toString(),
        user_id: user.id
      };
      
      // Try to save to Supabase
      try {
        const { data, error } = await supabase
          .from('health_metrics')
          .insert([{
            date: metricToAdd.date,
            time: metricToAdd.time,
            heartRate: metricToAdd.heartRate,
            systolic: metricToAdd.systolic,
            diastolic: metricToAdd.diastolic,
            bloodSugar: metricToAdd.bloodSugar,
            temperature: metricToAdd.temperature,
            notes: metricToAdd.notes,
            user_id: user.id
          }])
          .select();
          
        if (error) {
          console.error('Error inserting into Supabase:', error);
          
          // Fall back to localStorage if Supabase fails
          const updatedMetrics = [metricToAdd, ...metrics];
          setMetrics(updatedMetrics);
          calculateStats(updatedMetrics);
          localStorage.setItem('healthMetrics', JSON.stringify(updatedMetrics));
        } else if (data) {
          // Use Supabase returned data with proper ID
          const updatedMetrics = [data[0], ...metrics];
          setMetrics(updatedMetrics);
          calculateStats(updatedMetrics);
          localStorage.setItem('healthMetrics', JSON.stringify(updatedMetrics));
        }
      } catch (err) {
        console.error('Error saving to Supabase:', err);
        
        // Fall back to localStorage
        const updatedMetrics = [metricToAdd, ...metrics];
        setMetrics(updatedMetrics);
        calculateStats(updatedMetrics);
        localStorage.setItem('healthMetrics', JSON.stringify(updatedMetrics));
      }
      
      // Reset form
      setNewMetric({
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0].substring(0, 5),
        heartRate: undefined,
        systolic: undefined,
        diastolic: undefined,
        bloodSugar: undefined,
        temperature: undefined,
        notes: ''
      });
      
      setShowAddForm(false);
    } catch (err) {
      console.error('Error adding health metric:', err);
      setError('Failed to save health metric');
    }
  };
  
  const handleDelete = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Try to delete from Supabase
        try {
          const { error } = await supabase
            .from('health_metrics')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);
            
          if (error) {
            console.error('Error deleting from Supabase:', error);
          }
        } catch (err) {
          console.error('Error with Supabase deletion:', err);
        }
      }
      
      // Update local state regardless of Supabase result
      const updatedMetrics = metrics.filter(metric => metric.id !== id);
      setMetrics(updatedMetrics);
      calculateStats(updatedMetrics);
      localStorage.setItem('healthMetrics', JSON.stringify(updatedMetrics));
    } catch (err) {
      console.error('Error deleting health metric:', err);
      setError('Failed to delete health metric');
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Activity className="h-8 w-8 text-indigo-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">Health Metrics</h1>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          {showAddForm ? <X /> : <Plus />}
          {showAddForm ? 'Cancel' : 'Add New Reading'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Health Summary Card */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-xl font-semibold flex items-center text-gray-800">
            <Activity className="h-5 w-5 text-indigo-600 mr-2" />
            Your Health Summary
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-100">
          <div className="p-5 flex flex-col items-center">
            <Heart className="h-8 w-8 text-red-500 mb-2" />
            <p className="text-gray-500 text-sm">Heart Rate</p>
            <p className="text-2xl font-semibold">{stats.averageHeartRate || '-'}</p>
            <p className="text-xs text-gray-400">BPM</p>
          </div>
          <div className="p-5 flex flex-col items-center">
            <TrendingUp className="h-8 w-8 text-blue-500 mb-2" />
            <p className="text-gray-500 text-sm">Blood Pressure</p>
            <p className="text-2xl font-semibold">
              {stats.averageBloodPressure.systolic ? 
                `${stats.averageBloodPressure.systolic}/${stats.averageBloodPressure.diastolic}` : 
                '-'}
            </p>
            <p className="text-xs text-gray-400">mmHg</p>
          </div>
          <div className="p-5 flex flex-col items-center">
            <BarChart3 className="h-8 w-8 text-green-500 mb-2" />
            <p className="text-gray-500 text-sm">Blood Sugar</p>
            <p className="text-2xl font-semibold">{stats.averageBloodSugar || '-'}</p>
            <p className="text-xs text-gray-400">mg/dL</p>
          </div>
          <div className="p-5 flex flex-col items-center">
            <Thermometer className="h-8 w-8 text-orange-500 mb-2" />
            <p className="text-gray-500 text-sm">Temperature</p>
            <p className="text-2xl font-semibold">{stats.averageTemperature || '-'}</p>
            <p className="text-xs text-gray-400">°C</p>
          </div>
        </div>
      </div>

      {/* Add Metric Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Add New Health Reading</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  name="date"
                  value={newMetric.date}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input
                  type="time"
                  name="time"
                  value={newMetric.time}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Heart Rate (BPM)</label>
                <input
                  type="number"
                  name="heartRate"
                  value={newMetric.heartRate || ''}
                  onChange={handleInputChange}
                  placeholder="60-100"
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Blood Pressure (Systolic)</label>
                <input
                  type="number"
                  name="systolic"
                  value={newMetric.systolic || ''}
                  onChange={handleInputChange}
                  placeholder="90-140"
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Blood Pressure (Diastolic)</label>
                <input
                  type="number"
                  name="diastolic"
                  value={newMetric.diastolic || ''}
                  onChange={handleInputChange}
                  placeholder="60-90"
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Blood Sugar (mg/dL)</label>
                <input
                  type="number"
                  name="bloodSugar"
                  value={newMetric.bloodSugar || ''}
                  onChange={handleInputChange}
                  placeholder="70-140"
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temperature (°C)</label>
                <input
                  type="number"
                  name="temperature"
                  value={newMetric.temperature || ''}
                  onChange={handleInputChange}
                  placeholder="36.5-37.5"
                  className="w-full p-2 border rounded-md"
                  step="0.1"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                name="notes"
                value={newMetric.notes}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
                placeholder="Any additional observations..."
                rows={3}
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 mr-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Reading
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Health Readings List */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">Your Health Readings</h2>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : metrics.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-gray-500 mb-2">No health readings recorded yet</h3>
            <p className="text-gray-400 mb-4 max-w-md mx-auto">
              Start tracking your health metrics to see your data here.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Add Your First Reading
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {metrics.map(metric => (
              <div key={metric.id} className="p-4 hover:bg-gray-50">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center mb-2 md:mb-0">
                    <Calendar className="h-5 w-5 text-indigo-600 mr-2" />
                    <div>
                      <span className="font-medium">{formatDate(metric.date)}</span>
                      <span className="mx-2 text-gray-400">•</span>
                      <span className="text-gray-600">{metric.time}</span>
                    </div>
                  </div>
                  
                  <div className="flex md:space-x-8 mt-2 md:mt-0 flex-wrap gap-y-2">
                    {metric.heartRate && (
                      <div className="flex items-center mr-4">
                        <Heart className="h-4 w-4 text-red-500 mr-1" />
                        <span className="text-sm">
                          <span className="font-medium">{metric.heartRate}</span> bpm
                        </span>
                      </div>
                    )}
                    
                    {metric.systolic && metric.diastolic && (
                      <div className="flex items-center mr-4">
                        <TrendingUp className="h-4 w-4 text-blue-500 mr-1" />
                        <span className="text-sm">
                          <span className="font-medium">{metric.systolic}/{metric.diastolic}</span> mmHg
                        </span>
                      </div>
                    )}
                    
                    {metric.bloodSugar && (
                      <div className="flex items-center mr-4">
                        <BarChart3 className="h-4 w-4 text-green-500 mr-1" />
                        <span className="text-sm">
                          <span className="font-medium">{metric.bloodSugar}</span> mg/dL
                        </span>
                      </div>
                    )}
                    
                    {metric.temperature && (
                      <div className="flex items-center mr-4">
                        <Thermometer className="h-4 w-4 text-orange-500 mr-1" />
                        <span className="text-sm">
                          <span className="font-medium">{metric.temperature}</span> °C
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleDelete(metric.id)}
                    className="mt-2 md:mt-0 text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                    aria-label="Delete"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                {metric.notes && (
                  <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    {metric.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthMetrics;
