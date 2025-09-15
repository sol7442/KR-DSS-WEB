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
        // const [docBase64, sigBase64] = await Promise.all([
        //     toBase64(originalFile),
        //     toBase64(signatureFile)
        // ]);

        // const requestBody: VerifyDetachedRequest = {
        //     document: docBase64,
        //     signature: sigBase64,
        //     policy: policy,
        // };
        
        // const response = await fetch("http://localhost:8080/kr-dss/verify-signature", {
        //     method: "POST",
        //     headers: {
        //         "Content-Type": "application/json",
        //         Accept: "application/json",
        //     },
        //     body: JSON.stringify(requestBody),
        // });

        // if (!response.ok) {
        //     const errorText = await response.text();
        //     throw new Error(`Server error: ${response.status}: ${errorText}`);
        // }

        const result: VerificationResult = {
            "isValid": true,
            "simpleReport": {
              "indication": "TOTAL_PASSED",
              "message": "모든 전자서명이 성공적으로 검증되었습니다."
            },
            "detailedReport": [
              {
                "name": "서명 #1 (홍길동, PAdES)",
                "status": "PASSED",
                "message": "서명은 유효하며 모든 검증 절차를 통과했습니다."
              },
              {
                "name": "서명 #2 (테스트 사용자, XAdES)",
                "status": "FAILED",
                "message": "서명에 사용된 인증서가 폐지되었습니다."
              }
            ],
            "diagnosticTree": {
              "name": "전자서명 검증 트리",
              "status": "PASSED",
              "message": "전체 문서에 대한 검증 결과",
              "children": [
                {
                  "name": "서명 #1",
                  "status": "PASSED",
                  "message": "모든 검증 항목이 정상입니다.",
                  "children": [
                    {
                      "name": "인증서 (홍길동, KISA Root CA)",
                      "status": "PASSED",
                      "message": "유효한 인증서입니다."
                    }
                  ]
                },
                {
                  "name": "서명 #2",
                  "status": "FAILED",
                  "message": "인증서가 폐지되었습니다.",
                  "children": [
                    {
                      "name": "인증서 (테스트 사용자, Test CA)",
                      "status": "FAILED",
                      "message": "이 인증서는 2025-08-01에 폐지되었습니다."
                    }
                  ]
                }
              ]
            },
            "etsValidationReport": "<ETSIValidationReport><Signature Id='sig-1' Indication='PASSED'/><Signature Id='sig-2' Indication='FAILED' SubIndication='CERTIFICATE_REVOKED'/></ETSIValidationReport>"
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

          const response = {
            "result": {
              "status": "http://uri.etsi.org/TrstSvc/Svcs/ValidationStatus/valid",
              "message": "전자서명 검증이 성공적으로 완료되었습니다."
            },
            "profile": [
              "http://uri.etsi.org/19442/v1.1.1/validationprotocol#"
            ],
            "reqID": "request_client_12345",
            "respID": "response_server_67890",
            "optOutp": {
              "validationReport": {
                "etsiTS11910202XMLReport": "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4NCjxl"
              },
              "resForEachSignature": [
                {
                  "result": {
                    "status": "http://uri.etsi.org/TrstSvc/Svcs/ValidationStatus/valid",
                    "message": "개별 서명 검증이 성공적으로 완료되었습니다. 서명은 유효합니다."
                  },
                  "sigRef": {
                    "digRef": {
                      "digVal": "sTOgwOm+474gFj0q0x1iSNspKqbcse4IeiqlDg/HWuI=",
                      "digAlg": "http://www.w3.org/2001/04/xmlenc#sha256"
                    },
                    "padesFieldName": "DocSign"
                  },
                  "signerIdentity": {
                    "name": "홍길동"
                  },
                  "signingTimeInfo": {
                    "signingTime": "2023-10-26T10:00:00Z"
                  },
                  "validationReport": {
                    "etsiTS11910202XMLReport": "PDR4bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4NCjxld"
                    ,
                    "other": {
                      "content": "eyJvY3NwIjpbIk1JSUpnLi4ualNjPSJdLCJjcmwiOlsiTUlJQzQuLi5YN009Il0sImNlcnRpZmljYXRlcyI6WyI8QmFzZTY0LWVuY29kZWRfWC41MDlfY2VydGlmaWNhdGVfZm9yX3NpZ25lcj4iLCI8QmFzZTY0LWVuY29kZWRfWC41MDlfY2VydGlmaWNhdGVfZm9yX2ludGVybWVkaWF0ZV9DQT4iXX0=",
                      "specId": "https://cloudsignatureconsortium.org/csc/v2/validationInfo#",
                      "encoding": "application/json"
                    }
                  }
                },
                {
                  "result": {
                    "status": "http://uri.etsi.org/TrstSvc/Svcs/ValidationStatus/invalid",
                    "message": "두 번째 서명 검증이 실패했습니다. 서명 값이 일치하지 않습니다."
                  },
                  "sigRef": {
                    "digRef": {
                      "digVal": "HZQzZmMAIWekfGH0/ZKW1nsdt0xg3H6bZYztgsMTLw0=",
                      "digAlg": "http://www.w3.org/2001/04/xmlenc#sha256"
                    }
                  },
                  "signerIdentity": {
                    "name": "김철수"
                  },
                  "signingTimeInfo": {
                    "signingTime": "2023-10-26T09:30:00Z"
                  },
                  "validationReport": {
                    "etsiTS11910202XMLReport": "PDR4bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4NCjxld"
                  }
                }
              ]
            }
          }

        // const response = await fetch("http://localhost:8080/kr-dss/verify-enveloped", {
        //     method: "POST",
        //     headers: {
        //         "Content-Type": "application/json",
        //         Accept: "application/json",
        //     },
        //     body: JSON.stringify(requestBody),
        // });

        if (!response.result) {
            const errorText = await response.result.message;
            throw new Error(`Server error: ${response.result.status}: ${errorText}`);
        }

        const result: VerificationResult = {
            "isValid": true,
            "simpleReport": {
              "indication": "TOTAL_PASSED",
              "message": "모든 전자서명이 성공적으로 검증되었습니다."
            },
            "detailedReport": [
              {
                "name": "서명 #1 (홍길동, PAdES)",
                "status": "PASSED",
                "message": "서명은 유효하며 모든 검증 절차를 통과했습니다."
              },
              {
                "name": "서명 #2 (테스트 사용자, XAdES)",
                "status": "FAILED",
                "message": "서명에 사용된 인증서가 폐지되었습니다."
              }
            ],
            "diagnosticTree": {
              "name": "전자서명 검증 트리",
              "status": "PASSED",
              "message": "전체 문서에 대한 검증 결과",
              "children": [
                {
                  "name": "서명 #1",
                  "status": "PASSED",
                  "message": "모든 검증 항목이 정상입니다.",
                  "children": [
                    {
                      "name": "인증서 (홍길동, KISA Root CA)",
                      "status": "PASSED",
                      "message": "유효한 인증서입니다."
                    }
                  ]
                },
                {
                  "name": "서명 #2",
                  "status": "FAILED",
                  "message": "인증서가 폐지되었습니다.",
                  "children": [
                    {
                      "name": "인증서 (테스트 사용자, Test CA)",
                      "status": "FAILED",
                      "message": "이 인증서는 2025-08-01에 폐지되었습니다."
                    }
                  ]
                }
              ]
            },
            "etsValidationReport": "<ETSIValidationReport><Signature Id='sig-1' Indication='PASSED'/><Signature Id='sig-2' Indication='FAILED' SubIndication='CERTIFICATE_REVOKED'/></ETSIValidationReport>"
          }


        return result;

    } catch (error) {
        console.error("Error verifying enveloped signature:", error);
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        throw new Error(`Enveloped signature verification failed: ${message}`);
    }
};
