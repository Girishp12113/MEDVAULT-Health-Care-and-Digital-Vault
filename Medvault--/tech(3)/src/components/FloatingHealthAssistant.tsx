import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X } from 'lucide-react';
// Remove the ChevronUp import if you're not using it
// import { ChevronUp } from 'lucide-react';
import VirtualHealthAssistant from './VirtualHealthAssistant';

const FloatingHealthAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const assistantRef = useRef<HTMLDivElement>(null);

  // Close assistant when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (assistantRef.current && !assistantRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="fixed bottom-6 right-6 z-50" ref={assistantRef}>
      {isOpen ? (
        <div className="bg-white rounded-lg shadow-xl w-96 md:w-[450px] animate-fade-in-up">
          <div className="flex justify-between items-center p-3 border-b">
            <h3 className="font-medium text-gray-800">Health Assistant</h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={18} />
            </button>
          </div>
          <div className="p-2">
            <VirtualHealthAssistant />
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
        >
          <MessageSquare size={24} />
        </button>
      )}
    </div>
  );
};

export default FloatingHealthAssistant;