import React, { useMemo, useState } from 'react';
import { VerificationResult } from '../../types';
import {
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  ClipboardIcon,
  ClipboardCheckIcon,
} from '../Icons';

interface DetailedReportProps {
  detailedReport: VerificationResult['detailedReport'];
  fileName: string | null;
  downloadUrl: string | null;
}

const getStatusVisuals = (status: string) => {
  switch (status) {
    case 'PASSED':
    case 'TOTAL_PASSED':
      return { Icon: CheckCircleIcon, color: 'text-green-400' };
    case 'FAILED':
    case 'TOTAL_FAILED':
      return { Icon: XCircleIcon, color: 'text-red-400' };
    case 'WARNING':
      return { Icon: ExclamationTriangleIcon, color: 'text-yellow-400' };
    case 'INDETERMINATE':
    default:
      return { Icon: InformationCircleIcon, color: 'text-gray-400' };
  }
};

const DetailedReport: React.FC<DetailedReportProps> = ({ detailedReport, fileName, downloadUrl }) => {
  const [isCopied, setIsCopied] = useState(false);

  const canDownload = Boolean(fileName);

  const detailedDownloadUrl = useMemo(() => {
    if (!fileName) return null;

    const encoded = encodeURIComponent(fileName);

    if (downloadUrl) {
      const base = downloadUrl.endsWith('/') ? downloadUrl : `${downloadUrl}/`;
      const normalized = base.startsWith('/kr-dss')
        ? base
        : `/kr-dss${base.startsWith('/') ? '' : '/'}${base}`;
      return `${normalized}detailed/${encoded}`;
    }

    return `/kr-dss/api/verify/reports/detailed/${encoded}`;
  }, [downloadUrl, fileName]);

  const triggerDownload = () => {
    if (!detailedDownloadUrl) return;
    const a = document.createElement('a');
    a.href = detailedDownloadUrl;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const copyText = useMemo(() => {
    if (!detailedReport || detailedReport.length === 0) return '';
    const lines: string[] = [];
    lines.push('[Detailed Report Summary]');
    lines.push(`items: ${detailedReport.length}`);
    detailedReport.forEach((it, idx) => {
      lines.push(`--- #${idx + 1} ---`);
      lines.push(`name: ${it.name}`);
      lines.push(`status: ${it.status}`);
      if (it.message) lines.push(`message: ${it.message}`);
    });
    return lines.join('\n');
  }, [detailedReport]);

  const handleCopy = () => {
    if (!copyText) return;
    navigator.clipboard.writeText(copyText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!detailedReport || detailedReport.length === 0) {
    return (
      <div>
        <h3 className="text-xl font-bold text-blue-300 mb-4">Detailed Report</h3>
        <div className="bg-gray-900 p-4 rounded-md border border-gray-700 text-gray-200">
          Detailed Report 정보를 제공할 수 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* 제목 + 우측 버튼들 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-blue-300">Detailed Report</h3>

        <div className="flex items-center gap-2">
          <button
            onClick={triggerDownload}
            disabled={!canDownload || !detailedDownloadUrl}
            className={`px-3 py-2 rounded-md text-sm border transition-colors
              ${
                canDownload
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-600'
                  : 'bg-gray-900 text-gray-500 border-gray-800 cursor-not-allowed'
              }
            `}
            title={!canDownload ? 'fileName이 없어 다운로드할 수 없습니다.' : 'Detailed 리포트 다운로드'}
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

      <ul className="space-y-3">
        {detailedReport.map((item, index) => {
          const { Icon, color } = getStatusVisuals(item.status);
          return (
            <li key={index} className="flex items-start p-3 bg-gray-900/50 rounded-lg border border-gray-700">
              <Icon className={`w-6 h-6 mr-4 flex-shrink-0 ${color}`} />
              <div className="flex-1">
                <p className={`font-semibold ${color}`}>{item.name}</p>
                <p className="text-sm text-gray-400 whitespace-pre-line">{item.message}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default DetailedReport;
