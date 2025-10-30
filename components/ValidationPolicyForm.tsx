import React, { useState, useEffect, useCallback } from 'react';
import { ValidationPolicy } from '../types';

interface ValidationPolicyFormProps {
  onChange: (policy: ValidationPolicy) => void;
  disabled: boolean;
}

const ValidationPolicyForm: React.FC<ValidationPolicyFormProps> = ({ onChange, disabled }) => {
  const [policy, setPolicy] = useState<ValidationPolicy>({
    container: 'NO',
    signatureFormat: 'PAdES',
    signatureLevel: 'B',
    validationTime: new Date().toISOString().slice(0, 16),
    trustAnchor: 'European Union Trusted List (Simulated)',
  });

  useEffect(() => {
    onChange(policy);
  }, [policy, onChange]);

  const handleChange = useCallback(<K extends keyof ValidationPolicy>(field: K, value: ValidationPolicy[K]) => {
    setPolicy((prev) => ({ ...prev, [field]: value }));
  }, []);

  return (
    <div
      className={`bg-gray-700/50 p-6 rounded-lg border border-gray-600 transition-opacity ${
        disabled ? 'opacity-60' : ''
      }`}
    >
      <h3 className="text-lg font-semibold text-center text-blue-300 mb-4">
        Validation Policy Constraints
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-x-6 gap-y-4 items-center">
        {/* Container */}
        <label htmlFor="container" className="font-medium text-gray-300 md:text-right">
          Container
        </label>
        <div className="flex gap-4">
          {['NO', 'ASiC-S', 'ASiC-E'].map((option) => (
            <label key={option} className="flex items-center gap-2 text-gray-200">
              <input
                type="radio"
                name="container"
                value={option}
                checked={policy.container === option}
                onChange={() => handleChange('container', option as ValidationPolicy['container'])}
                disabled={disabled}
                className="accent-blue-500"
              />
              {option}
            </label>
          ))}
        </div>

        {/* Signature Format */}
        <label htmlFor="signatureFormat" className="font-medium text-gray-300 md:text-right">
          Signature Format
        </label>
        <div className="flex flex-wrap gap-4">
          {['XAdES', 'CAdES', 'PAdES', 'JAdES'].map((format) => (
            <label key={format} className="flex items-center gap-2 text-gray-200">
              <input
                type="radio"
                name="signatureFormat"
                value={format}
                checked={policy.signatureFormat === format}
                onChange={() => handleChange('signatureFormat', format as ValidationPolicy['signatureFormat'])}
                disabled={disabled}
                className="accent-blue-500"
              />
              {format}
            </label>
          ))}
        </div>

        {/* Signature Level */}
        <label htmlFor="signatureLevel" className="font-medium text-gray-300 md:text-right">
          Signature Level
        </label>
        <select
          id="signatureLevel"
          value={policy.signatureLevel}
          onChange={(e) => handleChange('signatureLevel', e.target.value as ValidationPolicy['signatureLevel'])}
          disabled={disabled}
          className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2 text-gray-200 focus:ring-2 focus:ring-blue-500"
        >
          <option value="B">B - Basic</option>
          <option value="T">BT - With Timestamp</option>
          <option value="LT">BLT - Long Term (with Validation Data)</option>
          <option value="LTA">BLTA - Archival (with Time-Stamp Chain)</option>
        </select>

        {/* Validation Time */}
        <label htmlFor="validationTime" className="font-medium text-gray-300 md:text-right">
          Validation Time
        </label>
        <div className="flex gap-2">
          <input
            id="validationTime"
            type="datetime-local"
            value={policy.validationTime}
            onChange={(e) => handleChange('validationTime', e.target.value)}
            disabled={disabled}
            className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2 text-gray-200"
          />
          <button
            onClick={() => handleChange('validationTime', new Date().toISOString().slice(0, 16))}
            disabled={disabled}
            className="bg-blue-600 text-white font-semibold py-2 px-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-600 transition-colors"
          >
            Now
          </button>
        </div>

        {/* Trust Anchor */}
        <label htmlFor="trustAnchor" className="font-medium text-gray-300 md:text-right">
          Trust Anchor (Simulated)
        </label>
        <input
          id="trustAnchor"
          type="text"
          value={policy.trustAnchor}
          onChange={(e) => handleChange('trustAnchor', e.target.value)}
          disabled={disabled}
          className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2 text-gray-200"
        />
      </div>
    </div>
  );
};

export default ValidationPolicyForm;
