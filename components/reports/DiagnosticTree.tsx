import React from 'react';
import { VerificationResult } from '../../types';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, ExclamationTriangleIcon } from '../Icons';

type DiagnosticTreeNode = VerificationResult['diagnosticTree'];

interface DiagnosticTreeProps {
  diagnosticTree: DiagnosticTreeNode;
}

const getStatusVisuals = (status: string) => {
  switch (status) {
    case 'PASSED':
      return { Icon: CheckCircleIcon, color: 'text-green-400' };
    case 'FAILED':
      return { Icon: XCircleIcon, color: 'text-red-400' };
    case 'WARNING':
        return { Icon: ExclamationTriangleIcon, color: 'text-yellow-400' };
    case 'INDETERMINATE':
    default:
      return { Icon: InformationCircleIcon, color: 'text-gray-400' };
  }
};

const TreeNode: React.FC<{ node: DiagnosticTreeNode; level: number }> = ({ node, level }) => {
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
          <p className="text-sm text-gray-400">{node.message}</p>
        </div>
      </div>
      {hasChildren && (
        <div className="border-l border-gray-700" style={{ marginLeft: `${level * 24 + 10}px` }}>
          {node.children?.map((child, index) => (
            <TreeNode key={index} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const DiagnosticTree: React.FC<DiagnosticTreeProps> = ({ diagnosticTree }) => {
  return (
    <div>
      <h3 className="text-xl font-bold text-blue-300 mb-4">Diagnostic Tree</h3>
      <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
        <TreeNode node={diagnosticTree} level={0} />
      </div>
    </div>
  );
};

export default DiagnosticTree;
