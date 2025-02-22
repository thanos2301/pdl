import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

export default function Rehabilitation() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [description, setDescription] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);

  // Initialize speech recognition
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  // Configure recognition
  const initRecognition = useCallback(() => {
    if (!recognition) return null;

    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('Speech recognition started');
      setIsRecording(true);
      setError('');
      setAudioChunks([]); // Reset audio chunks
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      switch (event.error) {
        case 'no-speech':
          setError('No speech was detected. Please try again.');
          break;
        case 'audio-capture':
          setError('No microphone was found. Ensure it is plugged in and allowed.');
          break;
        case 'not-allowed':
          setError('Microphone permission was denied. Please allow access and try again.');
          break;
        default:
          setError('Error recording speech. Please try again.');
      }
      stopRecording();
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
      setIsRecording(false);
    };

    return recognition;
  }, [recognition]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }

    // Check profile completion
    const checkProfile = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        
        // Check if all required fields are filled
        const isComplete = data && data.name && data.gender && data.dob && 
                          data.country && data.height && data.weight;
        setProfileComplete(isComplete);
      } catch (err) {
        console.error('Error checking profile:', err);
      }
    };

    const fetchRehabilitation = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/rehabilitation`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        if (response.ok && data.description) {
          setDescription(data.description);
        }
      } catch (err) {
        console.error('Error fetching rehabilitation data:', err);
      }
    };

    checkProfile();
    if (isAuthenticated) {
      fetchRehabilitation();
      initRecognition();
    }
  }, [isAuthenticated, navigate, initRecognition]);

  const startRecording = async () => {
    if (!recognition) {
      setError('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
      };

      mediaRecorder.start();
      setAudioChunks(chunks);

      recognition.onresult = (event) => {
        const result = event.results[event.results.length - 1];
        if (result.isFinal) {
          const transcript = result[0].transcript;
          setDescription(prev => {
            const prefix = prev ? prev + '\n' : '';
            return prefix + transcript.trim();
          });
        }
      };

      recognition.start();
    } catch (err) {
      console.error('Speech recognition start error:', err);
      setError('Failed to start speech recognition. Please try again.');
    }
  };

  const stopRecording = () => {
    if (recognition) {
      try {
        recognition.stop();
      } catch (err) {
        console.error('Speech recognition stop error:', err);
      }
    }
    setIsRecording(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('description', description);
      if (audioBlob) {
        formData.append('audio', audioBlob);
      }

      const response = await fetch(`${API_BASE_URL}/auth/rehabilitation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error);
      }

      setSuccess('Rehabilitation information saved successfully!');
      setAudioBlob(null); // Reset audio blob after successful save
    } catch (err) {
      setError(err.message || 'Failed to save rehabilitation information');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-black py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/80 dark:bg-black/30 backdrop-blur-md shadow-xl rounded-xl p-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Rehabilitation Assessment</h2>
          
          {/* Profile Warning */}
          {!profileComplete && (
            <div className="mb-6 p-4 bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-400 dark:border-yellow-500 text-yellow-800 dark:text-yellow-200 rounded">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-medium">Profile Incomplete</p>
                  <p className="text-sm mt-1">
                    Please complete your profile before proceeding with rehabilitation assessment.{' '}
                    <Link to="/profile" className="underline font-medium hover:text-yellow-900 dark:hover:text-yellow-100">
                      Update Profile
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-500 text-red-700 dark:text-red-300 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-100 dark:bg-green-900/50 border border-green-400 dark:border-green-500 text-green-700 dark:text-green-300 rounded">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Please specify any injuries, physical limitations, or disabilities you're currently facing:
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-black/30 text-gray-900 dark:text-white placeholder-gray-500"
                placeholder="Describe your current physical condition and any specific concerns..."
                disabled={!profileComplete}
              />
            </div>

            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={!profileComplete}
                className={`px-4 py-2 rounded-md text-white ${
                  isRecording 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                } transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isRecording ? 'Stop Recording' : 'Start Voice Recording'}
              </button>

              <button
                type="submit"
                disabled={isLoading || !description.trim() || !profileComplete}
                className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Saving...' : 'Save Information'}
              </button>
            </div>
          </form>

          {isLoading && (
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              {isRecording ? 'Processing your voice...' : 'Saving your information...'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 