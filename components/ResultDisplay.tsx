
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

  const signatureResultStr  = signatureResult ? JSON.stringify(signatureResult, null, 2) : '';

  const handleCopy = () => {
    if (signatureResult) {
      navigator.clipboard.writeText(signatureResultStr);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

const handleDownload = () => {
  if (signatureResult?.documentBase64) {
    // base64 → 바이너리 변환
    const byteCharacters = atob(signatureResult.documentBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    // 파일 형식 추론
    let mimeType = 'application/octet-stream';
    let extension = '.bin';

    if (signatureResult.fileName?.endsWith('.pdf')) {
      mimeType = 'application/pdf';
      extension = '.pdf';
    } else if (signatureResult.fileName?.endsWith('.json')) {
      mimeType = 'application/json';
      extension = '.json';
    } else if (signatureResult.fileName?.endsWith('.p7s') || signatureResult.fileName?.endsWith('.p7m')) {
      mimeType = 'application/pkcs7-signature';
      extension = '.p7s';
    } else if (signatureResult.fileName?.endsWith('.xml')) {
      mimeType = 'application/xml';
      extension = '.xml';
    }

    // Blob 생성
    const blob = new Blob([byteArray], { type: mimeType });

    // 파일명 지정 (fileName 없으면 originalFileName 기반)
    const baseName =
      originalFileName && originalFileName.includes('.')
        ? originalFileName.substring(0, originalFileName.lastIndexOf('.'))
        : originalFileName || 'document';

    const fileName = signatureResult.fileName || baseName + extension;

    // 다운로드 실행
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
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
            <code>
              Result: {signatureResult.result}{"\n"}
              FileName: {signatureResult.fileName}
            </code>
          </pre>          <div className="absolute top-2 right-2 flex gap-2">
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