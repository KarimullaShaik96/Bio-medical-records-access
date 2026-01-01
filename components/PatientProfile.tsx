import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import UserIcon from './icons/UserIcon';
import UploadIcon from './icons/UploadIcon';
import SpinnerIcon from './icons/SpinnerIcon';


const PatientProfile: React.FC = () => {
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [generatedAvatar, setGeneratedAvatar] = useState<string | null>(null);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState<boolean>(false);
  const [showUploadSuccess, setShowUploadSuccess] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const patientInfo = {
    name: 'Johnathan Doe',
    dob: 'January 1, 1985',
    bloodType: 'O+',
    allergies: 'Penicillin',
    emergencyContact: 'Jane Doe (Spouse) - (555) 123-4567',
  };

  useEffect(() => {
    const generateAvatar = async () => {
      if (profilePic || generatedAvatar) return;

      if (!process.env.API_KEY) {
          console.warn("API Key missing, skipping avatar generation.");
          return;
      }

      setIsGeneratingAvatar(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: 'A minimalist, abstract avatar representing health and technology. Clean lines, geometric shapes, with a calming color palette of blues and teals. Flat design.',
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/png',
              aspectRatio: '1:1',
            },
        });

        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
        setGeneratedAvatar(imageUrl);
      } catch (error) {
        console.error("Avatar generation failed:", error);
      } finally {
        setIsGeneratingAvatar(false);
      }
    };

    generateAvatar();
  }, []); // Run only once on mount

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      if (profilePic) {
        URL.revokeObjectURL(profilePic);
      }
      const newImageUrl = URL.createObjectURL(file);
      setProfilePic(newImageUrl);

      setShowUploadSuccess(true);
      setTimeout(() => {
        setShowUploadSuccess(false);
      }, 2500); // Message visible for 2.5 seconds
    }
  };

  // Clean up object URL on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (profilePic) {
        URL.revokeObjectURL(profilePic);
      }
    };
  }, [profilePic]);

  const renderAvatar = () => {
    const imageToShow = profilePic || generatedAvatar;

    if (isGeneratingAvatar) {
        return (
            <div className="w-24 h-24 bg-slate-700 rounded-full flex items-center justify-center border-2 border-cyan-500/50 animate-pulse">
                <SpinnerIcon className="w-10 h-10 text-cyan-400" />
            </div>
        )
    }

    if (imageToShow) {
        return <img src={imageToShow} alt="Patient profile" className="w-24 h-24 rounded-full object-cover border-2 border-cyan-500" />
    }
    
    return (
        <div className="w-24 h-24 bg-slate-700 rounded-full flex items-center justify-center border-2 border-cyan-500">
            <UserIcon className="w-12 h-12 text-cyan-400" />
        </div>
    );
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-8 animate-fade-in-up will-change-transform">
      <div className="flex flex-col sm:flex-row items-center">
        <div className="relative w-24 h-24 mr-0 sm:mr-6 mb-4 sm:mb-0 flex-shrink-0 group">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/png, image/jpeg"
            aria-label="Upload profile picture"
          />
          {renderAvatar()}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 bg-black rounded-full bg-opacity-0 group-hover:bg-opacity-60 flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-500"
            aria-label="Change profile picture"
          >
            <UploadIcon className="w-8 h-8 text-white transition-transform duration-300 group-hover:scale-110" />
          </button>
          <div 
              className={`absolute inset-0 bg-green-500 bg-opacity-80 rounded-full flex items-center justify-center pointer-events-none transition-opacity duration-300 ${showUploadSuccess ? 'opacity-100' : 'opacity-0'}`}
          >
              <span className="text-white font-bold text-sm tracking-wide">Photo Updated!</span>
          </div>
        </div>
        <div className="text-center sm:text-left">
          <h2 className="text-3xl font-bold text-white">{patientInfo.name}</h2>
          <p className="text-cyan-400">Patient ID: P-735-82A1</p>
        </div>
      </div>
      <div className="mt-6 border-t border-slate-700 pt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-center sm:text-left">
        <div>
          <h4 className="text-sm font-medium text-slate-400 mb-1">Date of Birth</h4>
          <p className="text-slate-200">{patientInfo.dob}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-slate-400 mb-1">Blood Type</h4>
          <p className="text-slate-200 font-mono text-lg">{patientInfo.bloodType}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-slate-400 mb-1">Known Allergies</h4>
          <p className="text-red-400 font-medium">{patientInfo.allergies}</p>
        </div>
        <div className="sm:col-span-2 md:col-span-3">
          <h4 className="text-sm font-medium text-slate-400 mb-1">Emergency Contact</h4>
          <p className="text-slate-200">{patientInfo.emergencyContact}</p>
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;