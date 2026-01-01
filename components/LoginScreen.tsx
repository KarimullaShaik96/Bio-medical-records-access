import React, { useState, useRef, useEffect } from 'react';
import FingerprintIcon from './icons/FingerprintIcon';
import AnimatedBackground from './AnimatedBackground';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState('Awaiting Authentication');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);
  const [isSimulation, setIsSimulation] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Animate progress when scanning is active
  useEffect(() => {
    let progressInterval: ReturnType<typeof setInterval> | null = null;
    if (isScanning) {
      progressInterval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            if (progressInterval) clearInterval(progressInterval);
            return 100;
          }
          // Increment to fill over ~5 seconds
          return prev + 100 / 100;
        });
      }, 50);
    } else {
      setScanProgress(0); // Reset on cancel/fail
    }

    return () => {
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [isScanning]);


  // Cleanup function to stop the camera stream and any pending timeouts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  const clearTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraError(null);
        setIsSimulation(false);
        return true;
      }
    } catch (err) {
      console.warn("Camera access denied or failed, switching to simulation mode:", err);
      // Fallback to simulation mode instead of blocking
      setIsSimulation(true);
      setCameraError(null);
      return false;
    }
    return false;
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }

  const handleScan = async () => {
    clearTimeouts();
    setIsScanning(true);
    setFaceDetected(false);
    setStatus('Initializing System...');
    
    // Attempt to start camera, but proceed to simulation if it fails
    const cameraStarted = await startCamera();
    const usingSimulation = !cameraStarted;
    
    setStatus(usingSimulation ? 'Initiating Simulation...' : 'Align your face with the camera...');

    const t1 = setTimeout(() => { 
        setStatus(usingSimulation ? 'Simulating Scan...' : 'Searching for face...'); 
    }, 500);
    
    const t2 = setTimeout(() => { 
        setStatus(usingSimulation ? 'Biometric Data Processed...' : 'Face detected. Hold still.'); 
        if (!usingSimulation) setFaceDetected(true); 
    }, 1500);
    
    const t3 = setTimeout(() => { setStatus('Scanning...'); }, 2000);
    const t4 = setTimeout(() => { setStatus('Verifying Identity...'); }, 3500);
    const t5 = setTimeout(() => {
      setStatus('Access Granted');
      setScanProgress(100);
      stopCamera();
      const t6 = setTimeout(onLoginSuccess, 1000);
      timeoutsRef.current.push(t6);
    }, 5000);

    timeoutsRef.current = [t1, t2, t3, t4, t5];
  };

  // SVG progress ring constants
  const circleWidth = 256; // Based on w-64 class
  const radius = 120;      // Radius of the circle
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (scanProgress / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-between min-h-screen bg-slate-900 text-white p-6 overflow-hidden">
      <AnimatedBackground />
      
      {/* Top Header Section */}
      <div className="w-full max-w-md text-center z-10 pt-8 sm:pt-12">
        <h1 className="text-4xl font-bold text-cyan-400">Bio-Med Record Access</h1>
        <p className="text-slate-400 mt-2">Your secure medical history portal.</p>
      </div>

      {/* Middle Scanner Section */}
      <div className="flex-1 flex items-center justify-center z-10 w-full">
        <div className="relative w-64 h-64 flex items-center justify-center">
          {/* Progress Ring and Track */}
          <svg className="absolute transform -rotate-90" width={circleWidth} height={circleWidth}>
            {/* Background track */}
            <circle
              className="text-slate-700"
              strokeWidth={strokeWidth}
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx={circleWidth / 2}
              cy={circleWidth / 2}
            />
            {/* Progress indicator */}
            <circle
              className="text-cyan-400"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx={circleWidth / 2}
              cy={circleWidth / 2}
              style={{ transition: 'stroke-dashoffset 0.05s linear' }}
            />
          </svg>

          {/* Pulsing effect during scan */}
          {isScanning && status !== 'Access Granted' && (
             <div className="absolute w-[calc(100%-24px)] h-[calc(100%-24px)] bg-cyan-500/10 rounded-full animate-bg-pulse"></div>
          )}

          {/* Video feed or Simulation container */}
          <div className="absolute w-[calc(100%-24px)] h-[calc(100%-24px)] rounded-full overflow-hidden bg-slate-800 flex items-center justify-center">
             {isScanning && isSimulation ? (
                <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                   <div className="w-full h-full opacity-30 bg-[linear-gradient(45deg,transparent_25%,rgba(0,255,255,0.1)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%] animate-[bg-pulse-anim_2s_ease-in-out_infinite]"></div>
                   <FingerprintIcon className="w-32 h-32 text-cyan-500/20 animate-pulse absolute" />
                </div>
             ) : (
                 <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-500 ${isScanning ? 'opacity-100' : 'opacity-0'}`}
                />
             )}
            
            {/* Face Scan Overlay (Only for real camera) */}
            {isScanning && !isSimulation && status !== 'Access Granted' && (
              <div className="absolute inset-0 flex items-center justify-center animate-fade-in pointer-events-none">
                <div className={`relative w-3/5 h-4/5 transition-all duration-500 ${faceDetected ? 'animate-face-scan-pulse' : ''}`}>
                  {/* Corner brackets */}
                  <div className={`absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 rounded-tl-lg ${faceDetected ? 'border-cyan-400/80' : 'border-slate-500/80'} transition-colors duration-500`}></div>
                  <div className={`absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 rounded-tr-lg ${faceDetected ? 'border-cyan-400/80' : 'border-slate-500/80'} transition-colors duration-500`}></div>
                  <div className={`absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 rounded-bl-lg ${faceDetected ? 'border-cyan-400/80' : 'border-slate-500/80'} transition-colors duration-500`}></div>
                  <div className={`absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 rounded-br-lg ${faceDetected ? 'border-cyan-400/80' : 'border-slate-500/80'} transition-colors duration-500`}></div>
                  
                  {/* Scanning Line */}
                  {(status === 'Scanning...' || status === 'Verifying Identity...') && (
                    <div className="absolute inset-0 overflow-hidden rounded-lg">
                      <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400/80 shadow-[0_0_12px_3px_rgba(0,229,255,0.6)] animate-scan-line"></div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Simulation Overlay */}
             {isScanning && isSimulation && status !== 'Access Granted' && (
              <div className="absolute inset-0 flex items-center justify-center animate-fade-in pointer-events-none">
                 <div className="absolute inset-0 overflow-hidden rounded-full">
                      <div className="absolute top-0 left-0 w-full h-2 bg-cyan-400/50 shadow-[0_0_15px_4px_rgba(0,229,255,0.5)] animate-scan-line"></div>
                 </div>
              </div>
            )}

            {/* Success Overlay */}
            {status === 'Access Granted' && (
              <div className="absolute inset-0 flex items-center justify-center animate-fade-in pointer-events-none">
                <div className="relative w-3/5 h-4/5 border-4 border-green-400 rounded-lg bg-green-400/10"></div>
              </div>
            )}
          </div>
          
          {/* Button and Icon are layered on top */}
          <button
            onClick={handleScan}
            disabled={isScanning}
            className="absolute inset-0 w-full h-full rounded-full flex items-center justify-center transition-all duration-300 bg-slate-800/50 hover:bg-slate-800/20 active:bg-slate-800/0 disabled:cursor-not-allowed disabled:bg-transparent"
            aria-label="Start biometric scan"
          >
            <FingerprintIcon className={`w-24 h-24 transition-all duration-500 ${isScanning ? 'text-cyan-400/50 scale-125' : 'text-slate-500 scale-100'}`} />
          </button>
        </div>
      </div>

      {/* Bottom Status Section */}
      <div className="w-full max-w-md text-center z-10 pb-8 sm:pb-12 h-32 flex flex-col justify-end">
        <div className="h-10 mb-2">
           {cameraError ? (
            <p className="text-red-400 text-sm">{cameraError}</p>
          ) : (
            <p className={`text-lg font-medium transition-all duration-300 ${isScanning ? 'text-cyan-300' : 'text-slate-400'}`}>
              {status}
            </p>
          )}
        </div>
        
        <p className="text-slate-500 text-sm">
          {isScanning ? (status === 'Initializing System...' ? 'Starting security protocols...' : (isSimulation ? 'Simulating biometric verification...' : 'Authentication in progress...')) : 'Press the scanner to begin.'}
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;