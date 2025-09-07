import React, { useState, useEffect, useCallback } from 'react';
import { SignatureOptions } from '../types';

const initialOptions: SignatureOptions = {
  container: 'No',
  signatureFormat: 'XAdES',
  packaging: 'Enveloped',
  level: 'B-B',
  digestAlgorithm: 'SHA256',
  allowExpiredCertificate: false,
  addContentTimestamp: false,
};

interface SignatureOptionsFormProps {
  onChange: (options: SignatureOptions) => void;
  disabled: boolean;
}

const SignatureOptionsForm: React.FC<SignatureOptionsFormProps> = ({ onChange, disabled }) => {
  const [options, setOptions] = useState<SignatureOptions>(initialOptions);

  useEffect(() => {
    onChange(options);
  }, [options, onChange]);

  const handleOptionChange = useCallback(<K extends keyof SignatureOptions>(field: K, value: SignatureOptions[K]) => {
    setOptions(prev => ({ ...prev, [field]: value }));
  }, []);

  const RadioGroup = ({ label, name, optionsList, selected, field }: { label: string, name: string, optionsList: string[], selected: string, field: keyof SignatureOptions }) => (
    <>
      <label className="font-medium text-gray-300 text-right">{label}</label>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {optionsList.map(option => (
          <label key={option} className="flex items-center space-x-2 text-gray-300 cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option}
              checked={selected === option}
              onChange={() => handleOptionChange(field, option as any)}
              disabled={disabled}
              className="form-radio text-blue-500 bg-gray-800 border-gray-600 focus:ring-blue-500 disabled:opacity-50"
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </>
  );

  const Checkbox = ({ label, field, checked }: { label: string, field: keyof SignatureOptions, checked: boolean }) => (
    <>
      <label className="font-medium text-gray-300 text-right">{label}</label>
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => handleOptionChange(field, e.target.checked)}
          disabled={disabled}
          className="form-checkbox h-5 w-5 text-blue-500 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 disabled:opacity-50"
        />
      </div>
    </>
  );

  return (
    <div className={`bg-gray-700/50 p-6 rounded-lg border border-gray-600 transition-opacity ${disabled ? 'opacity-60' : ''}`}>
      <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-5 items-center">
        <RadioGroup label="Container" name="container" optionsList={['No', 'ASiC-S', 'ASiC-E']} selected={options.container} field="container" />
        <RadioGroup label="Signature format" name="signatureFormat" optionsList={['XAdES', 'CAdES', 'PAdES', 'JAdES']} selected={options.signatureFormat} field="signatureFormat" />
        <RadioGroup label="Packaging" name="packaging" optionsList={['Enveloped', 'Enveloping', 'Detached', 'Internally detached']} selected={options.packaging} field="packaging" />
        
        <label htmlFor="level" className="font-medium text-gray-300 text-right">Level</label>
        <select
          id="level"
          value={options.level}
          onChange={(e) => handleOptionChange('level', e.target.value as SignatureOptions['level'])}
          disabled={disabled}
          className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2 text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50"
        >
          <option>B-B</option>
          <option>B-T</option>
          <option>B-LT</option>
          <option>B-LTA</option>
        </select>

        <RadioGroup label="Digest algorithm" name="digestAlgorithm" optionsList={['SHA1', 'SHA256', 'SHA384', 'SHA512']} selected={options.digestAlgorithm} field="digestAlgorithm" />
        <Checkbox label="Allow expired certificate" field="allowExpiredCertificate" checked={options.allowExpiredCertificate} />
        <Checkbox label="Add a content timestamp" field="addContentTimestamp" checked={options.addContentTimestamp} />
      </div>
    </div>
  );
};

export default SignatureOptionsForm;
