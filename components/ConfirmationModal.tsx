import React, { useState, useEffect } from 'react';

interface ConfirmationModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ title, message, onConfirm, onCancel }) => {
  const [isClosing, setIsClosing] = useState(false);

  // Wrapper to handle animations before calling parent handlers
  const handleClose = (callback: () => void) => {
    setIsClosing(true);
    setTimeout(() => {
      callback();
    }, 300); // Animation duration should match modal-close animation
  };

  // Add keyboard listener for 'Escape' key to cancel
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose(onCancel);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onCancel]);


  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4 ${isClosing ? 'animate-backdrop-fade-out' : 'animate-backdrop-fade-in'}`}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirmation-title"
      aria-describedby="confirmation-message"
    >
      <div className={`bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6 relative border border-slate-700 will-change-transform ${isClosing ? 'animate-modal-close' : 'animate-modal-open'}`}>
        <h2 id="confirmation-title" className="text-xl font-bold text-red-400 mb-4">{title}</h2>
        <p id="confirmation-message" className="text-slate-300 mb-6">{message}</p>
        <div className="flex justify-end space-x-4">
          <button 
            onClick={() => handleClose(onCancel)} 
            className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-500 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => handleClose(onConfirm)} 
            className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-500 transition-colors"
          >
            Confirm Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;