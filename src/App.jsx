import { useState } from 'react';
import UploadScreen from './components/UploadScreen';
import ProcessingScreen from './components/ProcessingScreen';
import EventDetailsForm from './components/EventDetailsForm';
import ReviewScreen from './components/ReviewScreen';
import { extractEventDetails } from './services/ocrParser';

const INITIAL_EVENT_DATA = {
  eventName: '',
  date: '',
  time: '',
  venue: '',
  city: '',
  description: '',
  whatToExpect: '',
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('upload'); // upload, processing, form, review
  const [eventData, setEventData] = useState(INITIAL_EVENT_DATA);
  const [autoFilledFields, setAutoFilledFields] = useState({});
  const [processingProgress, setProcessingProgress] = useState(0);

  const handleFileUpload = async (file) => {
    setCurrentScreen('processing');
    setProcessingProgress(10);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProcessingProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      // Extract event details from file
      const extractedDetails = await extractEventDetails(file);
      
      clearInterval(progressInterval);
      setProcessingProgress(100);

      // Wait a moment to show 100% progress
      await new Promise(resolve => setTimeout(resolve, 500));

      // Update event data with extracted details
      const newEventData = { ...INITIAL_EVENT_DATA };
      const newAutoFilledFields = {};

      Object.keys(extractedDetails).forEach((key) => {
        if (extractedDetails[key]) {
          newEventData[key] = extractedDetails[key];
          newAutoFilledFields[key] = true;
        }
      });

      setEventData(newEventData);
      setAutoFilledFields(newAutoFilledFields);
      setCurrentScreen('form');
    } catch (error) {
      console.error('Error processing file:', error);
      // On error, still show the form but with empty fields
      setEventData(INITIAL_EVENT_DATA);
      setAutoFilledFields({});
      setCurrentScreen('form');
    } finally {
      setProcessingProgress(0);
    }
  };

  const handleFieldChange = (fieldName, value) => {
    setEventData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleContinueToReview = () => {
    setCurrentScreen('review');
  };

  const handleBackToForm = () => {
    setCurrentScreen('form');
  };

  const handlePublish = () => {
    // In a real app, this would publish the event
    alert('Event published successfully! (This is a demo)');
    // Reset to start
    setCurrentScreen('upload');
    setEventData(INITIAL_EVENT_DATA);
    setAutoFilledFields({});
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleContinueToReview();
  };

  return (
    <div className="App">
      {currentScreen === 'upload' && (
        <UploadScreen onFileUpload={handleFileUpload} />
      )}

      {currentScreen === 'processing' && (
        <ProcessingScreen progress={processingProgress} />
      )}

      {currentScreen === 'form' && (
        <div>
          <EventDetailsForm
            eventData={eventData}
            onFieldChange={handleFieldChange}
            autoFilledFields={autoFilledFields}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
            <div className="max-w-3xl mx-auto px-4 py-6">
              <form onSubmit={handleFormSubmit}>
                <button
                  type="submit"
                  className="w-full bg-primary-600 text-white font-semibold py-4 px-6 rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
                >
                  Continue to Review
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {currentScreen === 'review' && (
        <ReviewScreen
          eventData={eventData}
          onPublish={handlePublish}
          onBack={handleBackToForm}
        />
      )}
    </div>
  );
}

