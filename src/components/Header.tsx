import { useState, useEffect } from 'react';
import { BookOpen, Search, ShoppingCart, User, Globe, LogOut, ChevronDown, BarChart, History, Heart, Shield } from 'lucide-react';
import { translations } from '../utils/translations';

interface HeaderProps {
  currentLang: 'uz' | 'ru' | 'en';
  setLang: (lang: 'uz' | 'ru' | 'en') => void;
  currentUser: any;
  onLogout: () => void;
  onOpenAuth: (view?: 'login' | 'register' | 'admin') => void;
  onSelectPage: (page: string) => void;
  currentPage: string;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  cartItemsCount: number;
}

export default function Header({
  currentLang,
  setLang,
  currentUser,
  onLogout,
  onOpenAuth,
  onSelectPage,
  currentPage,
  searchQuery,
  setSearchQuery,
  cartItemsCount,
}: HeaderProps) {
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const t = translations[currentLang];

  // Close dropdowns on click outside
  useEffect(() => {
    const handleOutsideClick = () => {
      setLangDropdownOpen(false);
      setUserDropdownOpen(false);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs" id="header-root">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left Side: Brand Name & Navigation */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => onSelectPage('library')}
            className="flex items-center gap-2 font-sans text-xl font-black tracking-tight text-indigo-600 transition hover:opacity-90"
            id="brand-logo"
          >
            <BookOpen className="h-5 w-5 text-indigo-600" />
            <span>Kitob<span className="text-slate-900">X</span></span>
          </button>

          <nav className="hidden md:flex items-center gap-4 text-xs font-semibold text-slate-600">
            <button
              onClick={() => onSelectPage('library')}
              className={`transition py-1 hover:text-indigo-600 ${currentPage === 'library' ? 'text-indigo-600 border-b-2 border-indigo-600' : ''}`}
              id="nav-library"
            >
              {t.digitalLibrary}
            </button>
            <button
              onClick={() => onSelectPage('bookstore')}
              className={`transition py-1 hover:text-indigo-600 ${currentPage === 'bookstore' ? 'text-indigo-600 border-b-2 border-indigo-600' : ''}`}
              id="nav-bookstore"
            >
              {t.bookstoreTitle}
            </button>
            {currentUser && (
              <button
                onClick={() => onSelectPage('history')}
                className={`transition py-1 hover:text-indigo-600 ${currentPage === 'history' ? 'text-indigo-600 border-b-2 border-indigo-600' : ''}`}
                id="nav-history"
              >
                {t.history}
              </button>
            )}
          </nav>
        </div>

        {/* Center: Search Bar */}
        <div className="hidden sm:flex max-w-sm flex-1 px-4">
          <div className="relative w-full">
            <Search className="absolute top-2 left-3 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 pr-3 pl-9 text-xs outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-100"
              id="header-search-bar"
            />
          </div>
        </div>

        {/* Right Side: Actions (Languages, Cart, User) */}
        <div className="flex items-center gap-3">
          {/* Language Selector Selector */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLangDropdownOpen(!langDropdownOpen);
                setUserDropdownOpen(false);
              }}
              className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              id="lang-selector"
            >
              <Globe className="h-3.5 w-3.5 text-slate-500" />
              <span className="uppercase">{currentLang}</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {langDropdownOpen && (
              <div className="absolute right-0 mt-1 w-32 rounded-md border border-slate-200 bg-white p-1 shadow-md ring-1 ring-black/5 animate-in fade-in slide-in-from-top-1 duration-150">
                <button
                  onClick={() => { setLang('uz'); setLangDropdownOpen(false); }}
                  className="flex w-full items-center px-2 py-1.5 text-left text-xs hover:bg-slate-50 rounded"
                >
                  🇺🇿 {t.uzbek}
                </button>
                <button
                  onClick={() => { setLang('ru'); setLangDropdownOpen(false); }}
                  className="flex w-full items-center px-2 py-1.5 text-left text-xs hover:bg-slate-50 rounded"
                >
                  🇷🇺 {t.russian}
                </button>
                <button
                  onClick={() => { setLang('en'); setLangDropdownOpen(false); }}
                  className="flex w-full items-center px-2 py-1.5 text-left text-xs hover:bg-slate-50 rounded"
                >
                  🇺🇸 {t.english}
                </button>
              </div>
            )}
          </div>

          {/* Cart Icon Button */}
          <button
            onClick={() => onSelectPage('cart')}
            className="relative rounded-md p-1.5 text-slate-600 hover:bg-slate-50 transition"
            id="cart-button"
          >
            <ShoppingCart className="h-4 w-4" />
            {cartItemsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white shadow-xs">
                {cartItemsCount}
              </span>
            )}
          </button>

          {/* User Section Selector */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setUserDropdownOpen(!userDropdownOpen);
                  setLangDropdownOpen(false);
                }}
                className="flex items-center gap-1.5 rounded-md border border-slate-200 p-1 pr-2.5 hover:bg-slate-50"
                id="user-profile-menu"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded bg-indigo-600 font-bold text-white text-xs">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[80px] truncate text-xs font-semibold text-slate-700 hidden sm:inline">
                  {currentUser.name}
                </span>
                <ChevronDown className="h-3 w-3 text-slate-400 hidden sm:inline" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-1 w-48 rounded-md border border-slate-200 bg-white p-1 shadow-md ring-1 ring-black/5 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-2 py-1.5 border-b border-slate-100">
                    <p className="text-[10px] text-slate-400">{t.welcome}</p>
                    <p className="truncate text-xs font-bold text-slate-900">{currentUser.name}</p>
                    {currentUser.premiumStatus !== 'free' && (
                      <span className="mt-1 inline-flex items-center rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-800 border border-amber-200">
                        ✨ Premium {currentUser.premiumStatus === 'monthly' ? 'Monthly' : 'Yearly'}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => { onSelectPage('profile'); setUserDropdownOpen(false); }}
                    className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 rounded"
                  >
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    {t.profile}
                  </button>
                  <button
                    onClick={() => { onSelectPage('history'); setUserDropdownOpen(false); }}
                    className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 rounded md:hidden"
                  >
                    <History className="h-3.5 w-3.5 text-slate-400" />
                    {t.history}
                  </button>
                  {currentUser.role === 'admin' && (
                    <button
                      onClick={() => { onSelectPage('admin'); setUserDropdownOpen(false); }}
                      className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs text-indigo-600 hover:bg-indigo-50 rounded font-semibold"
                    >
                      <Shield className="h-3.5 w-3.5 text-indigo-500" />
                      {t.adminPanel}
                    </button>
                  )}
                  <button
                    onClick={() => { onLogout(); setUserDropdownOpen(false); }}
                    className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs text-red-600 hover:bg-red-50 rounded"
                  >
                    <LogOut className="h-3.5 w-3.5 text-red-500" />
                    {t.logout}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onOpenAuth('login')}
                className="hidden sm:inline-block rounded-md px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                id="header-login-btn"
              >
                {t.login}
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition"
                id="header-register-btn"
              >
                {t.register}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
