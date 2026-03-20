import React, { useState, useEffect } from 'react';
import { Pill as Pills, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  notes: string;
}

const Medications = () => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [newMedication, setNewMedication] = useState<Omit<Medication, 'id'>>({
    name: '',
    dosage: '',
    frequency: '',
    startDate: '',
    notes: ''
  });
  // Explicitly set to false to ensure the form is hidden by default
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [expandedMedication, setExpandedMedication] = useState<string | null>(null);

  useEffect(() => {
    // Load medications from localStorage when component mounts
    const savedMedications = localStorage.getItem('medications');
    if (savedMedications) {
      setMedications(JSON.parse(savedMedications));
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewMedication(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const medicationToAdd = {
      ...newMedication,
      id: Date.now().toString()
    };
    
    const updatedMedications = [medicationToAdd, ...medications];
    setMedications(updatedMedications);
    
    // Save to localStorage
    localStorage.setItem('medications', JSON.stringify(updatedMedications));
    
    // Reset form and hide it
    setNewMedication({
      name: '',
      dosage: '',
      frequency: '',
      startDate: '',
      notes: ''
    });
    setShowAddForm(false);
  };

  const deleteMedication = (id: string) => {
    const updatedMedications = medications.filter(med => med.id !== id);
    setMedications(updatedMedications);
    localStorage.setItem('medications', JSON.stringify(updatedMedications));
  };

  const toggleMedicationExpansion = (id: string) => {
    if (expandedMedication === id) {
      setExpandedMedication(null);
    } else {
      setExpandedMedication(id);
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
          <Pills className="h-8 w-8 text-indigo-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">Medications</h1>
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
              Add New Medication
            </>
          )}
        </button>
      </div>

      {/* Saved Medications Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Your Medications</h2>
        
        {medications.length === 0 ? (
          <div className="text-center py-6">
            <Pills className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">No medications added yet</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-2 flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 mx-auto"
            >
              <Plus size={16} />
              Add Your First Medication
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {medications.map((med) => (
              <div key={med.id} className="border rounded-lg overflow-hidden">
                <div 
                  className="p-4 flex justify-between items-center bg-gray-50 cursor-pointer"
                  onClick={() => toggleMedicationExpansion(med.id)}
                >
                  <div className="flex items-center">
                    <Pills className="h-5 w-5 text-indigo-600 mr-2" />
                    <div>
                      <h3 className="font-medium text-gray-900">{med.name}</h3>
                      <p className="text-sm text-gray-600">{med.dosage} • {med.frequency}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMedication(med.id);
                      }}
                      className="text-red-500 p-1 hover:bg-red-50 rounded mr-2"
                    >
                      <X size={16} />
                    </button>
                    {expandedMedication === med.id ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                </div>
                
                {expandedMedication === med.id && (
                  <div className="p-4 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Dosage</p>
                        <p className="font-medium">{med.dosage}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Frequency</p>
                        <p className="font-medium">{med.frequency}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Start Date</p>
                        <p className="font-medium">{formatDate(med.startDate)}</p>
                      </div>
                      {med.notes && (
                        <div className="col-span-2">
                          <p className="text-sm text-gray-500">Notes</p>
                          <p className="font-medium">{med.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Medication Form - Hidden by Default */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Add New Medication</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Medication Name</label>
              <input
                type="text"
                name="name"
                value={newMedication.name}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Dosage</label>
              <input
                type="text"
                name="dosage"
                value={newMedication.dosage}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
                placeholder="e.g., 10mg, 1 tablet"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Frequency</label>
              <input
                type="text"
                name="frequency"
                value={newMedication.frequency}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
                placeholder="e.g., Once daily, Twice daily, Every 8 hours"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={newMedication.startDate}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                name="notes"
                value={newMedication.notes}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                rows={3}
                placeholder="Any special instructions or additional information"
              />
            </div>

            <button
              type="submit"
              className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Save Medication
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Medications;