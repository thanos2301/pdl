import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';
import { countries } from '../data/countries';

export default function Profile() {
  const navigate = useNavigate();
  const { userEmail } = useAuth();
  const [profile, setProfile] = useState({
    name: '',
    gender: '',
    dob: '',
    country: '',
    height: '',
    weight: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setProfile({
          ...data,
          dob: data.dob ? new Date(data.dob).toISOString().split('T')[0] : '',
          country: data.country || ''
        });
      }
    } catch (err) {
      setError('Failed to fetch profile');
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return '';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const calculateBMI = () => {
    if (!profile.height || !profile.weight) return '';
    const heightInMeters = profile.height / 100;
    const bmi = (profile.weight / (heightInMeters * heightInMeters)).toFixed(1);
    return bmi;
  };

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all required fields
    if (!profile.name || !profile.gender || !profile.dob || !profile.country || !profile.height || !profile.weight) {
      setError('Please fill in all required fields');
      return;
    }

    // Validate height and weight ranges
    if (profile.height < 1 || profile.height > 300) {
      setError('Please enter a valid height between 1 and 300 cm');
      return;
    }

    if (profile.weight < 1 || profile.weight > 500) {
      setError('Please enter a valid weight between 1 and 500 kg');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: profile.name,
          gender: profile.gender,
          dob: profile.dob,
          country: profile.country,
          height: parseFloat(profile.height),
          weight: parseFloat(profile.weight)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      // Show success message and redirect
      localStorage.setItem('profileUpdateSuccess', 'true');
      navigate('/'); // Redirect to landing page
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const getCountryName = (code) => {
    const country = countries.find(c => c.code === code);
    return country ? `${country.flag} ${country.name}` : '';
  };

  // Add this CSS class for required field indicator
  const requiredField = "after:content-['*'] after:ml-0.5 after:text-red-500";

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-black overflow-hidden">
      {/* Background overlay with fitness image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.85)), url('https://images.unsplash.com/photo-1571902943202-507ec2618e8f?ixlib=rb-1.2.1&auto=format&fit=crop&w=2070&q=80')`,
          backgroundPosition: 'center',
          backgroundSize: 'cover'
        }}
      />

      <div className="relative z-10 min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/80 dark:bg-black/30 backdrop-blur-md shadow-xl rounded-xl p-8 border border-gray-200 dark:border-gray-700">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">Your Profile</h2>
            
            {error && (
              <div className="mb-6 text-sm text-red-400 bg-red-900/50 p-3 rounded-lg border border-red-500">
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-6 text-sm text-green-400 bg-green-900/50 p-3 rounded-lg border border-green-500">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information Section */}
              <div className="bg-white/50 dark:bg-white/10 backdrop-blur-md rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email
                    </label>
                    <div className="h-10 px-3 py-2 bg-black/30 rounded-md text-gray-300 border border-gray-700">
                      {userEmail}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="name" className={`block text-sm font-medium text-gray-300 mb-2 ${requiredField}`}>
                      Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={profile.name}
                      onChange={handleChange}
                      required
                      className="h-10 w-full px-3 py-2 bg-black/30 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="gender" className={`block text-sm font-medium text-gray-300 mb-2 ${requiredField}`}>
                      Gender
                    </label>
                    <select
                      name="gender"
                      id="gender"
                      value={profile.gender}
                      onChange={handleChange}
                      required
                      className="h-10 w-full px-3 py-2 bg-black/30 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="dob" className={`block text-sm font-medium text-gray-300 mb-2 ${requiredField}`}>
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="dob"
                      id="dob"
                      value={profile.dob}
                      onChange={handleChange}
                      required
                      className="h-10 w-full px-3 py-2 bg-black/30 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="country" className={`block text-sm font-medium text-gray-300 mb-2 ${requiredField}`}>
                      Country
                    </label>
                    <input
                      type="text"
                      name="country"
                      id="country"
                      value={profile.country}
                      onChange={handleChange}
                      required
                      placeholder="Enter your country"
                      className="h-10 w-full px-3 py-2 bg-black/30 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Physical Information Section */}
              <div className="bg-white/50 dark:bg-white/10 backdrop-blur-md rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Physical Information</h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="height" className={`block text-sm font-medium text-gray-300 mb-2 ${requiredField}`}>
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      name="height"
                      id="height"
                      value={profile.height}
                      onChange={handleChange}
                      required
                      min="1"
                      max="300"
                      className="h-10 w-full px-3 py-2 bg-black/30 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="weight" className={`block text-sm font-medium text-gray-300 mb-2 ${requiredField}`}>
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      name="weight"
                      id="weight"
                      value={profile.weight}
                      onChange={handleChange}
                      required
                      min="1"
                      max="500"
                      className="h-10 w-full px-3 py-2 bg-black/30 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Calculated Information Section */}
              <div className="bg-primary-900/30 backdrop-blur-md rounded-lg p-6 border border-primary-700">
                <h3 className="text-lg font-medium text-white mb-4">Calculated Information</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="bg-black/30 backdrop-blur-sm p-4 rounded-lg border border-gray-700">
                    <div className="text-sm text-gray-400 mb-1">Age</div>
                    <div className="text-xl font-semibold text-white">
                      {calculateAge(profile.dob) || '-'} years
                    </div>
                  </div>
                  <div className="bg-black/30 backdrop-blur-sm p-4 rounded-lg border border-gray-700">
                    <div className="text-sm text-gray-400 mb-1">BMI</div>
                    <div className="text-xl font-semibold text-white">
                      {calculateBMI() || '-'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6">
                <button
                  type="submit"
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors shadow-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 