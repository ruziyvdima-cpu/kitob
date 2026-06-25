import React, { useState, useEffect } from 'react';
import { Users, BookOpen, CreditCard, Award, Plus, Trash, Edit, Save, Tag, Shield, FileText, CheckCircle, HelpCircle } from 'lucide-react';
import { translations } from '../utils/translations';
import { Book, User, Category } from '../types';

interface AdminPanelProps {
  currentLang: 'uz' | 'ru' | 'en';
}

export default function AdminPanel({ currentLang }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'stats' | 'books' | 'users' | 'categories'>('stats');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms state
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [bookForm, setBookForm] = useState<Partial<Book>>({
    title: '',
    author: '',
    description: '',
    category: '',
    language: 'uz',
    isPremium: false,
    coverUrl: '',
    content: '',
    price: 0,
    youtubeUrl: '',
  });

  const [categoryForm, setCategoryForm] = useState<Partial<Category>>({
    nameUz: '',
    nameRu: '',
    nameEn: '',
    slug: '',
  });

  const t = translations[currentLang];

  const fetchAdminData = async () => {
    setLoading(true);
    const token = localStorage.getItem('kitobx_token');
    try {
      // Stats
      const statsRes = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Users
      const usersRes = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      }

      // Books
      const booksRes = await fetch('/api/books?limit=100');
      if (booksRes.ok) {
        const booksData = await booksRes.json();
        setBooks(booksData.books || []);
      }

      // Categories
      const catsRes = await fetch('/api/categories');
      if (catsRes.ok) {
        const catsData = await catsRes.json();
        setCategories(catsData.categories || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('kitobx_token');
    const method = editingBookId ? 'PUT' : 'POST';
    const url = editingBookId ? `/api/admin/books/${editingBookId}` : '/api/admin/books';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(bookForm),
      });

      if (response.ok) {
        alert(editingBookId ? 'Book updated successfully' : 'Book created successfully');
        setEditingBookId(null);
        setBookForm({
          title: '',
          author: '',
          description: '',
          category: '',
          language: 'uz',
          isPremium: false,
          coverUrl: '',
          content: '',
          price: 0,
          youtubeUrl: '',
        });
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBook = async (id: string) => {
    if (!confirm('Are you sure you want to delete this book?')) return;

    const token = localStorage.getItem('kitobx_token');
    try {
      const response = await fetch(`/api/admin/books/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        alert('Book deleted successfully');
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateUser = async (id: string, updates: Partial<User>) => {
    const token = localStorage.getItem('kitobx_token');
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      if (response.ok) {
        alert('User status updated');
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user account?')) return;

    const token = localStorage.getItem('kitobx_token');
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        alert('User deleted');
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('kitobx_token');
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(categoryForm),
      });
      if (response.ok) {
        alert('Category added successfully');
        setCategoryForm({ nameUz: '', nameRu: '', nameEn: '', slug: '' });
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure? This action is irreversible.')) return;

    const token = localStorage.getItem('kitobx_token');
    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        alert('Category deleted');
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded border-2 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8" id="admin-panel-root">
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 pb-4 mb-6 gap-3">
        <div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
            <Shield className="h-5 w-5 text-indigo-600" />
            KitobX {t.adminPanel}
          </h1>
          <p className="text-[10px] text-slate-400 mt-0.5">Manage users, catalog books, categories, and audit global sales statistics.</p>
        </div>

        {/* Tab selection */}
        <div className="flex bg-slate-100 p-0.5 rounded border border-slate-200 gap-0.5">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-2.5 py-1 text-[10px] font-bold rounded transition cursor-pointer ${activeTab === 'stats' ? 'bg-white shadow-xs text-indigo-600 font-extrabold border border-slate-200/50' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('books')}
            className={`px-2.5 py-1 text-[10px] font-bold rounded transition cursor-pointer ${activeTab === 'books' ? 'bg-white shadow-xs text-indigo-600 font-extrabold border border-slate-200/50' : 'text-slate-500 hover:text-slate-900'}`}
          >
            {t.books}
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-2.5 py-1 text-[10px] font-bold rounded transition cursor-pointer ${activeTab === 'users' ? 'bg-white shadow-xs text-indigo-600 font-extrabold border border-slate-200/50' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-2.5 py-1 text-[10px] font-bold rounded transition cursor-pointer ${activeTab === 'categories' ? 'bg-white shadow-xs text-indigo-600 font-extrabold border border-slate-200/50' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Categories
          </button>
        </div>
      </div>

      {/* Stats Tab */}
      {activeTab === 'stats' && stats && (
        <div className="space-y-8 animate-in fade-in duration-250">
          {/* Bento boxes */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-lg border border-slate-200 bg-white p-3 flex items-center gap-3 shadow-xs">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Users className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider">{t.totalUsers}</p>
                <p className="text-md font-black text-slate-900 mt-0.5">{stats.totalUsers}</p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-3 flex items-center gap-3 shadow-xs">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-emerald-50 text-emerald-600 border border-emerald-100">
                <BookOpen className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider">{t.totalBooks}</p>
                <p className="text-md font-black text-slate-900 mt-0.5">{stats.totalBooks}</p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-3 flex items-center gap-3 shadow-xs">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-amber-50 text-amber-600 border border-amber-100">
                <Award className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider">{t.premiumUsers}</p>
                <p className="text-md font-black text-slate-900 mt-0.5">{stats.premiumUsers}</p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-3 flex items-center gap-3 shadow-xs">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-rose-50 text-rose-600 border border-rose-100">
                <CreditCard className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider">Total Sales</p>
                <p className="text-md font-black text-slate-900 mt-0.5">${stats.totalSales.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Sales History audit log */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
            <h2 className="text-xs font-black text-slate-900 mb-3 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-slate-400" />
              Audit Sales History & Reports
            </h2>

            <div className="overflow-x-auto rounded border border-slate-200">
              <table className="w-full text-left text-xs text-slate-500">
                <thead className="text-[10px] text-slate-400 uppercase bg-slate-50 border-b border-slate-200 font-black">
                  <tr>
                    <th className="px-3 py-2 font-black">Transaction Date</th>
                    <th className="px-3 py-2 font-black">Book Title</th>
                    <th className="px-3 py-2 text-right font-black">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {stats.salesHistory.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-3 text-xs italic text-gray-400">No purchase records logged yet.</td>
                    </tr>
                  ) : (
                    stats.salesHistory.map((item: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition">
                        <td className="px-3 py-2.5 font-semibold text-slate-900">{item.date}</td>
                        <td className="px-3 py-2.5 text-slate-700">{item.title}</td>
                        <td className="px-3 py-2.5 text-right text-emerald-600 font-bold">${item.amount.toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Books tab */}
      {activeTab === 'books' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 animate-in fade-in duration-250">
          {/* Add / Edit Form */}
          <div className="lg:col-span-1 rounded-lg border border-slate-200 bg-white p-4 h-fit shadow-xs">
            <h2 className="text-xs font-black text-slate-900 mb-3">
              {editingBookId ? 'Edit Book Record' : 'Add New Book'}
            </h2>

            <form onSubmit={handleSaveBook} className="space-y-3">
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase mb-1 tracking-wider">Book Title</label>
                <input
                  type="text"
                  required
                  placeholder="Atomic Habits"
                  value={bookForm.title || ''}
                  onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                  className="w-full rounded border border-slate-200 p-2 text-xs outline-none focus:border-indigo-500 bg-slate-50/35"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase mb-1 tracking-wider">Author</label>
                <input
                  type="text"
                  required
                  placeholder="James Clear"
                  value={bookForm.author || ''}
                  onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                  className="w-full rounded border border-slate-200 p-2 text-xs outline-none focus:border-indigo-500 bg-slate-50/35"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase mb-1 tracking-wider">Category Slug</label>
                  <select
                    required
                    value={bookForm.category || ''}
                    onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
                    className="w-full rounded border border-slate-200 bg-white p-2 text-xs outline-none focus:border-indigo-500 bg-slate-50/35"
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.slug}>{c.slug}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase mb-1 tracking-wider">Language</label>
                  <select
                    required
                    value={bookForm.language || 'uz'}
                    onChange={(e) => setBookForm({ ...bookForm, language: e.target.value as any })}
                    className="w-full rounded border border-slate-200 bg-white p-2 text-xs outline-none focus:border-indigo-500 bg-slate-50/35"
                  >
                    <option value="uz">Uzbek</option>
                    <option value="ru">Russian</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase mb-1 tracking-wider">Price (0 for free)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="14.99"
                  value={bookForm.price || 0}
                  onChange={(e) => setBookForm({ ...bookForm, price: parseFloat(e.target.value) })}
                  className="w-full rounded border border-slate-200 p-2 text-xs outline-none focus:border-indigo-500 bg-slate-50/35"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase mb-1 tracking-wider">Cover Image URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={bookForm.coverUrl || ''}
                  onChange={(e) => setBookForm({ ...bookForm, coverUrl: e.target.value })}
                  className="w-full rounded border border-slate-200 p-2 text-xs outline-none focus:border-indigo-500 bg-slate-50/35"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase mb-1 tracking-wider">YouTube Lesson URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://www.youtube.com/embed/..."
                  value={bookForm.youtubeUrl || ''}
                  onChange={(e) => setBookForm({ ...bookForm, youtubeUrl: e.target.value })}
                  className="w-full rounded border border-slate-200 p-2 text-xs outline-none focus:border-indigo-500 bg-slate-50/35"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase mb-1 tracking-wider">Description</label>
                <textarea
                  placeholder="Enter book synopsis..."
                  rows={2}
                  value={bookForm.description || ''}
                  onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                  className="w-full rounded border border-slate-200 p-2 text-xs outline-none focus:border-indigo-500 bg-slate-50/35"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase mb-1 tracking-wider">Digital Reader Full Text Content</label>
                <textarea
                  required
                  placeholder="Enter full text for reader here..."
                  rows={3}
                  value={bookForm.content || ''}
                  onChange={(e) => setBookForm({ ...bookForm, content: e.target.value })}
                  className="w-full rounded border border-slate-200 p-2 text-xs font-mono outline-none focus:border-indigo-500 bg-slate-50/35"
                />
              </div>

              <div className="flex items-center gap-1.5 py-1">
                <input
                  type="checkbox"
                  id="isPremiumCheck"
                  checked={bookForm.isPremium || false}
                  onChange={(e) => setBookForm({ ...bookForm, isPremium: e.target.checked })}
                  className="rounded border-slate-300 h-3.5 w-3.5 text-indigo-600 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="isPremiumCheck" className="text-[10px] font-bold text-slate-700 uppercase tracking-wider cursor-pointer">Premium Subscriber Exclusive</label>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 rounded bg-indigo-600 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition cursor-pointer"
                >
                  {editingBookId ? 'Save Changes' : 'Publish Book'}
                </button>
                {editingBookId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingBookId(null);
                      setBookForm({
                        title: '',
                        author: '',
                        description: '',
                        category: '',
                        language: 'uz',
                        isPremium: false,
                        coverUrl: '',
                        content: '',
                        price: 0,
                        youtubeUrl: '',
                      });
                    }}
                    className="rounded border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Catalog Listing */}
          <div className="lg:col-span-2 rounded-lg border border-slate-200 bg-white p-4 overflow-y-auto max-h-[640px] shadow-xs">
            <h2 className="text-xs font-black text-slate-900 mb-3">Book Catalog List</h2>

            <div className="space-y-2.5 divide-y divide-slate-100">
              {books.map((book) => (
                <div key={book.id} className="flex items-center justify-between pt-2.5 first:pt-0">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=300&auto=format&fit=crop';
                      }}
                      className="h-10 w-7.5 rounded object-cover bg-slate-50 border border-slate-200"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{book.title}</h4>
                      <p className="text-[9px] text-slate-400">by {book.author}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[9px] uppercase bg-slate-100 text-slate-600 px-1 py-0.5 rounded font-mono font-bold">
                          {book.language}
                        </span>
                        {book.isPremium && (
                          <span className="text-[9px] bg-amber-100 text-amber-800 px-1 py-0.5 rounded font-black uppercase tracking-wider">
                            PREM
                          </span>
                        )}
                        <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1 py-0.5 rounded font-bold">
                          {book.price === 0 ? 'Free' : `$${book.price}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingBookId(book.id);
                        setBookForm(book);
                      }}
                      className="p-1 rounded border border-slate-200 text-slate-400 hover:border-indigo-500 hover:text-indigo-600 cursor-pointer transition"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteBook(book.id)}
                      className="p-1 rounded border border-slate-200 text-slate-400 hover:border-rose-500 hover:text-rose-600 cursor-pointer transition"
                    >
                      <Trash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Users management tab */}
      {activeTab === 'users' && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 animate-in fade-in duration-250 shadow-xs">
          <h2 className="text-xs font-black text-slate-900 mb-3">{t.userManagement}</h2>

          <div className="overflow-x-auto rounded border border-slate-200">
            <table className="w-full text-left text-xs text-slate-500">
              <thead className="text-[10px] text-slate-400 uppercase bg-slate-50 border-b border-slate-200 font-black">
                <tr>
                  <th className="px-3 py-2 font-black">Full Name</th>
                  <th className="px-3 py-2 font-black">Email Address</th>
                  <th className="px-3 py-2 font-black">Verified Status</th>
                  <th className="px-3 py-2 font-black">System Role</th>
                  <th className="px-3 py-2 font-black">Premium Status</th>
                  <th className="px-3 py-2 text-right font-black">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-3 py-2.5 font-bold text-slate-950">{user.name}</td>
                    <td className="px-3 py-2.5 text-slate-600">{user.email}</td>
                    <td className="px-3 py-2.5">
                      {user.isVerified ? (
                        <span className="inline-flex rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-150">Verified</span>
                      ) : (
                        <span className="inline-flex rounded bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold text-rose-700 border border-rose-150">Unverified</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <select
                        value={user.role}
                        onChange={(e) => handleUpdateUser(user.id, { role: e.target.value as any })}
                        className="rounded border border-slate-200 p-1 text-[10px] outline-none focus:border-indigo-500 bg-slate-50/50"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-3 py-2.5">
                      <select
                        value={user.premiumStatus}
                        onChange={(e) => handleUpdateUser(user.id, { premiumStatus: e.target.value as any })}
                        className="rounded border border-slate-200 p-1 text-[10px] outline-none focus:border-indigo-500 bg-slate-50/50 font-bold"
                      >
                        <option value="free">Free Plan</option>
                        <option value="monthly">Premium Monthly</option>
                        <option value="yearly">Premium Yearly</option>
                      </select>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer transition"
                        title="Delete User"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Categories management tab */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 animate-in fade-in duration-250">
          {/* Add form */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 h-fit md:col-span-1 shadow-xs">
            <h2 className="text-xs font-black text-slate-900 mb-3 flex items-center gap-1">
              <Tag className="h-4 w-4 text-indigo-600" />
              Add Category
            </h2>

            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase mb-1 tracking-wider">Name (Uzbek)</label>
                <input
                  type="text"
                  required
                  placeholder="Ilmiy fantastika"
                  value={categoryForm.nameUz || ''}
                  onChange={(e) => setCategoryForm({ ...categoryForm, nameUz: e.target.value })}
                  className="w-full rounded border border-slate-200 p-2 text-xs outline-none focus:border-indigo-500 bg-slate-50/35"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase mb-1 tracking-wider">Name (Russian)</label>
                <input
                  type="text"
                  required
                  placeholder="Научная фантастика"
                  value={categoryForm.nameRu || ''}
                  onChange={(e) => setCategoryForm({ ...categoryForm, nameRu: e.target.value })}
                  className="w-full rounded border border-slate-200 p-2 text-xs outline-none focus:border-indigo-500 bg-slate-50/35"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase mb-1 tracking-wider">Name (English)</label>
                <input
                  type="text"
                  required
                  placeholder="Science Fiction"
                  value={categoryForm.nameEn || ''}
                  onChange={(e) => setCategoryForm({ ...categoryForm, nameEn: e.target.value })}
                  className="w-full rounded border border-slate-200 p-2 text-xs outline-none focus:border-indigo-500 bg-slate-50/35"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase mb-1 tracking-wider">Slug URL Parameter</label>
                <input
                  type="text"
                  required
                  placeholder="sci-fi"
                  value={categoryForm.slug || ''}
                  onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                  className="w-full rounded border border-slate-200 p-2 text-xs outline-none focus:border-indigo-500 bg-slate-50/35"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded bg-indigo-600 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition cursor-pointer shadow-xs"
              >
                Add Category
              </button>
            </form>
          </div>

          {/* Categories list */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 md:col-span-2 shadow-xs">
            <h2 className="text-xs font-black text-slate-900 mb-3">Categories List</h2>

            <div className="overflow-x-auto rounded border border-slate-200">
              <table className="w-full text-left text-xs text-slate-500">
                <thead className="text-[10px] text-slate-400 uppercase bg-slate-50 border-b border-slate-200 font-black">
                  <tr>
                    <th className="px-3 py-2 font-black">Slug</th>
                    <th className="px-3 py-2 font-black">Uzbek</th>
                    <th className="px-3 py-2 font-black">Russian</th>
                    <th className="px-3 py-2 font-black">English</th>
                    <th className="px-3 py-2 text-right font-black">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-3 py-2.5 font-mono font-bold text-slate-900">{cat.slug}</td>
                      <td className="px-3 py-2.5 text-slate-600">{cat.nameUz}</td>
                      <td className="px-3 py-2.5 text-slate-600">{cat.nameRu}</td>
                      <td className="px-3 py-2.5 text-slate-600">{cat.nameEn}</td>
                      <td className="px-3 py-2.5 text-right">
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer transition"
                          title="Delete Category"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
