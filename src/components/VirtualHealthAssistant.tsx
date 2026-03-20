import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, User, Bot } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

const VirtualHealthAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your Virtual Health Assistant. How can I help you today?',
      sender: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Enhanced responses for common questions including medicine suggestions and health advice
  const getResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    // Disclaimer for all medical advice
    const disclaimer = "\n\nDisclaimer: This information is for educational purposes only and not a substitute for professional medical advice. Always consult with your healthcare provider before taking any medication or making health decisions.";
    
    // Appointment related queries
    if (lowerQuery.includes('appointment') || lowerQuery.includes('schedule') || lowerQuery.includes('book')) {
      return "You can schedule an appointment by going to the Appointments section in the navigation menu. Click on 'Add New Appointment' and fill in the required details. Would you like me to guide you there?";
    }
    
    // Medication related queries - Enhanced with suggestions
    if (lowerQuery.includes('medication') || lowerQuery.includes('medicine') || lowerQuery.includes('prescription')) {
      if (lowerQuery.includes('pain') || lowerQuery.includes('headache') || lowerQuery.includes('ache')) {
        return "For mild to moderate pain or headaches, over-the-counter options like acetaminophen (Tylenol) or ibuprofen (Advil, Motrin) may help. Ibuprofen also reduces inflammation. For persistent or severe pain, please consult your doctor." + disclaimer;
      }
      
      if (lowerQuery.includes('cold') || lowerQuery.includes('flu') || lowerQuery.includes('cough')) {
        return "For cold and flu symptoms, rest and hydration are important. Over-the-counter options include acetaminophen or ibuprofen for fever and pain, decongestants for nasal congestion, and cough suppressants for cough. Combination cold medicines address multiple symptoms. Always read labels carefully and avoid duplicating active ingredients." + disclaimer;
      }
      
      if (lowerQuery.includes('allergy') || lowerQuery.includes('allergies') || lowerQuery.includes('antihistamine')) {
        return "For allergies, non-drowsy antihistamines like loratadine (Claritin), cetirizine (Zyrtec), or fexofenadine (Allegra) may help. Nasal steroid sprays like fluticasone (Flonase) can reduce nasal inflammation. For severe allergies, please consult your doctor." + disclaimer;
      }
      
      if (lowerQuery.includes('sleep') || lowerQuery.includes('insomnia')) {
        return "For occasional sleep difficulties, good sleep hygiene practices are recommended first. If needed, over-the-counter options include melatonin, diphenhydramine (Benadryl), or doxylamine (Unisom). For persistent insomnia, please consult your doctor as prescription medications may be more appropriate." + disclaimer;
      }
      
      if (lowerQuery.includes('stomach') || lowerQuery.includes('indigestion') || lowerQuery.includes('heartburn')) {
        return "For indigestion or heartburn, antacids like Tums or Rolaids provide quick, short-term relief. H2 blockers like famotidine (Pepcid) or proton pump inhibitors like omeprazole (Prilosec) offer longer-lasting relief for frequent symptoms. For persistent digestive issues, please consult your doctor." + disclaimer;
      }
      
      // General medication response
      return "Your medications can be viewed and managed in the Medications section. You can add new medications, view dosage information, and set reminders. If you're looking for medication suggestions for a specific condition, please provide more details about your symptoms. Remember that any suggestions should be discussed with your healthcare provider." + disclaimer;
    }
    
    // Health advice queries
    if (lowerQuery.includes('health advice') || lowerQuery.includes('healthy') || lowerQuery.includes('wellness') || lowerQuery.includes('lifestyle')) {
      return "Here are some general health recommendations:\n\n1. Stay physically active with at least 150 minutes of moderate exercise weekly\n2. Maintain a balanced diet rich in fruits, vegetables, whole grains, and lean proteins\n3. Stay hydrated by drinking plenty of water\n4. Get 7-9 hours of quality sleep each night\n5. Manage stress through mindfulness, meditation, or other relaxation techniques\n6. Avoid smoking and limit alcohol consumption\n7. Keep up with preventive care and regular check-ups\n\nWould you like more specific advice on any of these areas?" + disclaimer;
    }
    
    // Diet and nutrition advice
    if (lowerQuery.includes('diet') || lowerQuery.includes('nutrition') || lowerQuery.includes('food') || lowerQuery.includes('eat')) {
      return "A balanced diet is crucial for good health. Consider these nutrition guidelines:\n\n1. Eat a variety of fruits and vegetables daily (aim for 5+ servings)\n2. Choose whole grains over refined grains\n3. Include lean proteins like fish, poultry, beans, and nuts\n4. Limit saturated fats, trans fats, sodium, and added sugars\n5. Stay hydrated with water as your primary beverage\n6. Practice portion control\n\nFor personalized nutrition advice, consider consulting with a registered dietitian." + disclaimer;
    }
    
    // Exercise advice
    if (lowerQuery.includes('exercise') || lowerQuery.includes('workout') || lowerQuery.includes('fitness')) {
      return "Regular physical activity is essential for health. Consider these exercise guidelines:\n\n1. Aim for at least 150 minutes of moderate aerobic activity or 75 minutes of vigorous activity weekly\n2. Include muscle-strengthening activities at least twice a week\n3. Start slowly and gradually increase intensity if you're new to exercise\n4. Choose activities you enjoy to help maintain consistency\n5. Incorporate flexibility and balance exercises, especially as you age\n\nBefore starting a new exercise program, especially if you have existing health conditions, consult with your healthcare provider." + disclaimer;
    }
    
    // Mental health advice
    if (lowerQuery.includes('mental health') || lowerQuery.includes('stress') || lowerQuery.includes('anxiety') || lowerQuery.includes('depression')) {
      return "Mental health is as important as physical health. Here are some strategies that may help:\n\n1. Practice stress management techniques like deep breathing, meditation, or yoga\n2. Maintain social connections and seek support when needed\n3. Get regular physical activity, which can improve mood\n4. Ensure adequate sleep\n5. Consider mindfulness practices or cognitive behavioral techniques\n6. Limit alcohol and avoid recreational drugs\n\nIf you're experiencing persistent mental health concerns, please reach out to a healthcare provider or mental health professional. Many effective treatments are available." + disclaimer;
    }
    
    // Reports related queries
    if (lowerQuery.includes('report') || lowerQuery.includes('test') || lowerQuery.includes('result')) {
      return "Your medical reports are available in the Reports section. You can view, download, and upload new reports there. Would you like to know how to upload a new report?";
    }
    
    // General help
    if (lowerQuery.includes('help') || lowerQuery.includes('guide') || lowerQuery.includes('how to')) {
      return "I can help you navigate the patient portal. You can ask me about appointments, medications, reports, health metrics, or any other feature. I can also provide general health information and medication suggestions, though these should always be discussed with your healthcare provider. What would you like to learn more about?";
    }
    
    // Fallback response
    return "I'm here to help with your healthcare needs. You can ask me about scheduling appointments, managing medications, viewing reports, tracking health metrics, or navigating the portal. I can also provide general health information and medication suggestions, though these should always be verified with your healthcare provider. How can I assist you today?";
  };

  const handleSendMessage = () => {
    if (input.trim() === '') return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    
    // Simulate assistant typing
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: getResponse(input),
        sender: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 m-4">
      <div className="flex items-center mb-4">
        <MessageSquare className="h-6 w-6 text-indigo-600 mr-2" />
        <h2 className="text-xl font-semibold">Virtual Health Assistant</h2>
      </div>
      
      <div className="h-80 overflow-y-auto mb-4 p-2 border rounded-lg">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-3 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-3/4 rounded-lg px-3 py-2 ${
                message.sender === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div className="flex items-center mb-1">
                {message.sender === 'user' ? (
                  <User className="h-4 w-4 mr-1" />
                ) : (
                  <Bot className="h-4 w-4 mr-1" />
                )}
                <span className="text-xs opacity-75">
                  {message.sender === 'user' ? 'You' : 'Assistant'}
                </span>
              </div>
              <p>{message.content}</p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start mb-3">
            <div className="bg-gray-100 text-gray-800 rounded-lg px-3 py-2">
              <div className="flex items-center">
                <Bot className="h-4 w-4 mr-1" />
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="flex items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask me anything about your healthcare..."
          className="flex-grow px-3 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={handleSendMessage}
          className="bg-indigo-600 text-white px-3 py-2 rounded-r-lg hover:bg-indigo-700"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default VirtualHealthAssistant;