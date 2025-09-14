import { SignatureResult, SignatureOptions, VerificationResult, ValidationPolicy } from "../types";

// Helper to convert File to a Base64 string
const toBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // remove "data:*/*;base64," prefix
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Helper to construct the signature level string the backend expects
const getSignatureLevel = (format: SignatureOptions['signatureFormat'], level: SignatureOptions['level']): string => {
    const levelMap = {
        'B-B': 'BASELINE_B',
        'B-T': 'BASELINE_T',
        'B-LT': 'BASELINE_LT',
        'B-LTA': 'BASELINE_LTA'
    };
    return `${format}_${levelMap[level]}`;
};

// Interface for the backend sign request
interface SignDocumentRequest {
    documentToSign: string;
    containerType: string;
    signatureForm: string;
    signaturePackaging: string;
    signatureLevel: string;
    digestAlgorithm: string;
    signWithExpiredCertificate: boolean;
    addContentTimestamp: boolean;
}

/**
 * Generates a digital signature by calling a local backend service.
 */
export const generateSignature = async (
  document: File,
  options: SignatureOptions
): Promise<SignatureResult> => {
  try {
    const base64Doc = await toBase64(document);

    const signDocumentRequest: SignDocumentRequest = {
      documentToSign: base64Doc,
      containerType: options.container,
      signatureForm: options.signatureFormat,
      signaturePackaging: options.packaging,
      signatureLevel: getSignatureLevel(options.signatureFormat, options.level),
      digestAlgorithm: options.digestAlgorithm,
      signWithExpiredCertificate: options.allowExpiredCertificate,
      addContentTimestamp: options.addContentTimestamp,
    };

    const response = await fetch("http://localhost:8080/kr-dss/sign-document", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(signDocumentRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status}: ${errorText}`);
    }

    const result: SignatureResult = await response.json();
    return result;

  } catch (err) {
    console.error("Signature generation failed:", err);
    const message = err instanceof Error ? err.message : "An unknown error occurred.";
    throw new Error(`Signature generation failed: ${message}`);
  }
};

// Interface for the backend detached verification request
interface VerifyDetachedRequest {
    document: string; // base64
    signature: string; // base64
    policy: ValidationPolicy;
}

/**
 * Verifies a detached digital signature by calling a local backend service.
 */
export const verifySignature = async (originalFile: File, signatureFile: File, policy: ValidationPolicy): Promise<VerificationResult> => {
    try {
        const [docBase64, sigBase64] = await Promise.all([
            toBase64(originalFile),
            toBase64(signatureFile)
        ]);

        const requestBody: VerifyDetachedRequest = {
            document: docBase64,
            signature: sigBase64,
            policy: policy,
        };
        
        const response = await fetch("http://localhost:8080/kr-dss/verify-signature", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server error: ${response.status}: ${errorText}`);
        }

        const result: VerificationResult = await response.json();
        return result;

    } catch (error) {
        console.error("Error verifying signature:", error);
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        throw new Error(`Signature verification failed: ${message}`);
    }
};

// Interface for the backend enveloped verification request
interface VerifyEnvelopedRequest {
    signedDocument: string; // base64
    policy: ValidationPolicy;
}

/**
 * Verifies an enveloped digital signature by calling a local backend service.
 */
export const verifyEnvelopedSignature = async (signedFile: File, policy: ValidationPolicy): Promise<VerificationResult> => {
    try {
        const docBase64 = await toBase64(signedFile);

        const requestBody: VerifyEnvelopedRequest = {
            signedDocument: docBase64,
            policy: policy,
        };

        const response = await fetch("http://localhost:8080/kr-dss/verify-enveloped", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server error: ${response.status}: ${errorText}`);
        }

        const result: VerificationResult = await response.json();
        return result;

    } catch (error) {
        console.error("Error verifying enveloped signature:", error);
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        throw new Error(`Enveloped signature verification failed: ${message}`);
    }
};
