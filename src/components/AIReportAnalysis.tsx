import { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Loader2, Upload, Plus, ChevronDown, ChevronUp, FileText, Clock, X } from 'lucide-react';

interface AnalysisResult {
  diagnosis: string;
  findings: string[];
  recommendations: string[];
}

interface SavedReport {
  id: string;
  fileName: string;
  date: string;
  result: AnalysisResult;
}

// Mock API response function for prototype demo
const mockAnalyzeReport = async (file: File): Promise<AnalysisResult> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Generate a more realistic response based on the file name
  const fileName = file.name.toLowerCase();
  
  if (fileName.includes('blood') || fileName.includes('cbc')) {
    return {
      diagnosis: "Normal Complete Blood Count (CBC) with mild vitamin D deficiency",
      findings: [
        "Hemoglobin: 14.2 g/dL (Normal range: 13.5-17.5 g/dL)",
        "White blood cells: 7,500/μL (Normal range: 4,500-11,000/μL)",
        "Platelets: 250,000/μL (Normal range: 150,000-400,000/μL)",
        "Vitamin D: 28 ng/mL (Slightly below normal range of 30-100 ng/mL)"
      ],
      recommendations: [
        "Consider vitamin D supplementation (1000-2000 IU daily)",
        "Maintain a balanced diet rich in iron and proteins",
        "Follow up in 6 months for routine blood work"
      ]
    };
  } else if (fileName.includes('xray') || fileName.includes('chest') || fileName.includes('lung')) {
    return {
      diagnosis: "Normal chest X-ray with no significant findings",
      findings: [
        "No evidence of active lung disease",
        "Heart size within normal limits",
        "No pleural effusion or pneumothorax",
        "Normal bony structures"
      ],
      recommendations: [
        "No follow-up imaging required",
        "Maintain annual physical examinations",
        "Consider pulmonary function tests if respiratory symptoms develop"
      ]
    };
  } else if (fileName.includes('mri') || fileName.includes('brain')) {
    return {
      diagnosis: "Normal brain MRI with minor age-related changes",
      findings: [
        "No evidence of acute infarction, mass, or hemorrhage",
        "Mild periventricular white matter changes consistent with age",
        "Ventricles and sulci are within normal limits for age",
        "No abnormal enhancement noted"
      ],
      recommendations: [
        "No urgent follow-up required",
        "Maintain blood pressure control",
        "Continue cognitive health activities"
      ]
    };
  } else {
    // Generic response for any other file
    return {
      diagnosis: "Preliminary analysis completed. Overall health indicators within normal parameters.",
      findings: [
        "All major indicators within normal reference ranges",
        "No critical abnormalities detected",
        "Some values are at the optimal end of the normal range",
        "Test quality is good with reliable results"
      ],
      recommendations: [
        "Maintain current health practices",
        "Follow up with your primary physician as scheduled",
        "Continue regular health screenings appropriate for your age and risk factors",
        "Consider discussing preventative health strategies at your next visit"
      ]
    };
  }
};

// Example saved reports
const MOCK_SAVED_REPORTS: SavedReport[] = [
  {
    id: '1',
    fileName: 'blood_test_march2025.pdf',
    date: '2025-03-15',
    result: {
      diagnosis: "Normal Complete Blood Count with mild anemia",
      findings: [
        "Hemoglobin: 12.8 g/dL (Slightly below normal range)",
        "White blood cells: 6,800/μL (Normal range)",
        "Platelets: 210,000/μL (Normal range)"
      ],
      recommendations: [
        "Iron supplements recommended",
        "Follow up in 3 months",
        "Increase intake of iron-rich foods"
      ]
    }
  },
  {
    id: '2',
    fileName: 'chest_xray_february2025.jpg',
    date: '2025-02-10',
    result: {
      diagnosis: "Healthy lung examination",
      findings: [
        "No evidence of pneumonia",
        "Heart size normal",
        "Lung fields clear",
        "No pleural effusion"
      ],
      recommendations: [
        "No further imaging needed",
        "Annual check-up recommended",
        "Continue good health practices"
      ]
    }
  }
];

export default function AIReportAnalysis() {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string>('');
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);

  useEffect(() => {
    // Load saved reports from localStorage or use mock data if none exist
    const storedReports = localStorage.getItem('savedMedicalReports');
    if (storedReports) {
      setSavedReports(JSON.parse(storedReports));
    } else {
      setSavedReports(MOCK_SAVED_REPORTS);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      setFile(acceptedFiles[0]);
      setResult(null);
      setError('');
    }
  });

  const analyzeReport = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setError('');

    try {
      // Use our mock analysis function instead of the API call
      const analysisResult = await mockAnalyzeReport(file);
      setResult(analysisResult);
    } catch (err) {
      setError('Failed to analyze the report. Please try again.');
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveReport = () => {
    if (!file || !result) return;
    
    const newReport: SavedReport = {
      id: Date.now().toString(),
      fileName: file.name,
      date: new Date().toISOString().split('T')[0],
      result: result
    };
    
    const updatedReports = [newReport, ...savedReports];
    setSavedReports(updatedReports);
    localStorage.setItem('savedMedicalReports', JSON.stringify(updatedReports));
    
    // Reset the form
    setFile(null);
    setResult(null);
    setShowAddForm(false);
  };

  const deleteReport = (id: string) => {
    const updatedReports = savedReports.filter(report => report.id !== id);
    setSavedReports(updatedReports);
    localStorage.setItem('savedMedicalReports', JSON.stringify(updatedReports));
  };

  const toggleReportExpansion = (id: string) => {
    if (expandedReport === id) {
      setExpandedReport(null);
    } else {
      setExpandedReport(id);
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
    <div className="max-w-4xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">AI Report Analysis</h2>
      
      {/* Saved Reports Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Your Medical Reports</h3>
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
        
        {savedReports.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No reports saved yet</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 mx-auto"
            >
              <Plus size={16} />
              Add Your First Report
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {savedReports.map(report => (
              <div key={report.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div 
                  className="p-4 cursor-pointer flex justify-between items-center"
                  onClick={() => toggleReportExpansion(report.id)}
                >
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-indigo-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-900">{report.fileName}</h4>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        <span>{formatDate(report.date)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteReport(report.id);
                      }}
                      className="text-red-500 mr-4 p-1 hover:bg-red-50 rounded"
                    >
                      <X size={16} />
                    </button>
                    {expandedReport === report.id ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                </div>
                
                {expandedReport === report.id && (
                  <div className="border-t p-4">
                    <div className="space-y-4">
                      <div className="p-3 bg-blue-50 rounded">
                        <h4 className="font-medium text-gray-800 mb-1">Diagnosis</h4>
                        <p className="text-sm text-gray-700">{report.result.diagnosis}</p>
                      </div>
                      
                      <div className="p-3 bg-indigo-50 rounded">
                        <h4 className="font-medium text-gray-800 mb-1">Key Findings</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {report.result.findings.map((finding, index) => (
                            <li key={index} className="text-sm text-gray-700">{finding}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="p-3 bg-purple-50 rounded">
                        <h4 className="font-medium text-gray-800 mb-1">Recommendations</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {report.result.recommendations.map((rec, index) => (
                            <li key={index} className="text-sm text-gray-700">{rec}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Add New Report Form */}
      {showAddForm && (
        <div className="border-t pt-6 mt-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Add New Report</h3>
          
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors bg-white
              ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">
              {isDragActive
                ? 'Drop your medical report here'
                : 'Drag and drop your medical report, or click to select'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Supported formats: PNG, JPG, PDF
            </p>
          </div>

          {file && (
            <div className="mt-6">
              <p className="text-sm text-gray-600">Selected file: {file.name}</p>
              <button
                onClick={analyzeReport}
                disabled={isAnalyzing}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 flex items-center justify-center"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze Report'
                )}
              </button>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {result && (
            <div>
              <div className="mt-6 p-6 bg-white rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Analysis Results</h3>
                
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-md">
                    <h4 className="font-semibold text-gray-800 mb-2">Diagnosis</h4>
                    <p className="text-gray-700">{result.diagnosis}</p>
                  </div>
                  
                  <div className="p-4 bg-indigo-50 rounded-md">
                    <h4 className="font-semibold text-gray-800 mb-2">Key Findings</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {result.findings.map((finding, index) => (
                        <li key={index} className="text-gray-700">{finding}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-md">
                    <h4 className="font-semibold text-gray-800 mb-2">Recommendations</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {result.recommendations.map((rec, index) => (
                        <li key={index} className="text-gray-700">{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={saveReport}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Save Report
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
