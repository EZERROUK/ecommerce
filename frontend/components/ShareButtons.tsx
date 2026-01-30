
import React, { useState, useEffect, useRef } from 'react';
import { Share2, Link as LinkIcon, Facebook, Linkedin, Instagram, MessageCircle, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ShareButtonsProps {
  title: string;
  url?: string;
}

export const ShareButtons: React.FC<ShareButtonsProps> = ({ title, url }) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  
  // Ensure we have a valid absolute URL for sharing
  const getValidUrl = () => {
      if (!shareUrl) return '';
      try {
          return new URL(shareUrl, window.location.origin).href;
      } catch (e) {
          return '';
      }
  };

  const validShareUrl = getValidUrl();
  const encodedUrl = encodeURIComponent(validShareUrl);
  const encodedTitle = encodeURIComponent(title);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNativeShare = async () => {
    // Only attempt native share if supported and URL is valid http(s)
    const canShare = navigator.share && validShareUrl && (validShareUrl.startsWith('http'));

    if (canShare) {
      try {
        await navigator.share({
          title: title,
          url: validShareUrl,
        });
      } catch (err) {
        // Fallback to menu if cancelled or failed
        setIsOpen(true);
      }
    } else {
      setIsOpen(prev => !prev);
    }
  };

  const copyToClipboard = async (msgOverride?: string) => {
    try {
      await navigator.clipboard.writeText(validShareUrl);
      setToastMessage(msgOverride || t('common.share.linkCopied'));
      setShowCopyToast(true);
      setTimeout(() => setShowCopyToast(false), 3000);
      setIsOpen(false);
    } catch (err) {
      setToastMessage(t('common.share.copyError'));
      setShowCopyToast(true);
    }
  };

  const handleInstagram = () => {
    copyToClipboard(t('common.share.instaMessage'));
  };

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button 
        onClick={handleNativeShare}
        className="text-gray-400 hover:text-corporate-blue transition-colors p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-corporate-blue focus:ring-opacity-50"
        title={t('common.share.title')}
        aria-label={t('common.share.title')}
      >
        <Share2 className="w-5 h-5" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 transform origin-top-right animate-fade-in-up">
          <div className="p-3 bg-gray-50 border-b border-gray-100 rounded-t-xl flex justify-between items-center">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('common.share.title')}</span>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="p-2 space-y-1">
            {/* WhatsApp */}
            <a 
              href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg transition-colors group"
            >
              <div className="p-1.5 bg-green-100 text-green-600 rounded-full mr-3 group-hover:bg-green-200">
                 <MessageCircle className="w-4 h-4" />
              </div>
              WhatsApp
            </a>

            {/* LinkedIn */}
            <a 
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors group"
            >
              <div className="p-1.5 bg-blue-100 text-blue-600 rounded-full mr-3 group-hover:bg-blue-200">
                <Linkedin className="w-4 h-4" />
              </div>
              LinkedIn
            </a>

            {/* Facebook */}
            <a 
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-800 rounded-lg transition-colors group"
            >
              <div className="p-1.5 bg-blue-100 text-blue-800 rounded-full mr-3 group-hover:bg-blue-200">
                <Facebook className="w-4 h-4" />
              </div>
              Facebook
            </a>

            {/* Instagram (Copy Link Fallback) */}
            <button 
              onClick={handleInstagram}
              className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-600 rounded-lg transition-colors group text-left"
            >
              <div className="p-1.5 bg-pink-100 text-pink-600 rounded-full mr-3 group-hover:bg-pink-200">
                <Instagram className="w-4 h-4" />
              </div>
              Instagram
            </button>

            <div className="border-t border-gray-100 my-1"></div>

            {/* Copy Link */}
            <button 
              onClick={() => copyToClipboard()}
              className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors group"
            >
              <LinkIcon className="w-4 h-4 mr-3 text-gray-400 group-hover:text-corporate-blue" />
              {t('common.share.copyLink')}
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showCopyToast && (
        <div className="absolute top-full right-0 mt-3 w-max max-w-[200px] bg-gray-900 text-white text-xs py-2 px-3 rounded-lg shadow-lg z-50 animate-fade-in text-center">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
