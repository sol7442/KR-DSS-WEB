import React, { useState, useEffect, useCallback,useRef } from 'react';
import { SignatureOptions } from '../types';

const initialOptions: SignatureOptions = {
  container: 'NO',
  signatureFormat: 'PAdES',
  packaging: 'ENVELOPED',
  level: 'B-B',
  digestAlgorithm: 'SHA-256',
  allowExpiredCertificate: false,
  addContentTimestamp: false,
};

interface SignatureOptionsFormProps {
  onChange: (options: SignatureOptions) => void;
  disabled: boolean;
}

const SignatureOptionsForm: React.FC<SignatureOptionsFormProps> = ({ onChange, disabled }) => {
  
  const [options, setOptions] = useState<SignatureOptions>(initialOptions);
  const [disabledOptions, setDisabledOptions] = useState({
    container: [] as string[],
    signatureFormat: [] as string[],
    packaging: [] as string[],
  });

  const isInternalUpdate = useRef(false); // ✅ 내부 변경인지 추적
  let changed = false;
  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return; // 내부 업데이트는 무시
    }

    console.log('Options changed:', options);

    // This effect synchronizes the state and disables invalid combinations.
    let newOpts = { ...options };
    const newDisabled = { 
      container: [] as string[], 
      signatureFormat: [] as string[], 
      packaging: [] as string[] };


    // Rule: ASiC containers require Detached packaging
    if (newOpts.container === 'ASiC-S' || newOpts.container === 'ASiC-E') {
        newOpts.packaging = 'Detached';
        newDisabled.packaging.push('Enveloped', 'Enveloping', 'Internally detached');        
        newDisabled.signatureFormat.push('PAdES', 'JAdES');        
        changed = true;
    }else{

      if (newOpts.signatureFormat === 'XAdES') {        
        //newOpts.packaging = 'Enveloped';             
        changed = true; 
      }
      if (newOpts.signatureFormat === 'CAdES' || newOpts.signatureFormat === 'JAdES') {       
        //newOpts.packaging = 'Enveloping';            
        newDisabled.packaging.push('Enveloped', 'Internally detached');
        changed = true;
      }
      if (newOpts.signatureFormat === 'PAdES') {       
        //newOpts.packaging = 'Enveloped';    
        newDisabled.packaging.push('Enveloping', 'Detached','Internally detached');
        changed = true;
      }
    }

    setDisabledOptions(prev => {
      if (JSON.stringify(prev) !== JSON.stringify(newDisabled)) {
        return newDisabled;
      }
      return prev;
    });

    if (changed) {
      setOptions(newOpts);
      onChange(newOpts);
    }

  }, [options.signatureFormat, options.container, options.packaging]);


  const handleOptionChange = useCallback(<K extends keyof SignatureOptions>(field: K, value: SignatureOptions[K]) => {
    setOptions(prev => ({ ...prev, [field]: value }));
  }, []);

  const RadioGroup = ({ label, name, optionsList, selected, field, disabledList = [] }: { label: string, name: string, optionsList: string[], selected: string, field: keyof SignatureOptions, disabledList?: string[] }) => (
    <>
      <label className="font-medium text-gray-300 text-right">{label}</label>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {optionsList.map(option => {
          const isOptionDisabled = disabled || disabledList.includes(option);
          return (
            <label key={option} className={`flex items-center space-x-2 text-gray-300 ${isOptionDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
              <input
                type="radio"
                name={name}
                value={option}
                checked={selected === option}
                onChange={() => handleOptionChange(field, option as any)}
                disabled={isOptionDisabled}
                className="form-radio text-blue-500 bg-gray-800 border-gray-600 focus:ring-blue-500 disabled:opacity-50"
              />
              <span>{option}</span>
            </label>
          )
        })}
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
        <RadioGroup label="Container" name="container" optionsList={['No', 'ASiC-S', 'ASiC-E']} selected={options.container} field="container" disabledList={disabledOptions.container} />
        <RadioGroup label="Signature format" name="signatureFormat" optionsList={['XAdES', 'CAdES', 'PAdES', 'JAdES']} selected={options.signatureFormat} field="signatureFormat" disabledList={disabledOptions.signatureFormat} />
        <RadioGroup label="Packaging" name="packaging" optionsList={['Enveloped', 'Enveloping', 'Detached', 'Internally detached']} selected={options.packaging} field="packaging" disabledList={disabledOptions.packaging} />
        
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

        <RadioGroup label="Digest algorithm" name="digestAlgorithm" optionsList={['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']} selected={options.digestAlgorithm} field="digestAlgorithm" />
        <Checkbox label="Allow expired certificate" field="allowExpiredCertificate" checked={options.allowExpiredCertificate} />
        <Checkbox label="Add a content timestamp" field="addContentTimestamp" checked={options.addContentTimestamp} />
      </div>
    </div>
  );
};

export default SignatureOptionsForm;