import { useState, useEffect } from 'react';
import { User, Shield, CheckCircle, Clock, Heart, Award, Copy, Check, MessageSquare, RefreshCw, Star } from 'lucide-react';
import { translations } from '../utils/translations';
import { Book, ReadingHistoryItem } from '../types';

interface ProfileProps {
  currentLang: 'uz' | 'ru' | 'en';
  currentUser: any;
  onSelectBook: (id: string) => void;
  onRefreshUser: () => void;
}

export default function Profile({
  currentLang,
  currentUser,
  onSelectBook,
  onRefreshUser,
}: ProfileProps) {
  const [history, setHistory] = useState<ReadingHistoryItem[]>([]);
  const [favorites, setFavorites] = useState<Book[]>([]);
  const [copied, setCopied] = useState(false);
  const [submittingPlan, setSubmittingPlan] = useState(false);

  const t = translations[currentLang];

  const fetchProfileData = async () => {
    const token = localStorage.getItem('kitobx_token');
    if (!token) return;

    try {
      // History
      const histRes = await fetch('/api/history', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (histRes.ok) {
        const histData = await histRes.json();
        setHistory(histData.history || []);
      }

      // Favorites
      const favRes = await fetch('/api/favorites', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (favRes.ok) {
        const favData = await favRes.json();
        setFavorites(favData.favorites || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [currentUser]);

  const handleCopyCode = () => {
    if (currentUser?.telegramLinkCode) {
      navigator.clipboard.writeText(currentUser.telegramLinkCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubscribe = async (plan: 'monthly' | 'yearly') => {
    setSubmittingPlan(true);
    const token = localStorage.getItem('kitobx_token');
    try {
      const response = await fetch('/api/subscriptions/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ plan }),
      });
      const data = await response.json();
      if (response.ok) {
        onRefreshUser();
        alert(`Successfully subscribed to KitobX Premium ${plan}!`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingPlan(false);
    }
  };

  const handleCancelSubscribe = async () => {
    setSubmittingPlan(true);
    const token = localStorage.getItem('kitobx_token');
    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        onRefreshUser();
        alert('Subscription canceled successfully.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingPlan(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8" id="profile-root">
      {/* Upper Panel: User Info Banner */}
      <div className="rounded-lg bg-gradient-to-r from-indigo-900 via-indigo-850 to-slate-900 p-5 text-white shadow-md mb-6 flex flex-col md:flex-row items-center justify-between gap-4 border border-indigo-950">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded bg-white/10 font-bold text-white text-xl border border-white/10">
            {currentUser?.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight">{currentUser?.name}</h1>
              {currentUser?.premiumStatus !== 'free' && (
                <span className="inline-flex items-center gap-0.5 rounded bg-amber-400 px-1.5 py-0.5 text-[8px] font-black text-slate-950 shadow-xs uppercase tracking-wider">
                  <Award className="h-2.5 w-2.5 fill-current" />
                  PREMIUM
                </span>
              )}
            </div>
            <p className="text-indigo-200 text-xs mt-0.5">{currentUser?.email}</p>
            <div className="mt-1 flex items-center gap-2">
              {currentUser?.isVerified ? (
                <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300 border border-emerald-500/20">
                  <CheckCircle className="h-2.5 w-2.5" />
                  {t.verified}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-bold text-rose-300 border border-rose-500/20">
                  {t.unverified}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action / Upgrade section */}
        {currentUser?.premiumStatus === 'free' ? (
          <div className="bg-white/5 p-3 rounded-md border border-white/10 backdrop-blur-xs max-w-xs text-center md:text-left">
            <h3 className="text-xs font-bold text-indigo-100">Upgrade to Premium</h3>
            <p className="text-[10px] text-indigo-200/90 mt-0.5 leading-relaxed">Get instant access to over 5000+ top exclusive titles.</p>
            <div className="mt-2.5 flex items-center justify-center md:justify-start gap-2">
              <button
                onClick={() => handleSubscribe('monthly')}
                disabled={submittingPlan}
                className="rounded bg-white px-2.5 py-1 text-[10px] font-bold text-indigo-950 hover:bg-slate-50 transition cursor-pointer"
              >
                Monthly ($4.99)
              </button>
              <button
                onClick={() => handleSubscribe('yearly')}
                disabled={submittingPlan}
                className="rounded bg-amber-400 px-2.5 py-1 text-[10px] font-bold text-slate-950 hover:bg-amber-300 transition cursor-pointer"
              >
                Yearly ($39.99)
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white/5 p-3 rounded-md border border-white/10 backdrop-blur-xs text-center md:text-left">
            <p className="text-[9px] text-indigo-200 uppercase tracking-wider font-bold">{t.activePlan}</p>
            <p className="text-xs font-bold text-white mt-0.5">Premium {currentUser.premiumStatus === 'monthly' ? 'Monthly' : 'Yearly'}</p>
            <button
              onClick={handleCancelSubscribe}
              className="mt-2 text-[10px] font-bold text-rose-300 hover:text-rose-200 underline transition cursor-pointer"
            >
              Cancel Subscription
            </button>
          </div>
        )}
      </div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Left Side: History and Favorites */}
        <div className="md:col-span-2 space-y-6">
          {/* Reading History */}
          <section className="rounded-lg border border-slate-200 p-4 bg-white shadow-xs">
            <h2 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-indigo-600" />
              {t.historyTitle}
            </h2>

            {history.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">No reading history logged. Pick a book to start!</p>
            ) : (
              <div className="space-y-2.5">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded border border-slate-100 p-2 hover:bg-slate-50 transition cursor-pointer"
                    onClick={() => onSelectBook(item.bookId)}
                  >
                    <img
                      src={item.coverUrl}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=300&auto=format&fit=crop';
                      }}
                      className="h-12 w-9 rounded object-cover bg-slate-50 border border-slate-200"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-bold text-slate-900 truncate">{item.title}</h3>
                      <p className="text-[10px] text-slate-400 truncate mb-1">by {item.author}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded h-1 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-1 rounded"
                            style={{ width: `${item.progressPercent}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500">{item.progressPercent}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Favorites list */}
          <section className="rounded-lg border border-slate-200 p-4 bg-white shadow-xs">
            <h2 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-1.5">
              <Heart className="h-4 w-4 text-rose-500" />
              {t.favoritesTitle}
            </h2>

            {favorites.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">Your favorites list is empty.</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {favorites.map((book) => (
                  <div
                    key={book.id}
                    className="group rounded border border-slate-100 p-1.5 cursor-pointer hover:shadow-xs hover:border-indigo-200 transition"
                    onClick={() => onSelectBook(book.id)}
                  >
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=300&auto=format&fit=crop';
                      }}
                      className="aspect-[3/4] rounded object-cover bg-slate-50 mb-1.5 w-full border border-slate-200"
                    />
                    <h4 className="text-[10px] font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 truncate">{book.title}</h4>
                    <p className="text-[9px] text-slate-400 truncate">{book.author}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Side: Telegram Bot Linkage */}
        <div className="md:col-span-1">
          <section className="rounded-lg border border-slate-200 p-4 bg-white sticky top-20 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-indigo-50 text-indigo-600 border border-indigo-100">
                <MessageSquare className="h-4 w-4" />
              </div>
              <h2 className="text-xs font-black text-slate-900">{t.telegramIntegration}</h2>
            </div>

            <p className="text-[10px] text-slate-500 leading-relaxed mb-4">
              Connect your account with our secure Telegram Bot to instantly verify your premium access, get smart reading recommendations, and receive push notifications on new book arrivals.
            </p>

            <div className="rounded bg-slate-50 p-3 border border-slate-200">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                {t.telegramCodeLabel}
              </span>

              {currentUser?.telegramLinkCode ? (
                <div className="flex items-center justify-between rounded bg-white border border-slate-200 p-2 font-mono text-sm font-bold text-slate-800">
                  <span>{currentUser.telegramLinkCode}</span>
                  <button
                    onClick={handleCopyCode}
                    className="text-slate-400 hover:text-indigo-600 p-0.5 rounded cursor-pointer"
                    title="Copy code"
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              ) : currentUser?.telegramId ? (
                <div className="text-emerald-600 font-bold text-xs flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Linked successfully (ID: {currentUser.telegramId})
                </div>
              ) : (
                <div className="text-rose-500 text-xs font-bold">
                  No active linkage code. Please register/re-login.
                </div>
              )}

              <div className="mt-3 border-t border-slate-200 pt-2 text-[9px] text-slate-400 leading-relaxed space-y-0.5">
                <p>1. Open <a href="https://t.me/KitobXBot" target="_blank" rel="noreferrer" className="text-indigo-600 font-bold underline">@KitobXBot</a> in Telegram.</p>
                <p>2. Send <code className="bg-slate-200 px-1 rounded font-mono">/link [code]</code> command.</p>
                <p>3. Your account will link instantly!</p>
              </div>
            </div>

            <div className="mt-4 border-t border-slate-100 pt-3 space-y-2">
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">Bot Capabilities</span>
              <ul className="text-[10px] text-slate-500 space-y-1">
                <li className="flex items-center gap-1">✓ {t.botFeature1}</li>
                <li className="flex items-center gap-1">✓ {t.botFeature2}</li>
                <li className="flex items-center gap-1">✓ {t.botFeature3}</li>
                <li className="flex items-center gap-1">✓ {t.botFeature4}</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
