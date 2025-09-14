import React, { useState, useRef, useCallback } from 'react';
import { UploadIcon, FileIcon } from './Icons';

interface FileUploaderProps {
  onFileChange: (file: File | null) => void;
  accept?: string;
  fileTypeDescription?: string;
  placeholder?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileChange, accept, fileTypeDescription = "Any file type is accepted", placeholder = "Click to upload a document" }) => {
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      onFileChange(file);
    } else {
      setFileName('');
      onFileChange(null);
    }
  }, [onFileChange]);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        accept={accept}
      />
      <button
        onClick={handleButtonClick}
        className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-600 rounded-lg hover:bg-gray-700/50 hover:border-blue-500 transition-colors duration-300"
      >
        <UploadIcon className="w-10 h-10 text-gray-400 mb-2" />
        <span className="text-lg font-semibold text-gray-300">
          {fileName ? 'Click to change file' : placeholder}
        </span>
        <span className="text-sm text-gray-500">{fileTypeDescription}</span>
      </button>
      {fileName && (
        <div className="mt-4 flex items-center justify-center bg-gray-700 p-3 rounded-lg">
          <FileIcon className="w-5 h-5 text-blue-400 mr-2 flex-shrink-0" />
          <span className="text-sm text-gray-200 truncate" title={fileName}>
            Selected file: {fileName}
          </span>
        </div>
      )}
    </div>
  );
};

export default FileUploader;