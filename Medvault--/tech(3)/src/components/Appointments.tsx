import { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, X, AlertCircle, CheckCircle } from 'lucide-react';
import ReactDatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

interface Appointment {
  id: string;
  doctor_id?: string;
  patient_id?: string;
  doctor_name: string;
  specialty: string;
  date: string;
  time: string;
  notes: string | null;
  status?: 'scheduled' | 'completed' | 'cancelled';
}

const Appointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    doctor_name: '',
    specialty: '',
    date: '',
    time: '',
    notes: ''
  });

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);

    try {
      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      // Try to fetch appointments from Supabase
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('patient_id', user.id)
          .order('date', { ascending: true });

        if (error) {
          console.error('Error fetching appointments from database:', error);
          
          // Fall back to localStorage
          const savedAppointments = localStorage.getItem('appointments');
          if (savedAppointments) {
            const parsedAppointments = JSON.parse(savedAppointments);
            setAppointments(parsedAppointments);
          } else {
            setAppointments([]);
          }
        } else {
          // Database fetch was successful
          setAppointments(data || []);
          
          // Update localStorage as backup
          if (data) {
            localStorage.setItem('appointments', JSON.stringify(data));
          }
        }
      } catch (err) {
        console.error('Database error:', err);
        
        // Fall back to localStorage
        const savedAppointments = localStorage.getItem('appointments');
        if (savedAppointments) {
          setAppointments(JSON.parse(savedAppointments));
        } else {
          setAppointments([]);
        }
      }
    } catch (err) {
      console.error('Error getting user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      setFormData({
        ...formData,
        date: date.toISOString().split('T')[0]
      });
    } else {
      setFormData({
        ...formData,
        date: ''
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Get the logged-in user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('You must be logged in to book appointments');
        setLoading(false);
        return;
      }
      
      // Create new appointment object
      const newAppointment: Appointment = {
        id: uuidv4(),
        patient_id: user.id,
        doctor_name: formData.doctor_name,
        specialty: formData.specialty,
        date: formData.date,
        time: formData.time,
        notes: formData.notes,
        status: 'scheduled'
      };
      
      // Try to save to Supabase
      try {
        const { error } = await supabase
          .from('appointments')
          .insert(newAppointment);
        
        if (error) {
          console.error('Supabase error:', error);
        }
      } catch (err) {
        console.error('Error saving to Supabase:', err);
      }
      
      // Update local state and localStorage regardless of Supabase result
      const updatedAppointments = [newAppointment, ...appointments];
      setAppointments(updatedAppointments);
      localStorage.setItem('appointments', JSON.stringify(updatedAppointments));
      
      // Reset form
      setFormData({
        doctor_name: '',
        specialty: '',
        date: '',
        time: '',
        notes: ''
      });
      setSelectedDate(null);
      setShowForm(false);
      setSuccess('Appointment booked successfully!');
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error booking appointment:', err);
      setError('Failed to book appointment');
    } finally {
      setLoading(false);
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
    <div className="bg-gradient-to-br from-indigo-500 via-purple-400 to-blue-500 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Appointments header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-white mr-3" />
            <h1 className="text-3xl font-bold text-white">Appointments</h1>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1 px-3 py-1.5 bg-white text-indigo-600 rounded-md hover:bg-indigo-50"
          >
            {showForm ? (
              <>
                <X size={16} />
                Cancel
              </>
            ) : (
              <>
                <Plus size={16} />
                Book New Appointment
              </>
            )}
          </button>
        </div>

        {/* Success and Error Messages */}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center text-green-700">
            <CheckCircle className="h-5 w-5 mr-2" />
            {success}
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center text-red-700">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        {/* Appointment Booking Form */}
        {showForm && (
          <div className="mb-8 bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Book New Appointment</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Name</label>
                  <input
                    type="text"
                    name="doctor_name"
                    value={formData.doctor_name}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
                  <select
                    name="specialty"
                    value={formData.specialty}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Specialty</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Psychiatry">Psychiatry</option>
                    <option value="General Medicine">General Medicine</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <ReactDatePicker
                    selected={selectedDate}
                    onChange={handleDateChange}
                    minDate={new Date()}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                    placeholderText="Select date"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <div className="relative">
                    <Clock className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="time"
                      name="time"
                      value={formData.time}
                      onChange={handleInputChange}
                      className="w-full p-2 pl-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Any specific concerns or information for the doctor..."
                ></textarea>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Booking...
                    </>
                  ) : (
                    'Book Appointment'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Appointments content - now with the same background as Medications */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Your Appointments</h2>
          
          {/* Rest of the appointments content */}
          {loading ? (
            <div className="p-6 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : appointments.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No appointments scheduled yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {appointments.map((appointment) => (
                <div key={appointment.id} className="p-6 hover:bg-gray-50">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="mb-4 md:mb-0">
                      <div className="flex items-center mb-2">
                        <div className={`w-3 h-3 rounded-full mr-2 ${
                          appointment.status === 'scheduled' ? 'bg-blue-500' :
                          appointment.status === 'completed' ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <span className="font-medium text-gray-900">{appointment.doctor_name}</span>
                        <span className="mx-2 text-gray-400">•</span>
                        <span className="text-gray-600">{appointment.specialty}</span>
                      </div>
                      <div className="flex items-center text-gray-500 text-sm">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{formatDate(appointment.date)}</span>
                        <span className="mx-2">•</span>
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{appointment.time}</span>
                      </div>
                      {appointment.notes && (
                        <p className="mt-2 text-sm text-gray-600">{appointment.notes}</p>
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
  );
};

export default Appointments;