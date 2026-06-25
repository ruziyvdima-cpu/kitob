import { useState } from 'react';
import { Trash, CreditCard, ShieldCheck, ShoppingBag, CheckCircle, ArrowRight } from 'lucide-react';
import { translations } from '../utils/translations';
import { Book } from '../types';

interface CartProps {
  currentLang: 'uz' | 'ru' | 'en';
  cartItems: Book[];
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  currentUser: any;
  onOpenAuth: () => void;
  onSelectPage: (page: string) => void;
}

export default function Cart({
  currentLang,
  cartItems,
  onRemoveItem,
  onClearCart,
  currentUser,
  onOpenAuth,
  onSelectPage,
}: CartProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'payment'>('cart');
  const t = translations[currentLang];

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price || 0), 0);
  const total = subtotal; // No taxes/shipping for digital delivery

  const handleCheckout = async () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('kitobx_token');
      // Execute digital delivery checklist order by order
      for (const item of cartItems) {
        await fetch('/api/store/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ bookId: item.id }),
        });
      }

      setSuccess(true);
      onClearCart();
    } catch (e) {
      console.error(e);
      alert('Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="mx-auto max-w-sm px-4 py-12 text-center" id="cart-success-view">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-xs">
          <CheckCircle className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-black text-slate-900">{t.paymentSuccess}</h1>
        <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
          Your payment was processed securely. The books have been delivered to your digital library for instant reading!
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={() => onSelectPage('history')}
            className="rounded-md bg-indigo-600 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition cursor-pointer"
          >
            Start Reading
          </button>
          <button
            onClick={() => onSelectPage('library')}
            className="rounded-md border border-slate-200 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8" id="cart-root">
      <h1 className="text-xl font-black text-slate-900 mb-6">{t.shoppingCart}</h1>

      {cartItems.length === 0 ? (
        <div className="text-center py-12 rounded-lg bg-slate-50 border border-dashed border-slate-200">
          <ShoppingBag className="mx-auto h-10 w-10 text-slate-400 mb-3" />
          <h2 className="text-sm font-bold text-slate-700">{t.emptyCart}</h2>
          <p className="text-xs text-slate-400 mt-0.5">Explore our bookstore to add premium books to your cart.</p>
          <button
            onClick={() => onSelectPage('bookstore')}
            className="mt-4 rounded bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition cursor-pointer"
          >
            Go to Bookstore
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Items List */}
          <div className="md:col-span-2 space-y-3">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-xs hover:shadow-xs transition"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={item.coverUrl}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=300&auto=format&fit=crop';
                    }}
                    className="h-14 w-10 rounded object-cover bg-slate-50 border border-slate-200"
                  />
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 line-clamp-1">{item.title}</h3>
                    <p className="text-[10px] text-slate-400">by {item.author}</p>
                    <span className="mt-0.5 inline-block text-xs font-bold text-indigo-600">${item.price}</span>
                  </div>
                </div>

                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                  title="Remove item"
                >
                  <Trash className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Checkout Panel */}
          <div className="md:col-span-1">
            <div className="sticky top-20 rounded-lg bg-slate-50 p-4 border border-slate-200 shadow-xs">
              <h2 className="text-xs font-black text-slate-900 mb-3">Order Summary</h2>

              <div className="space-y-2 pb-3 border-b border-slate-200 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-800">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Digital Delivery</span>
                  <span className="font-bold text-emerald-600">Free</span>
                </div>
              </div>

              <div className="flex justify-between font-bold text-slate-950 pt-3 mb-4 text-sm">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>

              {checkoutStep === 'cart' ? (
                <button
                  onClick={() => setCheckoutStep('payment')}
                  className="w-full rounded-md bg-indigo-600 py-2 text-center text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Proceed to Payment
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                  <div className="rounded bg-white p-2.5 border border-slate-200 shadow-xs">
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-500 mb-1.5 uppercase tracking-wider">
                      <CreditCard className="h-3.5 w-3.5 text-indigo-600" />
                      Secure Sandbox Card
                    </div>
                    <input
                      type="text"
                      disabled
                      value="•••• •••• •••• 4242"
                      className="w-full rounded border border-slate-200 bg-slate-50 p-1.5 text-xs outline-none text-slate-600 font-mono"
                    />
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={loading}
                    className="w-full rounded-md bg-emerald-600 py-2 text-center text-xs font-bold text-white hover:bg-emerald-700 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {loading ? 'Processing...' : `Pay $${total.toFixed(2)}`}
                  </button>

                  <button
                    onClick={() => setCheckoutStep('cart')}
                    className="w-full text-center text-[10px] font-bold text-slate-400 hover:text-indigo-600 cursor-pointer"
                  >
                    Back to Summary
                  </button>
                </div>
              )}

              <div className="mt-3 flex items-center justify-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span>SSL Encrypted Checkout</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
