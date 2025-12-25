export default function ReviewScreen({ eventData, onPublish, onBack }) {
  const fields = [
    { key: 'eventName', label: 'Event Name' },
    { key: 'date', label: 'Date' },
    { key: 'time', label: 'Time' },
    { key: 'venue', label: 'Venue' },
    { key: 'city', label: 'City' },
    { key: 'description', label: 'Description' },
    { key: 'whatToExpect', label: 'What to Expect' },
  ];

  return (
    <div className="min-h-screen gradient-bg pb-24">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Review & Publish
          </h1>
          <p className="text-gray-600">
            Review your event details before going live
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-6">
          {fields.map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
              </label>
              <div className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg border border-gray-200 min-h-[44px]">
                {eventData[field.key] || (
                  <span className="text-gray-400 italic">Not provided</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-4">
          <button
            onClick={onBack}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Back to Edit
          </button>
        </div>
      </div>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <button
            onClick={onPublish}
            className="w-full bg-primary-600 text-white font-semibold py-4 px-6 rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
          >
            Go Live
          </button>
          <p className="text-center text-sm text-gray-500 mt-3">
            You're always in control. Review before publishing.
          </p>
        </div>
      </div>
    </div>
  );
}

