import React, { useMemo, useState } from 'react';
import { VerificationResult } from '../../types';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, ClipboardIcon, ClipboardCheckIcon } from '../Icons';

interface SimpleReportProps {
  simpleReport: VerificationResult['simpleReport'];
  fileName: string | null;
  downloadUrl: string | null;
}

const SimpleReport: React.FC<SimpleReportProps> = ({ simpleReport, fileName, downloadUrl }) => {
  const [isCopied, setIsCopied] = useState(false);

  if (!simpleReport) {
    return (
      <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700 text-gray-200">
        Simple Report 정보를 표시할 수 없습니다.
      </div>
    );
  }

  const isSuccess = simpleReport.indication === 'TOTAL_PASSED';
  const isFailure = simpleReport.indication === 'TOTAL_FAILED';

  const Icon = isSuccess ? CheckCircleIcon : isFailure ? XCircleIcon : InformationCircleIcon;
  const colorClass = isSuccess ? 'text-green-400' : isFailure ? 'text-red-400' : 'text-yellow-400';
  const bgColorClass = isSuccess ? 'bg-green-900/50' : isFailure ? 'bg-red-900/50' : 'bg-yellow-900/50';

  const simpleDownloadUrl = useMemo(() => {
    if (!fileName) return null;
    const encoded = encodeURIComponent(fileName);

    if (downloadUrl) {
      const base = downloadUrl.endsWith('/') ? downloadUrl : `${downloadUrl}/`;
      const normalized = base.startsWith('/kr-dss')
        ? base
        : `/kr-dss${base.startsWith('/') ? '' : '/'}${base}`;
      return `${normalized}simple/${encoded}`;
    }
    return `/kr-dss/api/verify/reports/simple/${encoded}`;
  }, [downloadUrl, fileName]);

  const triggerDownload = () => {
    if (!simpleDownloadUrl) return;
    const a = document.createElement('a');
    a.href = simpleDownloadUrl;
    a.download = ''; // Content-Disposition 사용
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const copyText = useMemo(() => {
    const lines: string[] = [];
    lines.push('[Simple Report]');
    lines.push(`indication: ${simpleReport.indication}`);
    if (simpleReport.subIndication) lines.push(`subIndication: ${simpleReport.subIndication}`);
    if (simpleReport.validationTime) lines.push(`validationTime: ${simpleReport.validationTime}`);
    lines.push(`signatureCount: ${simpleReport.signatureCount}`);
    if (simpleReport.message) lines.push(`message: ${simpleReport.message}`);
    return lines.join('\n');
  }, [simpleReport]);

  const handleCopy = () => {
    if (!copyText) return;
    navigator.clipboard.writeText(copyText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const canDownload = Boolean(fileName && simpleDownloadUrl);

  return (
    <div>
      {/* 제목 + 버튼 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-blue-300">Simple Report</h3>

        <div className="flex items-center gap-2">
          <button
            onClick={triggerDownload}
            disabled={!canDownload}
            className={`px-3 py-2 rounded-md text-sm border transition-colors
              ${canDownload
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-600'
                : 'bg-gray-900 text-gray-500 border-gray-800 cursor-not-allowed'}
            `}
            title={!fileName ? 'fileName이 없어 다운로드할 수 없습니다.' : 'Simple 리포트 다운로드'}
          >
            Download
          </button>

          <button
            onClick={handleCopy}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
            title="Copy summary to clipboard"
            disabled={!copyText}
          >
            {isCopied ? (
              <ClipboardCheckIcon className="w-5 h-5 text-green-400" />
            ) : (
              <ClipboardIcon className="w-5 h-5 text-gray-300" />
            )}
          </button>
        </div>
      </div>

      {/* 본문 (기존 그대로) */}
      <div className={`flex flex-col items-center justify-center p-8 rounded-lg ${bgColorClass} text-center`}>
        <Icon className={`w-20 h-20 ${colorClass}`} />
        <h3 className={`mt-4 text-2xl font-bold ${colorClass}`}>
          {simpleReport.indication.replace('_', ' ')}
        </h3>
        <p className="mt-2 text-gray-300 max-w-md whitespace-pre-line">{simpleReport.message}</p>
      </div>
    </div>
  );
};

export default SimpleReport;
