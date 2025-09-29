import React, { useState, useCallback } from 'react';
import { SignatureResult, SignatureOptions } from '../types';
import { generateSignature } from '../services/geminiService';
import FileUploader from './FileUploader';
import LoadingSpinner from './LoadingSpinner';
import ResultDisplay from './ResultDisplay';
import SignatureOptionsForm from './SignatureOptions';

const SignatureCreator: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SignatureResult | null>(null);
  const [signatureOptions, setSignatureOptions] = useState<SignatureOptions | null>(null);

  const handleFileChange = useCallback((selectedFile: File | null) => {
    setFile(selectedFile);
    setResult(null);
    setError(null);
  }, []);

  const handleOptionsChange = useCallback((options: SignatureOptions) => {
    setSignatureOptions(options);
  }, []);

  const handleGenerateSignature = async () => {
    if (!file) {
      setError("Please select a file first.");
      return;
    }
    if (!signatureOptions) {
      setError("Signature options are not set.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const signatureResult = await generateSignature(file, signatureOptions);
      setResult(signatureResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(`Signature generation failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold text-center text-blue-300">Create a New Digital Signature</h2>
      <p className="text-center text-gray-400 -mt-4">
        Upload your document, select your desired options, and we'll generate a unique signature.
      </p>
      
      <FileUploader onFileChange={handleFileChange} />

      <SignatureOptionsForm onChange={handleOptionsChange} disabled={isLoading} />



      <button
        onClick={handleGenerateSignature}
        disabled={!file || isLoading}
        className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-300 flex items-center justify-center shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
      >
        {isLoading ? (
          <>
            <LoadingSpinner />
            <span>Generating...</span>
          </>
        ) : (
          'Generate Signature'
        )}
      </button>

      {error && <ResultDisplay type="error" message={error} />}
      {result && (
        <ResultDisplay
          type="success"
          message="Signature generated successfully!"
          signatureResult={result}
          originalFileName={file?.name}
        />
      )}
    </div>
  );
};

export default SignatureCreator;