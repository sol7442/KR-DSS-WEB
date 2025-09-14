
import React, { useState } from 'react';
import { SignatureResult } from '../types';
import { CheckCircleIcon, XCircleIcon, ClipboardIcon, ClipboardCheckIcon, DownloadIcon } from './Icons';

interface ResultDisplayProps {
  type: 'success' | 'error';
  message: string;
  signatureResult?: SignatureResult;
  originalFileName?: string;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ type, message, signatureResult, originalFileName }) => {
  const [isCopied, setIsCopied] = useState(false);
  const isSuccess = type === 'success';

  const signatureString = signatureResult ? JSON.stringify(signatureResult, null, 2) : '';

  const handleCopy = () => {
    if (signatureString) {
      navigator.clipboard.writeText(signatureString);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (signatureString) {
      const blob = new Blob([signatureString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const baseName = originalFileName ? originalFileName.substring(0, originalFileName.lastIndexOf('.')) || originalFileName : 'document';
      a.download = `${baseName}.signature.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const bgColor = isSuccess ? 'bg-green-900/50' : 'bg-red-900/50';
  const borderColor = isSuccess ? 'border-green-500' : 'border-red-500';
  const textColor = isSuccess ? 'text-green-300' : 'text-red-300';
  const Icon = isSuccess ? CheckCircleIcon : XCircleIcon;

  return (
    <div className={`w-full p-4 rounded-lg border ${bgColor} ${borderColor}`}>
      <div className="flex items-center">
        <Icon className={`w-6 h-6 mr-3 ${textColor}`} />
        <p className={`font-semibold ${textColor}`}>{message}</p>
      </div>
      {signatureResult && (
        <div className="mt-4 relative bg-gray-900 p-4 rounded-md">
          <pre className="text-sm text-gray-200 whitespace-pre-wrap break-all">
            <code>{signatureString}</code>
          </pre>
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              onClick={handleDownload}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
              title="Download signature file"
            >
              <DownloadIcon className="w-5 h-5 text-gray-300" />
            </button>
            <button
              onClick={handleCopy}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
              title="Copy to clipboard"
            >
              {isCopied ? (
                <ClipboardCheckIcon className="w-5 h-5 text-green-400" />
              ) : (
                <ClipboardIcon className="w-5 h-5 text-gray-300" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultDisplay;