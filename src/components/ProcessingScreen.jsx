export default function ProcessingScreen({ progress = 0 }) {
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-primary-500"></div>
        </div>
        
        <h2 className="text-2xl font-semibold text-gray-900 mb-3">
          Reading your file…
        </h2>
        
        <p className="text-gray-600 text-lg">
          We'll never guess or assume missing details.
        </p>

        {progress > 0 && (
          <div className="mt-8">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-2">{Math.round(progress)}%</p>
          </div>
        )}
      </div>
    </div>
  );
}

