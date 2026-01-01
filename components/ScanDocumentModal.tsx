import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import type { MedicalRecord } from '../types';
import XIcon from './icons/XIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import CameraIcon from './icons/CameraIcon';
import UploadIcon from './icons/UploadIcon';

interface ScanDocumentModalProps {
  onClose: () => void;
  onScanComplete: (data: Partial<MedicalRecord>) => void;
}

type ScanStep = 'align' | 'captured' | 'processing' | 'error';

const ScanDocumentModal: React.FC<ScanDocumentModalProps> = ({ onClose, onScanComplete }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [step, setStep] = useState<ScanStep>('align');
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    stopCamera();
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose, stopCamera]);

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setError(null);
      }
    } catch (err) {
      console.error("Camera access error:", err);
      let errorMessage = "Could not access camera. Please upload an image instead.";
      if (err instanceof DOMException) {
          if (err.name === 'NotAllowedError') {
              errorMessage = "Camera access denied. You can upload an image file instead.";
          } else if (err.name === 'NotFoundError') {
              errorMessage = "No camera found. Please upload an image file.";
          } else if (err.name === 'NotReadableError') {
               errorMessage = "Camera is busy. Please upload an image file.";
          }
      }
      setError(errorMessage);
      setStep('error');
    }
  }, [stopCamera]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);
  
  const handleCapture = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(dataUrl);
      setStep('captured');
      stopCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCapturedImage(event.target.result as string);
          setStep('captured');
          setError(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setStep('align');
    startCamera();
  };
  
  const handleProcess = async () => {
    if (!capturedImage) return;

    if (!process.env.API_KEY) {
        setError("API Key is missing. Please configure the application.");
        setStep('error');
        return;
    }

    setStep('processing');
    setError(null);

    try {
        const base64Data = capturedImage.split(',')[1];
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

        const imagePart = { inlineData: { mimeType: 'image/jpeg', data: base64Data } };
        const prompt = `You are an AI assistant that extracts information from medical documents. Analyze the image and extract: doctorName, hospital, diagnosis, symptoms (as a string array), treatment, notes, and a category from 'Consultation', 'Procedure', 'Prescription', 'Check-up', 'Imaging', 'Follow-up'. If a field is missing, use an empty string or array. Return JSON.`;
        
        const responseSchema = {
          type: Type.OBJECT,
          properties: {
              doctorName: { type: Type.STRING }, hospital: { type: Type.STRING },
              diagnosis: { type: Type.STRING },
              symptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
              treatment: { type: Type.STRING }, notes: { type: Type.STRING },
              category: { type: Type.STRING },
          }
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: prompt }] },
            config: { responseMimeType: "application/json", responseSchema },
        });

        const resultText = response.text.trim();
        const resultJson = JSON.parse(resultText) as Partial<MedicalRecord>;
        onScanComplete(resultJson);
    } catch (err) {
        console.error("AI processing failed:", err);
        setError("AI could not process the document. Please ensure the image is clear and try again.");
        setStep('error');
    }
  };

  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4 ${isClosing ? 'animate-backdrop-fade-out' : 'animate-backdrop-fade-in'}`}
      role="dialog" aria-modal="true" aria-labelledby="scan-modal-title"
    >
      <div className={`bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col relative border border-slate-700 will-change-transform ${isClosing ? 'animate-modal-close' : 'animate-modal-open'}`}>
        <header className="flex items-center justify-between p-6 border-b border-slate-700 flex-shrink-0">
          <h2 id="scan-modal-title" className="text-2xl font-bold text-cyan-400">Scan Medical Document</h2>
          <button onClick={handleClose} className="text-slate-400 hover:text-white transition-colors" aria-label="Close scanner">
            <XIcon className="w-7 h-7" />
          </button>
        </header>
        
        <main className="flex-grow p-6 overflow-y-auto flex flex-col justify-center items-center">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="image/*" 
            className="hidden" 
          />
          
          {step === 'align' && (
            <div className="flex flex-col items-center w-full">
              <p className="text-slate-300 mb-4 text-center">Position the document within the frame and capture, or upload an image.</p>
              <div className="relative w-full aspect-[4/3] bg-slate-900 rounded-lg overflow-hidden border-2 border-slate-600 max-w-lg group">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative w-[90%] h-[90%]">
                    <div className="absolute -top-1 -left-1 w-10 h-10 border-t-4 border-l-4 rounded-tl-lg border-cyan-400/80"></div>
                    <div className="absolute -top-1 -right-1 w-10 h-10 border-t-4 border-r-4 rounded-tr-lg border-cyan-400/80"></div>
                    <div className="absolute -bottom-1 -left-1 w-10 h-10 border-b-4 border-l-4 rounded-bl-lg border-cyan-400/80"></div>
                    <div className="absolute -bottom-1 -right-1 w-10 h-10 border-b-4 border-r-4 rounded-br-lg border-cyan-400/80"></div>
                    <div className="absolute inset-0 overflow-hidden rounded-lg">
                      <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400/80 shadow-[0_0_12px_3px_rgba(0,229,255,0.6)] animate-scan-line"></div>
                    </div>
                  </div>
                </div>
                 {/* Fallback upload overlay on video area for easier access */}
                 <div className="absolute bottom-4 right-4 pointer-events-auto">
                     <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 bg-slate-700/80 rounded-full hover:bg-slate-600 text-white transition-colors backdrop-blur-sm"
                        title="Upload Image"
                    >
                         <UploadIcon className="w-6 h-6" />
                     </button>
                 </div>
              </div>
            </div>
          )}
          {step === 'captured' && capturedImage && (
            <div className="flex flex-col items-center w-full">
                <p className="text-slate-300 mb-4 text-center">Review the captured image before processing.</p>
                <img src={capturedImage} alt="Captured document" className="w-full max-w-lg rounded-lg border-2 border-cyan-500" />
            </div>
          )}
           {step === 'processing' && (
            <div className="flex flex-col items-center justify-center text-center h-full">
                <SpinnerIcon className="w-12 h-12 text-cyan-400" />
                <h3 className="text-xl font-semibold text-slate-100 mt-4">Processing Document...</h3>
                <p className="text-slate-400 mt-2">The AI is extracting information. Please wait.</p>
            </div>
          )}
          {step === 'error' && (
             <div className="text-center p-8">
                <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-full mx-auto flex items-center justify-center mb-4">
                    <XIcon className="w-8 h-8"/>
                </div>
                <h3 className="text-xl font-semibold text-red-400">Camera Unavailable</h3>
                <p className="text-slate-400 mt-2 bg-slate-700/50 p-3 rounded-md mb-6">{error}</p>
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center w-full px-4 py-3 bg-cyan-600 text-white font-semibold rounded-md hover:bg-cyan-500 transition-colors"
                >
                    <UploadIcon className="w-5 h-5 mr-2" />
                    Upload Image File
                </button>
            </div>
          )}
        </main>
        
        <footer className="p-6 border-t border-slate-700 flex justify-end items-center gap-4 flex-shrink-0">
          {step === 'align' && (
            <button onClick={handleCapture} className="p-4 bg-cyan-600 rounded-full hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-600/30">
                <CameraIcon className="w-8 h-8 text-white"/>
            </button>
          )}
          {step === 'captured' && (
             <>
                <button onClick={handleRetake} className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-500 transition-colors">Retake</button>
                <button onClick={handleProcess} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-500 transition-colors">Process with AI</button>
             </>
          )}
           {step === 'error' && (
             <>
                <button onClick={handleRetake} className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-500 transition-colors">Retry Camera</button>
             </>
          )}
          <button onClick={handleClose} className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-500 transition-colors">Cancel</button>
        </footer>
      </div>
    </div>
  );
};

export default ScanDocumentModal;