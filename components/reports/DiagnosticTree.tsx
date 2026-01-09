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

type DiagnosticTreeNode = VerificationResult['diagnosticTree'];

interface DiagnosticTreeProps {
  diagnosticTree: DiagnosticTreeNode;
  fileName: string | null;      // result.fileName
  downloadUrl: string | null;   // result.downloadUrl (ex: "/api/verify/reports/" or "/kr-dss/api/verify/reports/")
}

const getStatusVisuals = (status: string) => {
  switch (status) {
    case 'TOTAL_PASSED':
    case 'PASSED':
      return { Icon: CheckCircleIcon, color: 'text-green-400' };
    case 'TOTAL_FAILED':
    case 'FAILED':
      return { Icon: XCircleIcon, color: 'text-red-400' };
    case 'WARNING':
      return { Icon: ExclamationTriangleIcon, color: 'text-yellow-400' };
    case 'INDETERMINATE':
    default:
      return { Icon: InformationCircleIcon, color: 'text-gray-400' };
  }
};

const TreeNode: React.FC<{ node: NonNullable<DiagnosticTreeNode>; level: number }> = ({ node, level }) => {
  const { Icon, color } = getStatusVisuals(node.status);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <div className="flex items-start py-2">
        <span style={{ width: `${level * 24}px` }} className="flex-shrink-0"></span>
        {hasChildren && <span className="text-gray-500 mr-2">{level > 0 ? '└─' : ''}</span>}
        <Icon className={`w-5 h-5 mr-3 flex-shrink-0 ${color}`} />
        <div className="flex-1">
          <p className={`font-semibold ${color}`}>{node.name}</p>
          <p className="text-sm text-gray-400 whitespace-pre-wrap">{node.message}</p>
        </div>
      </div>

      {hasChildren && (
        <div className="border-l border-gray-700" style={{ marginLeft: `${level * 24 + 10}px` }}>
          {node.children?.map((child, index) => (
            <TreeNode key={index} node={child as NonNullable<DiagnosticTreeNode>} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const DiagnosticTree: React.FC<DiagnosticTreeProps> = ({ diagnosticTree, fileName, downloadUrl }) => {
  const [isCopied, setIsCopied] = useState(false);

  const canDownload = Boolean(fileName);

  const diagnosticDownloadUrl = useMemo(() => {
    if (!fileName) return null;

    const encoded = encodeURIComponent(fileName);
    // downloadUrl이 내려오는 경우 prefix로 사용 (예: "/kr-dss/api/verify/reports/")
    if (downloadUrl) {
      const base = downloadUrl.endsWith('/') ? downloadUrl : `${downloadUrl}/`;
      const normalized = base.startsWith('/kr-dss') ? base : `/kr-dss${base.startsWith('/') ? '' : '/'}${base}`;
      return `${normalized}diagnostic/${encoded}`;
    }

    // fallback (vite proxy 기준)
    return `/kr-dss/api/verify/reports/diagnostic/${encoded}`;
  }, [downloadUrl, fileName]);

  const triggerDownload = () => {
    if (!diagnosticDownloadUrl) return;
    const a = document.createElement('a');
    a.href = diagnosticDownloadUrl;
    a.download = ''; // 서버 Content-Disposition 사용
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // 트리 텍스트를 한 줄 요약으로 펼치는 helper
  const flattenTreeLines = (node: NonNullable<DiagnosticTreeNode>, depth = 0): string[] => {
    const indent = '  '.repeat(depth);
    const line1 = `${indent}- ${node.name} [${node.status}]`;
    const line2 = node.message ? `${indent}  ${String(node.message).replace(/\n/g, '\n' + indent + '  ')}` : null;

    const lines = [line1];
    if (line2) lines.push(line2);

    if (node.children && node.children.length > 0) {
      node.children.forEach((c) => {
        lines.push(...flattenTreeLines(c as NonNullable<DiagnosticTreeNode>, depth + 1));
      });
    }
    return lines;
  };

  const copyText = useMemo(() => {
    if (!diagnosticTree) return '';

    const lines: string[] = [];
    lines.push('[Diagnostic Tree Summary]');
    lines.push(`name: ${diagnosticTree.name ?? 'N/A'}`);
    lines.push(`status: ${diagnosticTree.status ?? 'N/A'}`);
    if (diagnosticTree.message) lines.push(`message: ${diagnosticTree.message}`);
    lines.push(''); // blank line
    lines.push('[Tree]');
    lines.push(...flattenTreeLines(diagnosticTree as NonNullable<DiagnosticTreeNode>));

    return lines.join('\n');
  }, [diagnosticTree]);

  const handleCopy = () => {
    if (!copyText) return;
    navigator.clipboard.writeText(copyText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!diagnosticTree) {
    return (
      <div>
        <h3 className="text-xl font-bold text-blue-300 mb-4">Diagnostic Tree</h3>
        <div className="bg-gray-900 p-4 rounded-md border border-gray-700 text-gray-200">
          Diagnostic Tree 정보를 제공할 수 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* 제목 + 우측 버튼들 (ETSI 패턴 동일) */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-blue-300">Diagnostic Tree</h3>

        <div className="flex items-center gap-2">
          {/* Download */}
          <button
            onClick={triggerDownload}
            disabled={!canDownload || !diagnosticDownloadUrl}
            className={`px-3 py-2 rounded-md text-sm border transition-colors
              ${canDownload ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-900 text-gray-500 border-gray-800 cursor-not-allowed'}
            `}
            title={!canDownload ? 'fileName이 없어 다운로드할 수 없습니다.' : 'Diagnostic 리포트 다운로드'}
          >
            Download
          </button>

          {/* Copy */}
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

      <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
        <TreeNode node={diagnosticTree as NonNullable<DiagnosticTreeNode>} level={0} />
      </div>
    </div>
  );
};

export default DiagnosticTree;
