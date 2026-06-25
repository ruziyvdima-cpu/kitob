import { useState, useEffect } from 'react';
import { translations } from './utils/translations';
import Header from './components/Header';
import AuthModal from './components/AuthModal';
import BookDetails from './components/BookDetails';
import Reader from './components/Reader';
import Bookstore from './components/Bookstore';
import Cart from './components/Cart';
import Profile from './components/Profile';
import AdminPanel from './components/AdminPanel';
import { Book, Category } from './types';
import { Star, Eye, BookOpen, Sparkles, AlertCircle, ChevronLeft, ChevronRight, Search } from 'lucide-react';

export default function App() {
  const [currentLang, setCurrentLang] = useState<'uz' | 'ru' | 'en'>('uz');
  const [currentPage, setCurrentPage] = useState<string>('library');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [activeReadingBook, setActiveReadingBook] = useState<Book | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState<Book[]>([]);

  // Auth modal controls
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<'login' | 'register' | 'admin'>('login');

  // Library books & categories
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const t = translations[currentLang];

  // 1. Auto-login on mount (restore token & profile)
  const fetchUserProfile = async (token: string) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setCurrentUser(data.user);
      } else {
        localStorage.removeItem('kitobx_token');
      }
    } catch (e) {
      console.error('Auto login check failed', e);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('kitobx_token');
    if (token) {
      fetchUserProfile(token);
    }
  }, []);

  // 2. Fetch books (Digital Library Catalog - price === 0)
  const fetchLibraryBooks = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        premium: 'all',
        page: page.toString(),
        limit: '12',
      });

      if (selectedCategory && selectedCategory !== 'all') {
        query.append('category', selectedCategory);
      }
      if (searchQuery) {
        query.append('q', searchQuery);
      }

      const response = await fetch(`/api/books?${query.toString()}`);
      const data = await response.json();

      if (response.ok) {
        // Library catalog lists only free & premium books (excluding store purchasable books in the home view)
        const libraryCatalog = data.books.filter((b: Book) => b.price === 0);
        setBooks(libraryCatalog);
        setTotalPages(data.pages || 1);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibraryBooks();
  }, [selectedCategory, searchQuery, page]);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        if (response.ok) {
          setCategories(data.categories || []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategories();
  }, []);

  // Handlers
  const handleLoginSuccess = (token: string, user: any) => {
    localStorage.setItem('kitobx_token', token);
    setCurrentUser(user);
    setIsAuthModalOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('kitobx_token');
    setCurrentUser(null);
    setCurrentPage('library');
  };

  const handleOpenAuth = (view: 'login' | 'register' | 'admin' = 'login') => {
    setAuthModalView(view);
    setIsAuthModalOpen(true);
  };

  const handleSelectPage = (pageName: string) => {
    setSelectedBookId(null);
    setActiveReadingBook(null);
    setCurrentPage(pageName);
    setPage(1); // Reset page on navigation
  };

  const handleAddToCart = (book: Book) => {
    if (cartItems.some(item => item.id === book.id)) {
      alert('This book is already in your shopping cart!');
      return;
    }
    setCartItems([...cartItems, book]);
    alert('Book added to cart!');
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans text-gray-900 flex flex-col" id="app-wrapper">
      {/* Header Navigation */}
      <Header
        currentLang={currentLang}
        setLang={setCurrentLang}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenAuth={handleOpenAuth}
        onSelectPage={handleSelectPage}
        currentPage={currentPage}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        cartItemsCount={cartItems.length}
      />

      {/* Main Container */}
      <main className="flex-grow">
        {/* Active view renderer */}
        {activeReadingBook ? (
          <Reader
            currentLang={currentLang}
            book={activeReadingBook}
            onClose={() => setActiveReadingBook(null)}
            currentUser={currentUser}
          />
        ) : selectedBookId ? (
          <BookDetails
            currentLang={currentLang}
            bookId={selectedBookId}
            onBack={() => setSelectedBookId(null)}
            onRead={(book) => setActiveReadingBook(book)}
            onAddToCart={handleAddToCart}
            currentUser={currentUser}
            onOpenAuth={() => handleOpenAuth('login')}
          />
        ) : currentPage === 'library' ? (
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8" id="library-catalog-view">
            {/* Hero / Promo Banner */}
            <div className="rounded-xl bg-gradient-to-r from-indigo-900 via-indigo-850 to-slate-900 py-8 px-6 sm:px-10 text-white shadow-md mb-8 relative overflow-hidden border border-indigo-950">
              <div className="absolute right-0 bottom-0 top-0 opacity-10 pointer-events-none hidden md:block">
                <Sparkles className="h-full w-auto" />
              </div>

              <div className="max-w-2xl">
                <span className="inline-flex items-center rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold text-indigo-200 backdrop-blur-xs border border-white/10 uppercase tracking-wider">
                  ✨ Multi-Language Catalog
                </span>
                <h1 className="text-3xl font-black tracking-tight sm:text-4xl mt-3">
                  {t.welcome}
                </h1>
                <p className="mt-2 text-sm text-indigo-100/90 leading-relaxed max-w-xl">
                  {t.tagline}. Access over 1000+ free and 5000+ premium books in Uzbek, Russian, and English.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => handleSelectPage('bookstore')}
                    className="rounded-md bg-white px-4 py-2 text-xs font-bold text-indigo-950 shadow-xs hover:bg-slate-50 transition cursor-pointer"
                  >
                    Explore Bookstore
                  </button>
                  {currentUser?.premiumStatus === 'free' && (
                    <button
                      onClick={() => handleSelectPage('profile')}
                      className="rounded-md bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-300 transition cursor-pointer"
                    >
                      Unlock 5000+ Premium Books
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Categories Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6 border-b border-slate-200 pb-4">
              <h2 className="text-lg font-black tracking-tight text-slate-900">{t.digitalLibrary}</h2>

              {/* Category buttons list */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => { setSelectedCategory('all'); setPage(1); }}
                  className={`rounded-md px-3 py-1.5 text-xs font-bold transition cursor-pointer ${selectedCategory === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {t.allCategories}
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCategory(cat.slug); setPage(1); }}
                    className={`rounded-md px-3 py-1.5 text-xs font-bold transition cursor-pointer ${selectedCategory === cat.slug ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    {currentLang === 'uz' ? cat.nameUz : currentLang === 'ru' ? cat.nameRu : cat.nameEn}
                  </button>
                ))}
              </div>
            </div>

            {/* Books Grid */}
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
              </div>
            ) : books.length === 0 ? (
              <div className="text-center py-12 rounded-lg bg-slate-50 border border-dashed border-slate-200">
                <AlertCircle className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                <h3 className="text-sm font-bold text-slate-700">{t.noBooksFound}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Try resetting filters or refine your search term.</p>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {books.map((book) => (
                    <div
                      key={book.id}
                      onClick={() => setSelectedBookId(book.id)}
                      className="group flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-2.5 shadow-xs hover:shadow-md hover:border-indigo-300 transition duration-200 cursor-pointer relative"
                    >
                      {/* Cover */}
                      <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-slate-50 mb-2.5">
                        <img
                          src={book.coverUrl}
                          alt={book.title}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=300&auto=format&fit=crop';
                          }}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-103"
                        />
                        {/* Rating overlay badge */}
                        <span className="absolute top-1.5 right-1.5 inline-flex items-center gap-0.5 rounded bg-slate-900/85 px-1.5 py-0.5 text-[8px] font-bold text-amber-400 backdrop-blur-xs">
                          ★ {book.rating}
                        </span>

                        {/* Exclusive/Free banners */}
                        {book.isPremium && (
                          <span className="absolute bottom-1.5 left-1.5 inline-flex items-center rounded bg-amber-400 px-1 py-0.5 text-[8px] font-black text-slate-950 shadow-xs uppercase tracking-wider">
                            PREMIUM
                          </span>
                        )}

                        {book.youtubeUrl && (
                          <span className="absolute bottom-1.5 right-1.5 inline-flex items-center gap-1 rounded bg-red-600 px-1.5 py-0.5 text-[8px] font-black text-white shadow-xs uppercase tracking-wider">
                            <span className="h-1 w-1 rounded-full bg-white animate-pulse"></span>
                            VIDEO
                          </span>
                        )}
                      </div>

                      {/* Details info */}
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition">
                          {book.title}
                        </h3>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">by {book.author}</p>
                        
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 border border-slate-200 px-1 py-0.5 rounded">
                            {book.language}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-600">
                            {book.isPremium ? 'Premium' : 'Free'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-3 border-t border-slate-100 pt-6">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 transition disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-xs font-semibold text-slate-700">Page {page} of {totalPages}</span>
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 transition disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : currentPage === 'bookstore' ? (
          <Bookstore
            currentLang={currentLang}
            onSelectBook={(id) => setSelectedBookId(id)}
            onAddToCart={handleAddToCart}
          />
        ) : currentPage === 'cart' ? (
          <Cart
            currentLang={currentLang}
            cartItems={cartItems}
            onRemoveItem={handleRemoveFromCart}
            onClearCart={handleClearCart}
            currentUser={currentUser}
            onOpenAuth={() => handleOpenAuth('login')}
            onSelectPage={handleSelectPage}
          />
        ) : currentPage === 'profile' ? (
          <Profile
            currentLang={currentLang}
            currentUser={currentUser}
            onSelectBook={(id) => setSelectedBookId(id)}
            onRefreshUser={() => currentUser && fetchUserProfile(localStorage.getItem('kitobx_token') || '')}
          />
        ) : currentPage === 'history' ? (
          <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
            <Profile
              currentLang={currentLang}
              currentUser={currentUser}
              onSelectBook={(id) => setSelectedBookId(id)}
              onRefreshUser={() => currentUser && fetchUserProfile(localStorage.getItem('kitobx_token') || '')}
            />
          </div>
        ) : currentPage === 'admin' ? (
          <AdminPanel currentLang={currentLang} />
        ) : null}
      </main>

      {/* Auth Modal Panel */}
      {isAuthModalOpen && (
        <AuthModal
          currentLang={currentLang}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={handleLoginSuccess}
          initialView={authModalView}
        />
      )}

      {/* Elegant Footer */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 font-sans font-black text-slate-500">
            <BookOpen className="h-4 w-4 text-indigo-600" />
            <span>KitobX © 2026</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-indigo-600 transition">Terms of Service</a>
            <a href="#" className="hover:text-indigo-600 transition">Privacy Policy</a>
            <button onClick={() => handleOpenAuth('admin')} className="hover:text-indigo-600 transition font-bold cursor-pointer">
              Admin Portal Login
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
