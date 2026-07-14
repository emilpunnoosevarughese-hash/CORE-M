import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, ChevronLeft, Play, Scissors, Image as ImageIcon, Download } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const steps = [
  {
    title: "Welcome to CORE M",
    description: "Your professional, browser-based video editor. Let's take a quick tour of how things work.",
    icon: <Play size={48} className="text-primary mb-4" />
  },
  {
    title: "1. Import Media",
    description: "Drag and drop your video files into the Media Panel on the left, or click to upload them.",
    icon: <ImageIcon size={48} className="text-blue-500 mb-4" />
  },
  {
    title: "2. Edit on Timeline",
    description: "Drag your clips from the Media Panel down into the Timeline at the bottom. You can trim clips by dragging their edges, or split them using the 'S' key.",
    icon: <Scissors size={48} className="text-red-500 mb-4" />
  },
  {
    title: "3. Export your Video",
    description: "When you are done, click the Export button in the top right corner to render your final video in high quality.",
    icon: <Download size={48} className="text-green-500 mb-4" />
  }
];

export function TutorialOverlay({ onClose }: Props) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden relative">
        
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-1.5 hover:bg-surface-hover rounded-lg transition-colors text-foreground/50 hover:text-foreground"
        >
          <X size={18} />
        </button>

        <div className="p-8 flex flex-col items-center text-center">
          {steps[currentStep].icon}
          <h2 className="text-2xl font-bold mb-4">{steps[currentStep].title}</h2>
          <p className="text-foreground/70 leading-relaxed max-w-md">
            {steps[currentStep].description}
          </p>
        </div>

        <div className="p-6 bg-surface-hover/30 border-t border-border flex items-center justify-between">
          <div className="flex gap-2">
            {steps.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full ${i === currentStep ? 'bg-primary' : 'bg-foreground/20'}`} />
            ))}
          </div>

          <div className="flex gap-3">
            {currentStep > 0 && (
              <button 
                onClick={handlePrev}
                className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-surface-hover transition-colors"
              >
                Back
              </button>
            )}
            <button 
              onClick={handleNext}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
              {currentStep < steps.length - 1 && <ChevronRight size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
