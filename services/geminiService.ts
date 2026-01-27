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

function getSignatrForm(signatureFormat: string): string {
  switch (signatureFormat) {
    case "PAdES":
      return "PAdES";
    case "XAdES":
      return "XAdES";
    case "CAdES":
      return "CAdES";
    case "JAdES":
      return "JAdES";
    default:
      return "PKCS7";    
  }
}
// Helper to construct the signature level string the backend expects
function getSignatureLevel(signatureFormat: string, level: string): string {
  const format = signatureFormat;

  let normalizedLevel: string;
  switch (level.toUpperCase()) {
    case "B-LTA":
    case "LTA":
    case "BASELINE_LTA":
      normalizedLevel = "BASELINE_LTA";
      break;
    case "B-LT":
    case "LT":
    case "BASELINE_LT":
      normalizedLevel = "BASELINE_LT";
      break;
    case "B-T":
    case "T":
    case "BASELINE_T":
      normalizedLevel = "BASELINE_T";
      break;
    case "B-B":
    case "B":
    case "BASELINE_B":
      normalizedLevel = "BASELINE_B";
      break;

    default:
      throw new Error(`Unsupported signature level: ${level}`);
  }
  
  switch (format) {
    case "XAdES":
      return `XAdES_${normalizedLevel}`;
    case "CAdES":
      return `CAdES_${normalizedLevel}`;
    case "PAdES":
      return `PAdES_${normalizedLevel}`;
    case "JAdES":
      return `JAdES_${normalizedLevel}`;
    case "PKCS7":
      return `PKCS7_${normalizedLevel}`;
    default:
      throw new Error(`Unsupported signature format: ${signatureFormat}`);
  }
}
// Interface for the backend sign request
export interface SignDocumentRequest {
  fileName: string;
  documentBase64: string;
  signatureValue: number[];   // 🔑 byte[] -> JSON 배열로 전송
  containerType: string;
  signatureForm: string;
  signaturePackaging: string;
  signatureLevel: string;
  digestAlgorithm: string;
  signWithExpiredCertificate: boolean;
  addContentTimestamp: boolean;
}


async function generateSignatureValue(base64Doc: string, algorithm: string = "SHA-256"): Promise<Uint8Array> {
  
  const subtle = (window.crypto || (window as any).msCrypto)?.subtle;
  if (!subtle) {
    throw new Error('Web Crypto API not supported in this environment');
  }
  // Base64 → ArrayBuffer 변환
  const binary = atob(base64Doc);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  console.log("Generating signature value algorithm:", algorithm);

  // 다이제스트 계산
  const digest = await crypto.subtle.digest(algorithm, bytes);

  return new Uint8Array(digest); // signatureValue 로 사용
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

    console.log("Generating signature base64Doc:", base64Doc);
    console.log("SignatureOptions:", options);    
    console.log("Generating signature value using digest algorithm:", options.digestAlgorithm);
    const signatureValue = await generateSignatureValue(base64Doc, options.digestAlgorithm ?? "SHA-256");

    const signDocumentRequest: SignDocumentRequest = {
      fileName: document.name,
      documentBase64: base64Doc,
      signatureValue: Array.from(signatureValue),  // byte[] 형태로 직렬화
      containerType: getContainerType(options.container),
      signatureForm: getSignatrForm(options.signatureFormat),
      signaturePackaging: getSignautrePackaging(options.packaging),
      signatureLevel: getSignatureLevel(options.signatureFormat, options.level),
      digestAlgorithm: getDigestAlgorithm(options.digestAlgorithm),
      signWithExpiredCertificate: options.allowExpiredCertificate,
      addContentTimestamp: options.addContentTimestamp,
    };

    const response = await fetch("/kr-dss/sign-document", { 
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

    console.log("Signature generation result:", result);    

    return result;

  } catch (err) {
    console.error("Signature generation failed:", err);
    const message = err instanceof Error ? err.message : "An unknown error occurred.";
    throw new Error(`Signature generation failed: ${message}`);
  }
};


// Interface for the backend detached verification request
interface VerifyDetachedRequest {
    documentBase64: string; // base64
    signatureBase64: string; // base64
    // policy: ValidationPolicy;
    container: string;
    signatureFormat: string;
    signatureLevel: string;
    validationTime: string;
    trustAnchor: string;
}

/**
 * Verifies a detached digital signature by calling a local backend service.
 */
export const verifySignature = async (
  originalFile: File, 
  signatureFile: File, 
  options: ValidationPolicy
): Promise<VerificationResult> => {
    try {
      const base64Doc = await toBase64(originalFile);
      const base64Sig = await toBase64(signatureFile);

      const requestBody: VerifyDetachedRequest = {
        documentBase64:  base64Doc,
        signatureBase64: base64Sig,
        // policy: options,
        container: getContainerType(options.container),
        signatureFormat: getSignatrForm(options.signatureFormat),
        signatureLevel: getSignatureLevel(options.signatureFormat, options.signatureLevel),
        validationTime: options.validationTime,
        trustAnchor: options.trustAnchor,
      };

      const response = await fetch("/kr-dss/verify-signature", { 
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
      console.log("Signature generation result:", result); 
      
      if (result.isValid == false) {
        throw new Error(`Signature parsing failed. The signature structure is unsupported or corrupted.`);
      }
      
      return result;

    } catch (error) {
        console.error("Error verifying signature:", error);
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        throw new Error(`Signature verification failed: ${message}`);
    }
};

// Interface for the backend enveloped verification request
interface VerifyEnvelopedRequest {
    signatureBase64: string; // base64
    // policy: ValidationPolicy;
    container: string;
    signatureFormat: string;
    signatureLevel: string;
    validationTime: string;
    trustAnchor: string;
}

/**
 * Verifies an enveloped digital signature by calling a local backend service.
 */
export const verifyEnvelopedSignature = async (
  signedFile: File, 
  options: ValidationPolicy
): Promise<VerificationResult> => {
  try {
    const docBase64 = await toBase64(signedFile);

    const requestBody: VerifyEnvelopedRequest = {
      signatureBase64: docBase64,
        // policy: options
        container: getContainerType(options.container),
        signatureFormat: getSignatrForm(options.signatureFormat),
        signatureLevel: getSignatureLevel(options.signatureFormat, options.signatureLevel),
        validationTime: options.validationTime,
        trustAnchor: options.trustAnchor,
    };
    
    console.log("requestBody : ", requestBody)
    console.log("requestBody : ", JSON.stringify(requestBody));

    const response = await fetch("/kr-dss/verify-signature", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status}: ${errorText}`);
    }

    const result: VerificationResult = await response.json();
    console.log("Signature generation result:", result);   


    if (result.isValid == false) {
      throw new Error(`Signature parsing failed. The signature structure is unsupported or corrupted.`);
    }

    return result;

  } catch (error) {
    console.error("Error verifying enveloped signature:", error);
    const message = error instanceof Error ? error.message : "An unknown error occurred.";
    throw new Error(`Enveloped signature verification failed: ${message}`);
  }
};

/**
 * Maps the signature packaging option to the backend expected value.
 */
function getSignautrePackaging(packaging: string): string {
  switch (packaging.toUpperCase()) {
  case "ENVELOPED":
    return "ENVELOPED";
  case "ENVELOPING":
    return "ENVELOPING";
  case "DETACHED":
    return "DETACHED";
    // case "INTERNALLY DETACHED":
    // return "INTERNALLY_DETACHED";
  default:
    throw new Error(`Unknown signature packaging: ${packaging}`);
  }
}
function getContainerType(container: string): string {
   switch(container ) {
    case "ASiC-S":
      return "ASiC_S";
    case "ASiC-E":
      return "ASiC_E";
    default: null;
   }   
}
function getDigestAlgorithm(digestAlgorithm: string): string {
  const map: Record<string, string> = {
    "SHA-256": "SHA256",
    "SHA-384": "SHA384",
    "SHA-512": "SHA512",
    "SHA1": "SHA1",
    "SHA-1": "SHA1"
  };
  const key = digestAlgorithm.trim().toUpperCase().replace("-", "");
  for (const k in map) {
    if (key === k.replace("-", "").toUpperCase()) {
      return map[k];
    }
  }
  throw new Error(`Unknown digest algorithm: ${digestAlgorithm}`);
}


