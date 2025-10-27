import React, { useState, useEffect } from 'react';
import { Book, Star, ArrowLeft, Heart, BookOpen, ThumbsUp, User } from 'lucide-react';

export default function BookDetailPage({ bookId, onNavigate }) {
  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [newReview, setNewReview] = useState({ rating: 5, reviewText: '' });
  const [submitting, setSubmitting] = useState(false);
  const [inLibrary, setInLibrary] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchBookDetails();
    fetchReviews();
    checkLibraryStatus();
  }, [bookId]);

  const fetchBookDetails = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/books/${bookId}`);
      const data = await response.json();
      if (data.success) {
        setBook(data.book);
      }
    } catch (error) {
      console.error('Error fetching book:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/reviews/book/${bookId}`);
      const data = await response.json();
      if (data.success) {
        setReviews(data.reviews);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const checkLibraryStatus = async () => {
    const token = localStorage.getItem('token');
    console.log('Checking library: Token exists?', !!token); // DEBUG: Log if token present
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:5000/api/user-books/check/${bookId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setInLibrary(data.inLibrary);
      }
    } catch (error) {
      console.error('Error checking library status:', error);
    }
  };

  const handleAddToLibrary = async () => {
    const token = localStorage.getItem('token');
    console.log('Adding to library: Token starts with?', token ? token.substring(0, 20) + '...' : 'NO TOKEN'); // DEBUG: Log token
    if (!token) {
      alert('Please login to add books to your library');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/user-books/add', {
        method: 'POST',
        mode: 'cors', // FIXED: Ensure CORS
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bookId: bookId.toString(), status: 'want-to-read' }) // FIXED: Ensure bookId string
      });

      const data = await response.json();
      console.log('Add to library response:', data); // DEBUG: Log full response
      if (data.success) {
        setInLibrary(true);
        alert('Book added to your library!');
      } else {
        alert(`Error: ${data.message || 'Failed to add'}`); // FIXED: Show exact message
      }
    } catch (error) {
      console.error('Error adding to library:', error);
      alert('Failed to add book to library - check console');
    }
  };

  const handleSubmitReview = async () => {
    const token = localStorage.getItem('token');
    console.log('Submitting review: Token starts with?', token ? token.substring(0, 20) + '...' : 'NO TOKEN'); // DEBUG: Log token
    if (!token) {
      alert('Please login to submit a review');
      return;
    }

    if (!newReview.reviewText.trim()) {
      alert('Please write a review');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('http://localhost:5000/api/reviews/add', {
        method: 'POST',
        mode: 'cors', // FIXED: Ensure CORS
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bookId: bookId.toString(), // FIXED: Ensure bookId string
          rating: newReview.rating,
          reviewText: newReview.reviewText
        })
      });

      const data = await response.json();
      console.log('Submit review response:', data); // DEBUG: Log full response
      if (data.success) {
        alert('Review submitted successfully!');
        setNewReview({ rating: 5, reviewText: '' });
        fetchReviews();
        fetchBookDetails(); // Refresh book to update average rating
      } else {
        alert(`Error: ${data.message || 'Failed to submit'}`); // FIXED: Show exact message
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review - check console');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeReview = async (reviewId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to like reviews');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/reviews/${reviewId}/like`, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        fetchReviews(); // Refresh reviews
      }
    } catch (error) {
      console.error('Error liking review:', error);
    }
  };

  const renderStars = (rating, size = 'w-5 h-5') => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`${size} ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const renderRatingSelector = () => {
    return (
      <div className="flex items-center space-x-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            onClick={() => setNewReview({ ...newReview, rating })}
            className="transition hover:scale-110"
          >
            <Star
              className={`w-8 h-8 ${
                rating <= newReview.rating
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Book className="w-16 h-16 text-orange-500 mx-auto mb-4 animate-pulse" />
          <p className="text-xl text-gray-600">Loading book details...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Book not found</p>
          <button
            onClick={() => onNavigate && onNavigate('home')}
            className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-purple-50">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <button
          onClick={() => onNavigate && onNavigate('home')}
          className="flex items-center space-x-2 text-gray-700 hover:text-orange-500 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Browse</span>
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Book Header */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Book Cover */}
            <div className="flex justify-center">
              <div className="w-full max-w-sm">
                {book.coverImage || book.thumbnail ? (
                  <img
                    src={book.coverImage || book.thumbnail}
                    alt={book.title}
                    className="w-full rounded-2xl shadow-2xl"
                  />
                ) : (
                  <div className="w-full aspect-[2/3] bg-gradient-to-br from-orange-200 to-pink-200 rounded-2xl flex items-center justify-center">
                    <Book className="w-24 h-24 text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* Book Info */}
            <div className="md:col-span-2">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{book.title}</h1>
              
              <p className="text-xl text-gray-600 mb-4">
                by {book.authors?.join(', ') || 'Unknown Author'}
              </p>

              <div className="flex items-center space-x-4 mb-6">
                <div className="flex items-center">
                  {renderStars(Math.round(book.averageRating))}
                  <span className="ml-2 text-lg font-semibold text-gray-700">
                    {book.averageRating > 0 ? book.averageRating.toFixed(1) : 'No ratings'}
                  </span>
                </div>
                <span className="text-gray-500">
                  ({book.reviewCount || 0} reviews)
                </span>
              </div>

              {/* Categories */}
              {book.categories && book.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {book.categories.map((category, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-gradient-to-r from-orange-100 to-pink-100 text-orange-700 rounded-full text-sm font-semibold"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              )}

              {/* Book Details */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {book.publisher && (
                  <div>
                    <p className="text-sm text-gray-500">Publisher</p>
                    <p className="font-semibold text-gray-900">{book.publisher}</p>
                  </div>
                )}
                {book.publishedDate && (
                  <div>
                    <p className="text-sm text-gray-500">Published</p>
                    <p className="font-semibold text-gray-900">{book.publishedDate}</p>
                  </div>
                )}
                {book.pageCount > 0 && (
                  <div>
                    <p className="text-sm text-gray-500">Pages</p>
                    <p className="font-semibold text-gray-900">{book.pageCount}</p>
                  </div>
                )}
                {book.language && (
                  <div>
                    <p className="text-sm text-gray-500">Language</p>
                    <p className="font-semibold text-gray-900">{book.language.toUpperCase()}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleAddToLibrary}
                  disabled={inLibrary}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-full font-bold transition ${
                    inLibrary
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:shadow-lg'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${inLibrary ? 'fill-current' : ''}`} />
                  <span>{inLibrary ? 'In Library' : 'Add to Library'}</span>
                </button>

                {user?.isPremium ? (
                  <button className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full font-bold hover:shadow-lg transition">
                    <BookOpen className="w-5 h-5" />
                    <span>Read Now</span>
                  </button>
                ) : (
                  <button className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-full font-bold hover:shadow-lg transition">
                    <span>Rent ₹{book.rentalPrice || 49}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {book.description && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Book</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {book.description}
              </p>
            </div>
          )}
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Reviews ({reviews.length})
          </h2>

          {/* Add Review Form */}
          {user && (
            <div className="bg-gradient-to-br from-orange-50 to-pink-50 rounded-2xl p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Write a Review</h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-700 mb-2">Your Rating</p>
                {renderRatingSelector()}
              </div>

              <textarea
                value={newReview.reviewText}
                onChange={(e) => setNewReview({ ...newReview, reviewText: e.target.value })}
                placeholder="Share your thoughts about this book..."
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none resize-none"
                rows="4"
              />

              <button
                onClick={handleSubmitReview}
                disabled={submitting}
                className="mt-4 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-full font-bold hover:shadow-lg transition disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          )}

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No reviews yet. Be the first to review!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div
                  key={review._id}
                  className="bg-gray-50 rounded-2xl p-6 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      {review.userProfilePicture ? (
                        <img
                          src={review.userProfilePicture}
                          alt={review.username}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-gray-900">{review.username}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {renderStars(review.rating, 'w-5 h-5')}
                    </div>
                  </div>

                  <p className="text-gray-700 leading-relaxed mb-4">{review.reviewText}</p>

                  <button
                    onClick={() => handleLikeReview(review._id)}
                    className="flex items-center space-x-2 text-gray-600 hover:text-orange-500 transition"
                  >
                    <ThumbsUp className="w-5 h-5" />
                    <span className="text-sm font-semibold">{review.likes} Helpful</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}