import React, { useState, useEffect } from 'react';
import type { MedicalRecord } from '../types';
import CalendarIcon from './icons/CalendarIcon';
import StethoscopeIcon from './icons/StethoscopeIcon';
import XIcon from './icons/XIcon';
import TrashIcon from './icons/TrashIcon';
import PencilIcon from './icons/PencilIcon';

interface RecordDetailModalProps {
  record: MedicalRecord;
  onClose: () => void;
  onDeleteRequest: (record: MedicalRecord) => void;
  onEditRequest: (record: MedicalRecord) => void;
}

// Define category colors for visual indicators
const CATEGORY_COLORS: { [key: string]: string } = {
  'Consultation': 'bg-sky-400',
  'Procedure': 'bg-purple-400',
  'Prescription': 'bg-green-400',
  'Check-up': 'bg-teal-400',
  'Imaging': 'bg-amber-400',
  'Follow-up': 'bg-pink-400',
  'default': 'bg-slate-500'
};


const RecordDetailModal: React.FC<RecordDetailModalProps> = ({ record, onClose, onDeleteRequest, onEditRequest }) => {
  const [isClosing, setIsClosing] = useState(false);

  const categoryColor = CATEGORY_COLORS[record.category] || CATEGORY_COLORS['default'];

  const handleClose = () => {
    setIsClosing(true);
    // Wait for animation to finish before calling parent's onClose
    setTimeout(() => {
      onClose();
    }, 300); // Duration should match the animation duration
  };

  // Add keyboard listener for 'Escape' key to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // Empty dependency array means this effect runs once on mount

  const handleDelete = () => {
    onDeleteRequest(record);
  };

  const handleEdit = () => {
    onEditRequest(record);
  };

  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4 ${isClosing ? 'animate-backdrop-fade-out' : 'animate-backdrop-fade-in'}`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="record-modal-title"
    >
      <div 
        className={`bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 relative border border-slate-700 will-change-transform ${isClosing ? 'animate-modal-close' : 'animate-modal-open'}`}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <button 
          onClick={handleClose} 
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10"
          aria-label="Close record details"
        >
          <XIcon className="w-7 h-7" />
        </button>

        {/* Header */}
        <div className="border-b border-slate-700 pb-4 mb-6">
           <div className="flex items-baseline gap-3 flex-wrap mb-1">
             <h2 id="record-modal-title" className="text-3xl font-bold text-cyan-400">{record.diagnosis}</h2>
             <span
              className={`text-xs font-semibold px-3 py-1 rounded-full text-slate-900 ${categoryColor}`}
              title={`Category: ${record.category}`}
            >
              {record.category}
            </span>
           </div>
          <div className="flex items-center text-slate-400 text-sm">
            <CalendarIcon className="w-4 h-4 mr-2" />
            <span>{record.date}</span>
          </div>
        </div>

        {/* Doctor and Hospital Info */}
        <div className="flex items-center text-slate-200 mb-6 bg-slate-900/50 p-4 rounded-lg">
          <StethoscopeIcon className="w-8 h-8 mr-4 text-cyan-400 flex-shrink-0" />
          <div>
            <p className="font-bold text-lg">Dr. {record.doctorName}</p>
            <p className="text-slate-400">{record.hospital}</p>
          </div>
        </div>
        
        <div className="space-y-6">
          {/* Symptoms */}
          {record.symptoms.length > 0 && record.symptoms[0] !== "None" && (
            <div>
              <h3 className="text-xl font-semibold text-slate-100 mb-2">Symptoms Reported</h3>
              <div className="flex flex-wrap gap-2">
                {record.symptoms.map((symptom, index) => (
                  <span key={index} className="bg-slate-700 text-cyan-300 text-sm font-medium px-3 py-1.5 rounded-full">{symptom}</span>
                ))}
              </div>
            </div>
          )}

          {/* Treatment */}
          <div>
            <h3 className="text-xl font-semibold text-slate-100 mb-2">Treatment Plan & Prescription</h3>
            <p className="text-slate-300 bg-slate-700/50 p-4 rounded-lg whitespace-pre-wrap">{record.treatment}</p>
          </div>

          {/* Notes */}
          {record.notes && (
            <div>
              <h3 className="text-xl font-semibold text-slate-100 mb-2">Doctor's Notes</h3>
              <blockquote className="text-slate-400 italic border-l-4 border-cyan-500 pl-4 py-2 bg-slate-900/40 rounded-r-md">
                {record.notes}
              </blockquote>
            </div>
          )}
        </div>
        
        <div className="mt-8 pt-6 border-t border-slate-700 flex justify-between items-center">
            <button 
                onClick={handleDelete}
                className="flex items-center px-4 py-2 bg-red-600/20 text-red-400 font-semibold rounded-md hover:bg-red-600/40 hover:text-red-300 transition-colors"
            >
                <TrashIcon className="w-5 h-5 mr-2"/>
                Delete Record
            </button>
            <div className="flex items-center gap-4">
                 <button
                    onClick={handleEdit}
                    className="flex items-center px-4 py-2 bg-cyan-600 text-white font-semibold rounded-md hover:bg-cyan-500 transition-colors"
                >
                    <PencilIcon className="w-5 h-5 mr-2"/>
                    Edit Record
                </button>
                <button 
                    onClick={handleClose} 
                    className="px-6 py-2 bg-slate-600 text-white font-semibold rounded-md hover:bg-slate-500 transition-colors"
                >
                    Close
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default RecordDetailModal;
