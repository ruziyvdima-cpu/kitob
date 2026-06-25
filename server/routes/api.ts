import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../db';
import { GoogleGenAI } from '@google/genai';
import { broadcastMessage } from '../telegram';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'kitobx_secret_key_123';

// Initialize Gemini SDK lazily for AI recommendations and reviews if required
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    } catch (e) {
      console.error('Failed to initialize GoogleGenAI client:', e);
    }
  }
  return aiClient;
}

// Middleware: Authenticate JWT
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Access token required' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, user: any) => {
    if (err) {
      res.status(403).json({ message: 'Invalid or expired token' });
      return;
    }
    req.user = user;
    next();
  });
}

// Middleware: Require Admin
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }
  next();
}

// ==========================================
// 1. AUTHENTICATION ENDPOINTS
// ==========================================

// Register
router.post('/auth/register', (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    res.status(400).json({ message: 'Please provide email, password, and name' });
    return;
  }

  const existingUser = db.findUserByEmail(email);
  if (existingUser) {
    res.status(400).json({ message: 'User with this email already exists' });
    return;
  }

  // Create verification code
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const telegramLinkCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  const user = db.createUser(
    {
      email,
      name,
      role: 'user',
      isVerified: false,
      premiumStatus: 'free',
      verificationCode,
      telegramLinkCode,
    },
    password
  );

  console.log(`[VERIFICATION EMAIL SENT] To: ${email}, Code: ${verificationCode}`);

  broadcastMessage(`👤 <b>Yangi foydalanuvchi ro'yxatdan o'tdi!</b>

• <b>Ism:</b> ${user.name}
• <b>Email:</b> ${user.email}
• <b>ID:</b> <code>${user.id}</code>`);

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

  res.status(201).json({
    message: 'Registration successful! Verification code sent to email.',
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isVerified: user.isVerified,
      premiumStatus: user.premiumStatus,
      telegramLinkCode: user.telegramLinkCode,
    },
    // In development mode, return the code so users can verify instantly without an actual email gateway
    devVerificationCode: verificationCode,
  });
});

// Login
router.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: 'Please provide email and password' });
    return;
  }

  const user = db.findUserByEmail(email);
  if (!user || !db.verifyPassword(user.id, password)) {
    res.status(400).json({ message: 'Invalid email or password' });
    return;
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

  res.json({
    message: 'Login successful!',
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isVerified: user.isVerified,
      premiumStatus: user.premiumStatus,
      telegramLinkCode: user.telegramLinkCode,
      telegramId: user.telegramId,
    },
  });
});

// Verify Email
router.post('/auth/verify-email', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { code } = req.body;
  const userId = req.user?.id;

  if (!userId || !code) {
    res.status(400).json({ message: 'Verification code is required' });
    return;
  }

  const user = db.findUserById(userId);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  if (user.isVerified) {
    res.json({ message: 'Email is already verified', user });
    return;
  }

  if (user.verificationCode === code) {
    db.updateUser(userId, { isVerified: true, verificationCode: undefined });
    res.json({ message: 'Email verified successfully!', user: { ...user, isVerified: true } });
  } else {
    res.status(400).json({ message: 'Incorrect verification code' });
  }
});

// Reset Password Request
router.post('/auth/reset-password-request', (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ message: 'Email is required' });
    return;
  }

  const user = db.findUserByEmail(email);
  if (!user) {
    res.status(404).json({ message: 'No user found with this email' });
    return;
  }

  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  db.updateUser(user.id, { resetCode });

  console.log(`[PASSWORD RESET CODE SENT] To: ${email}, Code: ${resetCode}`);

  res.json({
    message: 'Reset password code sent to your email!',
    devResetCode: resetCode,
  });
});

// Reset Password
router.post('/auth/reset-password', (req: Request, res: Response) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    res.status(400).json({ message: 'All fields (email, code, newPassword) are required' });
    return;
  }

  const user = db.findUserByEmail(email);
  if (!user || user.resetCode !== code) {
    res.status(400).json({ message: 'Invalid email or verification code' });
    return;
  }

  db.updatePassword(user.id, newPassword);
  db.updateUser(user.id, { resetCode: undefined });

  res.json({ message: 'Password has been reset successfully! You can now log in.' });
});

// Get profile
router.get('/auth/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const user = db.findUserById(userId);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  res.json({ user });
});

// ==========================================
// 2. LIBRARY AND BOOKS ENDPOINTS
// ==========================================

// Search / List books
router.get('/books', (req: Request, res: Response) => {
  const { q, category, lang, premium, page = '1', limit = '12' } = req.query;

  let filteredBooks = db.getBooks();

  if (q) {
    const searchString = (q as string).toLowerCase();
    filteredBooks = filteredBooks.filter(
      b => b.title.toLowerCase().includes(searchString) || b.author.toLowerCase().includes(searchString)
    );
  }

  if (category && category !== 'all') {
    filteredBooks = filteredBooks.filter(b => b.category === category);
  }

  if (lang) {
    filteredBooks = filteredBooks.filter(b => b.language === lang);
  }

  if (premium === 'true') {
    filteredBooks = filteredBooks.filter(b => b.isPremium);
  } else if (premium === 'false') {
    filteredBooks = filteredBooks.filter(b => !b.isPremium);
  }

  // Paginate for performance
  const p = parseInt(page as string, 10);
  const l = parseInt(limit as string, 10);
  const total = filteredBooks.length;
  const start = (p - 1) * l;
  const paginatedBooks = filteredBooks.slice(start, start + l);

  res.json({
    books: paginatedBooks,
    total,
    page: p,
    pages: Math.ceil(total / l),
  });
});

// Categories list
router.get('/categories', (req: Request, res: Response) => {
  res.json({ categories: db.getCategories() });
});

// Get single book details
router.get('/books/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const book = db.findBookById(id);

  if (!book) {
    res.status(404).json({ message: 'Book not found' });
    return;
  }

  // Check if authenticated user has purchased this book
  let userId: string | undefined = undefined;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      userId = decoded.id;
    } catch (e) {
      // Ignore token verification errors for public-compatible details view
    }
  }

  const hasPurchased = userId ? db.getOrdersByUser(userId).some(o => o.bookId === id && o.status === 'completed') : false;
  const reviews = db.getReviewsByBook(id);

  res.json({ book, reviews, hasPurchased });
});

// Toggle Favorite Book
router.post('/books/:id/favorite', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const { id: bookId } = req.params;

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const added = db.toggleFavorite(userId, bookId);
  const favorites = db.getFavorites(userId);

  res.json({
    message: added ? 'Book added to favorites!' : 'Book removed from favorites',
    isFavorite: added,
    favorites,
  });
});

// Get user favorites
router.get('/favorites', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const favoriteIds = db.getFavorites(userId);
  const allBooks = db.getBooks();
  const favoriteBooks = allBooks.filter(b => favoriteIds.includes(b.id));

  res.json({ favorites: favoriteBooks });
});

// Write Book Review
router.post('/books/:id/review', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const { id: bookId } = req.params;
  const { rating, comment } = req.body;

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  if (!rating || !comment) {
    res.status(400).json({ message: 'Rating and comment are required' });
    return;
  }

  const user = db.findUserById(userId);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  const review = db.createReview({
    bookId,
    userId,
    userName: user.name,
    rating: parseInt(rating, 10),
    comment,
  });

  const book = db.findBookById(bookId);
  const bookTitle = book ? book.title : 'Noma\'lum kitob';

  broadcastMessage(`✍️ <b>Yangi sharh qoldirildi!</b>

• <b>Kitob:</b> ${bookTitle}
• <b>Foydalanuvchi:</b> ${user.name} (${user.email})
• <b>Baholash:</b> ${'⭐️'.repeat(parseInt(rating, 10))} (${rating}/5)
• <b>Fikr:</b> ${comment}`);

  res.status(201).json({ message: 'Review added successfully!', review });
});

// ==========================================
// 3. READING HISTORY & BOOKMARKS ENDPOINTS
// ==========================================

// Get history
router.get('/history', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const history = db.getHistoryByUser(userId);
  res.json({ history });
});

// Log or update reading progress
router.post('/history/update', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const { bookId, progressPercent } = req.body;

  if (!userId || !bookId || progressPercent === undefined) {
    res.status(400).json({ message: 'bookId and progressPercent are required' });
    return;
  }

  const item = db.updateHistory(userId, bookId, parseInt(progressPercent, 10));
  res.json({ item });
});

// Get book bookmarks
router.get('/bookmarks/:bookId', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const { bookId } = req.params;

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const bookmarks = db.getBookmarks(userId, bookId);
  res.json({ bookmarks });
});

// Create Bookmark
router.post('/bookmarks', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const { bookId, pageNumber, note } = req.body;

  if (!userId || !bookId || pageNumber === undefined) {
    res.status(400).json({ message: 'bookId and pageNumber are required' });
    return;
  }

  const bookmark = db.createBookmark({
    userId,
    bookId,
    pageNumber: parseInt(pageNumber, 10),
    note: note || '',
  });

  res.status(201).json({ message: 'Bookmark added successfully!', bookmark });
});

// Delete Bookmark
router.delete('/bookmarks/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const success = db.deleteBookmark(id);

  if (success) {
    res.json({ message: 'Bookmark deleted successfully' });
  } else {
    res.status(404).json({ message: 'Bookmark not found' });
  }
});

// ==========================================
// 4. SUBSTORE, CART, AND ORDER ENDPOINTS
// ==========================================

// Purchase book checkout
router.post('/store/checkout', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const { bookId } = req.body;

  if (!userId || !bookId) {
    res.status(400).json({ message: 'bookId is required for checkout' });
    return;
  }

  const book = db.findBookById(bookId);
  if (!book) {
    res.status(404).json({ message: 'Book not found' });
    return;
  }

  // Create Order
  const order = db.createOrder({
    userId,
    bookId,
    title: book.title,
    coverUrl: book.coverUrl,
    price: book.price,
    status: 'completed', // Instant secure auto-payment simulation
  });

  const user = db.findUserById(userId);
  const userName = user ? `${user.name} (${user.email})` : 'Noma\'lum xaridor';

  broadcastMessage(`🛍️ <b>Yangi buyurtma qabul qilindi!</b>

• <b>Kitob:</b> ${book.title}
• <b>Muallif:</b> ${book.author}
• <b>Xaridor:</b> ${userName}
• <b>Narxi:</b> $${book.price}
• <b>Buyurtma ID:</b> <code>${order.id}</code>`);

  res.json({
    message: 'Book purchased successfully! Digital delivery completed.',
    order,
  });
});

// View orders
router.get('/store/orders', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const orders = db.getOrdersByUser(userId);
  res.json({ orders });
});

// ==========================================
// 5. SUBSCRIPTION PLAN ENDPOINTS
// ==========================================

router.post('/subscriptions/subscribe', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const { plan } = req.body; // 'monthly' | 'yearly'

  if (!userId || (plan !== 'monthly' && plan !== 'yearly')) {
    res.status(400).json({ message: 'Valid subscription plan (monthly or yearly) is required' });
    return;
  }

  const expiresAt = new Date();
  if (plan === 'monthly') {
    expiresAt.setMonth(expiresAt.getMonth() + 1);
  } else {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  }

  const user = db.updateUser(userId, {
    premiumStatus: plan,
    premiumExpiresAt: expiresAt.toISOString(),
  });

  broadcastMessage(`💎 <b>Yangi premium obuna!</b>

• <b>Foydalanuvchi:</b> ${user?.name} (${user?.email})
• <b>Tarif:</b> ${plan === 'monthly' ? 'Oylik (Monthly)' : 'Yillik (Yearly)'}
• <b>Amal qilish muddati:</b> ${expiresAt.toLocaleString()}`);

  res.json({
    message: `Successfully subscribed to KitobX Premium ${plan === 'monthly' ? 'Monthly' : 'Yearly'}!`,
    user,
  });
});

router.post('/subscriptions/cancel', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const user = db.updateUser(userId, {
    premiumStatus: 'free',
    premiumExpiresAt: undefined,
  });

  broadcastMessage(`❌ <b>Premium obuna bekor qilindi</b>

• <b>Foydalanuvchi:</b> ${user?.name} (${user?.email})`);

  res.json({
    message: 'Subscription canceled successfully. Back to Free plan.',
    user,
  });
});

// ==========================================
// 6. TELEGRAM BOT INTEGRATION API (FOR BOT DEVELOPERS)
// ==========================================

// Link Telegram account with website account
router.post('/telegram/link', (req: Request, res: Response) => {
  const { telegramId, linkCode } = req.body;

  if (!telegramId || !linkCode) {
    res.status(400).json({ message: 'telegramId and linkCode are required' });
    return;
  }

  const user = db.findUserByTelegramLinkCode(linkCode);
  if (!user) {
    res.status(404).json({ message: 'Invalid or expired linkage code' });
    return;
  }

  db.updateUser(user.id, {
    telegramId,
    telegramLinkCode: undefined, // Consume code
  });

  res.json({
    message: 'Telegram account successfully linked with KitobX website account!',
    username: user.name,
    email: user.email,
    premiumStatus: user.premiumStatus,
  });
});

// Check subscription status
router.get('/telegram/user-status', (req: Request, res: Response) => {
  const { telegramId } = req.query;

  if (!telegramId) {
    res.status(400).json({ message: 'telegramId query param is required' });
    return;
  }

  const user = db.findUserByTelegramId(telegramId as string);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  res.json({
    name: user.name,
    email: user.email,
    premiumStatus: user.premiumStatus,
    expiresAt: user.premiumExpiresAt,
    isVerified: user.isVerified,
  });
});

// Send book recommendations
router.get('/telegram/recommendations', async (req: Request, res: Response) => {
  const { telegramId } = req.query;

  if (!telegramId) {
    res.status(400).json({ message: 'telegramId is required' });
    return;
  }

  const user = db.findUserByTelegramId(telegramId as string);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  const favorites = db.getFavorites(user.id);
  const allBooks = db.getBooks();

  // Pick up to 3 smart book recommendations
  // If we have Gemini key, we can ask Gemini for a nice list!
  const ai = getAiClient();
  if (ai && favorites.length > 0) {
    try {
      const favTitles = allBooks.filter(b => favorites.includes(b.id)).map(b => b.title).join(', ');
      const prompt = `Recommend 3 books similar to these favorite books: "${favTitles}". Provide output strictly as a JSON list containing titles and descriptions in Uzbek, Russian, and English. No conversational text.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });
      const data = JSON.parse(response.text || '[]');
      res.json({ recommendations: data, source: 'ai' });
      return;
    } catch (e) {
      console.error('Gemini recommendations error, falling back to static logic', e);
    }
  }

  // Fallback static recommendations
  const recs = allBooks.slice(0, 3).map(b => ({
    title: b.title,
    author: b.author,
    category: b.category,
    isPremium: b.isPremium,
    description: b.description,
  }));

  res.json({ recommendations: recs, source: 'database' });
});

// Notify users about new books (Retrieve newly added books)
router.get('/telegram/notify-new-books', (req: Request, res: Response) => {
  const books = db.getBooks().slice(0, 5); // 5 newest books
  res.json({
    newBooks: books.map(b => ({
      title: b.title,
      author: b.author,
      isPremium: b.isPremium,
      price: b.price,
      coverUrl: b.coverUrl,
    }))
  });
});

// ==========================================
// 7. ADMIN PANEL ENDPOINTS
// ==========================================

// Dashboard stats
router.get('/admin/stats', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const users = db.getUsers();
  const books = db.getBooks();
  const orders = db.getOrdersAll();

  const totalUsers = users.length;
  const totalBooks = books.length;
  const premiumUsers = users.filter(u => u.premiumStatus !== 'free').length;
  const totalSales = orders.reduce((sum, o) => sum + (o.price || 0), 0);

  // Sales statistics grouped by month
  const salesHistory = orders.map(o => ({
    date: o.createdAt.split('T')[0],
    amount: o.price,
    title: o.title,
  }));

  res.json({
    totalUsers,
    totalBooks,
    premiumUsers,
    totalSales,
    salesHistory,
  });
});

// Manage Users
router.get('/admin/users', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.json({ users: db.getUsers() });
});

router.put('/admin/users/:id', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name, role, premiumStatus, isVerified } = req.body;

  const user = db.updateUser(id, { name, role, premiumStatus, isVerified });
  if (user) {
    res.json({ message: 'User updated successfully', user });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

router.delete('/admin/users/:id', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const success = db.deleteUser(id);
  if (success) {
    res.json({ message: 'User deleted successfully' });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

// Manage Books
router.post('/admin/books', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { title, author, description, category, language, isPremium, coverUrl, content, price } = req.body;

  if (!title || !author || !category || !language || !content) {
    res.status(400).json({ message: 'title, author, category, language, and content are required' });
    return;
  }

  const book = db.createBook({
    title,
    author,
    description: description || '',
    category,
    language,
    isPremium: !!isPremium,
    coverUrl: coverUrl || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=300&auto=format&fit=crop',
    content,
    rating: 5.0,
    reviewCount: 0,
    price: parseFloat(price) || 0,
    salesCount: 0,
  });

  res.status(201).json({ message: 'Book created successfully!', book });
});

router.put('/admin/books/:id', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { title, author, description, category, language, isPremium, coverUrl, content, price } = req.body;

  const book = db.updateBook(id, {
    title,
    author,
    description,
    category,
    language,
    isPremium,
    coverUrl,
    content,
    price: price !== undefined ? parseFloat(price) : undefined,
  });

  if (book) {
    res.json({ message: 'Book updated successfully', book });
  } else {
    res.status(404).json({ message: 'Book not found' });
  }
});

router.delete('/admin/books/:id', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const success = db.deleteBook(id);
  if (success) {
    res.json({ message: 'Book deleted successfully' });
  } else {
    res.status(404).json({ message: 'Book not found' });
  }
});

// Manage Categories
router.post('/admin/categories', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { nameUz, nameRu, nameEn, slug } = req.body;

  if (!nameUz || !nameRu || !nameEn || !slug) {
    res.status(400).json({ message: 'All category fields are required' });
    return;
  }

  const category = db.createCategory({ nameUz, nameRu, nameEn, slug });
  res.status(201).json({ message: 'Category created successfully!', category });
});

router.delete('/admin/categories/:id', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const success = db.deleteCategory(id);
  if (success) {
    res.json({ message: 'Category deleted successfully' });
  } else {
    res.status(404).json({ message: 'Category not found' });
  }
});

export default router;
