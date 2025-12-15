import React from 'react';
import { VerificationResult } from '../../types';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon } from '../Icons';

interface SimpleReportProps {
  simpleReport: VerificationResult['simpleReport'];
}

const SimpleReport: React.FC<SimpleReportProps> = ({ simpleReport }) => {
  const isSuccess = simpleReport.indication === 'TOTAL_PASSED';
  const isFailure = simpleReport.indication === 'TOTAL_FAILED';

  const Icon = isSuccess ? CheckCircleIcon : isFailure ? XCircleIcon : InformationCircleIcon;
  const colorClass = isSuccess ? 'text-green-400' : isFailure ? 'text-red-400' : 'text-yellow-400';
  const bgColorClass = isSuccess ? 'bg-green-900/50' : isFailure ? 'bg-red-900/50' : 'bg-yellow-900/50';

  return (
    <div className={`flex flex-col items-center justify-center p-8 rounded-lg ${bgColorClass} text-center`}>
      <Icon className={`w-20 h-20 ${colorClass}`} />
      <h3 className={`mt-4 text-2xl font-bold ${colorClass}`}>
        {simpleReport.indication.replace('_', ' ')}
      </h3>
      <p className="mt-2 text-gray-300 max-w-md whitespace-pre-line">{simpleReport.message}</p>
    </div>
  );
};

export default SimpleReport;
