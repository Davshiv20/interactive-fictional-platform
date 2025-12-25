import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

export default function UploadScreen({ onFileUpload }) {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      onFileUpload(acceptedFiles[0]);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'text/*': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    multiple: false,
  });

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-semibold text-gray-900 mb-3">
            Create your event
          </h1>
          <p className="text-lg text-gray-600">
            Upload your poster or event plan. We'll only auto-fill what we're confident about.
          </p>
        </div>

        <div
          {...getRootProps()}
          className={`
            bg-white rounded-2xl border-2 border-dashed p-12 cursor-pointer
            transition-all duration-200
            ${isDragActive 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-gray-300 hover:border-gray-400'
            }
          `}
        >
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center justify-center text-center">
            <div className="mb-6">
              <svg
                className="w-16 h-16 mx-auto text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>

            <p className="text-xl font-medium text-gray-900 mb-2">
              {isDragActive ? 'Drop your file here' : 'Drag & drop your file here'}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              or click to browse
            </p>

            <div className="flex flex-wrap gap-2 justify-center text-xs text-gray-500">
              <span className="px-3 py-1 bg-gray-100 rounded-full">Image</span>
              <span className="px-3 py-1 bg-gray-100 rounded-full">PDF</span>
              <span className="px-3 py-1 bg-gray-100 rounded-full">Document</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

