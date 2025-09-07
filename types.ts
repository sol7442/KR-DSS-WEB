export enum View {
  CREATE = 'CREATE',
  VERIFY = 'VERIFY',
}

export interface SignatureOptions {
  container: 'No' | 'ASiC-S' | 'ASiC-E';
  signatureFormat: 'XAdES' | 'CAdES' | 'PAdES' | 'JAdES';
  packaging: 'Enveloped' | 'Enveloping' | 'Detached' | 'Internally detached';
  level: 'B-B' | 'B-T' | 'B-LT' | 'B-LTA';
  digestAlgorithm: 'SHA1' | 'SHA256' | 'SHA384' | 'SHA512';
  allowExpiredCertificate: boolean;
  addContentTimestamp: boolean;
}

export interface SignatureResult {
  signature: string;
  timestamp: string;
  documentHash: string;
  options: SignatureOptions;
}

export interface VerificationResult {
  isValid: boolean;
  message: string;
}
