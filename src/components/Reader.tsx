import { useState, useEffect } from 'react';
import { X, Moon, Sun, Type, Bookmark, Trash, Save, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { translations } from '../utils/translations';
import { Book, Bookmark as BookmarkType } from '../types';

interface ReaderProps {
  currentLang: 'uz' | 'ru' | 'en';
  book: Book;
  onClose: () => void;
  currentUser: any;
}

export default function Reader({
  currentLang,
  book,
  onClose,
  currentUser,
}: ReaderProps) {
  const [theme, setTheme] = useState<'light' | 'dark' | 'sepia'>('light');
  const [fontSize, setFontSize] = useState<number>(16); // in px
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [bookmarkNote, setBookmarkNote] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(5); // Simulated pagination for reading content
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const t = translations[currentLang];

  // Load Bookmarks & Reading Progress
  useEffect(() => {
    const fetchProgressAndBookmarks = async () => {
      const token = localStorage.getItem('kitobx_token');
      if (!token || !currentUser) return;

      try {
        // Fetch bookmarks
        const bmkRes = await fetch(`/api/bookmarks/${book.id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (bmkRes.ok) {
          const bmkData = await bmkRes.json();
          setBookmarks(bmkData.bookmarks || []);
        }

        // Fetch Reading history to find progress
        const histRes = await fetch('/api/history', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (histRes.ok) {
          const histData = await histRes.json();
          const record = histData.history.find((h: any) => h.bookId === book.id);
          if (record) {
            // Restore progress
            const restoredPage = Math.max(1, Math.round((record.progressPercent / 100) * totalPages));
            setCurrentPage(restoredPage);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchProgressAndBookmarks();
  }, [book.id]);

  // Update Reading Progress on Page change
  const updateReadingProgress = async (pageNum: number) => {
    const token = localStorage.getItem('kitobx_token');
    if (!token || !currentUser) return;

    const progressPercent = Math.round((pageNum / totalPages) * 100);

    try {
      await fetch('/api/history/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ bookId: book.id, progressPercent }),
      });
    } catch (e) {
      console.error('Failed to update progress', e);
    }
  };

  const handlePageChange = (direction: 'next' | 'prev') => {
    let newPage = currentPage;
    if (direction === 'next' && currentPage < totalPages) {
      newPage = currentPage + 1;
    } else if (direction === 'prev' && currentPage > 1) {
      newPage = currentPage - 1;
    }

    if (newPage !== currentPage) {
      setCurrentPage(newPage);
      updateReadingProgress(newPage);
    }
  };

  const handleAddBookmark = async () => {
    const token = localStorage.getItem('kitobx_token');
    if (!token) {
      alert('Please log in to add bookmarks');
      return;
    }

    try {
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookId: book.id,
          pageNumber: currentPage,
          note: bookmarkNote || `Page ${currentPage} bookmark`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setBookmarks([...bookmarks, data.bookmark]);
        setBookmarkNote('');
        showToast('Bookmark saved successfully!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBookmark = async (id: string) => {
    const token = localStorage.getItem('kitobx_token');
    try {
      const response = await fetch(`/api/bookmarks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setBookmarks(bookmarks.filter(b => b.id !== id));
        showToast('Bookmark deleted');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  // Divide the book content conceptually into totalPages pieces
  const getPageContent = () => {
    const text = book.content || 'No text content available.';
    const paragraphs = text.split('\n\n');
    const itemsPerPage = Math.ceil(paragraphs.length / totalPages);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageParagraphs = paragraphs.slice(start, end);

    return pageParagraphs.length > 0 ? pageParagraphs.join('\n\n') : text;
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col transition-colors duration-200 ${
        theme === 'dark' ? 'bg-slate-950 text-slate-100' : theme === 'sepia' ? 'bg-[#f7f0e1] text-slate-900' : 'bg-white text-slate-900'
      }`}
      id="reader-root"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 flex items-center gap-1 rounded bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-md animate-in fade-in slide-in-from-top-4">
          <CheckCircle className="h-3.5 w-3.5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Reader Header Controls */}
      <header className="flex items-center justify-between border-b border-current/10 px-4 py-2.5 bg-opacity-95 backdrop-blur-md shadow-xs">
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-current/10 transition cursor-pointer" id="reader-close-btn">
            <X className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xs font-bold truncate max-w-[150px] sm:max-w-md">{book.title}</h1>
            <p className="text-[10px] opacity-60">by {book.author}</p>
          </div>
        </div>

        {/* Configurations Controls */}
        <div className="flex items-center gap-2">
          {/* FontSize controls */}
          <div className="flex items-center gap-1 rounded border border-current/15 px-2 py-0.5">
            <button
              onClick={() => setFontSize(Math.max(12, fontSize - 1))}
              className="px-1 text-xs font-bold hover:scale-105 cursor-pointer"
              title="Decrease Font Size"
            >
              A-
            </button>
            <Type className="h-3.5 w-3.5 opacity-50" />
            <button
              onClick={() => setFontSize(Math.min(26, fontSize + 1))}
              className="px-1 text-xs font-bold hover:scale-105 cursor-pointer"
              title="Increase Font Size"
            >
              A+
            </button>
          </div>

          {/* Theme selection */}
          <div className="flex items-center gap-1 border-l border-current/10 pl-2">
            <button
              onClick={() => setTheme('light')}
              className={`rounded p-1 hover:bg-current/10 cursor-pointer ${theme === 'light' ? 'bg-indigo-600 text-white' : ''}`}
            >
              <Sun className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setTheme('sepia')}
              className={`rounded p-1 hover:bg-current/10 cursor-pointer ${theme === 'sepia' ? 'bg-[#d8c3a5] text-[#3e2723]' : ''}`}
            >
              <span className="text-[10px] font-bold px-0.5">S</span>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`rounded p-1 hover:bg-current/10 cursor-pointer ${theme === 'dark' ? 'bg-indigo-600 text-white' : ''}`}
            >
              <Moon className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Bookmarks Toggle */}
          <button
            onClick={() => setShowBookmarks(!showBookmarks)}
            className={`rounded p-1.5 hover:bg-current/10 cursor-pointer ${showBookmarks ? 'text-indigo-600' : ''}`}
            id="reader-bookmarks-btn"
          >
            <Bookmark className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Bookmarks Sidebar */}
        {showBookmarks && (
          <aside className="w-64 border-r border-current/10 bg-opacity-50 p-3.5 overflow-y-auto" id="reader-bookmarks-panel">
            <h2 className="text-xs font-bold mb-3 flex items-center gap-1">
              <Bookmark className="h-4 w-4 text-indigo-600" />
              {t.bookmarks}
            </h2>

            {/* Save current page bookmark */}
            <div className="mb-4 rounded bg-current/5 p-2.5 border border-current/10">
              <p className="text-[10px] opacity-65 mb-1.5">Save current Page {currentPage}</p>
              <input
                type="text"
                placeholder={t.bookmarkNote}
                value={bookmarkNote}
                onChange={(e) => setBookmarkNote(e.target.value)}
                className="w-full rounded border border-current/20 bg-transparent p-1.5 text-[11px] outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleAddBookmark}
                className="mt-2 w-full rounded bg-indigo-600 py-1 text-[11px] font-bold text-white hover:bg-indigo-700 transition cursor-pointer"
              >
                {t.addBookmark}
              </button>
            </div>

            {/* List */}
            <div className="space-y-1.5">
              {bookmarks.length === 0 ? (
                <p className="text-[10px] opacity-50 italic">No bookmarks created yet.</p>
              ) : (
                bookmarks.map((bmk) => (
                  <div
                    key={bmk.id}
                    className="flex items-center justify-between rounded bg-current/5 p-2 hover:bg-current/10 transition border border-current/10 cursor-pointer"
                    onClick={() => setCurrentPage(bmk.pageNumber)}
                  >
                    <div>
                      <p className="text-[11px] font-bold">Page {bmk.pageNumber}</p>
                      <p className="text-[9px] opacity-60 truncate max-w-[140px]">{bmk.note}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteBookmark(bmk.id);
                      }}
                      className="text-rose-400 hover:text-rose-600 p-0.5 rounded hover:bg-rose-50/10 cursor-pointer"
                    >
                      <Trash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </aside>
        )}

        {/* Reading Text Panel */}
        <main className="flex-1 overflow-y-auto px-4 py-8 flex justify-center">
          <article
            style={{ fontSize: `${fontSize}px` }}
            className="max-w-xl font-sans leading-relaxed tracking-wide text-justify space-y-4 select-text"
            id="reader-text-container"
          >
            {getPageContent().split('\n').map((para, index) => {
              if (para.startsWith('CHAPTER') || para.startsWith('ГЛАВА') || para.startsWith('1-BOB') || para.startsWith('PREMIUM CHAPTER')) {
                return <h2 key={index} className="text-xl font-black tracking-tight text-center border-b border-current/10 pb-2 mb-6">{para}</h2>;
              }
              return <p key={index} className="indent-4">{para}</p>;
            })}
          </article>
        </main>
      </div>

      {/* Reader Footer Controls / Pagination */}
      <footer className="border-t border-current/10 px-4 py-3 flex items-center justify-between bg-opacity-95 backdrop-blur-md">
        <button
          onClick={() => handlePageChange('prev')}
          disabled={currentPage === 1}
          className="flex items-center gap-1 rounded border border-current/15 px-3 py-1 text-xs font-bold hover:bg-current/10 transition disabled:opacity-40 cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Prev
        </button>

        {/* Progress Tracker */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-bold opacity-75">
            {currentPage} of {totalPages} Pages
          </span>
          <div className="w-36 bg-current/10 rounded h-1 overflow-hidden">
            <div
              className="bg-indigo-600 h-1 rounded transition-all duration-300"
              style={{ width: `${(currentPage / totalPages) * 100}%` }}
            />
          </div>
        </div>

        <button
          onClick={() => handlePageChange('next')}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 rounded border border-current/15 px-3 py-1 text-xs font-bold hover:bg-current/10 transition disabled:opacity-40 cursor-pointer"
        >
          Next
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </footer>
    </div>
  );
}
