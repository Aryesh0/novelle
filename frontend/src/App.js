import React, { useState, useEffect } from 'react';
import Homepage from './components/homepage';
import Login from './components/login';
import UserProfile from './components/UserProfile';
import BookDetailPage from './components/bookdetailpage';
import BrowsePage from './components/browsepage';
import MyBooksPage from './components/mybookspage';
import CommunityPage from './components/communitypage';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedBookId, setSelectedBookId] = useState(null);

  useEffect(() => {
    // Check URL parameters on load
    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get('page');
   
    if (page === 'profile') {
      setCurrentPage('profile');
    }
  }, []);

  const handleNavigate = (page, bookId = null) => {
    setCurrentPage(page);
    setSelectedBookId(bookId);
    window.scrollTo(0, 0); // Scroll to top on navigation
  };

  const renderPage = () => {
    switch(currentPage) {
      case 'home':
        return <Homepage onNavigate={handleNavigate} />;
      
      case 'login':
        return <Login onNavigate={handleNavigate} />;
      
      case 'profile':
        return <UserProfile onNavigate={handleNavigate} />;
      
      case 'bookDetail':
        return <BookDetailPage bookId={selectedBookId} onNavigate={handleNavigate} />;
      
      case 'browse':
        return <BrowsePage onNavigate={handleNavigate} />;
      
      case 'myBooks':
        return <MyBooksPage onNavigate={handleNavigate} />;
      
      case 'community':
        return <CommunityPage onNavigate={handleNavigate} />;
      
      default:
        return <Homepage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="App">
      {renderPage()}
    </div>
  );
}

export default App;