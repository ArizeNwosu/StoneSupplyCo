import React, { useState, useEffect, useRef } from 'react';
import { Info } from 'lucide-react';
import { PaperclipIcon } from './icons/PaperclipIcon';
import { AILogoIcon } from './icons/AILogoIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { GlowEffect } from './ui/background-components';

interface Message {
  id: number;
  author: 'user' | 'ai';
  text: string;
}

const DemoSection: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [history, setHistory] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isLoading]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isLoading) return;

    setHistory(prev => [...prev, { id: Date.now(), author: 'user', text: trimmedInput }]);
    setInputValue('');
    setIsLoading(true);

    setTimeout(() => {
      setHistory(prev => [...prev, { 
        id: Date.now() + 1, 
        author: 'ai', 
        text: "This is where the AI response to your query will appear. However, this is only an example query response to demonstrate the function of the SubClick ad unit."
      }]);
      setIsLoading(false);
    }, 1500);
  };

  const resetDemo = () => {
    setInputValue('');
    setHistory([]);
    setIsLoading(false);
  };

  const sponsor = {
    advertiserName: 'Nike Running',
    adCreativeImageUrl: 'https://cdn.shopify.com/s/files/1/0810/7540/5080/files/Untitled_300_x_100_px.gif?v=1763367372',
    logoUrl: 'https://picsum.photos/seed/techcorp/32/32',
    linkUrl: 'https://www.nike.com'
  };

  return (
    <section id="demo" className="py-20 px-6 bg-gray-50 relative overflow-hidden">
      <GlowEffect glowColor="#38bdf8" />
      <div className="relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              <span className="font-serif italic">See</span> SubClick in Action
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              This is a fully interactive simulation. Type a message to see how our ad unit works in a real chat flow.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col h-[600px]">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <span className="text-sm text-gray-400 font-medium">AI Assistant</span>
              <button
                onClick={resetDemo}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium"
              >
                Reset Demo
              </button>
            </div>

            <div className="p-8 flex-1 overflow-y-auto flex flex-col">
              {history.length === 0 && !isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-normal text-black animate-subtle-float">
                    What are you working on?
                  </h2>
                </div>
              ) : (
                <div className="space-y-6">
                  {history.map(message => (
                    <div key={message.id}>
                      {message.author === 'user' ? (
                        <div className="flex gap-4 justify-end">
                          <div className="bg-blue-500 text-white p-4 rounded-lg rounded-br-none max-w-lg">
                            <p>{message.text}</p>
                          </div>
                           <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-blue-600 font-semibold text-sm">You</span>
                           </div>
                        </div>
                      ) : (
                        <div className="flex gap-4">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-semibold text-sm">AI</span>
                          </div>
                          <div className="flex-1">
                            <div className="bg-gray-50 p-5 rounded-lg rounded-tl-none border border-gray-200 mb-3">
                                <p className="text-gray-700 leading-relaxed">{message.text}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                      <div className="flex gap-4">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-semibold text-sm">AI</span>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg rounded-tl-none border border-gray-200 flex items-center gap-2">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                          </div>
                      </div>
                  )}
                   <div ref={chatEndRef} />
                </div>
              )}
            </div>
            
            <div className="p-8 pt-0 flex-shrink-0">
               <form onSubmit={handleSubmit} className="w-full">
                <div className="relative group h-56">
                  {!inputValue && !isLoading && (
                    <div className="absolute inset-0 p-4 pb-12 text-gray-500 pointer-events-none flex flex-col justify-between animate-in fade-in duration-300">
                      <div><span>Ask me anything...</span></div>
                      <div className="space-y-3">
                        <div className="group/ad relative w-full max-w-[300px] pointer-events-auto">
                          <a href={sponsor.linkUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400">
                              Compute cost supported by <span className="font-semibold text-gray-500 group-hover/ad:underline">{sponsor.advertiserName}</span>
                          </a>
                          <img src={sponsor.adCreativeImageUrl} alt={`${sponsor.advertiserName} ad`} className="absolute bottom-full left-0 mb-2 w-full max-w-[300px] h-auto aspect-[3/1] object-cover rounded shadow-lg pointer-events-none opacity-0 group-hover/ad:opacity-100 transform transition-all duration-200 ease-in-out" />
                        </div>
                      </div>
                    </div>
                  )}
                  {!isLoading && (
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 text-gray-500 pointer-events-auto">
                        <button type="button" className="p-1.5 hover:bg-gray-100 rounded-full"><PaperclipIcon className="w-5 h-5" /></button>
                        <button type="button" className="p-1.5 hover:bg-gray-100 rounded-full"><AILogoIcon className="w-5 h-5" /></button>
                        <button type="button" className="p-1.5 hover:bg-gray-100 rounded-full"><MicrophoneIcon className="w-5 h-5" /></button>
                        <button type="button" className="p-1.5 hover:bg-gray-100 rounded-full"><SettingsIcon className="w-5 h-5" /></button>
                    </div>
                  )}
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={inputValue ? "Ask me anything..." : ""}
                    className={`w-full h-full p-4 pb-12 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none pr-12 ${!inputValue ? 'bg-transparent caret-gray-800' : 'bg-white'}`}
                    disabled={isLoading}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSubmit(e); }}
                  />
                  {!!inputValue && !isLoading && (
                    <button type="submit" className="absolute right-3 bottom-3 p-2 rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 animate-in fade-in duration-300">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.428A1 1 0 009 15.571V11.5a1 1 0 012 0v4.071a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                    </button>
                  )}
                </div>
              </form>
              <p className="text-xs text-center text-gray-400 mt-3">
                  Tip: Hover your mouse over the "Compute cost supported by Nike Running" text to see the ad.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default DemoSection;