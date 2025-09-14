import React from 'react';
import { VerificationResult } from '../../types';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, ExclamationTriangleIcon } from '../Icons';

interface DetailedReportProps {
  detailedReport: VerificationResult['detailedReport'];
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

const DetailedReport: React.FC<DetailedReportProps> = ({ detailedReport }) => {
  return (
    <div>
      <h3 className="text-xl font-bold text-blue-300 mb-4">Detailed Validation Report</h3>
      <ul className="space-y-3">
        {detailedReport.map((item, index) => {
          const { Icon, color } = getStatusVisuals(item.status);
          return (
            <li key={index} className="flex items-start p-3 bg-gray-900/50 rounded-lg border border-gray-700">
              <Icon className={`w-6 h-6 mr-4 flex-shrink-0 ${color}`} />
              <div className="flex-1">
                <p className={`font-semibold ${color}`}>{item.name}</p>
                <p className="text-sm text-gray-400">{item.message}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default DetailedReport;
