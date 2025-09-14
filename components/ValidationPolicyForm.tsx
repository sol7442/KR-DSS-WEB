
import React, { useState, useEffect, useCallback } from 'react';
import { ValidationPolicy } from '../types';

interface ValidationPolicyFormProps {
  onChange: (policy: ValidationPolicy) => void;
  disabled: boolean;
}

const ValidationPolicyForm: React.FC<ValidationPolicyFormProps> = ({ onChange, disabled }) => {
    const [policy, setPolicy] = useState<ValidationPolicy>({
        validationModel: 'Shell',
        digestAlgorithmRequirement: 'SHA256',
        validationTime: new Date().toISOString().slice(0, 16),
        trustAnchor: 'European Union Trusted List (Simulated)'
    });
    
    useEffect(() => {
        onChange(policy);
    }, [policy, onChange]);

    const handleChange = useCallback(<K extends keyof ValidationPolicy>(field: K, value: ValidationPolicy[K]) => {
        setPolicy(prev => ({ ...prev, [field]: value }));
    }, []);
    
    return (
        <div className={`bg-gray-700/50 p-6 rounded-lg border border-gray-600 transition-opacity ${disabled ? 'opacity-60' : ''}`}>
            <h3 className="text-lg font-semibold text-center text-blue-300 mb-4">Validation Policy Constraints</h3>
            <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-x-6 gap-y-4 items-center">
                {/* Validation Model */}
                <label htmlFor="validationModel" className="font-medium text-gray-300 md:text-right">Certificate Validation Model</label>
                <select
                    id="validationModel"
                    value={policy.validationModel}
                    onChange={(e) => handleChange('validationModel', e.target.value as ValidationPolicy['validationModel'])}
                    disabled={disabled}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2 text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50"
                >
                    <option>Shell</option>
                    <option>Chain</option>
                </select>
                
                {/* Digest Algorithm */}
                <label htmlFor="digestAlgorithmRequirement" className="font-medium text-gray-300 md:text-right">Digest Algorithm Requirement</label>
                <select
                    id="digestAlgorithmRequirement"
                    value={policy.digestAlgorithmRequirement}
                    onChange={(e) => handleChange('digestAlgorithmRequirement', e.target.value as ValidationPolicy['digestAlgorithmRequirement'])}
                    disabled={disabled}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2 text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50"
                >
                    <option value="Any">Any</option>
                    <option value="SHA256">SHA256 or stronger</option>
                    <option value="SHA384">SHA384 or stronger</option>
                    <option value="SHA512">SHA512 only</option>
                </select>
                
                {/* Validation Time */}
                <label htmlFor="validationTime" className="font-medium text-gray-300 md:text-right">Validation Time</label>
                <div className="flex gap-2">
                    <input
                        id="validationTime"
                        type="datetime-local"
                        value={policy.validationTime}
                        onChange={(e) => handleChange('validationTime', e.target.value)}
                        disabled={disabled}
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2 text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50"
                    />
                    <button 
                        onClick={() => handleChange('validationTime', new Date().toISOString().slice(0, 16))}
                        disabled={disabled}
                        className="bg-blue-600 text-white font-semibold py-2 px-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-600 transition-colors"
                        title="Set to current time"
                    >
                        Now
                    </button>
                </div>

                {/* Trust Anchor */}
                <label htmlFor="trustAnchor" className="font-medium text-gray-300 md:text-right">Trust Anchor (Simulated)</label>
                <input
                    id="trustAnchor"
                    type="text"
                    value={policy.trustAnchor}
                    onChange={(e) => handleChange('trustAnchor', e.target.value)}
                    disabled={disabled}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2 text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50"
                />
            </div>
        </div>
    );
};

export default ValidationPolicyForm;