import React, { useState, useEffect, useCallback } from 'react';
import { Book, Star, Camera, X, Crown, Menu } from 'lucide-react';
import Cropper from 'react-easy-crop';
import PremiumModal from './PremiumModal';

export default function UserProfile({ onNavigate, userId }) {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [profileData, setProfileData] = useState({
    bio: '',
    profilePicture: '',
    headerImage: ''
  });
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [reviewError, setReviewError] = useState('');

  const [isCropping, setIsCropping] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState('');
  const [cropType, setCropType] = useState('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      
      setProfileData({
        bio: userData.bio || '',
        profilePicture: userData.profilePicture || '',
        headerImage: userData.headerImage || ''
      });
    } else {
      // Redirect to login if no token
      onNavigate && onNavigate('login');
      return;
    }

    // Fetch user's reviews
    fetchUserReviews(token);
  }, []);

  const fetchUserReviews = async (token) => {
    setLoadingReviews(true);
    setReviewError('');
    try {
      const response = await fetch('http://localhost:5000/api/reviews/user', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setReviews(data.reviews || []);
      } else {
        setReviewError(data.message || 'Failed to load reviews');
      }
    } catch (err) {
      console.error('Error fetching user reviews:', err);
      setReviewError('Failed to load reviews. Please check your connection.');
    } finally {
      setLoadingReviews(false);
    }
  };

  const handlePremiumSuccess = (updatedUser) => {
    setUser(updatedUser);
    setShowPremiumModal(false);
  };

  const compressImage = (canvas, quality = 0.7) => {
    return new Promise((resolve, reject) => {
      try {
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        const sizeInMB = (compressedBase64.length * 3) / 4 / (1024 * 1024);
        console.log(`Compressed image size: ${sizeInMB.toFixed(2)}MB`);
        
        if (sizeInMB > 5) {
          reject(new Error('Image still too large after compression. Please use a smaller image.'));
        } else {
          resolve(compressedBase64);
        }
      } catch (err) {
        reject(err);
      }
    });
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropSave = async () => {
    try {
      const image = new Image();
      image.src = tempImageSrc;
      await new Promise((resolve) => { image.onload = resolve; });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      ctx.drawImage(
        image,
        croppedAreaPixels.x * scaleX,
        croppedAreaPixels.y * scaleY,
        croppedAreaPixels.width * scaleX,
        croppedAreaPixels.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const quality = cropType === 'profile' ? 0.8 : 0.7;
      const croppedBase64 = await compressImage(canvas, quality);

      if (cropType === 'profile') {
        setProfileData({ ...profileData, profilePicture: croppedBase64 });
      } else if (cropType === 'header') {
        setProfileData({ ...profileData, headerImage: croppedBase64 });
      }

      setIsCropping(false);
      setTempImageSrc('');
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    } catch (err) {
      console.error('Error saving cropped image:', err);
      alert(err.message || 'Error processing image.');
    }
  };

  const handleCropCancel = () => {
    setIsCropping(false);
    setTempImageSrc('');
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const handleProfilePictureSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Image is too large. Please select an image smaller than 10MB');
      return;
    }

    setTempImageSrc(URL.createObjectURL(file));
    setCropType('profile');
    setIsCropping(true);
  };

  const handleHeaderImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Image is too large. Please select an image smaller than 10MB');
      return;
    }

    setTempImageSrc(URL.createObjectURL(file));
    setCropType('header');
    setIsCropping(true);
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Please login again');
        return;
      }

      console.log('Sending profile update...');
      
      const response = await fetch('http://localhost:5000/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bio: profileData.bio,
          profilePicture: profileData.profilePicture || '',
          headerImage: profileData.headerImage || ''
        })
      });

      const data = await response.json();
      console.log('Server response:', data);

      if (data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        setProfileData({
          bio: data.user.bio || '',
          profilePicture: data.user.profilePicture || '',
          headerImage: data.user.headerImage || ''
        });
        setIsEditing(false);
        alert('Profile updated successfully!');
        window.location.reload();
      } else {
        setError(data.message || 'Failed to update profile');
        alert('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Network error. Please check your connection and try again.');
      alert('Error: Could not connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    onNavigate && onNavigate('home');
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <p className="text-xl text-gray-600">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-purple-50">
      {/* Premium Modal */}
      <PremiumModal 
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        onSuccess={handlePremiumSuccess}
      />

      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div 
              className="flex items-center space-x-2 cursor-pointer" 
              onClick={() => onNavigate && onNavigate('home')}
            >
              <Book className="w-8 h-8 text-orange-500" />
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-blue-500 bg-clip-text text-transparent">
                Novelle
              </span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => onNavigate && onNavigate('home')}
                className="text-gray-700 hover:text-orange-500 transition"
              >
                Home
              </button>
              <a href="#" className="text-gray-700 hover:text-orange-500 transition">Browse</a>
              <a href="#" className="text-gray-700 hover:text-orange-500 transition">Community</a>
              <a href="#" className="text-gray-700 hover:text-orange-500 transition">My Books</a>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              {/* Premium Button */}
              {!user.isPremium ? (
                <button
                  onClick={() => setShowPremiumModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 text-white rounded-full font-bold hover:shadow-lg transition flex items-center space-x-2"
                >
                  <Crown className="w-4 h-4" />
                  <span>Premium</span>
                </button>
              ) : (
                <div className="px-4 py-2 bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 text-white rounded-full font-bold flex items-center space-x-2">
                  <Crown className="w-4 h-4" />
                  <span>Premium</span>
                </div>
              )}

              <div className="relative">
                <button 
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-100 rounded-full transition"
                >
                  {user?.profilePicture ? (
                    <img 
                      src={user.profilePicture} 
                      alt="Profile" 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center text-white font-bold">
                      {user?.fullname?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="font-semibold text-gray-700">@{user?.username}</span>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowDropdown(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 z-50">
                      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 py-2">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-semibold text-gray-900">{user?.fullname}</p>
                          <p className="text-xs text-gray-500">{user?.email}</p>
                          {user.isPremium && (
                            <div className="mt-2 flex items-center space-x-1 text-xs text-yellow-600">
                              <Crown className="w-3 h-3" />
                              <span>Premium Member</span>
                            </div>
                          )}
                        </div>
                        
                        <button
                          onClick={() => setIsEditing(!isEditing)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 transition flex items-center space-x-3"
                        >
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-sm text-gray-700">{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
                        </button>
                        
                        <div className="border-t border-gray-100 mt-2 pt-2">
                          <button
                            onClick={handleLogout}
                            className="w-full px-4 py-3 text-left hover:bg-red-50 transition flex items-center space-x-3"
                          >
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span className="text-sm text-red-600 font-semibold">Logout</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-4 py-3 space-y-3">
              <button 
                onClick={() => onNavigate && onNavigate('home')}
                className="block w-full text-left text-gray-700 hover:text-orange-500"
              >
                Home
              </button>
              {!user.isPremium && (
                <button 
                  className="w-full px-4 py-2 bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 text-white rounded-full font-bold flex items-center justify-center space-x-2"
                  onClick={() => setShowPremiumModal(true)}
                >
                  <Crown className="w-4 h-4" />
                  <span>Upgrade to Premium</span>
                </button>
              )}
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="block w-full text-left text-gray-700 hover:text-orange-500"
              >
                {isEditing ? 'Cancel Edit' : 'Edit Profile'}
              </button>
              <button 
                onClick={handleLogout}
                className="w-full px-4 py-2 text-red-600 border border-red-300 rounded-full"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="relative h-64 rounded-t-3xl overflow-hidden bg-gray-100">
          {profileData.headerImage ? (
            <img src={profileData.headerImage} alt="Header" className="w-full h-full object-cover" />
          ) : user?.headerImage ? (
            <img src={user.headerImage} alt="Header" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Book className="w-20 h-20 text-gray-300" />
            </div>
          )}
          
          {isEditing && (
            <div className="absolute top-4 right-4 flex space-x-2">
              <label className="p-2 bg-white/90 rounded-full cursor-pointer hover:bg-white transition">
                <Camera className="w-5 h-5 text-gray-800" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleHeaderImageSelect}
                  className="hidden"
                />
              </label>
              <button 
                onClick={() => setProfileData({ ...profileData, headerImage: '' })}
                className="p-2 bg-white/90 rounded-full cursor-pointer hover:bg-white transition"
              >
                <X className="w-5 h-5 text-gray-800" />
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-b-3xl shadow-xl p-8 -mt-16 relative">
          <div className="relative -mt-20 mb-4">
            <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gray-200 mx-auto">
              {profileData.profilePicture ? (
                <img src={profileData.profilePicture} alt="Profile" className="w-full h-full object-cover" />
              ) : user?.profilePicture ? (
                <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-400 to-pink-400">
                  <span className="text-4xl font-bold text-white">
                    {user?.fullname?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            
            {isEditing && (
              <label className="absolute bottom-0 right-1/2 translate-x-16 translate-y-2 p-2 bg-orange-500 rounded-full cursor-pointer hover:bg-orange-600 transition">
                <Camera className="w-4 h-4 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{user?.fullname}</h1>
            <p className="text-gray-600 mb-1">@{user?.username}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            
            {user.isPremium && (
              <div className="mt-3 inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-full">
                <Crown className="w-5 h-5 text-yellow-600" />
                <span className="text-sm font-bold text-yellow-700">Premium Member</span>
              </div>
            )}
            
            <div className="flex items-center justify-center space-x-2 mt-4">
              <span className="text-sm font-semibold text-gray-700">Reading Frequency:</span>
              <div className="flex">{renderStars(user?.rating || 0)}</div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Bio</h3>
            {isEditing ? (
              <textarea
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                placeholder="Tell us about yourself and your reading preferences..."
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none resize-none"
                rows="4"
              />
            ) : (
              <p className="text-gray-700 leading-relaxed">
                {profileData.bio || user?.bio || "No bio added yet. Click 'Edit Profile' to add one!"}
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-orange-50 to-pink-50 rounded-2xl p-4 text-center">
              <p className="text-3xl font-bold text-orange-600">{reviews.length}</p>
              <p className="text-sm text-gray-600">Books Reviewed</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">12</p>
              <p className="text-sm text-gray-600">Currently Reading</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 text-center">
              <p className="text-3xl font-bold text-purple-600">47</p>
              <p className="text-sm text-gray-600">Books Read</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              {error}
            </div>
          )}

          {isEditing && (
            <button
              onClick={handleSaveProfile}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-blue-500 text-white rounded-xl font-bold hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">My Book Reviews</h2>
          
          {reviewError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              {reviewError}
            </div>
          )}

          {loadingReviews ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
              <Book className="w-16 h-16 text-gray-300 mx-auto mb-4 animate-pulse" />
              <p className="text-gray-600">Loading your reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
              <Book className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No reviews yet. Start reviewing books!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map((review) => (
                <div key={review._id} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{review.bookId?.title || 'Unknown Book'}</h3>
                      <p className="text-sm text-gray-600">{review.bookId?.authors?.join(', ') || 'Unknown Author'}</p>
                    </div>
                    <div className="flex">{renderStars(review.rating)}</div>
                  </div>
                  
                  <p className="text-gray-700 mb-3 line-clamp-3">{review.reviewText}</p>
                  
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                    <button className="text-sm text-orange-500 hover:text-orange-600 font-semibold">
                      Edit Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isCropping && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-xl max-w-lg w-full">
            <h3 className="text-lg font-bold mb-4">
              Crop {cropType === 'profile' ? 'Profile Picture' : 'Header Image'}
            </h3>
            <div className="relative w-full h-64">
              <Cropper
                image={tempImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={cropType === 'profile' ? 1 : 3}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Zoom</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={handleCropCancel}
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCropSave}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Save Crop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}