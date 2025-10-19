
export enum View {
  CREATE = 'CREATE',
  VERIFY = 'VERIFY',
}

export interface SignatureOptions {
  container: 'NO'|'ASiC-S' | 'ASiC-E';
  signatureFormat: 'XAdES' | 'CAdES' | 'PAdES' | 'JAdES';
  packaging: 'ENVELOPED' | 'ENVELOPING' | 'DETACHED' | 'INTERNALLY_DETACHED';
  level: 'B-B' | 'B-T' | 'B-LT' | 'B-LTA';
  digestAlgorithm: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';
  allowExpiredCertificate: boolean;
  addContentTimestamp: boolean;
}

export interface SignatureResult {
  result: string;
  fileName: string;
  documentBase64: string;
}

// --- New Validation Policy Types ---
export interface ValidationPolicy {
    validationModel: 'Shell' | 'Chain';
    digestAlgorithmRequirement: 'Any' | 'SHA-256' | 'SHA-384' | 'SHA-512';
    validationTime: string; // ISO string for datetime-local
    trustAnchor: string;
}


// --- Detailed Verification Result Types ---

type VerificationStatus = 'PASSED' | 'FAILED' | 'INDETERMINATE' | 'WARNING';

interface SimpleReport {
  indication: 'TOTAL_PASSED' | 'TOTAL_FAILED' | 'INDETERMINATE';
  message: string;
}

interface DetailedReportItem {
  name: string;
  status: VerificationStatus;
  message: string;
}

interface DiagnosticTreeNode {
  name: string;
  status: VerificationStatus;
  message: string;
  children?: DiagnosticTreeNode[];
}

export interface VerificationResult {
  isValid: boolean;
  simpleReport: SimpleReport;
  detailedReport: DetailedReportItem[];
  diagnosticTree: DiagnosticTreeNode;
  etsValidationReport: string; // Simulated XML content
}