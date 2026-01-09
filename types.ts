
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
    container: 'NO'|'ASiC-S' | 'ASiC-E';
    signatureFormat: 'XAdES' | 'CAdES' | 'PAdES' | 'JAdES';
    signatureLevel: 'B-B' | 'B-T' | 'B-LT' | 'B-LTA';
    validationTime: string; // ISO string for datetime-local
    trustAnchor: string;
}


// --- Detailed Verification Result Types ---

//type VerificationStatus = 'PASSED' | 'FAILED' | 'INDETERMINATE' | 'WARNING';
type VerificationStatus = 'TOTAL_PASSED' | 'PASSED' |'TOTAL_FAILED' | 'FAILED' | 'INDETERMINATE';

interface SimpleReport {
  indication: VerificationStatus;
  message: string;
  subIndication: string | null;
  validationTime: string | null;
  signatureCount: number;
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
  children?: DiagnosticTreeNode[] | null;
}

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

export interface VerificationResult {
  isValid: boolean;
  simpleReport: SimpleReport | null;
  detailedReport: DetailedReportItem[] | null;
  diagnosticTree: DiagnosticTreeNode | null;
  etsiValidationReport: EtsiValidationReportInfo | null; 
  fileName: string | null;
  downloadUrl: string | null;
}