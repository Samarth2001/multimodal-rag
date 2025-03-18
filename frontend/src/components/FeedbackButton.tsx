'use client';

import { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';

export default function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, this would send feedback to a server
    console.log('Feedback submitted:', { rating, feedback });
    
    // For now, just show success state
    setSubmitted(true);
    setTimeout(() => {
      setIsOpen(false);
      // Reset after closing
      setTimeout(() => {
        setFeedback('');
        setRating(null);
        setSubmitted(false);
      }, 300);
    }, 2000);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md ${
          isDark 
            ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
        }`}
        title="Provide feedback"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        Feedback
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setIsOpen(false)}>
          <div 
            className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border p-6 rounded-lg shadow-xl max-w-md w-full animate-fade-in`}
            onClick={(e) => e.stopPropagation()}
          >
            {submitted ? (
              <div className="text-center py-6">
                <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-green-900/30' : 'bg-green-100'}`}>
                  <svg className={`w-6 h-6 ${isDark ? 'text-green-400' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className={`mt-4 text-lg font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>Thank you for your feedback!</h3>
                <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Your input helps us improve the experience.</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className={`text-lg font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Share Your Feedback</h3>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className={`${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      How would you rate your experience?
                    </label>
                    <div className="flex gap-2 items-center justify-center">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setRating(value)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            rating === value
                              ? isDark 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-blue-500 text-white'
                              : isDark
                                ? 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Tell us about your experience
                    </label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={4}
                      className={`w-full p-2 rounded-md border ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-gray-200'
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                      placeholder="What worked well? What could be improved?"
                    ></textarea>
                  </div>
                  
                  <button
                    type="submit"
                    className={`w-full py-2 px-4 rounded-md font-medium ${
                      isDark
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    Submit Feedback
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
} 