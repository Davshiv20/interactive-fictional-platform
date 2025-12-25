export default function EventDetailsForm({ eventData, onFieldChange, autoFilledFields = {} }) {
  const hasAutoFilledFields = Object.keys(autoFilledFields).length > 0;
  const allFieldsEmpty = Object.values(eventData).every(val => !val || val.trim() === '');

  return (
    <div className="min-h-screen gradient-bg py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Event Details
          </h1>
          <p className="text-gray-600">
            Review and complete your event information
          </p>
        </div>

        {allFieldsEmpty && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-blue-800">
                We couldn't confidently detect event details. Please add them manually.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-6">
          {/* Event Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Name
              {autoFilledFields.eventName && (
                <span className="ml-2 text-xs text-primary-600 font-normal">
                  (Detected from uploaded file)
                </span>
              )}
              {!autoFilledFields.eventName && (
                <span className="ml-2 text-xs text-gray-500 font-normal">
                  (Add manually)
                </span>
              )}
            </label>
            <input
              type="text"
              value={eventData.eventName || ''}
              onChange={(e) => onFieldChange('eventName', e.target.value)}
              className={`
                w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                ${autoFilledFields.eventName 
                  ? 'border-primary-200 bg-primary-50/30' 
                  : 'border-gray-300 bg-white'
                }
              `}
              placeholder=""
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
              {autoFilledFields.date && (
                <span className="ml-2 text-xs text-primary-600 font-normal">
                  (Detected from uploaded file)
                </span>
              )}
              {!autoFilledFields.date && (
                <span className="ml-2 text-xs text-gray-500 font-normal">
                  (Add manually)
                </span>
              )}
            </label>
            <input
              type="text"
              value={eventData.date || ''}
              onChange={(e) => onFieldChange('date', e.target.value)}
              className={`
                w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                ${autoFilledFields.date 
                  ? 'border-primary-200 bg-primary-50/30' 
                  : 'border-gray-300 bg-white'
                }
              `}
              placeholder=""
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time
              {autoFilledFields.time && (
                <span className="ml-2 text-xs text-primary-600 font-normal">
                  (Detected from uploaded file)
                </span>
              )}
              {!autoFilledFields.time && (
                <span className="ml-2 text-xs text-gray-500 font-normal">
                  (Add manually)
                </span>
              )}
            </label>
            <input
              type="text"
              value={eventData.time || ''}
              onChange={(e) => onFieldChange('time', e.target.value)}
              className={`
                w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                ${autoFilledFields.time 
                  ? 'border-primary-200 bg-primary-50/30' 
                  : 'border-gray-300 bg-white'
                }
              `}
              placeholder=""
            />
          </div>

          {/* Venue */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Venue
              {autoFilledFields.venue && (
                <span className="ml-2 text-xs text-primary-600 font-normal">
                  (Detected from uploaded file)
                </span>
              )}
              {!autoFilledFields.venue && (
                <span className="ml-2 text-xs text-gray-500 font-normal">
                  (Add manually)
                </span>
              )}
            </label>
            <input
              type="text"
              value={eventData.venue || ''}
              onChange={(e) => onFieldChange('venue', e.target.value)}
              className={`
                w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                ${autoFilledFields.venue 
                  ? 'border-primary-200 bg-primary-50/30' 
                  : 'border-gray-300 bg-white'
                }
              `}
              placeholder=""
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City
              {autoFilledFields.city && (
                <span className="ml-2 text-xs text-primary-600 font-normal">
                  (Detected from uploaded file)
                </span>
              )}
              {!autoFilledFields.city && (
                <span className="ml-2 text-xs text-gray-500 font-normal">
                  (Add manually)
                </span>
              )}
            </label>
            <input
              type="text"
              value={eventData.city || ''}
              onChange={(e) => onFieldChange('city', e.target.value)}
              className={`
                w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                ${autoFilledFields.city 
                  ? 'border-primary-200 bg-primary-50/30' 
                  : 'border-gray-300 bg-white'
                }
              `}
              placeholder=""
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
              {autoFilledFields.description && (
                <span className="ml-2 text-xs text-primary-600 font-normal">
                  (Detected from uploaded file)
                </span>
              )}
              {!autoFilledFields.description && (
                <span className="ml-2 text-xs text-gray-500 font-normal">
                  (Add manually)
                </span>
              )}
            </label>
            <textarea
              value={eventData.description || ''}
              onChange={(e) => onFieldChange('description', e.target.value)}
              rows={4}
              className={`
                w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                ${autoFilledFields.description 
                  ? 'border-primary-200 bg-primary-50/30' 
                  : 'border-gray-300 bg-white'
                }
              `}
              placeholder=""
            />
          </div>

          {/* What to Expect */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What to Expect
              {autoFilledFields.whatToExpect && (
                <span className="ml-2 text-xs text-primary-600 font-normal">
                  (Detected from uploaded file)
                </span>
              )}
              {!autoFilledFields.whatToExpect && (
                <span className="ml-2 text-xs text-gray-500 font-normal">
                  (Add manually)
                </span>
              )}
            </label>
            <textarea
              value={eventData.whatToExpect || ''}
              onChange={(e) => onFieldChange('whatToExpect', e.target.value)}
              rows={4}
              className={`
                w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                ${autoFilledFields.whatToExpect 
                  ? 'border-primary-200 bg-primary-50/30' 
                  : 'border-gray-300 bg-white'
                }
              `}
              placeholder=""
            />
          </div>
        </div>
      </div>
    </div>
  );
}

