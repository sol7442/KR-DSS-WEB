import React, { useState, useCallback } from 'react';
import { VerificationResult, ValidationPolicy } from '../types';
import { verifySignature, verifyEnvelopedSignature } from '../services/geminiService';
import FileUploader from './FileUploader';
import LoadingSpinner from './LoadingSpinner';
import ResultDisplay from './ResultDisplay';
import VerificationResultsTabs from './VerificationResultsTabs';
import ValidationPolicyForm from './ValidationPolicyForm';

type VerificationMode = 'detached' | 'enveloped';

const SignatureVerifier: React.FC = () => {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signedFile, setSignedFile] = useState<File | null>(null);
  const [verificationMode, setVerificationMode] = useState<VerificationMode>('detached');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [validationPolicy, setValidationPolicy] = useState<ValidationPolicy | null>(null);

  const resetState = () => {
    setResult(null);
    setError(null);
    setOriginalFile(null);
    setSignatureFile(null);
    setSignedFile(null);
  }

  const handleModeChange = (mode: VerificationMode) => {
    setVerificationMode(mode);
    resetState();
  };
  
  const handleOriginalFileChange = useCallback((selectedFile: File | null) => {
    setOriginalFile(selectedFile);
    setResult(null);
    setError(null);
  }, []);

  const handleSignatureFileChange = useCallback((selectedFile: File | null) => {
    setSignatureFile(selectedFile);
    setResult(null);
    setError(null);
  }, []);

  const handleSignedFileChange = useCallback((selectedFile: File | null) => {
    setSignedFile(selectedFile);
    setResult(null);
    setError(null);
  }, []);
  
  const handlePolicyChange = useCallback((policy: ValidationPolicy) => {
    setValidationPolicy(policy);
  }, []);
  
  const handleVerifySignature = async () => {
    if (!validationPolicy) {
      setError("Please configure the validation policy.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      if (verificationMode === 'detached') {
        if (!originalFile || !signatureFile) {
          throw new Error("Please provide both the original document and the signature file.");
        }
        const verificationResult = await verifySignature(originalFile, signatureFile, validationPolicy);
        setResult(verificationResult);
      } else { // enveloped mode
        if (!signedFile) {
          throw new Error("Please provide the signed document.");
        }
        const verificationResult = await verifyEnvelopedSignature(signedFile, validationPolicy);
        setResult(verificationResult);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(`Signature verification failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getModeButtonClass = (mode: VerificationMode) => {
    return `w-1/2 py-2 px-4 text-sm font-semibold rounded-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 ${
      verificationMode === mode
        ? 'bg-blue-600 text-white shadow'
        : 'text-gray-300 hover:bg-gray-700/50'
    }`;
  }
  
  const isButtonDisabled = isLoading || !validationPolicy ||
    (verificationMode === 'detached' && (!originalFile || !signatureFile)) ||
    (verificationMode === 'enveloped' && !signedFile);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold text-center text-blue-300">Verify an Existing Signature</h2>
      <p className="text-center text-gray-400 -mt-4">
        Upload the document(s) and set validation constraints to confirm authenticity.
      </p>

      <div className="w-full max-w-sm mx-auto">
        <label className="block text-sm font-medium text-gray-300 mb-2 text-center">Verification Type</label>
        <div className="flex bg-gray-900 p-1 rounded-lg border border-gray-700">
          <button onClick={() => handleModeChange('detached')} className={getModeButtonClass('detached')}>
            Detached
          </button>
          <button onClick={() => handleModeChange('enveloped')} className={getModeButtonClass('enveloped')}>
            Enveloped
          </button>
        </div>
      </div>
      
      {verificationMode === 'detached' && (
        <div className="grid md:grid-cols-2 gap-6 items-start">
          <div className="flex flex-col gap-2">
            <label className="block text-sm font-medium text-gray-300 text-center md:text-left">
              1. Original Document
            </label>
            <FileUploader 
              onFileChange={handleOriginalFileChange}
              fileTypeDescription="The document that was signed"
              placeholder="Click to upload original document"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="block text-sm font-medium text-gray-300 text-center md:text-left">
              2. Signature File
            </label>
            <FileUploader
              onFileChange={handleSignatureFileChange}
              accept=".json,.p7s,.xml"
              fileTypeDescription="Signature file (.json, .p7s, .xml)"
              placeholder="Click to upload signature file"
            />
          </div>
        </div>
      )}

      {verificationMode === 'enveloped' && (
        <div className="flex flex-col gap-2">
          <label className="block text-sm font-medium text-gray-300 text-center">
            Signed Document
          </label>
          <FileUploader
            onFileChange={handleSignedFileChange}
            accept=".pdf,.xml,.p7s,.json"
            fileTypeDescription="e.g., signed PDF, XML, P7S container"
            placeholder="Click to upload a signed document"
          />
        </div>
      )}

      <ValidationPolicyForm onChange={handlePolicyChange} disabled={isLoading} />

      <button
        onClick={handleVerifySignature}
        disabled={isButtonDisabled}
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
      {result && <VerificationResultsTabs result={result} />}
    </div>
  );
};

export default SignatureVerifier;