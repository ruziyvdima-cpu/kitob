import { useState, useEffect } from 'react';
import { ShoppingCart, Star, Eye, Globe, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { translations } from '../utils/translations';
import { Book, Category } from '../types';

interface BookstoreProps {
  currentLang: 'uz' | 'ru' | 'en';
  onSelectBook: (id: string) => void;
  onAddToCart: (book: Book) => void;
}

export default function Bookstore({
  currentLang,
  onSelectBook,
  onAddToCart,
}: BookstoreProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [language, setLanguage] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const t = translations[currentLang];

  const getBookPrice = (book: Book) => {
    if (book.price > 0) return book.price;
    if (book.isPremium) return 4.99;
    if (book.category === 'school') return 3.50;
    return 1.99; // for classics/free books
  };

  const fetchBooks = async () => {
    setLoading(true);
    try {
      // Books query parameter: fetch all books (free, premium, school text books, and store books)
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '12',
      });

      if (selectedCategory && selectedCategory !== 'all') {
        query.append('category', selectedCategory);
      }
      if (search) {
        query.append('q', search);
      }
      if (language && language !== 'all') {
        query.append('lang', language);
      }

      const response = await fetch(`/api/books?${query.toString()}`);
      const data = await response.json();

      if (response.ok) {
        // Show all books on the site exactly inside the bookstore too
        setBooks(data.books || []);
        setTotalPages(data.pages || 1);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [selectedCategory, search, language, page]);

  // Fetch categories
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8" id="bookstore-root">
      {/* Intro section */}
      <div className="text-center mb-6 max-w-xl mx-auto">
        <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
          KitobX {t.bookstoreTitle}
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Discover best-selling international titles and premium books with secure checkout and instant digital delivery.
        </p>
      </div>

      {/* Filters Toolbar */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 mb-6">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute top-2.5 left-3 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-md border border-slate-200 bg-white py-1.5 pr-3 pl-9 text-xs outline-none focus:border-indigo-500 transition shadow-xs"
          />
        </div>

        {/* Category Filters */}
        <select
          value={selectedCategory}
          onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
          className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-indigo-500 cursor-pointer shadow-xs"
        >
          <option value="all">{t.allCategories}</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.slug}>
              {currentLang === 'uz' ? cat.nameUz : currentLang === 'ru' ? cat.nameRu : cat.nameEn}
            </option>
          ))}
        </select>

        {/* Language select */}
        <select
          value={language}
          onChange={(e) => { setLanguage(e.target.value); setPage(1); }}
          className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-indigo-500 cursor-pointer shadow-xs"
        >
          <option value="all">Languages (All)</option>
          <option value="uz">{t.uzbek}</option>
          <option value="ru">{t.russian}</option>
          <option value="en">{t.english}</option>
        </select>
      </div>

      {/* Books grid */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-12 rounded-lg bg-slate-50 border border-dashed border-slate-200">
          <p className="text-slate-400 font-bold text-xs">{t.noBooksFound}</p>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {books.map((book) => (
              <div
                key={book.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-lg border border-slate-200 bg-white p-2.5 shadow-xs hover:shadow-md transition duration-200"
              >
                {/* Book cover container */}
                <div
                  onClick={() => onSelectBook(book.id)}
                  className="relative aspect-[3/4] w-full overflow-hidden rounded-md bg-slate-50 cursor-pointer mb-2.5"
                >
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=300&auto=format&fit=crop';
                    }}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-103"
                  />
                  {/* Rating Badge */}
                  <span className="absolute top-1.5 right-1.5 inline-flex items-center gap-0.5 rounded bg-slate-900/85 px-1.5 py-0.5 text-[8px] font-bold text-amber-400 backdrop-blur-xs">
                    ★ {book.rating}
                  </span>

                  {book.youtubeUrl && (
                    <span className="absolute bottom-1.5 right-1.5 inline-flex items-center gap-1 rounded bg-red-600 px-1.5 py-0.5 text-[8px] font-black text-white shadow-xs uppercase tracking-wider">
                      <span className="h-1 w-1 rounded-full bg-white animate-pulse"></span>
                      VIDEO
                    </span>
                  )}
                </div>

                {/* Info & Buy panel */}
                <div>
                  <h3
                    onClick={() => onSelectBook(book.id)}
                    className="text-xs font-bold text-slate-900 line-clamp-1 cursor-pointer hover:text-indigo-600 transition"
                  >
                    {book.title}
                  </h3>
                  <p className="text-[10px] text-slate-400 truncate">by {book.author}</p>

                  <div className="mt-2.5 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-indigo-600 font-extrabold text-xs">
                        ${getBookPrice(book).toFixed(2)}
                      </span>
                      {book.price === 0 && (
                        <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider">
                          {book.isPremium ? 'Premium' : 'Bepul darslik'}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => onAddToCart({ ...book, price: getBookPrice(book) })}
                      className="rounded bg-indigo-50 p-1.5 text-indigo-600 hover:bg-indigo-600 hover:text-white transition cursor-pointer"
                      title={t.addToCart}
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                    </button>
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
                className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 transition disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-semibold text-slate-700">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 transition disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
