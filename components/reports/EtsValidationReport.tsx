import React, { useState } from 'react';
import { ClipboardIcon, ClipboardCheckIcon } from '../Icons';

interface EtsValidationReportProps {
  etsValidationReport: string;
}

const EtsValidationReport: React.FC<EtsValidationReportProps> = ({ etsValidationReport }) => {
  const [isCopied, setIsCopied] = useState(false);

  // 줄 정리용 helper
  const prettyFormatXml = (xml: string) => {
    return xml.replace(/></g, '>\n<').trim();
  };

  const formattedXml = prettyFormatXml(etsValidationReport);

  // 메타 정보 추출 (SignatureId / Format / MainIndication)

  // 1) SignatureIdentifier 태그에서 id 뽑기
  const sigIdMatch = etsValidationReport.match(/<SignatureIdentifier[^>]*\sid=["']([^"']+)["']/);
  const sigId = sigIdMatch?.[1] ?? 'Unknown';

  // 2) SignatureIdentifier 태그에서 Format 뽑기
  //    (지금 우리가 만든 XML: <SignatureIdentifier id="..." Format="파일명">)
  const formatMatch = etsValidationReport.match(/<SignatureIdentifier[^>]*\sFormat=["']([^"']+)["']/);
  const format = formatMatch?.[1] ?? 'N/A';

  // 3) MainIndication 내용 뽑기
  //    attr 형태가 아니라 <MainIndication>...totl-passed...</MainIndication> 구조라서 element 콘텐츠로 추출
  const indicationElemMatch = etsValidationReport.match(/<MainIndication>([^<]+)<\/MainIndication>/);
  const indication = indicationElemMatch?.[1] ?? 'Unknown';

  // URN 형태라도 'passed'가 들어가면 통과로 간주 (total-passed 포함)
  const isPassed = /passed/i.test(indication);


  const handleCopy = () => {
    navigator.clipboard.writeText(etsValidationReport);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div>
      <h3 className="text-xl font-bold text-blue-300 mb-4">ETS Validation Report</h3>

      {/* 요약 정보 영역 */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="px-2 py-1 rounded-md bg-gray-800 text-gray-200 text-xs border border-gray-600">
          <strong>SignatureId:</strong> {sigId}
        </span>

        <span className="px-2 py-1 rounded-md bg-gray-800 text-gray-200 text-xs border border-gray-600">
          <strong>Format:</strong> {format}
        </span>

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

      {/* XML 출력 영역 */}
      <div className="relative bg-gray-900 p-4 rounded-md border border-gray-700">
        <pre className="text-sm text-gray-200 whitespace-pre break-all max-h-80 overflow-auto">
          <code>{formattedXml}</code>
        </pre>

        {/* Copy 버튼 */}
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
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
  );
};

export default EtsValidationReport;
