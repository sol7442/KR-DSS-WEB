import { GoogleGenAI } from "@google/genai";
import { SignatureResult, SignatureOptions, VerificationResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

/**
 * Generates a simulated digital signature by calling a backend server.
 * @param document The file to be signed.
 * @param options The selected signature options.
 * @returns A promise that resolves to the signature result.
 */
export const generateSignature = async (document: File, options: SignatureOptions): Promise<SignatureResult> => {
    try {
        const formData = new FormData();
        formData.append('document', document);
        formData.append('options', JSON.stringify(options));

        const response = await fetch('http://localhost:8080/kr-dss/sign-document', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            let errorMessage = `Server error: ${response.status}`;
            try {
                // Try to parse a more specific error message from the server response
                const errorData = await response.json();
                errorMessage = errorData.message || JSON.stringify(errorData);
            } catch (e) {
                // If response is not JSON, use the status text
                errorMessage = `${errorMessage} ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }

        const result: SignatureResult = await response.json();
        return result;

    } catch (error) {
        console.error("Error generating signature from server:", error);
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        throw new Error(`Signature generation failed: ${message}`);
    }
};

/**
 * Verifies a simulated digital signature using the Gemini API.
 * @param documentHash The SHA-256 hash of the original document.
 * @param signatureBlock The signature block to verify (as a JSON string).
 * @returns A promise that resolves to the verification result.
 */
export const verifySignature = async (documentHash: string, signatureBlock: string): Promise<VerificationResult> => {
    try {
        let parsedSignature: SignatureResult;
        try {
            parsedSignature = JSON.parse(signatureBlock);
        } catch (e) {
            return { isValid: false, message: "Invalid signature format. The signature block is not valid JSON." };
        }

        const prompt = `
            Act as a digital signature verification service.
            You need to verify if the provided document hash matches the hash embedded in the signature block.
            
            Current Document SHA-256 Hash: ${documentHash}
            
            Signature Block for Verification:
            ${JSON.stringify(parsedSignature, null, 2)}
            
            Analyze the signature block. Compare the 'documentHash' from the block with the 'Current Document SHA-256 Hash'.
            - If they match, the signature is valid. Respond with a success message.
            - If they do not match, the signature is invalid. Respond with a failure message explaining the hash mismatch.
            - Also, check if the signature options seem consistent. For example, if the digest algorithm in the options is SHA256, it should match the hash type.
            
            Based on your analysis, provide a simple JSON response with two fields: "isValid" (boolean) and "message" (string).
            Example valid response: {"isValid": true, "message": "Signature is valid. Document hash matches the signed hash."}
            Example invalid response: {"isValid": false, "message": "Signature is invalid. The document has been altered since it was signed (hash mismatch)."}
            Return ONLY the JSON object.
        `;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        const cleanedText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
        const resultJson = JSON.parse(cleanedText);
        
        return resultJson;

    } catch (error) {
        console.error("Error verifying signature with AI:", error);
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        throw new Error(`AI signature verification failed: ${message}`);
    }
};
