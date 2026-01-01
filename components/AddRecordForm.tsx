import React, { useState, useEffect } from 'react';
import type { MedicalRecord } from '../types';

interface AddRecordFormProps {
  onSave: (record: MedicalRecord) => void;
  onCancel: () => void;
  recordToEdit?: MedicalRecord | null;
  initialData?: Partial<MedicalRecord> | null;
}

const CATEGORIES = ['Consultation', 'Procedure', 'Prescription', 'Check-up', 'Imaging', 'Follow-up'];


const AddRecordForm: React.FC<AddRecordFormProps> = ({ onSave, onCancel, recordToEdit, initialData }) => {
  const [doctorName, setDoctorName] = useState('');
  const [hospital, setHospital] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [treatment, setTreatment] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);

  useEffect(() => {
    if (recordToEdit) {
      setDoctorName(recordToEdit.doctorName);
      setHospital(recordToEdit.hospital);
      setDiagnosis(recordToEdit.diagnosis);
      setSymptoms(recordToEdit.symptoms.join(', '));
      setTreatment(recordToEdit.treatment);
      setNotes(recordToEdit.notes);
      setCategory(recordToEdit.category);
    } else if (initialData) {
      setDoctorName(initialData.doctorName || '');
      setHospital(initialData.hospital || '');
      setDiagnosis(initialData.diagnosis || '');
      setSymptoms((initialData.symptoms || []).join(', '));
      setTreatment(initialData.treatment || '');
      setNotes(initialData.notes || '');
      setCategory(initialData.category || CATEGORIES[0]);
    } else {
      // Reset form if opening for a new record
      setDoctorName('');
      setHospital('');
      setDiagnosis('');
      setSymptoms('');
      setTreatment('');
      setNotes('');
      setCategory(CATEGORIES[0]);
    }
  }, [recordToEdit, initialData]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorName || !diagnosis || !treatment) {
        alert("Please fill in Doctor's Name, Diagnosis, and Treatment.");
        return;
    }

    const recordData = {
        doctorName,
        hospital,
        diagnosis,
        symptoms: symptoms.split(',').map(s => s.trim()).filter(s => s),
        treatment,
        notes,
        category,
    };

    if (recordToEdit) {
        onSave({ ...recordData, id: recordToEdit.id, date: recordToEdit.date });
    } else {
        onSave({
            ...recordData,
            id: new Date().toISOString(),
            date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl p-6 relative animate-fade-in-up will-change-transform">
        <h2 className="text-2xl font-bold text-cyan-400 mb-6">{recordToEdit ? 'Edit Medical Record' : (initialData ? 'Confirm Scanned Record' : 'Add New Medical Record')}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Doctor's Name *</label>
              <input type="text" value={doctorName} onChange={(e) => setDoctorName(e.target.value)} className="w-full bg-slate-700 text-white border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Hospital/Clinic</label>
              <input type="text" value={hospital} onChange={(e) => setHospital(e.target.value)} className="w-full bg-slate-700 text-white border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none" />
            </div>
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Diagnosis *</label>
              <input type="text" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} className="w-full bg-slate-700 text-white border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none" required />
            </div>
             <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Category *</label>
               <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-slate-700 text-white border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none" required>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Symptoms (comma separated)</label>
            <input type="text" value={symptoms} onChange={(e) => setSymptoms(e.target.value)} className="w-full bg-slate-700 text-white border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Treatment/Prescription *</label>
            <textarea value={treatment} onChange={(e) => setTreatment(e.target.value)} rows={3} className="w-full bg-slate-700 text-white border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none" required></textarea>
          </div>
           <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Additional Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full bg-slate-700 text-white border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none"></textarea>
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-500 transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-cyan-600 text-white font-semibold rounded-md hover:bg-cyan-500 transition-colors">Save Record</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRecordForm;