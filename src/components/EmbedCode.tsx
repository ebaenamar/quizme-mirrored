'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface EmbedCodeProps {
  quizId: string;
  onSave?: (domain: string) => void;
}

export default function EmbedCode({ quizId, onSave }: EmbedCodeProps) {
  const [domain, setDomain] = useState('');
  const [embedCode, setEmbedCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const generateEmbedCode = () => {
    // Basic embed code with styling to match the desired look
    const code = `<iframe 
  src="${window.location.origin}/embed/${quizId}" 
  width="100%" 
  height="600px" 
  frameborder="0"
  style="border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);"
  allow="clipboard-write"
></iframe>`;
    
    setEmbedCode(code);
  };

  const saveAllowedDomain = async () => {
    if (!domain && !showAdvanced) {
      // If no domain is specified and not in advanced mode, just generate the code
      generateEmbedCode();
      return;
    }

    if (domain) {
      try {
        // Save the allowed domain to the database
        const response = await fetch(`/api/public/embed/${quizId}/domains`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain })
        });
        
        if (response.ok) {
          generateEmbedCode();
          if (onSave) {
            onSave(domain);
          }
        } else {
          console.error('Failed to save domain');
        }
      } catch (error) {
        console.error('Error saving domain:', error);
      }
    } else {
      generateEmbedCode();
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="embed-code-generator bg-white rounded-xl p-6 shadow-lg">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Embed This Quiz</h3>
      
      <p className="text-gray-600 mb-6">
        Share this quiz on your website or blog by embedding the code below.
      </p>
      
      <button 
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-blue-600 hover:text-blue-800 text-sm mb-4 flex items-center"
      >
        {showAdvanced ? '- Hide Advanced Options' : '+ Show Advanced Options'}
      </button>
      
      {showAdvanced && (
        <div className="mb-4 bg-gray-50 p-4 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Restrict to Domain (Optional):
          </label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={domain} 
              onChange={(e) => setDomain(e.target.value)}
              placeholder="example.com"
              className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Leave blank to allow embedding on any domain
          </p>
        </div>
      )}
      
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={saveAllowedDomain}
        className="w-full py-3 px-6 mb-6 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-lg font-semibold
                 transition-all duration-200 hover:from-blue-600 hover:to-blue-800 active:opacity-90"
      >
        Generate Embed Code
      </motion.button>
      
      {embedCode && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Embed Code:
          </label>
          <div className="relative">
            <textarea 
              readOnly 
              value={embedCode}
              className="w-full h-32 p-3 border border-gray-300 rounded-md font-mono text-sm bg-gray-50"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={copyToClipboard}
              className="absolute top-2 right-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-md text-sm hover:bg-blue-200"
            >
              {copied ? 'Copied!' : 'Copy'}
            </motion.button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Paste this code into your website where you want the quiz to appear.
          </p>
        </div>
      )}
    </div>
  );
}
