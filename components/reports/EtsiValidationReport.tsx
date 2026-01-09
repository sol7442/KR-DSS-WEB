import React, { useMemo, useState } from 'react';
import { ClipboardIcon, ClipboardCheckIcon } from '../Icons';

type VerificationStatus = 'TOTAL_PASSED' | 'PASSED' | 'TOTAL_FAILED' | 'FAILED' | 'INDETERMINATE';

interface EtsiValidationReportInfo {
  available: boolean;
  message: string | null;
  mainIndication: VerificationStatus | null;
  validationTime: string | null;
  poeTime: string | null;
  policy: string | null;
  algorithm: string | null;
  signerInfo: string | null;
  cert: string | null;
  certNotAfter: string | null;
  timeStampEvidence: string | null;
}

interface EtsiValidationReportProps {
  etsiValidationReport: EtsiValidationReportInfo | null;
  fileName: string | null;      
  backendBase: string;          
}

const EtsiValidationReport: React.FC<EtsiValidationReportProps> = ({
  etsiValidationReport,
  fileName,
  downloadUrl,
}) => {
  const [isCopied, setIsCopied] = useState(false);

  const isAvailable = Boolean(etsiValidationReport?.available);
  const indication = etsiValidationReport?.mainIndication ?? 'INDETERMINATE';
  const isPassed = /passed/i.test(indication);

  const canDownload = Boolean(fileName);

  // backendAddr/kr-dss/api/verify/reports/etsi/{fileName}
  const etsiDownloadUrl = useMemo(() => {
    if (!fileName) return null;
    return `/kr-dss${downloadUrl}/etsi/${encodeURIComponent(fileName)}`;
  }, [downloadUrl, fileName]);

  const triggerDownload = () => {
    if (!etsiDownloadUrl) return;
    const a = document.createElement('a');
    a.href = etsiDownloadUrl;
    a.download = ''; // 서버 Content-Disposition 사용
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const copyText = useMemo(() => {
    if (!etsiValidationReport) return '';
    const lines: string[] = [];
    lines.push(`[ETSI Validation Report Summary]`);
    lines.push(`available: ${etsiValidationReport.available}`);
    if (etsiValidationReport.mainIndication) lines.push(`mainIndication: ${etsiValidationReport.mainIndication}`);
    if (etsiValidationReport.validationTime) lines.push(`validationTime: ${etsiValidationReport.validationTime}`);
    if (etsiValidationReport.poeTime) lines.push(`poeTime: ${etsiValidationReport.poeTime}`);
    if (etsiValidationReport.policy) lines.push(`policy: ${etsiValidationReport.policy}`);
    if (etsiValidationReport.algorithm) lines.push(`algorithm: ${etsiValidationReport.algorithm}`);
    if (etsiValidationReport.signerInfo) lines.push(`signerInfo: ${etsiValidationReport.signerInfo}`);
    if (etsiValidationReport.cert) lines.push(`cert: ${etsiValidationReport.cert}`);
    if (etsiValidationReport.certNotAfter) lines.push(`certNotAfter: ${etsiValidationReport.certNotAfter}`);
    if (etsiValidationReport.timeStampEvidence) lines.push(`timeStampEvidence: ${etsiValidationReport.timeStampEvidence}`);
    if (etsiValidationReport.message) lines.push(`message: ${etsiValidationReport.message}`);
    return lines.join('\n');
  }, [etsiValidationReport]);

  const handleCopy = () => {
    if (!copyText) return;
    navigator.clipboard.writeText(copyText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!etsiValidationReport || !isAvailable) {
    return (
      <div>
        <h3 className="text-xl font-bold text-blue-300 mb-4">ETSI Validation Report</h3>
        <div className="bg-gray-900 p-4 rounded-md border border-gray-700 text-gray-200">
          ETSI Validation Report 요약 정보를 제공할 수 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-blue-300">ETSI Validation Report</h3>

        <div className="flex items-center gap-2">
          <button
            onClick={triggerDownload}
            disabled={!canDownload || !etsiDownloadUrl}
            className={`px-3 py-2 rounded-md text-sm border transition-colors
              ${canDownload ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-900 text-gray-500 border-gray-800 cursor-not-allowed'}
            `}
            title={!canDownload ? 'fileName이 없어 다운로드할 수 없습니다.' : 'ETSI 리포트 다운로드'}
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

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="px-2 py-1 rounded-md bg-gray-800 text-gray-200 text-xs border border-gray-600">
          <strong>Signer:</strong> {etsiValidationReport.signerInfo ?? 'N/A'}
        </span>

        {/* <span className="px-2 py-1 rounded-md bg-gray-800 text-gray-200 text-xs border border-gray-600">
          <strong>Policy:</strong> {etsiValidationReport.policy ?? 'N/A'}
        </span> */}

        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold border ${
            isPassed
              ? 'bg-green-800/20 text-green-300 border-green-600/40'
              : 'bg-red-800/20 text-red-300 border-red-600/40'
          }`}
        >
          {indication}
        </span>
      </div>

      <div className="relative bg-gray-900 p-4 rounded-md border border-gray-700">
        <div className="text-sm text-gray-200 space-y-2">
          {etsiValidationReport.message && (
            <div className="text-gray-300 whitespace-pre-wrap">{etsiValidationReport.message}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <span className="text-gray-400">ValidationTime:</span> {etsiValidationReport.validationTime ?? 'N/A'}
            </div>

            <div>
              <span className="text-gray-400">POETime:</span> {etsiValidationReport.poeTime ?? 'N/A'}
            </div>

            <div className="md:col-span-2">
              <span className="text-gray-400">Algorithm:</span>{' '}
              <span className="break-all">{etsiValidationReport.algorithm ?? 'N/A'}</span>
            </div>

            <div className="md:col-span-2">
              <span className="text-gray-400">Cert:</span>{' '}
              <span className="break-all">{etsiValidationReport.cert ?? 'N/A'}</span>
            </div>

            <div>
              <span className="text-gray-400">Cert NotAfter:</span> {etsiValidationReport.certNotAfter ?? 'N/A'}
            </div>

            <div className="md:col-span-2">
              <span className="text-gray-400">TimeStamp Evidence:</span>{' '}
              <span className="break-all">{etsiValidationReport.timeStampEvidence ?? 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EtsiValidationReport;
