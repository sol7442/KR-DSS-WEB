import React, { useState } from 'react';
import { ClipboardIcon, ClipboardCheckIcon } from '../Icons';

interface EtsValidationReportProps {
  etsValidationReport: string;
}

const EtsValidationReport: React.FC<EtsValidationReportProps> = ({ etsValidationReport }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(etsValidationReport);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div>
      <h3 className="text-xl font-bold text-blue-300 mb-4">ETS Validation Report</h3>
      <div className="relative bg-gray-900 p-4 rounded-md border border-gray-700">
        <pre className="text-sm text-gray-200 whitespace-pre-wrap break-all">
          <code>{etsValidationReport}</code>
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
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
  );
};

export default EtsValidationReport;
