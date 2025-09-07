import React, { useState, useCallback } from 'react';
import { VerificationResult } from '../types';
import { verifySignature } from '../services/geminiService';
import FileUploader from './FileUploader';
import LoadingSpinner from './LoadingSpinner';
import ResultDisplay from './ResultDisplay';
import { calculateSha256 } from '../utils/fileUtils';

const SignatureVerifier: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [signature, setSignature] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const handleFileChange = useCallback((selectedFile: File | null) => {
    setFile(selectedFile);
    setResult(null);
    setError(null);
  }, []);
  
  const handleVerifySignature = async () => {
    if (!file || !signature) {
      setError("Please select a file and provide the signature.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const documentHash = await calculateSha256(file);
      const verificationResult = await verifySignature(documentHash, signature);
      setResult(verificationResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(`Signature verification failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold text-center text-blue-300">Verify an Existing Signature</h2>
      <p className="text-center text-gray-400 -mt-4">
        Upload the original document and paste the signature block to confirm its authenticity.
      </p>
      
      <FileUploader onFileChange={handleFileChange} />

      <div>
        <label htmlFor="signature" className="block text-sm font-medium text-gray-300 mb-2">
          Signature Block
        </label>
        <textarea
          id="signature"
          rows={5}
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
          placeholder="Paste the full signature JSON block here..."
          className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
      </div>

      <button
        onClick={handleVerifySignature}
        disabled={!file || !signature || isLoading}
        className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-300 flex items-center justify-center shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
      >
        {isLoading ? (
          <>
            <LoadingSpinner />
            <span>Verifying...</span>
          </>
        ) : (
          'Verify Signature'
        )}
      </button>

      {error && <ResultDisplay type="error" message={error} />}
      {result && (
         <ResultDisplay
            type={result.isValid ? 'success' : 'error'}
            message={result.message}
          />
      )}
    </div>
  );
};

export default SignatureVerifier;
