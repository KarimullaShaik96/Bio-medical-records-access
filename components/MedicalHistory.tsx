import React from 'react';
import type { MedicalRecord } from '../types';
import CalendarIcon from './icons/CalendarIcon';
import StethoscopeIcon from './icons/StethoscopeIcon';
import TrashIcon from './icons/TrashIcon';

interface MedicalHistoryProps {
  records: MedicalRecord[];
  onRecordSelect: (record: MedicalRecord) => void;
  onDeleteRequest: (record: MedicalRecord) => void;
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

const MedicalHistory: React.FC<MedicalHistoryProps> = ({ records, onRecordSelect, onDeleteRequest }) => {
  if (records.length === 0) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <p className="text-slate-400">No medical records found for your search.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {records.map((record, index) => {
        const categoryColor = CATEGORY_COLORS[record.category] || CATEGORY_COLORS['default'];

        return (
          <div
            key={record.id}
            className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700 transition-all duration-300 hover:border-cyan-500 hover:shadow-xl hover:shadow-cyan-500/20 hover:-translate-y-1 hover:scale-[1.02] cursor-pointer group relative animate-fade-in-up will-change-transform"
            style={{ animationDelay: `${index * 75}ms` }}
            onClick={() => onRecordSelect(record)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onRecordSelect(record);
            }}
            aria-label={`View details for diagnosis: ${record.diagnosis} on ${record.date}`}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteRequest(record);
              }}
              className="absolute top-4 right-4 text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 z-10 p-1 bg-slate-800/50 rounded-full"
              aria-label={`Delete record for ${record.diagnosis}`}
            >
              <TrashIcon className="w-5 h-5" />
            </button>
            <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-4">
              <div className="flex-grow pr-4">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-3 h-3 rounded-full ${categoryColor}`}
                    title={`Category: ${record.category}`}
                  ></div>
                  <span className="text-cyan-300 text-xs font-semibold uppercase tracking-wider">{record.category}</span>
                </div>
                <h3 className="text-2xl font-bold text-cyan-400 mb-1">{record.diagnosis}</h3>
                <p className="text-slate-400 text-sm line-clamp-1">
                  {record.treatment}
                </p>
              </div>
              <div className="flex items-center text-slate-400 text-sm mt-2 sm:mt-0 flex-shrink-0">
                <CalendarIcon className="w-4 h-4 mr-2" />
                <span>{record.date}</span>
              </div>
            </div>

            <div className="flex items-center text-slate-300">
              <StethoscopeIcon className="w-5 h-5 mr-3 text-cyan-400" />
              <p>
                <strong>Dr. {record.doctorName}</strong> at <span className="font-medium">{record.hospital}</span>
              </p>
            </div>

            <div className="text-right text-cyan-400 text-sm font-semibold mt-4">
              View Details &rarr;
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MedicalHistory;