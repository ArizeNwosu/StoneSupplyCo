import React, { useState, useRef } from 'react';
import type { Campaign, KeywordTarget } from '../App';
import { PaperclipIcon } from './icons/PaperclipIcon';
import { AILogoIcon } from './icons/AILogoIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { SettingsIcon } from './icons/SettingsIcon';

export type AdFormat =
  | 'ghost'
  | 'micro-tag'
  | 'ephemeral'
  | 'embed'
  | 'outer-tag'
  | 'output-unit';

interface PromptInputAreaProps {
  adFormat: AdFormat;
  sponsor: Campaign | null;
  value: string;
  onChange: (value: string) => void;
  onSponsorClick: (campaignId: number, keyword: KeywordTarget) => void;
  onPromptSubmit: (prompt: string) => void;
  isLoading?: boolean;
}

// Mock sponsors for consistent demoing if no real sponsor is passed
export const MOCK_SPONSORS: { [key in AdFormat]: Campaign } = {
    // FIX: Added biddingStrategy to all mock campaigns to satisfy the Campaign interface.
    'ghost': { id: 999, advertiserName: 'Nike Running', logoUrl: "https://picsum.photos/seed/acme/32/32", adCreativeImageUrl: "https://cdn.shopify.com/s/files/1/0810/7540/5080/files/test-ghost-ad-300x100.jpg?v=1763203010", linkUrl: '#', name: '', dailyBudget: 0, startDate: '', endDate: null, maxBid: 0, biddingStrategy: 'cpm', targetingKeywords: [], negativeKeywords: [], status: 'Active' },
    'micro-tag': { id: 998, advertiserName: 'NimbusAI', logoUrl: "https://picsum.photos/seed/nimbus/32/32", adCreativeImageUrl: "https://cdn.shopify.com/s/files/1/0810/7540/5080/files/test-ghost-ad-300x100.jpg?v=1763203010", linkUrl: '#', name: '', dailyBudget: 0, startDate: '', endDate: null, maxBid: 0, biddingStrategy: 'cpm', targetingKeywords: [], negativeKeywords: [], status: 'Active' },
    'ephemeral': { id: 997, advertiserName: 'Contoso Compute', logoUrl: "https://picsum.photos/seed/contoso/32/32", adCreativeImageUrl: "https://cdn.shopify.com/s/files/1/0810/7540/5080/files/test-ghost-ad-300x100.jpg?v=1763203010", linkUrl: '#', name: '', dailyBudget: 0, startDate: '', endDate: null, maxBid: 0, biddingStrategy: 'cpm', targetingKeywords: [], negativeKeywords: [], status: 'Active' },
    'embed': { id: 996, advertiserName: 'Ad Sponsor Inc.', logoUrl: "https://picsum.photos/seed/adsponsor/32/32", adCreativeImageUrl: "https://cdn.shopify.com/s/files/1/0810/7540/5080/files/test-ghost-ad-300x100.jpg?v=1763203010", linkUrl: '#', name: '', dailyBudget: 0, startDate: '', endDate: null, maxBid: 0, biddingStrategy: 'cpm', targetingKeywords: [], negativeKeywords: [], status: 'Active' },
    'outer-tag': { id: 995, advertiserName: 'Apex Compute', logoUrl: "https://picsum.photos/seed/apex/32/32", adCreativeImageUrl: "https://cdn.shopify.com/s/files/1/0810/7540/5080/files/test-ghost-ad-300x100.jpg?v=1763203010", linkUrl: '#', name: '', dailyBudget: 0, startDate: '', endDate: null, maxBid: 0, biddingStrategy: 'cpm', targetingKeywords: [], negativeKeywords: [], status: 'Active' },
    'output-unit': { id: 994, advertiserName: 'SponsorCo', logoUrl: "https://picsum.photos/seed/sponsorco/32/32", adCreativeImageUrl: "https://cdn.shopify.com/s/files/1/0810/7540/5080/files/test-ghost-ad-300x100.jpg?v=1763203010", linkUrl: '#', name: '', dailyBudget: 0, startDate: '', endDate: null, maxBid: 0, biddingStrategy: 'cpm', targetingKeywords: [], negativeKeywords: [], status: 'Active' },
};

export const PromptInputArea: React.FC<PromptInputAreaProps> = ({ adFormat, sponsor, value, onChange, onSponsorClick, onPromptSubmit, isLoading = false }) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const activeSponsor = sponsor || MOCK_SPONSORS[adFormat];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedValue = value.trim();
        if (!trimmedValue || isLoading) return;
        onPromptSubmit(trimmedValue);
    };
    
    const handleContainerClick = () => {
        if (isLoading) return;
        inputRef.current?.focus();
    };

    const handleAdClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        onSponsorClick(activeSponsor.id, { text: 'in-prompt-ad', matchType: 'Broad' });
        window.open(activeSponsor.linkUrl, '_blank');
    };
    
    const renderAdUnit = () => {
        const showPostSubmitAd = isLoading && !value;

        switch (adFormat) {
            case 'ghost':
            case 'output-unit':
                return null;
            case 'micro-tag':
                return (
                    <div className="absolute top-1.5 right-3 text-xs text-gray-400 opacity-40 group-hover:opacity-100 group-focus-within:opacity-30 transition-opacity pointer-events-none">
                        Compute partner: {activeSponsor.advertiserName}
                    </div>
                );
            case 'ephemeral':
                if (showPostSubmitAd) {
                    return (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm italic pointer-events-none">
                            Request powered in part by {activeSponsor.advertiserName}
                        </div>
                    );
                }
                return null;
            case 'embed':
                 if (showPostSubmitAd) {
                    return (
                        <div 
                            className="absolute inset-0 flex flex-col justify-center items-center p-2 cursor-pointer"
                            onClick={handleAdClick}
                            role="button"
                            tabIndex={0}
                            aria-label={`Advertisement from ${activeSponsor.advertiserName}`}
                         >
                            <div className="w-full h-2 mb-1"></div> {/* Spacer */}
                            <img
                                src={activeSponsor.adCreativeImageUrl}
                                alt="Embedded advertisement"
                                className="w-full h-full object-contain rounded"
                            />
                        </div>
                    );
                }
                return null;
            case 'outer-tag':
                return (
                    <div className={`absolute -bottom-5 right-0 text-xs text-gray-500 transition-opacity ${isFocused ? 'opacity-40' : 'opacity-100'}`}>
                        Powered by {activeSponsor.advertiserName}
                    </div>
                );
            default:
                return null;
        }
    };
    
    const getInputPadding = () => {
        if (adFormat === 'micro-tag') return 'pr-40'; // Extra padding for inner tag
        return 'pr-12'; // Default padding for send button
    };

    const getTextAreaBgClass = () => {
      if (isLoading) {
        return 'bg-gray-50 cursor-pointer';
      }
      if (adFormat === 'ghost' && !value) {
        return 'bg-transparent caret-gray-800';
      }
      return 'bg-white';
    };

    return (
        <form onSubmit={handleSubmit} className="w-full">
            <div className="relative group h-56" onClick={handleContainerClick} role="presentation">
                 {adFormat === 'ghost' && !value && !isLoading && (
                    <div className="absolute inset-0 p-4 text-gray-500 pointer-events-none flex flex-col justify-between">
                        <div>
                            <span>Type your prompt...</span>
                        </div>
                        <div className="space-y-3">
                            <div className="group/ad relative w-full max-w-[300px] pointer-events-auto">
                                <a
                                    href={activeSponsor.linkUrl}
                                    onClick={handleAdClick}
                                    className="text-sm text-gray-400"
                                    tabIndex={0}
                                >
                                    Supported by <span className="font-semibold text-gray-500 group-hover/ad:underline">{activeSponsor.advertiserName}</span>
                                </a>
                                <img
                                    src={activeSponsor.adCreativeImageUrl}
                                    alt={`${activeSponsor.advertiserName} ad`}
                                    className="absolute bottom-full left-0 mb-2 w-full max-w-[300px] h-auto aspect-[3/1] object-cover rounded shadow-lg pointer-events-none opacity-0 group-hover/ad:opacity-100 transform transition-all duration-200 ease-in-out translate-y-2 group-hover/ad:translate-y-0"
                                />
                            </div>
                            <div className="flex items-center gap-2 text-gray-500 pointer-events-auto">
                                 <button type="button" className="p-1.5 hover:bg-gray-100 rounded-full" aria-label="Attach file">
                                    <PaperclipIcon className="w-5 h-5" />
                                </button>
                                <button type="button" className="p-1.5 hover:bg-gray-100 rounded-full" aria-label="Choose model">
                                    <AILogoIcon className="w-5 h-5" />
                                </button>
                                <button type="button" className="p-1.5 hover:bg-gray-100 rounded-full" aria-label="Use voice">
                                    <MicrophoneIcon className="w-5 h-5" />
                                </button>
                                <button type="button" className="p-1.5 hover:bg-gray-100 rounded-full" aria-label="Settings">
                                    <SettingsIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                <textarea
                    ref={inputRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={adFormat === 'ghost' || isLoading ? '' : "Type your prompt..."}
                    className={`w-full h-full p-4 border rounded-lg shadow-sm transition-colors focus:ring-2 focus:ring-blue-400 focus:outline-none resize-none ${getInputPadding()} ${getTextAreaBgClass()}`}
                    disabled={isLoading}
                    aria-label="Prompt input"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit(e);
                      }
                    }}
                />
                
                {renderAdUnit()}

                {!isLoading && !!value.trim() && (
                  <button 
                    type="submit" 
                    className="absolute right-3 bottom-3 p-2 rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed" 
                    disabled={!value.trim()}
                    aria-label="Submit prompt"
                   >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.428A1 1 0 009 15.571V11.5a1 1 0 012 0v4.071a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                      </svg>
                  </button>
                )}
            </div>
        </form>
    );
};