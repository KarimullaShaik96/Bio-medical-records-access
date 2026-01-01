import React, { useState, useEffect, useCallback } from 'react';
import type { AIAnalysisResult } from '../types';
import XIcon from './icons/XIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import BrainCircuitIcon from './icons/BrainCircuitIcon';

interface AIAnalysisModalProps {
  onClose: () => void;
  isLoading: boolean;
  analysisResult: AIAnalysisResult | null;
  error: string | null;
  onCheckSpecificInteractions: (meds: string[]) => Promise<string>;
}

const AIAnalysisModal: React.FC<AIAnalysisModalProps> = ({ onClose, isLoading, analysisResult, error, onCheckSpecificInteractions }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [selectedMeds, setSelectedMeds] = useState<Set<string>>(new Set());
  const [isCheckingInteractions, setIsCheckingInteractions] = useState<boolean>(false);
  const [interactionCheckResult, setInteractionCheckResult] = useState<string | null>(null);
  const [interactionCheckError, setInteractionCheckError] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);
  
  const handleMedicationSelection = (med: string) => {
    setSelectedMeds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(med)) {
        newSet.delete(med);
      } else {
        newSet.add(med);
      }
      return newSet;
    });
  };
  
  const handleCheckInteractions = async () => {
    if (selectedMeds.size < 2) return;
    setIsCheckingInteractions(true);
    setInteractionCheckResult(null);
    setInteractionCheckError(null);
    try {
      const result = await onCheckSpecificInteractions(Array.from(selectedMeds));
      setInteractionCheckResult(result);
    } catch (err: any) {
      setInteractionCheckError(err.message || 'An unknown error occurred.');
    } finally {
      setIsCheckingInteractions(false);
    }
  };


  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleClose]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-8">
          <SpinnerIcon className="w-12 h-12 text-cyan-400" />
          <h3 className="text-xl font-semibold text-slate-100 mt-4">Analyzing Health Records...</h3>
          <p className="text-slate-400 mt-2">The AI is reviewing the patient's history to identify insights and potential interactions. This may take a moment.</p>
        </div>
      );
    }
    
    if (error) {
       return (
        <div className="text-center p-8">
            <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-full mx-auto flex items-center justify-center mb-4">
                <XIcon className="w-8 h-8"/>
            </div>
            <h3 className="text-xl font-semibold text-red-400">Analysis Failed</h3>
            <p className="text-slate-400 mt-2 bg-slate-700/50 p-3 rounded-md">{error}</p>
        </div>
       )
    }

    if (!analysisResult || (analysisResult.healthInsights.length === 0 && analysisResult.drugInteractions.length === 0 && analysisResult.uniqueMedications.length === 0)) {
        return (
             <div className="text-center p-8">
                <div className="w-16 h-16 bg-slate-700 text-slate-400 rounded-full mx-auto flex items-center justify-center mb-4">
                    <BrainCircuitIcon className="w-8 h-8"/>
                </div>
                <h3 className="text-xl font-semibold text-slate-100">No Specific Insights Found</h3>
                <p className="text-slate-400 mt-2">The AI analysis did not identify any specific health trends, potential drug interactions, or medications based on the provided records.</p>
            </div>
        )
    }

    return (
      <div className="space-y-8">
        {analysisResult.healthInsights.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold text-cyan-300 mb-3 border-b border-slate-700 pb-2">Health Insights</h3>
            <ul className="space-y-4">
              {analysisResult.healthInsights.map((item, index) => (
                <li key={index} className="bg-slate-900/50 p-4 rounded-lg">
                  <p className="text-slate-200">{item.insight}</p>
                  <p className="text-xs text-slate-400 mt-2"><strong>Evidence:</strong> {item.evidence.join(', ')}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
        {analysisResult.drugInteractions.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold text-amber-400 mb-3 border-b border-slate-700 pb-2">Potential Drug Interactions</h3>
            <ul className="space-y-4">
              {analysisResult.drugInteractions.map((item, index) => (
                <li key={index} className="bg-slate-900/50 p-4 rounded-lg border-l-4 border-amber-500">
                  <p className="font-semibold text-slate-200">Interaction between: {item.drugs.join(' and ')}</p>
                  <p className="text-slate-300 mt-1">{item.interaction}</p>
                  <p className="text-xs text-slate-400 mt-2"><strong>Source Records:</strong> {item.sourceRecords.join(', ')}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {analysisResult?.uniqueMedications && analysisResult.uniqueMedications.length > 0 && (
            <div>
                <h3 className="text-xl font-semibold text-green-400 mb-3 border-b border-slate-700 pb-2">Check Specific Drug Interactions</h3>
                <p className="text-sm text-slate-400 mb-4">Select two or more medications from the list below to check for potential interactions.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                    {analysisResult.uniqueMedications.map((med, index) => (
                        <label key={index} className="flex items-center space-x-2 bg-slate-700/50 p-2 rounded-md cursor-pointer hover:bg-slate-700 transition-colors">
                            <input
                                type="checkbox"
                                checked={selectedMeds.has(med)}
                                onChange={() => handleMedicationSelection(med)}
                                className="h-4 w-4 bg-slate-600 border-slate-500 rounded focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-700 focus:ring-green-500 accent-green-500"
                            />
                            <span className="text-slate-200">{med}</span>
                        </label>
                    ))}
                </div>
                <button
                    onClick={handleCheckInteractions}
                    disabled={selectedMeds.size < 2 || isCheckingInteractions}
                    className="flex items-center justify-center bg-green-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-green-500 transition-colors shadow-md shadow-green-600/20 disabled:bg-green-500/50 disabled:cursor-not-allowed"
                >
                    {isCheckingInteractions ? (
                        <>
                            <SpinnerIcon className="w-5 h-5 mr-2" />
                            Checking...
                        </>
                    ) : 'Check Selected for Interactions'}
                </button>

                <div className="mt-4">
                    {isCheckingInteractions && (
                        <div className="text-center p-4 bg-slate-900/50 rounded-lg">
                            <p className="text-slate-300">AI is analyzing interactions...</p>
                        </div>
                    )}
                    {interactionCheckError && (
                         <div className="p-4 bg-red-900/50 border border-red-500/50 text-red-300 rounded-lg">
                            <p className="font-semibold">Error</p>
                            <p>{interactionCheckError}</p>
                        </div>
                    )}
                    {interactionCheckResult && (
                        <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg whitespace-pre-wrap font-sans text-slate-300">
                            {interactionCheckResult}
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4 ${isClosing ? 'animate-backdrop-fade-out' : 'animate-backdrop-fade-in'}`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-analysis-title"
    >
      <div
        className={`bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col will-change-transform ${isClosing ? 'animate-modal-close' : 'animate-modal-open'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-6 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
          <div className="flex items-center">
            <BrainCircuitIcon className="w-7 h-7 mr-3 text-cyan-400" />
            <h2 id="ai-analysis-title" className="text-2xl font-bold text-cyan-400">AI Health Insights</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Close AI analysis"
          >
            <XIcon className="w-7 h-7" />
          </button>
        </header>

        <main className="p-6 flex-grow">
            {renderContent()}
        </main>
        
        <footer className="p-6 border-t border-slate-700 space-y-3">
             <div className="text-xs text-slate-500 italic text-center">
                <strong>Disclaimer:</strong> This is an AI-generated analysis and is for informational purposes only. It should not be considered a substitute for professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare professional regarding any medical concerns.
            </div>
            <div className="flex justify-end">
                <button
                onClick={handleClose}
                className="px-6 py-2 bg-slate-600 text-white font-semibold rounded-md hover:bg-slate-500 transition-colors"
                >
                Close
                </button>
            </div>
        </footer>
      </div>
    </div>
  );
};

export default AIAnalysisModal;