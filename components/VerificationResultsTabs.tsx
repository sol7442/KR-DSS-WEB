import React, { useState } from 'react';
import { VerificationResult } from '../types';
import SimpleReport from './reports/SimpleReport';
import DetailedReport from './reports/DetailedReport';
import DiagnosticTree from './reports/DiagnosticTree';
import EtsiValidationReport from './reports/EtsiValidationReport';

interface VerificationResultsTabsProps {
  result: VerificationResult;
}

type Tab = 'Simple' | 'Detailed' | 'Diagnostic Tree' | 'ETSI Validation Report';

const VerificationResultsTabs: React.FC<VerificationResultsTabsProps> = ({ result }) => {
  const [activeTab, setActiveTab] = useState<Tab>('Simple');

  const tabs: Tab[] = ['Simple', 'Detailed', 'Diagnostic Tree', 'ETSI Validation Report'];

  const renderContent = () => {
    switch (activeTab) {
      case 'Simple':
        return (
          <SimpleReport
            simpleReport={result.simpleReport}
            fileName={result.fileName}
            downloadUrl={result.downloadUrl}
          />
        );
      case 'Detailed':
        return (
          <DetailedReport
            detailedReport={result.detailedReport}
            fileName={result.fileName}
            downloadUrl={result.downloadUrl}
          />
        );
      case 'Diagnostic Tree':
        return (
          <DiagnosticTree
            diagnosticTree={result.diagnosticTree}
            fileName={result.fileName}
            downloadUrl={result.downloadUrl}
          />
        );
      case 'ETSI Validation Report':
        return (
          <EtsiValidationReport
            etsiValidationReport={result.etsiValidationReport}
            fileName={result.fileName}
            downloadUrl={result.downloadUrl}
          />
        );
      default:
        return null;
    }
  };

  const getTabClass = (tab: Tab) => {
    return `px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 ${
      activeTab === tab ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
    }`;
  };

  return (
    <div className="w-full bg-gray-800 border border-gray-700 rounded-lg shadow-inner">
      <div className="p-2 bg-gray-900/50 border-b border-gray-700">
        <nav className="flex flex-wrap gap-2" aria-label="Verification Results">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={getTabClass(tab)}
              role="tab"
              aria-selected={activeTab === tab}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-4 md:p-6">{renderContent()}</div>
    </div>
  );
};

export default VerificationResultsTabs;
