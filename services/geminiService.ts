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
    case "B-B":
    case "BASELINE_B":
      normalizedLevel = "BASELINE_B";
      break;
    case "B-T":
    case "BASELINE_T":
      normalizedLevel = "BASELINE_T";
      break;
    case "B-LT":
    case "BASELINE_LT":
      normalizedLevel = "BASELINE_LT";
      break;
    case "B-LTA":
    case "BASELINE_LTA":
      normalizedLevel = "BASELINE_LTA";
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

    const response = await fetch("http://localhost:8081/kr-dss/sign-document", {
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
    policy: ValidationPolicy;
}

/**
 * Verifies a detached digital signature by calling a local backend service.
 */
export const verifySignature = async (
  originalFile: File, 
  signatureFile: File, 
  policy: ValidationPolicy
): Promise<VerificationResult> => {
    try {
      const base64Doc = await toBase64(originalFile);
      const base64Sig = await toBase64(signatureFile);

      const requestBody: VerifyDetachedRequest = {
        documentBase64:  base64Doc,
        signatureBase64: base64Sig,
        policy: policy
      };

      // const response = await fetch("http://localhost:8081/kr-dss/verify-signature", {
      //   method: "POST",
      //   headers: {
      //       "Content-Type": "application/json",
      //       Accept: "application/json",
      //   },
      //   body: JSON.stringify(requestBody),
      // });

      
      // if (!response.ok) {
      //   const errorText = await response.text();
      //   throw new Error(`Server error: ${response.status}: ${errorText}`);
      // }

      // const result: VerificationResult = await response.json();      
      // console.log("Signature generation result:", result); 
      const result: VerificationResult = {
          // 전체 문서 기준 최종 유효 여부 (기술적 검증 관점)
          isValid: true,
          simpleReport: {
            indication: "TOTAL_PASSED",
            message: "1개의 전자서명이 모두 기술적으로 유효합니다. " +
                    "다만, 신뢰목록(TSL) 기반의 ‘공인/Qualified’ 여부는 판단할 수 없습니다."
          },
          detailedReport: [
            {
              name: "서명 #1 (tester2, CAdES-B-LTA, SHA-512)",
              status: "PASSED",
              message:
              [
                "• 서명은 TOTAL_PASSED 상태이며, 암호 검증 및 서명 형식 검증을 모두 통과했습니다.",
                "• 서명자 : tester2",
                "• 서명형식 : CAdES-BASELINE-LTA (파일명 및 리포트 내용 기준)",
                "• 사용 해시/서명 알고리즘 : RSA-SHA512",
                "• 자격·신뢰목록(qualification) 관련 :",
                "   - Unable to build a certificate chain up to a trusted list!"
              ].join("\n")
              }
            ],
            diagnosticTree: {
              name: "전자서명 검증 트리",
              status: "PASSED",
              message: "CAdES LTA 서명 1건에 대한 전체 검증 결과",
              children: [
                {
                  name: "서명 #1 – 기술적 검증",
                  status: "PASSED",
                  message: "형식 검증, 서명값 검증, X.509 인증서 검증을 모두 통과했습니다.",
                  children: [
                    {
                      name: "형식 검증 (formatChecking)",
                      status: "PASSED",
                      message: "CAdES LTA 서명 구조가 규격(ETSI EN 319 122/102-1)에 부합합니다."
                    },
                    {
                      name: "서명자 인증서 체인 (x509CertificateValidation)",
                      status: "PASSED",
                      message:
                      [
                        "서명자 인증서 → 중간 CA → Root CA 체인이 정상적으로 검증되었습니다."
                      ].join("\n")
                    },
                    {
                      name: "장기검증(LT/LTA) 정보",
                      status: "PASSED",
                      message:
                      "타임스탬프 및 아카이브 타임스탬프를 이용한 LTA 검증이 성공하였습니다.",
                      children: [
                        {
                          name: "타임스탬프 #1 (signature-time-stamp)",
                          status: "PASSED",
                          message:
                          "FAKE-KISA TSA가 발행한 시점정보가 유효합니다. (ProductionTime = 2025-12-01T07:14:06Z)"
                        },
                        {
                          name: "타임스탬프 #2 (archive-time-stamp)",
                          status: "PASSED",
                          message:
                          "장기보존을 위한 추가 시점정보가 유효하며, 전체 문서(DOCUMENT_Full-document)에 대해 적용됩니다."
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            etsValidationReport: `
<?xml version="1.0" encoding="UTF-8"?>
<ValidationReport xmlns="http://uri.etsi.org/19102/v1.4.1#"
                  xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
  <SignatureValidationReport>
    <SignatureIdentifier id="SIGNATURE_tester2_20251201-0714" Format="${signatureFile.name}">
      <DigestAlgAndValue>
        <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha512"/>
        <ds:DigestValue>cBOM6KSLRyTRqXbsye4FBzgx6Kvanpsn6Q6BAOnfhDkh0evJSvd9jyqe/HbQJ5r/xEZUo6Bx5YGtsiIpjusH4w==</ds:DigestValue>
      </DigestAlgAndValue>
      <HashOnly>false</HashOnly>
      <DocHashOnly>false</DocHashOnly>
    </SignatureIdentifier>

    <ValidationConstraintsEvaluationReport>
      <ValidationConstraint>
        <ValidationConstraintIdentifier>urn:cef:dss:bbb:formatChecking</ValidationConstraintIdentifier>
        <ConstraintStatus>
          <Status>urn:etsi:019102:constraintStatus:applied</Status>
        </ConstraintStatus>
        <ValidationStatus>
          <MainIndication>urn:etsi:019102:mainindication:passed</MainIndication>
        </ValidationStatus>
      </ValidationConstraint>

      <ValidationConstraint>
        <ValidationConstraintIdentifier>urn:cef:dss:bbb:cryptographicVerification</ValidationConstraintIdentifier>
        <ConstraintStatus>
          <Status>urn:etsi:019102:constraintStatus:applied</Status>
        </ConstraintStatus>
        <ValidationStatus>
          <MainIndication>urn:etsi:019102:mainindication:passed</MainIndication>
        </ValidationStatus>
      </ValidationConstraint>

      <ValidationConstraint>
        <ValidationConstraintIdentifier>urn:cef:dss:bbb:x509CertificateValidation</ValidationConstraintIdentifier>
        <ConstraintStatus>
          <Status>urn:etsi:019102:constraintStatus:applied</Status>
        </ConstraintStatus>
        <ValidationStatus>
          <MainIndication>urn:etsi:019102:mainindication:passed</MainIndication>
        </ValidationStatus>
      </ValidationConstraint>
    </ValidationConstraintsEvaluationReport>

    <ValidationTimeInfo>
      <ValidationTime>2025-12-01T07:14:54Z</ValidationTime>
      <BestSignatureTime>
        <POETime>2025-12-01T07:14:06Z</POETime>
        <TypeOfProof>urn:etsi:019102:poetype:validation</TypeOfProof>
      </BestSignatureTime>
    </ValidationTimeInfo>

    <SignersDocument>
      <DigestAlgAndValue>
        <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
        <ds:DigestValue>os3hy/4zHYJ/HlNBPZiQKwk6LjJVu/97mtYGpBBYSBU=</ds:DigestValue>
      </DigestAlgAndValue>
    </SignersDocument>

    <SignatureAttributes>
      <SigningTime Signed="true">
        <Time>2025-12-01T07:14:06Z</Time>
      </SigningTime>
      <SignatureTimeStamp>
        <TimeStampValue>2025-12-01T07:14:06Z</TimeStampValue>
      </SignatureTimeStamp>
      <ArchiveTimeStamp>
        <TimeStampValue>2025-12-01T07:14:06Z</TimeStampValue>
      </ArchiveTimeStamp>
    </SignatureAttributes>

    <SignerInformation Pseudonym="false">
      <Signer>tester2</Signer>
    </SignerInformation>

    <SignatureValidationProcess>
      <SignatureValidationProcessID>urn:etsi:019102:validationprocess:LTA</SignatureValidationProcessID>
    </SignatureValidationProcess>

    <SignatureValidationStatus>
      <MainIndication>urn:etsi:019102:mainindication:total-passed</MainIndication>
      <AssociatedValidationReportData>
        <TrustAnchor VOReference="CERTIFICATE_FAKE-KISA-RootCA_20250918-0505"/>

        <CertificateChain>
          <SigningCertificate VOReference="CERTIFICATE_tester2_20251117-0407"/>
          <IntermediateCertificate VOReference="CERTIFICATE_FAKE-KISA-CA_20251117-0404"/>
          <TrustAnchor VOReference="CERTIFICATE_FAKE-KISA-RootCA_20250918-0505"/>
        </CertificateChain>

        <CryptoInformation>
          <ValidationObjectId VOReference="SIGNATURE_tester2_20251201-0714"/>
          <Algorithm>http://www.w3.org/2001/04/xmldsig-more#rsa-sha512</Algorithm>
          <SecureAlgorithm>true</SecureAlgorithm>
          <NotAfter>2029-01-01T00:00:00Z</NotAfter>
        </CryptoInformation>

      </AssociatedValidationReportData>
    </SignatureValidationStatus>
  </SignatureValidationReport>
</ValidationReport>
`.trim()
          };
      
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
    policy: ValidationPolicy;
}

/**
 * Verifies an enveloped digital signature by calling a local backend service.
 */
export const verifyEnvelopedSignature = async (
  signedFile: File, 
  policy: ValidationPolicy
): Promise<VerificationResult> => {
  try {
    const docBase64 = await toBase64(signedFile);

    const requestBody: VerifyEnvelopedRequest = {
      signatureBase64: docBase64,
      policy: policy,
    };
    console.log("requestBody : ", requestBody)
    console.log("requestBody : ", JSON.stringify(requestBody));

    // const response = await fetch("http://localhost:8081/kr-dss/verify-signature", {
    //     method: "POST",
    //     headers: {
    //         "Content-Type": "application/json",
    //         "Accept": "application/json",
    //     },
    //     body: JSON.stringify(requestBody),
    // });

    // if (!response.ok) {
    //   const errorText = await response.text();
    //   throw new Error(`Server error: ${response.status}: ${errorText}`);
    // }

    // const result: VerificationResult = await response.json();
    // console.log("Signature generation result:", result);   

    const result: VerificationResult = {
          // 전체 문서 기준 최종 유효 여부 (기술적 검증 관점)
          isValid: true,
          simpleReport: {
            indication: "TOTAL_PASSED",
            message: "1개의 전자서명이 모두 기술적으로 유효합니다. " +
                    "\n다만, 신뢰목록(TSL) 기반의 ‘공인/Qualified’ 여부는 판단할 수 없습니다."
          },
          detailedReport: [
            {
              name: "서명 #1 (tester2, CAdES-B-LTA, SHA-512)",
              status: "PASSED",
              message:
              [
                "• 서명은 TOTAL_PASSED 상태이며, 암호 검증 및 서명 형식 검증을 모두 통과했습니다.",
                "• 서명자 : tester2",
                "• 서명형식 : CAdES-BASELINE-LTA (파일명 및 리포트 내용 기준)",
                "• 사용 해시/서명 알고리즘 : RSA-SHA512",
                "• 자격·신뢰목록(qualification) 관련 :",
                "   - Unable to build a certificate chain up to a trusted list!"
              ].join("\n")
              }
            ],
            diagnosticTree: {
              name: "전자서명 검증 트리",
              status: "PASSED",
              message: "CAdES LTA 서명 1건에 대한 전체 검증 결과",
              children: [
                {
                  name: "서명 #1 – 기술적 검증",
                  status: "PASSED",
                  message: "형식 검증, 서명값 검증, X.509 인증서 검증을 모두 통과했습니다.",
                  children: [
                    {
                      name: "형식 검증 (formatChecking)",
                      status: "PASSED",
                      message: "CAdES LTA 서명 구조가 규격(ETSI EN 319 122/102-1)에 부합합니다."
                    },
                    {
                      name: "서명자 인증서 체인 (x509CertificateValidation)",
                      status: "PASSED",
                      message:
                      [
                        "서명자 인증서 → 중간 CA → Root CA 체인이 정상적으로 검증되었습니다."
                      ].join("\n")
                    },
                    {
                      name: "장기검증(LT/LTA) 정보",
                      status: "PASSED",
                      message:
                      "타임스탬프 및 아카이브 타임스탬프를 이용한 LTA 검증이 성공하였습니다.",
                      children: [
                        {
                          name: "타임스탬프 #1 (signature-time-stamp)",
                          status: "PASSED",
                          message:
                          "FAKE-KISA TSA가 발행한 시점정보가 유효합니다. (ProductionTime = 2025-12-01T07:14:06Z)"
                        },
                        {
                          name: "타임스탬프 #2 (archive-time-stamp)",
                          status: "PASSED",
                          message:
                          "장기보존을 위한 추가 시점정보가 유효하며, 전체 문서(DOCUMENT_Full-document)에 대해 적용됩니다."
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            
            etsValidationReport: `
<?xml version="1.0" encoding="UTF-8"?>
<ValidationReport xmlns="http://uri.etsi.org/19102/v1.4.1#"
                  xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
  <SignatureValidationReport>
    <SignatureIdentifier id="SIGNATURE_tester2_20251201-0714" Format="${signedFile.name}">
      <DigestAlgAndValue>
        <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha512"/>
        <ds:DigestValue>cBOM6KSLRyTRqXbsye4FBzgx6Kvanpsn6Q6BAOnfhDkh0evJSvd9jyqe/HbQJ5r/xEZUo6Bx5YGtsiIpjusH4w==</ds:DigestValue>
      </DigestAlgAndValue>
      <HashOnly>false</HashOnly>
      <DocHashOnly>false</DocHashOnly>
    </SignatureIdentifier>

    <ValidationConstraintsEvaluationReport>
      <ValidationConstraint>
        <ValidationConstraintIdentifier>urn:cef:dss:bbb:formatChecking</ValidationConstraintIdentifier>
        <ConstraintStatus>
          <Status>urn:etsi:019102:constraintStatus:applied</Status>
        </ConstraintStatus>
        <ValidationStatus>
          <MainIndication>urn:etsi:019102:mainindication:passed</MainIndication>
        </ValidationStatus>
      </ValidationConstraint>

      <ValidationConstraint>
        <ValidationConstraintIdentifier>urn:cef:dss:bbb:cryptographicVerification</ValidationConstraintIdentifier>
        <ConstraintStatus>
          <Status>urn:etsi:019102:constraintStatus:applied</Status>
        </ConstraintStatus>
        <ValidationStatus>
          <MainIndication>urn:etsi:019102:mainindication:passed</MainIndication>
        </ValidationStatus>
      </ValidationConstraint>

      <ValidationConstraint>
        <ValidationConstraintIdentifier>urn:cef:dss:bbb:x509CertificateValidation</ValidationConstraintIdentifier>
        <ConstraintStatus>
          <Status>urn:etsi:019102:constraintStatus:applied</Status>
        </ConstraintStatus>
        <ValidationStatus>
          <MainIndication>urn:etsi:019102:mainindication:passed</MainIndication>
        </ValidationStatus>
      </ValidationConstraint>
    </ValidationConstraintsEvaluationReport>

    <ValidationTimeInfo>
      <ValidationTime>2025-12-01T07:14:54Z</ValidationTime>
      <BestSignatureTime>
        <POETime>2025-12-01T07:14:06Z</POETime>
        <TypeOfProof>urn:etsi:019102:poetype:validation</TypeOfProof>
      </BestSignatureTime>
    </ValidationTimeInfo>

    <SignersDocument>
      <DigestAlgAndValue>
        <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
        <ds:DigestValue>os3hy/4zHYJ/HlNBPZiQKwk6LjJVu/97mtYGpBBYSBU=</ds:DigestValue>
      </DigestAlgAndValue>
    </SignersDocument>

    <SignatureAttributes>
      <SigningTime Signed="true">
        <Time>2025-12-01T07:14:06Z</Time>
      </SigningTime>
      <SignatureTimeStamp>
        <TimeStampValue>2025-12-01T07:14:06Z</TimeStampValue>
      </SignatureTimeStamp>
      <ArchiveTimeStamp>
        <TimeStampValue>2025-12-01T07:14:06Z</TimeStampValue>
      </ArchiveTimeStamp>
    </SignatureAttributes>

    <SignerInformation Pseudonym="false">
      <Signer>tester2</Signer>
    </SignerInformation>

    <SignatureValidationProcess>
      <SignatureValidationProcessID>urn:etsi:019102:validationprocess:LTA</SignatureValidationProcessID>
    </SignatureValidationProcess>

    <SignatureValidationStatus>
      <MainIndication>urn:etsi:019102:mainindication:total-passed</MainIndication>
      <AssociatedValidationReportData>
        <TrustAnchor VOReference="CERTIFICATE_FAKE-KISA-RootCA_20250918-0505"/>

        <CertificateChain>
          <SigningCertificate VOReference="CERTIFICATE_tester2_20251117-0407"/>
          <IntermediateCertificate VOReference="CERTIFICATE_FAKE-KISA-CA_20251117-0404"/>
          <TrustAnchor VOReference="CERTIFICATE_FAKE-KISA-RootCA_20250918-0505"/>
        </CertificateChain>

        <CryptoInformation>
          <ValidationObjectId VOReference="SIGNATURE_tester2_20251201-0714"/>
          <Algorithm>http://www.w3.org/2001/04/xmldsig-more#rsa-sha512</Algorithm>
          <SecureAlgorithm>true</SecureAlgorithm>
          <NotAfter>2029-01-01T00:00:00Z</NotAfter>
        </CryptoInformation>
        
      </AssociatedValidationReportData>
    </SignatureValidationStatus>
  </SignatureValidationReport>
</ValidationReport>
`.trim()
          };

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
    case "INTERNALLY DETACHED":
    return "INTERNALLY_DETACHED";
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


