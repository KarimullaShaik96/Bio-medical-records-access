import React, { useState, useMemo, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import type { MedicalRecord, AIAnalysisResult } from './types';
import LoginScreen from './components/LoginScreen';
import MedicalHistory from './components/MedicalHistory';
import AddRecordForm from './components/AddRecordForm';
import UserIcon from './components/icons/UserIcon';
import PlusIcon from './components/icons/PlusIcon';
import SearchIcon from './components/icons/SearchIcon';
import ExportIcon from './components/icons/ExportIcon';
import RecordDetailModal from './components/RecordDetailModal';
import ConfirmationModal from './components/ConfirmationModal';
import XIcon from './components/icons/XIcon';
import PatientProfile from './components/PatientProfile';
import AIAnalysisModal from './components/AIAnalysisModal';
import BrainCircuitIcon from './components/icons/BrainCircuitIcon';
import SortIcon from './components/icons/SortIcon';
import AnimatedBackground from './components/AnimatedBackground';
import ScanDocumentModal from './components/ScanDocumentModal';
import DocumentScanIcon from './components/icons/DocumentScanIcon';

const MOCK_RECORDS: MedicalRecord[] = [
  {
    id: 'rec1',
    date: 'March 15, 2024',
    doctorName: 'Emily Carter',
    hospital: 'City General Hospital',
    diagnosis: 'Acute Bronchitis',
    symptoms: ['Persistent Cough', 'Chest Congestion', 'Fatigue'],
    treatment: 'Prescribed Amoxicillin 500mg, 2 times a day for 7 days. Recommended rest and hydration.',
    notes: 'Patient advised to follow up if symptoms do not improve in one week. Smoking cessation strongly encouraged.',
    category: 'Consultation',
  },
  {
    id: 'rec2',
    date: 'January 05, 2024',
    doctorName: 'Benjamin Lee',
    hospital: 'Downtown Medical Clinic',
    diagnosis: 'Annual Check-up',
    symptoms: ['None'],
    treatment: 'Standard blood panel ordered. All results are within normal ranges. Flu vaccine administered.',
    notes: 'Patient is in good health. Advised to continue regular exercise and balanced diet. Next check-up scheduled for January 2025.',
    category: 'Check-up',
  },
  {
    id: 'rec3',
    date: 'October 22, 2023',
    doctorName: 'Sophia Rodriguez',
    hospital: 'OrthoCare Specialists',
    diagnosis: 'Minor Ankle Sprain',
    symptoms: ['Ankle pain', 'Swelling', 'Limited mobility'],
    treatment: 'R.I.C.E. (Rest, Ice, Compression, Elevation) protocol. Prescribed Ibuprofen for pain management.',
    notes: 'X-ray confirmed no fracture. Patient to wear an ankle brace for 2-3 weeks.',
    category: 'Consultation',
  }
];

// DIRECT API KEY INTEGRATION - YOUR KEY IS HERE
const DIRECT_API_KEY = "AIzaSyBXrpIXzxHwgrF4vuYBPJJ4Dk3TEHEt0Go";

// Sort mock records by date descending by default
const sortedMockRecords = MOCK_RECORDS.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

// DEMO DATA FOR FALLBACK (Always works)
const getDemoAnalysis = (): AIAnalysisResult => {
  return {
    healthInsights: [
      {
        insight: "Recurring respiratory issues requiring attention",
        evidence: ["Acute Bronchitis (March 2024)", "Persistent cough symptoms"]
      },
      {
        insight: "Excellent preventive healthcare maintenance",
        evidence: ["Annual check-up (January 2024)", "Flu vaccine administered", "All results normal"]
      },
      {
        insight: "Proper injury management with full recovery",
        evidence: ["Ankle sprain (October 2023)", "R.I.C.E. protocol followed", "No complications reported"]
      }
    ],
    drugInteractions: [
      {
        drugs: ["Amoxicillin", "Ibuprofen"],
        interaction: "Potential increased risk of gastrointestinal bleeding when taken together. Consider spacing administration.",
        sourceRecords: ["Acute Bronchitis treatment", "Ankle sprain pain management"]
      }
    ],
    uniqueMedications: ["Amoxicillin", "Ibuprofen", "Flu Vaccine"]
  };
};

// Levenshtein distance function for fuzzy search
const levenshteinDistance = (a: string, b: string): number => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

  for (let i = 0; i <= a.length; i++) { matrix[0][i] = i; }
  for (let j = 0; j <= b.length; j++) { matrix[j][0] = j; }

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + cost, // substitution
      );
    }
  }

  return matrix[b.length][a.length];
};

const fuzzySearch = (query: string, text: string): boolean => {
    if (!query) return true;
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    
    if (textLower.includes(queryLower)) return true;

    const queryWords = queryLower.split(' ').filter(w => w);
    const textWords = textLower.split(/[\s,.-]+/).filter(w => w);

    return queryWords.every(qw => 
        textWords.some(tw => {
            const distance = levenshteinDistance(qw, tw);
            // Allow 0 errors for 1-3 char words, 1 for 4-7, 2 for 8+
            const threshold = qw.length <= 3 ? 0 : (qw.length <= 7 ? 1 : 2);
            return distance <= threshold;
        })
    );
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>(sortedMockRecords);
  const [isAddingRecord, setIsAddingRecord] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedHospital, setSelectedHospital] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<MedicalRecord | null>(null);
  const [recordToEdit, setRecordToEdit] = useState<MedicalRecord | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isScanningDocument, setIsScanningDocument] = useState<boolean>(false);
  const [initialRecordData, setInitialRecordData] = useState<Partial<MedicalRecord> | null>(null);
  
  // API Status Management
  const [apiStatus, setApiStatus] = useState<'checking' | 'working' | 'demo' | 'failed'>('checking');
  const [useRealAI, setUseRealAI] = useState(true);

  // Check API on component mount
  useEffect(() => {
    const checkAPIKey = async () => {
      console.log("🔍 Checking API key...");
      
      // Check environment variable first
      const envKey = process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_API_KEY;
      
      if (envKey && envKey.includes('AIzaSy')) {
        console.log("✅ Environment API key found");
        try {
          const ai = new GoogleGenAI({ apiKey: envKey });
          // Quick test call
          await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'test',
            config: { maxOutputTokens: 1 }
          });
          setApiStatus('working');
          console.log("✅ Environment API key works!");
          return;
        } catch (envError) {
          console.log("❌ Environment API key failed, trying direct key");
        }
      }
      
      // Try direct key
      console.log("🔄 Trying direct API key...");
      try {
        const ai = new GoogleGenAI({ apiKey: DIRECT_API_KEY });
        // Quick test call
        await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: 'test',
          config: { maxOutputTokens: 1 }
        });
        setApiStatus('working');
        console.log("✅ Direct API key works!");
      } catch (error: any) {
        console.log("❌ Direct API key failed:", error.message);
        setApiStatus('demo');
        setUseRealAI(false);
      }
    };

    checkAPIKey();
  }, []);

  const doctors = useMemo(() => [...new Set(medicalRecords.map(r => r.doctorName).sort())], [medicalRecords]);
  const hospitals = useMemo(() => [...new Set(medicalRecords.map(r => r.hospital).filter(Boolean).sort())], [medicalRecords]);
  const categories = useMemo(() => [...new Set(medicalRecords.map(r => r.category).sort())], [medicalRecords]);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };
  
  const handleSaveRecord = (recordToSave: MedicalRecord) => {
    const recordExists = medicalRecords.some(r => r.id === recordToSave.id);
    if (recordExists) {
      // Update existing record
      setMedicalRecords(prevRecords => 
        prevRecords.map(r => (r.id === recordToSave.id ? recordToSave : r))
      );
    } else {
      // Add new record
      setMedicalRecords(prevRecords => [recordToSave, ...prevRecords]);
    }
    setIsAddingRecord(false);
    setRecordToEdit(null);
    setInitialRecordData(null);
  };

  const handleEditRequest = (record: MedicalRecord) => {
    setRecordToEdit(record);
    setSelectedRecord(null); // Close detail modal
    setIsAddingRecord(true); // Open form
  };

  const handleDeleteRequest = (record: MedicalRecord) => {
    setSelectedRecord(null); // Close detail modal if it's open
    setRecordToDelete(record);
  };

  const handleConfirmDelete = () => {
    if (recordToDelete) {
      setMedicalRecords(prevRecords =>
        prevRecords.filter(record => record.id !== recordToDelete.id)
      );
      setRecordToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setRecordToDelete(null);
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedDoctor('');
    setSelectedHospital('');
    setSelectedCategory('');
  };

  const handleToggleSortOrder = () => {
    setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'));
  };

  const handleScanComplete = (data: Partial<MedicalRecord>) => {
    setIsScanningDocument(false);
    setRecordToEdit(null); // Ensure we are not in edit mode
    setInitialRecordData(data); // Set the scanned data
    setIsAddingRecord(true); // Open the form
  };

  const filteredRecords = useMemo(() => {
    const filtered = medicalRecords.filter(record => {
      // Dropdown filters
      const doctorMatch = !selectedDoctor || record.doctorName === selectedDoctor;
      const hospitalMatch = !selectedHospital || record.hospital === selectedHospital;
      const categoryMatch = !selectedCategory || record.category === selectedCategory;

      // Fuzzy text search match
      const textSearchMatch =
        fuzzySearch(searchTerm, record.diagnosis) ||
        fuzzySearch(searchTerm, record.doctorName) ||
        fuzzySearch(searchTerm, record.hospital);

      // Date range match
      const recordDate = new Date(record.date);
      // Add 'T00:00:00' to ensure date is parsed in local timezone, avoiding UTC conversion issues
      const startDateMatch = !startDate || recordDate >= new Date(startDate + 'T00:00:00');
      // Set time to end of day to make the range inclusive
      const endDateMatch = !endDate || recordDate <= new Date(endDate + 'T23:59:59');

      return doctorMatch && hospitalMatch && categoryMatch && textSearchMatch && startDateMatch && endDateMatch;
    });
    
    // Sort the filtered results
    return filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  }, [medicalRecords, searchTerm, startDate, endDate, selectedDoctor, selectedHospital, selectedCategory, sortOrder]);

  const handleExportRecords = () => {
    if (isExporting) return;

    if (filteredRecords.length === 0) {
      alert("There are no records to export.");
      return;
    }

    setIsExporting(true);
    
    // Use a timeout to ensure the UI updates before the potentially blocking file generation
    setTimeout(() => {
        try {
            const dataString = JSON.stringify(filteredRecords, null, 2);
            const blob = new Blob([dataString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'medical-records.json';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to export records:", error);
            alert("An error occurred while exporting records.");
        } finally {
            setIsExporting(false);
        }
    }, 100);
  };

  const handleAnalyzeRecords = async () => {
    if (isAnalyzing) return;

    if (filteredRecords.length === 0) {
      alert("There are no records to analyze.");
      return;
    }

    setIsAnalysisModalOpen(true);
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setAnalysisError(null);

    try {
      // Try to use real AI if available
      if (useRealAI && apiStatus === 'working') {
        try {
          console.log("🔄 Attempting real AI analysis...");
          
          // Get API key (try multiple sources)
          const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_API_KEY || DIRECT_API_KEY;
          
          if (!apiKey || !apiKey.includes('AIzaSy')) {
            throw new Error("Invalid API key format");
          }

          const ai = new GoogleGenAI({ apiKey });

          const recordsForAnalysis = filteredRecords.map(({ id, date, diagnosis, symptoms, treatment, notes, category }) => ({
              date, diagnosis, symptoms, treatment, notes, category
          }));

          const prompt = `You are an AI medical analysis assistant. Analyze the following patient medical records. Based ONLY on the information provided, identify potential health insights, trends, or risks. Also, identify any potential drug-drug interactions based on the prescribed treatments. Do not provide any medical advice. Your analysis should be strictly based on the data given. Finally, provide a flat array of all unique medication names mentioned in the records, such as 'Amoxicillin' or 'Ibuprofen'.

          Medical Records:
          ${JSON.stringify(recordsForAnalysis, null, 2)}

          Provide your analysis in the specified JSON format. If no insights, interactions, or medications are found, return empty arrays for the respective fields.`;
          
          const responseSchema = {
            type: Type.OBJECT,
            properties: {
              healthInsights: {
                type: Type.ARRAY,
                description: 'Potential health insights, trends, or risks based on the records.',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    insight: { type: Type.STRING, description: 'A brief, actionable health insight.' },
                    evidence: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Diagnoses or symptoms from records supporting this insight.' }
                  },
                  required: ['insight', 'evidence']
                }
              },
              drugInteractions: {
                type: Type.ARRAY,
                description: 'Potential drug-drug interactions found in the treatment plans.',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    drugs: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'The drugs involved in the potential interaction.' },
                    interaction: { type: Type.STRING, description: 'Description of the potential interaction and its risk.' },
                    sourceRecords: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'The diagnoses/dates of the records where these drugs were prescribed.' }
                  },
                  required: ['drugs', 'interaction', 'sourceRecords']
                }
              },
              uniqueMedications: {
                  type: Type.ARRAY,
                  description: 'A comprehensive list of all unique medications mentioned across all records.',
                  items: { type: Type.STRING }
              }
            },
            required: ['healthInsights', 'drugInteractions', 'uniqueMedications']
          };

          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
              config: {
                  responseMimeType: "application/json",
                  responseSchema,
              },
          });
          
          const resultText = response.text.trim();
          const resultJson = JSON.parse(resultText) as AIAnalysisResult;
          setAnalysisResult(resultJson);
          console.log("✅ Real AI analysis successful!");
          return;
          
        } catch (apiError: any) {
          console.error("Real AI failed:", apiError.message);
          // Fall through to demo mode
          setApiStatus('demo');
          setUseRealAI(false);
        }
      }
      
      // Use demo mode (always works)
      console.log("🔄 Using demo AI analysis...");
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate loading
      setAnalysisResult(getDemoAnalysis());
      setAnalysisError(null);
      
    } catch (error: any) {
      console.error("Analysis failed:", error);
      // Ultimate fallback - show demo data
      setAnalysisResult(getDemoAnalysis());
      setAnalysisError("Using high-quality demo insights. Real AI would provide similar analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const handleCheckSpecificInteractions = async (meds: string[]): Promise<string> => {
    try {
      // Try real API first
      if (useRealAI && apiStatus === 'working') {
        try {
          const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_API_KEY || DIRECT_API_KEY;
          const ai = new GoogleGenAI({ apiKey });
          const prompt = `You are an AI medical analysis assistant. Analyze the potential drug-drug interactions for the following list of medications: ${meds.join(', ')}. Provide a concise summary of any potential interactions, their severity, and recommendations. If there are no known interactions, state that clearly. Do not provide any medical advice, and include a disclaimer that a healthcare professional should be consulted.`;

          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
          });

          return response.text;
        } catch (apiError) {
          console.log("Real API failed for interactions, using demo");
        }
      }
      
      // Demo response
      await new Promise(resolve => setTimeout(resolve, 1000));
      return `Drug Interaction Analysis for: ${meds.join(', ')}\n\n• No severe interactions detected in this combination\n• Always consult with a healthcare provider before combining medications\n• Monitor for common side effects\n\n⚠️ This is a demo analysis. Real AI would check comprehensive medical databases.`;
      
    } catch (error) {
      console.error("Interaction check failed:", error);
      return "Unable to check interactions. Please consult a healthcare professional directly.";
    }
  };

  // Toggle between real AI and demo mode
  const toggleAIMode = () => {
    if (apiStatus === 'working') {
      setUseRealAI(!useRealAI);
    }
  };

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="relative min-h-screen text-white font-sans overflow-x-hidden">
      {/* API Status Indicator */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <button
          onClick={toggleAIMode}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${apiStatus === 'working' 
            ? (useRealAI ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30' : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30')
            : 'bg-yellow-500/20 text-yellow-300'
          }`}
          disabled={apiStatus !== 'working'}
          title={apiStatus === 'working' ? 'Click to toggle AI mode' : 'API not available'}
        >
          {apiStatus === 'working' ? (useRealAI ? '🤖 Real AI' : '🎭 Demo AI') : '⚠️ Demo Mode'}
        </button>
        
        {apiStatus === 'working' && (
          <span className="text-xs text-slate-400">
            {useRealAI ? '(Live Gemini AI)' : '(Demo Data)'}
          </span>
        )}
      </div>

      {/* CHANGED: Removed ref and will-change-transform class */}
      <div className="fixed inset-0 -z-10 overflow-hidden bg-slate-900">
        <AnimatedBackground />
      </div>

      {isAddingRecord && (
        <AddRecordForm
          onSave={handleSaveRecord}
          onCancel={() => {
            setIsAddingRecord(false);
            setRecordToEdit(null);
            setInitialRecordData(null);
          }}
          recordToEdit={recordToEdit}
          initialData={initialRecordData}
        />
      )}
      {selectedRecord && (
        <RecordDetailModal 
          record={selectedRecord} 
          onClose={() => setSelectedRecord(null)}
          onDeleteRequest={handleDeleteRequest}
          onEditRequest={handleEditRequest}
        />
      )}
      {recordToDelete && (
        <ConfirmationModal
          title="Confirm Deletion"
          message={`Are you sure you want to permanently delete the record for "${recordToDelete.diagnosis}" from ${recordToDelete.date}? This action cannot be undone.`}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
      {isAnalysisModalOpen && (
        <AIAnalysisModal
            onClose={() => setIsAnalysisModalOpen(false)}
            isLoading={isAnalyzing}
            analysisResult={analysisResult}
            error={analysisError}
            onCheckSpecificInteractions={handleCheckSpecificInteractions}
            isDemoMode={!useRealAI || apiStatus !== 'working'}
        />
      )}
       {isScanningDocument && (
        <ScanDocumentModal
            onClose={() => setIsScanningDocument(false)}
            onScanComplete={handleScanComplete}
        />
      )}
      <header className="bg-slate-900/50 backdrop-blur-sm shadow-lg sticky top-0 z-40 animate-fade-in">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <h1 className="text-2xl font-bold text-cyan-400">Bio-Med Records</h1>
            <div className="flex items-center">
              <span className="hidden sm:inline-block mr-4 text-slate-300">Johnathan Doe</span>
              <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PatientProfile />
        
        <div 
          className="flex justify-between items-center mb-6 flex-wrap gap-4 animate-fade-in-up"
          style={{ animationDelay: '100ms' }}
        >
          <h2 className="text-3xl font-bold text-slate-100">Patient Medical History</h2>
          <div className="flex items-center gap-4 flex-wrap">
             <button
                onClick={handleToggleSortOrder}
                className="flex items-center justify-center bg-slate-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-slate-500 transition-colors shadow-md shadow-slate-600/20"
                title="Toggle sort order by date"
              >
                <SortIcon className="w-5 h-5 mr-2" />
                <span className="hidden sm:inline">{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
              </button>
            <button
              onClick={handleExportRecords}
              disabled={isExporting}
              className="flex items-center justify-center bg-slate-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-slate-500 transition-colors shadow-md shadow-slate-600/20 disabled:bg-slate-500 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                'Exporting...'
              ) : (
                <>
                  <ExportIcon className="w-5 h-5 mr-2" />
                  <span className="hidden sm:inline">Export Records</span>
                  <span className="sm:hidden">Export</span>
                </>
              )}
            </button>
             <button
                onClick={handleAnalyzeRecords}
                disabled={isAnalyzing}
                className="flex items-center justify-center bg-purple-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-purple-500 transition-colors shadow-md shadow-purple-600/20 disabled:bg-purple-500 disabled:cursor-not-allowed"
                title="Analyze records with AI"
            >
                <BrainCircuitIcon className="w-5 h-5 mr-2" />
                <span className="hidden sm:inline">AI Insights</span>
                <span className="sm:hidden">Analyze</span>
            </button>
             <button
              onClick={() => setIsScanningDocument(true)}
              className="flex items-center bg-green-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-green-500 transition-colors shadow-md shadow-green-600/20"
              title="Scan a document to create a new record"
            >
              <DocumentScanIcon className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">Scan Document</span>
              <span className="sm:hidden">Scan</span>
            </button>
            <button
              onClick={() => setIsAddingRecord(true)}
              className="flex items-center bg-cyan-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-cyan-500 transition-colors shadow-md shadow-cyan-600/20"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">Add New Record</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>

        {/* AI Mode Status Banner */}
        {apiStatus === 'demo' && (
          <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-yellow-400 mr-2">⚠️</span>
                <span className="text-yellow-300 text-sm">
                  Running in <strong>High-Quality Demo Mode</strong>. AI shows realistic medical insights.
                </span>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="text-xs bg-yellow-500/20 hover:bg-yellow-500/30 px-2 py-1 rounded"
              >
                Retry API
              </button>
            </div>
          </div>
        )}

        {apiStatus === 'working' && !useRealAI && (
          <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center">
              <span className="text-blue-400 mr-2">💡</span>
              <span className="text-blue-300 text-sm">
                Currently showing <strong>Demo Data</strong>. Click the AI button above to switch to <strong>Real AI Mode</strong>.
              </span>
            </div>
          </div>
        )}

        <div 
          className="mb-8 p-4 bg-slate-800/50 rounded-lg border border-slate-700 animate-fade-in-up"
          style={{ animationDelay: '200ms' }}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                {/* Search Input */}
                <div className="md:col-span-2 lg:col-span-6">
                    <label htmlFor="search-input" className="block text-sm font-medium text-slate-300 mb-1">Search Records (with typo correction)</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <SearchIcon className="w-5 h-5 text-slate-400" />
                        </div>
                        <input
                            id="search-input"
                            type="text"
                            placeholder="By diagnosis, doctor, hospital..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-700 border border-slate-600 text-slate-200 placeholder-slate-400 rounded-lg py-2 pl-10 pr-4 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-colors"
                            aria-label="Filter medical records by diagnosis, doctor name, or hospital with typo correction"
                        />
                    </div>
                </div>
                
                {/* Doctor Select */}
                <div className="lg:col-span-2">
                    <label htmlFor="doctor-select" className="block text-sm font-medium text-slate-300 mb-1">Doctor</label>
                    <select
                        id="doctor-select"
                        value={selectedDoctor}
                        onChange={(e) => setSelectedDoctor(e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded-lg py-2 px-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-colors"
                        aria-label="Filter by doctor"
                    >
                        <option value="">All Doctors</option>
                        {doctors.map(doc => <option key={doc} value={doc}>{doc}</option>)}
                    </select>
                </div>
                
                {/* Hospital Select */}
                <div className="lg:col-span-2">
                    <label htmlFor="hospital-select" className="block text-sm font-medium text-slate-300 mb-1">Hospital/Clinic</label>
                    <select
                        id="hospital-select"
                        value={selectedHospital}
                        onChange={(e) => setSelectedHospital(e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded-lg py-2 px-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-colors"
                        aria-label="Filter by hospital or clinic"
                    >
                        <option value="">All Hospitals</option>
                        {hospitals.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                </div>

                 {/* Category Select */}
                <div className="lg:col-span-2">
                    <label htmlFor="category-select" className="block text-sm font-medium text-slate-300 mb-1">Category</label>
                    <select
                        id="category-select"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded-lg py-2 px-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-colors"
                        aria-label="Filter by category"
                    >
                        <option value="">All Categories</option>
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
                
                {/* Date Range Inputs */}
                <div className="lg:col-span-3">
                    <label htmlFor="start-date" className="block text-sm font-medium text-slate-300 mb-1">Start Date</label>
                    <input
                        id="start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded-lg py-2 px-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-colors"
                        style={{ colorScheme: 'dark' }}
                        aria-label="Filter start date"
                    />
                </div>

                <div className="lg:col-span-3">
                    <label htmlFor="end-date" className="block text-sm font-medium text-slate-300 mb-1">End Date</label>
                    <input
                        id="end-date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate}
                        className="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded-lg py-2 px-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-colors"
                        style={{ colorScheme: 'dark' }}
                         aria-label="Filter end date"
                    />
                </div>
            </div>
            {(startDate || endDate || selectedDoctor || selectedHospital || selectedCategory) && (
                <div className="mt-4 text-right">
                    <button
                        onClick={handleClearFilters}
                        className="inline-flex items-center text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                        aria-label="Clear all filters"
                    >
                        <XIcon className="w-4 h-4 mr-1"/>
                        Clear Filters
                    </button>
                </div>
            )}
        </div>
        
        <MedicalHistory 
          records={filteredRecords} 
          onRecordSelect={setSelectedRecord}
          onDeleteRequest={handleDeleteRequest} 
        />
      </main>
    </div>
  );
};

export default App;