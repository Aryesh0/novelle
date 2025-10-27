import React, { useState, useEffect } from 'react';
import { Book, Users, MessageCircle, TrendingUp, Star } from 'lucide-react';

export default function CommunityPage({ onNavigate }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const discussions = [
    {
      id: 1,
      author: 'bookworm123',
      avatar: '',
      title: 'What are you currently reading?',
      content: "I'm halfway through 'The Midnight Library' and loving it! What's everyone else reading?",
      replies: 24,
      likes: 15,
      timeAgo: '2 hours ago'
    },
    {
      id: 2,
      author: 'literarylion',
      avatar: '',
      title: 'Best sci-fi books of 2024?',
      content: 'Looking for recommendations for great science fiction books released this year!',
      replies: 18,
      likes: 12,
      timeAgo: '5 hours ago'
    },
    {
      id: 3,
      author: 'readingrabbit',
      avatar: '',
      title: 'Book club suggestions for next month',
      content: 'Our book club needs ideas for March. What should we read together?',
      replies: 31,
      likes: 20,
      timeAgo: '1 day ago'
    }
  ];

  const topReaders = [
    { name: 'Emily R.', books: 47, avatar: '' },
    { name: 'James K.', books: 42, avatar: '' },
    { name: 'Sarah M.', books: 39, avatar: '' },
    { name: 'David L.', books: 35, avatar: '' },
    { name: 'Lisa P.', books: 33, avatar: '' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => onNavigate && onNavigate('home')}
            className="flex items-center space-x-2 text-gray-700 hover:text-orange-500 transition"
          >
            <Book className="w-6 h-6" />
            <span className="text-xl font-bold">Back to Home</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center space-x-3 mb-8">
          <Users className="w-10 h-10 text-orange-500" />
          <h1 className="text-4xl font-bold text-gray-900">Community</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Create Discussion Button */}
            {user && (
              <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
                <button className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg transition">
                  Start a Discussion
                </button>
              </div>
            )}

            {/* Discussions */}
            <div className="space-y-6">
              {discussions.map((discussion) => (
                <div
                  key={discussion.id}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition cursor-pointer"
                >
                  <div className="flex items-start space-x-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold">
                        {discussion.author.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-bold text-gray-900">@{discussion.author}</span>
                        <span className="text-sm text-gray-500">{discussion.timeAgo}</span>
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {discussion.title}
                      </h3>
                      <p className="text-gray-700 mb-4">{discussion.content}</p>

                      {/* Stats */}
                      <div className="flex items-center space-x-6 text-sm">
                        <div className="flex items-center space-x-2 text-gray-600 hover:text-orange-500 transition">
                          <MessageCircle className="w-5 h-5" />
                          <span>{discussion.replies} replies</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600 hover:text-orange-500 transition">
                          <Star className="w-5 h-5" />
                          <span>{discussion.likes} likes</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More */}
            <div className="text-center mt-8">
              <button className="px-8 py-3 bg-white text-gray-700 rounded-full font-semibold hover:bg-gray-100 transition shadow-md">
                Load More Discussions
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Top Readers */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="w-6 h-6 text-orange-500" />
                <h2 className="text-xl font-bold text-gray-900">Top Readers</h2>
              </div>

              <div className="space-y-4">
                {topReaders.map((reader, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg transition cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center">
                          <span className="text-white font-bold">
                            {reader.name.charAt(0)}
                          </span>
                        </div>
                        {index < 3 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold text-white">
                            {index + 1}
                          </div>
                        )}
                      </div>
                      <span className="font-semibold text-gray-900">{reader.name}</span>
                    </div>
                    <span className="text-sm text-gray-600">{reader.books} books</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Community Stats */}
            <div className="bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl p-6 text-white shadow-lg">
              <h2 className="text-xl font-bold mb-4">Community Stats</h2>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Active Members</span>
                    <span className="font-bold">12,543</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div className="bg-white h-2 rounded-full" style={{ width: '75%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span>Books Reviewed</span>
                    <span className="font-bold">45,231</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div className="bg-white h-2 rounded-full" style={{ width: '85%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span>Active Discussions</span>
                    <span className="font-bold">1,892</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div className="bg-white h-2 rounded-full" style={{ width: '60%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Join Premium CTA */}
            {user && !user.isPremium && (
              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-6 text-white shadow-lg">
                <h3 className="text-xl font-bold mb-2">Unlock More Features</h3>
                <p className="text-sm mb-4">
                  Join Premium to access exclusive book clubs and discussions!
                </p>
                <button className="w-full px-4 py-2 bg-white text-orange-600 rounded-full font-bold hover:shadow-lg transition">
                  Upgrade to Premium
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}