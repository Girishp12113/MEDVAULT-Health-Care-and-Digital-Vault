import { useState, useEffect, useRef } from 'react';
import { FileText, Plus, X, AlertCircle, CheckCircle, ChevronDown, ChevronUp, Download, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Report {
  id: string;
  title: string;
  doctor: string;
  date: string;
  category: string;
  notes: string;
  file_url?: string;
  file_name?: string;
}

const Reports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    doctor: '',
    date: '',
    category: '',
    notes: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [expandedReports, setExpandedReports] = useState<Record<string, boolean>>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      // Get the logged-in user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        try {
          // Try to fetch reports from Supabase first
          const { data, error } = await supabase
            .from('reports')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          
          if (error) {
            console.error('Supabase error:', error);
            // If there's an error with Supabase, fall back to localStorage
            const savedReports = localStorage.getItem('reports');
            if (savedReports) {
              setReports(JSON.parse(savedReports));
            } else {
              setReports([]);
            }
          } else {
            // If we have data from Supabase, use it
            setReports(data || []);
            
            // Also update localStorage as a backup
            if (data) {
              localStorage.setItem('reports', JSON.stringify(data));
            }
          }
        } catch (err) {
          console.error('Error fetching reports:', err);
          // Fall back to localStorage
          const savedReports = localStorage.getItem('reports');
          if (savedReports) {
            setReports(JSON.parse(savedReports));
          } else {
            setReports([]);
          }
        }
      } else {
        // Not logged in, use localStorage
        const savedReports = localStorage.getItem('reports');
        if (savedReports) {
          setReports(JSON.parse(savedReports));
        } else {
          setReports([]);
        }
      }
    } catch (err) {
      console.error('Error:', err);
      setErrorMessage('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select a file');
      return;
    }

    setLoading(true);
    
    try {
      // Convert file to base64 for storage
      const fileUrl = await convertFileToBase64(selectedFile);
      
      // Get the logged-in user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to add reports');
      }
      
      const reportToAdd = {
        id: Date.now().toString(),
        title: formData.title,
        doctor: formData.doctor,
        date: formData.date,
        category: formData.category,
        notes: formData.notes,
        file_url: fileUrl,
        file_name: selectedFile.name,
        user_id: user.id
      };
      
      // Try to save to Supabase first
      try {
        const { data, error } = await supabase
          .from('reports')
          .insert([{
            title: reportToAdd.title,
            doctor: reportToAdd.doctor,
            date: reportToAdd.date,
            category: reportToAdd.category,
            notes: reportToAdd.notes,
            file_url: reportToAdd.file_url,
            file_name: reportToAdd.file_name,
            user_id: user.id
          }])
          .select();
        
        if (error) {
          console.error('Supabase error:', error);
          // Fall back to localStorage if there's an error
          const updatedReports = [reportToAdd, ...reports];
          setReports(updatedReports);
          localStorage.setItem('reports', JSON.stringify(updatedReports));
        } else if (data) {
          // If save to Supabase was successful, update state with returned data
          const updatedReports = [data[0], ...reports];
          setReports(updatedReports);
          localStorage.setItem('reports', JSON.stringify(updatedReports));
        }
      } catch (err) {
        console.error('Error saving to Supabase:', err);
        // Fall back to localStorage
        const updatedReports = [reportToAdd, ...reports];
        setReports(updatedReports);
        localStorage.setItem('reports', JSON.stringify(updatedReports));
      }
      
      // Reset form
      setFormData({
        title: '',
        doctor: '',
        date: '',
        category: '',
        notes: ''
      });
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setShowAddForm(false);
      setSuccess('Report added successfully!');
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error adding report:', err);
      alert('Failed to add report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error('Failed to convert file'));
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleDeleteReport = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Try to delete from Supabase first
        try {
          const { error } = await supabase
            .from('reports')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);
          
          if (error) {
            console.error('Supabase delete error:', error);
          }
        } catch (err) {
          console.error('Error deleting from Supabase:', err);
        }
      }
      
      // Update local state and localStorage regardless of Supabase result
      const updatedReports = reports.filter(report => report.id !== id);
      setReports(updatedReports);
      localStorage.setItem('reports', JSON.stringify(updatedReports));
    } catch (err) {
      console.error('Error deleting report:', err);
      alert('Failed to delete report. Please try again.');
    }
  };

  const toggleReportExpand = (id: string) => {
    setExpandedReports(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const downloadReport = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-500 via-purple-400 to-blue-500 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-indigo-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Medical Reports</h1>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            {showAddForm ? (
              <>
                <X size={16} />
                Cancel
              </>
            ) : (
              <>
                <Plus size={16} />
                Add New Report
              </>
            )}
          </button>
        </div>

        {success && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Add Report Form - Hidden by Default */}
        {showAddForm && (
          <div className="bg-blue-50 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Add New Report</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Form fields remain the same */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Report Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Name</label>
                  <input
                    type="text"
                    name="doctor"
                    value={formData.doctor}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="Lab Test">Lab Test</option>
                    <option value="Imaging">Imaging</option>
                    <option value="Consultation">Consultation</option>
                    <option value="Surgery">Surgery</option>
                    <option value="Prescription">Prescription</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Additional information about the report..."
                ></textarea>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Report File (PDF, JPG, PNG)</label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
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
                      Saving...
                    </>
                  ) : (
                    'Save Report'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Reports List */}
        <div className="bg-white rounded-xl shadow-md card-enhanced">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800">Your Medical Reports</h2>
          </div>
          
          {loading ? (
            <div className="p-6 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : reports.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No medical reports found.</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-2 text-indigo-600 hover:text-indigo-800"
              >
                Add your first report
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {reports.map((report) => (
                <div key={report.id} className="p-6 hover:bg-gray-50">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="mb-4 md:mb-0">
                      <div className="flex items-center mb-2">
                        <button 
                          onClick={() => toggleReportExpand(report.id)}
                          className="mr-2 text-gray-400 hover:text-indigo-600"
                        >
                          {expandedReports[report.id] ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </button>
                        <span className="font-medium text-gray-900">{report.title}</span>
                        <span className="mx-2 text-gray-400">•</span>
                        <span className="text-gray-600">{report.category}</span>
                      </div>
                      <div className="flex items-center text-gray-500 text-sm">
                        <FileText className="h-4 w-4 mr-1" />
                        <span>Dr. {report.doctor}</span>
                        <span className="mx-2">•</span>
                        <span>{new Date(report.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {report.file_url && (
                        <button
                          onClick={() => downloadReport(report.file_url!, report.file_name || 'report')}
                          className="p-1 text-gray-400 hover:text-indigo-600"
                          title="Download report"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteReport(report.id)}
                        className="p-1 text-gray-400 hover:text-red-500"
                        title="Delete report"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  {expandedReports[report.id] && (
                    <div className="mt-4 pl-7 text-sm text-gray-600 border-l-2 border-indigo-100">
                      <p className="mb-2">{report.notes}</p>
                      {report.file_url && (
                        <button
                          onClick={() => downloadReport(report.file_url!, report.file_name || 'report')}
                          className="text-indigo-600 hover:text-indigo-800 flex items-center"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download report file
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;