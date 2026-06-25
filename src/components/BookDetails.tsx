import React, { useState, useEffect } from 'react';
import { Star, BookOpen, ShoppingCart, Globe, Heart, Shield, MessageSquare, ArrowLeft } from 'lucide-react';
import { translations } from '../utils/translations';
import { Book, Review } from '../types';

interface BookDetailsProps {
  currentLang: 'uz' | 'ru' | 'en';
  bookId: string;
  onBack: () => void;
  onRead: (book: Book) => void;
  onAddToCart: (book: Book) => void;
  currentUser: any;
  onOpenAuth: () => void;
}

export default function BookDetails({
  currentLang,
  bookId,
  onBack,
  onRead,
  onAddToCart,
  currentUser,
  onOpenAuth,
}: BookDetailsProps) {
  const [book, setBook] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Review Form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const t = translations[currentLang];

  const fetchBookDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('kitobx_token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/books/${bookId}`, { headers });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load book');
      }

      setBook(data.book);
      setReviews(data.reviews || []);
      setHasPurchased(!!data.hasPurchased);

      // Check favorite status if authenticated
      if (currentUser) {
        const favResponse = await fetch('/api/favorites', { headers });
        if (favResponse.ok) {
          const favData = await favResponse.json();
          const isFav = favData.favorites.some((f: Book) => f.id === bookId);
          setIsFavorite(isFav);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookDetails();
  }, [bookId]);

  const handleToggleFavorite = async () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    try {
      const token = localStorage.getItem('kitobx_token');
      const response = await fetch(`/api/books/${bookId}/favorite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (response.ok) {
        setIsFavorite(data.isFavorite);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    setReviewSubmitting(true);
    try {
      const token = localStorage.getItem('kitobx_token');
      const response = await fetch(`/api/books/${bookId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ rating, comment }),
      });

      if (response.ok) {
        setComment('');
        setRating(5);
        fetchBookDetails(); // Refresh reviews and total rating
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to post review');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center" id="book-details-loading">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="text-center py-12" id="book-details-error">
        <p className="text-red-500 font-semibold">{error || 'Book not found'}</p>
        <button onClick={onBack} className="mt-4 rounded-lg bg-gray-100 px-4 py-2 hover:bg-gray-200">
          Go Back
        </button>
      </div>
    );
  }

  const isPremiumLocked = book.isPremium && (!currentUser || currentUser.premiumStatus === 'free');
  const isPurchasable = book.price > 0 && !hasPurchased;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8" id="book-details-root">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition cursor-pointer"
        id="book-details-back"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </button>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Left: Cover */}
        <div className="md:col-span-1">
          <div className="sticky top-20 overflow-hidden rounded-lg bg-slate-50 shadow-sm border border-slate-200 aspect-[3/4]">
            <img
              src={book.coverUrl}
              alt={book.title}
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=300&auto=format&fit=crop';
              }}
              className="h-full w-full object-cover transition duration-300 hover:scale-103"
            />
          </div>
        </div>

        {/* Right: Info and Actions */}
        <div className="md:col-span-2 flex flex-col justify-between">
          <div>
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
              {book.isPremium && (
                <span className="inline-flex items-center rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                  ✨ Premium
                </span>
              )}
              {book.price === 0 ? (
                <span className="inline-flex items-center rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                  {t.free}
                </span>
              ) : (
                <span className="inline-flex items-center rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-800 border border-indigo-200">
                  {t.bookstoreTitle}
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200">
                <Globe className="h-3 w-3" />
                <span className="uppercase">{book.language}</span>
              </span>
            </div>

            {/* Title & Author */}
            <h1 className="text-2xl font-black tracking-tight text-slate-900">{book.title}</h1>
            <p className="mt-0.5 text-sm font-semibold text-slate-400">by {book.author}</p>

            {/* Rating */}
            <div className="mt-3 flex items-center gap-3">
              <div className="flex items-center text-amber-500 gap-0.5 font-bold text-sm">
                <Star className="h-4 w-4 fill-current" />
                <span>{book.rating}</span>
              </div>
              <div className="text-xs text-slate-400">
                ({book.reviewCount} {t.reviews})
              </div>
              <button
                onClick={handleToggleFavorite}
                className={`rounded-md p-1.5 transition cursor-pointer ${isFavorite ? 'text-rose-500 bg-rose-50' : 'text-slate-400 hover:bg-slate-100'}`}
                id="details-fav-toggle"
              >
                <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Description */}
            <p className="mt-4 text-xs text-slate-600 leading-relaxed">{book.description}</p>

            {/* YouTube Video Lessons for School Books */}
            {book.youtubeUrl && (
              <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-xs animate-in slide-in-from-bottom-2 duration-300" id="book-youtube-player">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-red-600 animate-pulse"></span>
                  Darslik darslari (Video darslar)
                </h3>
                <p className="text-[10px] text-slate-500 mb-3">
                  Ushbu darslik mavzularini batafsil o'rganish uchun maxsus tayyorlangan video darslar:
                </p>
                <div className="relative aspect-video w-full overflow-hidden rounded-md border border-slate-200 shadow-xs bg-slate-900">
                  <iframe
                    src={book.youtubeUrl}
                    title={`Video darslik: ${book.title}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full border-0"
                  ></iframe>
                </div>
              </div>
            )}
          </div>

          {/* Action Panel */}
          <div className="mt-6 rounded-lg bg-slate-50 p-4 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500">{t.price}</span>
              <span className="text-lg font-black text-slate-900">
                {book.price === 0 ? t.free : `$${book.price}`}
              </span>
            </div>

            {isPremiumLocked ? (
              <div className="space-y-2.5">
                <div className="rounded-md bg-amber-50 p-3 border border-amber-100 text-xs text-amber-800 font-medium">
                  🔒 This book is reserved for Premium subscribers. Subscribe today to gain instant access to 5000+ premium books!
                </div>
                <button
                  onClick={onBack}
                  className="w-full rounded-md bg-amber-500 py-2 text-center text-xs font-bold text-white hover:bg-amber-600 transition cursor-pointer"
                >
                  Join Premium
                </button>
              </div>
            ) : isPurchasable ? (
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => onAddToCart(book)}
                  className="rounded-md border border-indigo-600 py-2 text-center text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  {t.addToCart}
                </button>
                <button
                  onClick={() => { onAddToCart(book); }}
                  className="rounded-md bg-indigo-600 py-2 text-center text-xs font-bold text-white hover:bg-indigo-700 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {t.buyNow}
                </button>
              </div>
            ) : (
              <button
                onClick={() => onRead(book)}
                className="w-full rounded-md bg-indigo-600 py-2 text-center text-xs font-bold text-white hover:bg-indigo-700 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                id="details-read-btn"
              >
                <BookOpen className="h-3.5 w-3.5" />
                {t.read}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-8 border-t border-slate-200 pt-6">
        <h2 className="text-lg font-black text-slate-900 mb-4">{t.reviewsTitle}</h2>

        {/* Review Input */}
        {currentUser ? (
          <form onSubmit={handleReviewSubmit} className="mb-6 rounded-lg bg-slate-50 p-4 border border-slate-200 shadow-xs">
            <h3 className="text-xs font-bold text-slate-800 mb-2">{t.writeReview}</h3>
            
            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="text-amber-500 transition hover:scale-105 cursor-pointer"
                >
                  <Star className={`h-5 w-5 ${star <= rating ? 'fill-current' : ''}`} />
                </button>
              ))}
            </div>

            <textarea
              required
              rows={2}
              placeholder={t.reviewPlaceholder}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white p-2.5 text-xs outline-none focus:border-indigo-500 transition mb-3"
            />

            <button
              type="submit"
              disabled={reviewSubmitting}
              className="rounded-md bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition cursor-pointer"
            >
              {reviewSubmitting ? '...' : t.submitReview}
            </button>
          </form>
        ) : (
          <div className="mb-6 rounded-lg bg-slate-50 p-4 text-center border border-dashed border-slate-200">
            <p className="text-xs text-slate-500">Please <button onClick={onOpenAuth} className="font-bold text-indigo-600 hover:underline cursor-pointer">log in</button> to write a review.</p>
          </div>
        )}

        {/* Reviews List */}
        <div className="space-y-3">
          {reviews.length === 0 ? (
            <p className="text-slate-400 text-xs italic">No reviews yet. Be the first to review!</p>
          ) : (
            reviews.map((rev) => (
              <div key={rev.id} className="rounded-lg border border-slate-200 p-3.5 bg-white shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded bg-indigo-50 font-bold text-indigo-600 text-xs">
                      {rev.userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{rev.userName}</h4>
                      <p className="text-[10px] text-slate-400">{new Date(rev.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center text-amber-500 gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-3.5 w-3.5 ${i < rev.rating ? 'fill-current' : ''}`} />
                    ))}
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
