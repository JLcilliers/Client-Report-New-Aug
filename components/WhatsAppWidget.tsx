'use client';

import { MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function WhatsAppWidget() {
  const [isVisible, setIsVisible] = useState(false);
  const phoneNumber = '447736637938';
  const message = 'Hello! I\'m interested in your SEO reporting services.';

  useEffect(() => {
    // Show widget after page loads
    const timer = setTimeout(() => setIsVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleClick = () => {
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transition-all duration-500 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
      }`}
    >
      <button
        onClick={handleClick}
        className="bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 group flex items-center"
        aria-label="Contact us on WhatsApp"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-linear">
          <span className="pl-2 pr-1 whitespace-nowrap">Chat with us</span>
        </span>
      </button>

      {/* Pulse animation */}
      <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-20 pointer-events-none" />
    </div>
  );
}