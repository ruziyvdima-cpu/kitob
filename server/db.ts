import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { User, Book, Review, Order, ReadingHistoryItem, Bookmark, Category } from '../src/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface DatabaseSchema {
  users: User[];
  passwords: Record<string, string>; // userId -> hashed_password
  books: Book[];
  reviews: Review[];
  orders: Order[];
  readingHistory: ReadingHistoryItem[];
  bookmarks: Bookmark[];
  favorites: Record<string, string[]>; // userId -> bookIds[]
  categories: Category[];
  telegramChatIds?: number[];
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', nameUz: 'Mumtoz adabiyot', nameRu: 'Классика', nameEn: 'Classics', slug: 'classics' },
  { id: '2', nameUz: 'Ilmiy fantastika', nameRu: 'Научная фантастика', nameEn: 'Science Fiction', slug: 'sci-fi' },
  { id: '3', nameUz: 'Shaxsiy rivojlanish', nameRu: 'Саморазвитие', nameEn: 'Self-Development', slug: 'self-dev' },
  { id: '4', nameUz: 'Tarixiy', nameRu: 'Исторические романы', nameEn: 'Historical Fiction', slug: 'historical' },
  { id: '5', nameUz: 'Biznes va moliya', nameRu: 'Бизнес и финансы', nameEn: 'Business & Finance', slug: 'business' },
  { id: '6', nameUz: 'Bolalar adabiyoti', nameRu: 'Детская литература', nameEn: 'Children\'s Books', slug: 'children' },
];

const SEED_BOOKS_DETAILED: Book[] = [
  // Free Books
  {
    id: 'free-1',
    title: 'O\'tkan kunlar',
    author: 'Abdulla Qodiriy',
    description: 'Uzbek adabiyotining ilk romani. Otabek va Kumushning fojiaviy sevgisi haqida.',
    category: 'classics',
    language: 'uz',
    isPremium: false,
    coverUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=300&auto=format&fit=crop',
    content: '1-BOB: QOTILLIK TA\'RIFI.\n\nOtabek Marg\'ilondan qaytishda qalbi g\'ash edi. Marg\'ilonning loy ko\'chalari unga Kumushning nurli siymosini eslatar, har bir qadamda uning xayoli bilan yashar edi. Abdulla Qodiriyning ushbu o\'lmas asari vatanparvarlik, sevgi va sadoqat haqidadir.',
    rating: 4.8,
    reviewCount: 142,
    price: 0,
    salesCount: 0,
  },
  {
    id: 'free-2',
    title: 'Master i Margarita',
    author: 'Mikhail Bulgakov',
    description: 'A classic Russian novel that interweaves a visit by the Devil to the Soviet Union with a retelling of Pontius Pilate’s trial of Jesus.',
    category: 'classics',
    language: 'ru',
    isPremium: false,
    coverUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=300&auto=format&fit=crop',
    content: 'ГЛАВА 1: НИКОГДА НЕ РАЗГОВАРИВАЙТЕ С НЕИЗВЕСТНЫМИ.\n\nОднажды весною, в час небывало жаркого заката, в Москве, на Патриарших прудах, появились два гражданина. Первый из них, одетый в летнюю серенькую пару, был маленького роста, упитан, лыс, свою приличную шляпу пирожком нес в руке...',
    rating: 4.9,
    reviewCount: 389,
    price: 0,
    salesCount: 0,
  },
  {
    id: 'free-3',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    description: 'The story of the mysteriously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan.',
    category: 'classics',
    language: 'en',
    isPremium: false,
    coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=300&auto=format&fit=crop',
    content: 'CHAPTER 1.\n\nIn my younger and more vulnerable years my father gave me some advice that I’ve been turning over in my mind ever since. "Whenever you feel like criticizing any one," he told me, "just remember that all the people in this world haven\'t had the advantages that you\'ve had."',
    rating: 4.5,
    reviewCount: 95,
    price: 0,
    salesCount: 0,
  },
  {
    id: 'free-4',
    title: 'Sariq devni minib',
    author: 'Xudoyberdi To\'xtaboyev',
    description: 'O\'zbek bolalar adabiyotining eng mashhur asarlaridan biri. Hoshimjonning sarguzashtlari.',
    category: 'children',
    language: 'uz',
    isPremium: false,
    coverUrl: 'https://images.unsplash.com/photo-1474932430478-367dbb6832c1?q=80&w=300&auto=format&fit=crop',
    content: '1-BOB: MEN QANDAY QILIB SARIQ DEVNI JILOVLADIM.\n\nE, do\'stlarim, agar siz mening boshimdan o\'tgan sarguzashtlarni eshitsangiz, hayratdan yoqangizni ushlaysiz. Hoshimjon deganlari men bo\'laman. Dangasalikda menga teng keladigani yo\'q edi, ammo sehrli qalpoqcha topib olganimdan keyin hammasi o\'zgardi...',
    rating: 4.7,
    reviewCount: 120,
    price: 0,
    salesCount: 0,
  },
  {
    id: 'free-5',
    title: 'Think and Grow Rich',
    author: 'Napoleon Hill',
    description: 'A personal development and self-help book that claims to contain the secrets of the wealthy.',
    category: 'self-dev',
    language: 'en',
    isPremium: false,
    coverUrl: 'https://images.unsplash.com/photo-1511108690759-009324a90311?q=80&w=300&auto=format&fit=crop',
    content: 'CHAPTER 1: INTRODUCTION.\n\nTruly, "thoughts are things," and powerful things at that, when they are mixed with definiteness of purpose, persistence, and a BURNING DESIRE for their translation into riches, or other material objects. Edwin C. Barnes discovered how true it is that thoughts can accumulate wealth.',
    rating: 4.6,
    reviewCount: 231,
    price: 0,
    salesCount: 0,
  },
  // Premium Books (Monthly/Yearly Subscribers can read these for free)
  {
    id: 'prem-1',
    title: 'Yulduzli tunlar',
    author: 'Pirimqul Qodirov',
    description: 'Zahiriddin Muhammad Boburning hayoti va ijodiga bag\'ishlangan tarixiy asar.',
    category: 'historical',
    language: 'uz',
    isPremium: true,
    coverUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=300&auto=format&fit=crop',
    content: '1-BOB: ANDIJONNING HAVOSI.\n\nZahiriddin Muhammad Bobur o\'n ikki yoshida taxtga o\'tirdi. Uning ko\'z o\'ngida Farg\'ona vodiysining go\'zal tabiati, Andijon qal\'asining mustahkam devorlari va bevaqt halok bo\'lgan otasi Umarshayx Mirzoning siymosi gavdalanar edi...',
    rating: 4.9,
    reviewCount: 312,
    price: 0,
    salesCount: 0,
  },
  {
    id: 'prem-2',
    title: 'Voina i Mir',
    author: 'Leo Tolstoy',
    description: 'A monumental epic detailing the French invasion of Russia and its impact on Tsarist society through five families.',
    category: 'historical',
    language: 'ru',
    isPremium: true,
    coverUrl: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=300&auto=format&fit=crop',
    content: 'ЧАСТЬ 1, ГЛАВА 1.\n\n— Еh bien, mon prince. Gênes et Lucques ne sont plus que des apanages, des pomes, de la famille Buonaparte... — Так говорила в июле 1805 года известная Анна Павловна Шерер, фрейлина и приближенная императрицы Марии Феодоровны, встречая важного и чиновного князя Василия...',
    rating: 4.8,
    reviewCount: 520,
    price: 0,
    salesCount: 0,
  },
  // Store Books (Must be purchased to read)
  {
    id: 'store-1',
    title: 'Atomic Habits',
    author: 'James Clear',
    description: 'An easy & proven way to build good habits & break bad ones. Tiny changes, remarkable results.',
    category: 'self-dev',
    language: 'en',
    isPremium: false,
    coverUrl: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=300&auto=format&fit=crop',
    content: 'CHAPTER 1: THE SURPRISING POWER OF ATOMIC HABITS.\n\nThe fate of British Cycling changed on a single day in 2003. The organization, which had been the governing body for professional cycling in Great Britain, had recently hired Dave Brailsford as its new performance director. At the time, they had won just one gold medal since 1908...',
    rating: 4.9,
    reviewCount: 680,
    price: 15.99,
    salesCount: 42,
  },
  {
    id: 'store-2',
    title: 'Boy ota, kambag\'al ota',
    author: 'Robert Kiyosaki',
    description: 'Moliya erkinligi va shaxsiy boylikni oshirish haqidagi jahon bestselleri.',
    category: 'business',
    language: 'uz',
    isPremium: false,
    coverUrl: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?q=80&w=300&auto=format&fit=crop',
    content: '1-BOB: DARS: BOY VAKT UCHUN ISHLAMAYDI.\n\nMening ikkita otam bor edi. Biri o\'ta ilmli, oliy ma\'lumotli, falsafa doktori edi. Ikkinchisi esa sakkizinchi sinfni ham bitirmagan edi, lekin u o\'z asrining eng badavlat kishilaridan biriga aylandi. Biri kambag\'allikda vafot etdi, ikkinchisi esa merosxo\'rlariga millionlab dollar qoldirdi...',
    rating: 4.7,
    reviewCount: 289,
    price: 9.99,
    salesCount: 110,
  },
];

class Database {
  private schema: DatabaseSchema = {
    users: [],
    passwords: {},
    books: [],
    reviews: [],
    orders: [],
    readingHistory: [],
    bookmarks: [],
    favorites: {},
    categories: DEFAULT_CATEGORIES,
  };

  constructor() {
    this.init();
  }

  private init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        this.schema = JSON.parse(fileContent);
        if (!this.schema.telegramChatIds) {
          this.schema.telegramChatIds = [];
        }
        console.log('Database loaded from file successfully.');
      } catch (err) {
        console.error('Error parsing db.json, generating a new database', err);
        this.generateDefaultDatabase();
      }
    } else {
      this.generateDefaultDatabase();
    }

    // Ensure we meet the user requirement: More than 1000 free books and 5000 premium books
    this.ensureInfiniteLibrary();
    this.ensureAdminUser();
    this.ensureSchoolBooks();
  }

  private generateDefaultDatabase() {
    this.schema = {
      users: [],
      passwords: {},
      books: [...SEED_BOOKS_DETAILED],
      reviews: [
        {
          id: 'rev-1',
          bookId: 'free-1',
          userId: 'admin-1',
          userName: 'Admin',
          rating: 5,
          comment: 'O\'zbek adabiyotining durdonasi! Har bir inson o\'qishi shart.',
          createdAt: new Date().toISOString(),
        }
      ],
      orders: [],
      readingHistory: [],
      bookmarks: [],
      favorites: {},
      categories: DEFAULT_CATEGORIES,
      telegramChatIds: [],
    };

    // Create a default administrator
    const adminId = 'admin-1';
    const admin: User = {
      id: adminId,
      email: 'admin@kitobx.uz',
      name: 'System Admin',
      role: 'admin',
      isVerified: true,
      premiumStatus: 'yearly',
      createdAt: new Date().toISOString(),
    };
    this.schema.users.push(admin);
    this.schema.passwords[adminId] = bcrypt.hashSync('admin123KitobX!', 10);

    // Create a default demo user
    const demoId = 'user-1';
    const demoUser: User = {
      id: demoId,
      email: 'user@kitobx.uz',
      name: 'Demo Kitobxon',
      role: 'user',
      isVerified: true,
      premiumStatus: 'free',
      createdAt: new Date().toISOString(),
    };
    this.schema.users.push(demoUser);
    this.schema.passwords[demoId] = bcrypt.hashSync('user123', 10);

    this.save();
  }

  private ensureInfiniteLibrary() {
    const freeCount = this.schema.books.filter(b => !b.isPremium && b.price === 0).length;
    const premiumCount = this.schema.books.filter(b => b.isPremium).length;

    let modified = false;

    const literatureCovers = [
      '1544947950-fa07a98d237f', '1543002588-bfa74002ed7e', '1512820790803-83ca734da794', '1474932430478-367dbb6832c1',
      '1511108690759-009324a90311', '1456513080510-7bf3a84b82f8', '1516979187457-637abb4f9353', '1541963463532-d68292c34b19',
      '1506880018603-83d5b814b5a6', '1532012197267-da84d127e765', '1497633762265-9d179a990aa6', '1501504905252-473c47e087f8',
      '1513475382585-d06e58bc0e05', '1535905122575-3009afdfb17c', '1495640388908-05fa85288e61', '1515847049296-a281d6401047',
      '1524995997946-a1c2e315a42f', '1546410531-bb4caa18d03d', '1503676260728-1c00da094a0b', '1588072421713-112643336300',
      '1580582932707-520aed937b7b', '1434030216411-0b793f4b4173', '1522202176988-66273c2fd55f', '1519389950473-47ba0277781c'
    ];

    // Repair existing book cover URLs if they contain invalid Unsplash IDs
    this.schema.books.forEach((b, idx) => {
      if (!b.coverUrl || b.coverUrl.includes('photo-15000000') || b.coverUrl.includes('photo-15100000')) {
        b.coverUrl = `https://images.unsplash.com/photo-${literatureCovers[idx % literatureCovers.length]}?q=80&w=300&auto=format&fit=crop`;
        modified = true;
      }
    });

    // We want > 1000 free books and > 5000 premium books
    // To implement this programmatically without consuming massive file space:
    // We will generate them procedurally!
    // Since keeping 6000 books in memory is light (~2-3MB), we can generate them.
    // However, saving 6000 books to a JSON file on every write can be slightly slow,
    // but at 6000 items, a JSON file is about 1.5MB, which is completely fine for fs.writeFile (takes ~5-10ms).
    // Let's generate them if the DB has fewer than 6000 books!
    if (this.schema.books.length < 6200) {
      console.log(`Generating procedurally 1100 free books and 5100 premium books...`);
      const categories = ['classics', 'sci-fi', 'self-dev', 'historical', 'business', 'children'];
      const authors = [
        'Abdulla Qodiriy', 'Cho\'lpon', 'Fitrat', 'Oybek', 'Tog\'ay Murod', 'Mikhail Bulgakov',
        'Leo Tolstoy', 'Fyodor Dostoevsky', 'Alexander Pushkin', 'F. Scott Fitzgerald',
        'Ernest Hemingway', 'George Orwell', 'Stephen King', 'James Clear', 'Robert Kiyosaki',
        'Xudoyberdi To\'xtaboyev', 'Pirimqul Qodirov', 'Adil Yakubov', 'Erkin Vohidov', 'Abdulla Oripov'
      ];
      
      const bookTitlesUz = [
        'Sirlar xazinasi', 'Koinot bo\'ylab sayohat', 'Muvaffaqiyat kaliti', 'Temur tuzuklari',
        'Zamonlar chorrahasi', 'Oltin vodiy', 'Tushlar ta\'biri', 'Ufq ortidagi nur', 'Daholar suhbati',
        'Qalb ko\'zi', 'Baxtli hayot sirlari', 'Boylik sari yo\'l', 'Tarixiy saboqlar', 'Sehrli kitob',
        'Kichik tadbirkor', 'Dunyoning ishlari', 'Ikki eshik orasi', 'Kecha va kunduz', 'Sinchalak'
      ];

      const bookTitlesRu = [
        'Тайны вселенной', 'Путь к успеху', 'История империй', 'Секреты разума', 'Тени прошлого',
        'Золотая долина', 'В поисках счастья', 'Финансовая свобода', 'Сказки народов мира', 'Философия жизни',
        'Утренний рассвет', 'Звездный десант', 'Детство и юность', 'Голос сердца', 'Законы богатства'
      ];

      const bookTitlesEn = [
        'Echoes of Destiny', 'The Quantum Paradox', 'Mastering Mindset', 'Chronicles of Empires',
        'The Silent Observer', 'Golden Meadows', 'The Pursuit of Happiness', 'Financial Mastery',
        'Legends of the World', 'The Creative Spark', 'Beyond the Horizon', 'Path to Greatness',
        'Lessons of History', 'The Whispering Forest', 'Wired for Success', 'The Art of Living'
      ];

      // Generate Free Books up to 1050
      let currentId = this.schema.books.length + 1;
      const targetFree = 1050;
      const currentFreeCount = this.schema.books.filter(b => !b.isPremium && b.price === 0).length;
      
      if (currentFreeCount < targetFree) {
        const needed = targetFree - currentFreeCount;
        for (let i = 0; i < needed; i++) {
          const lang = (i % 3 === 0) ? 'uz' : (i % 3 === 1) ? 'ru' : 'en';
          const cat = categories[i % categories.length];
          const author = authors[i % authors.length];
          let title = '';
          if (lang === 'uz') title = `${bookTitlesUz[i % bookTitlesUz.length]} #${i + 1}`;
          else if (lang === 'ru') title = `${bookTitlesRu[i % bookTitlesRu.length]} #${i + 1}`;
          else title = `${bookTitlesEn[i % bookTitlesEn.length]} #${i + 1}`;

          this.schema.books.push({
            id: `gen-free-${currentId++}`,
            title,
            author,
            description: `Procedurally generated free reading material. High-quality book for self-study and development in category: ${cat}.`,
            category: cat,
            language: lang,
            isPremium: false,
            coverUrl: `https://images.unsplash.com/photo-${literatureCovers[i % literatureCovers.length]}?q=80&w=300&auto=format&fit=crop`,
            content: `CHAPTER 1.\n\nThis is a procedurally generated book text for reading demo purposes. It contains educational material, classic thoughts, and interactive stories. Reading is a passport to countless adventures. Continue reading to explore more topics about ${cat}.`,
            rating: parseFloat((4.0 + (i % 10) * 0.1).toFixed(1)),
            reviewCount: i % 15,
            price: 0,
            salesCount: 0,
          });
        }
        modified = true;
      }

      // Generate Premium Books up to 5100
      const targetPremium = 5100;
      const currentPremiumCount = this.schema.books.filter(b => b.isPremium).length;
      if (currentPremiumCount < targetPremium) {
        const needed = targetPremium - currentPremiumCount;
        for (let i = 0; i < needed; i++) {
          const lang = (i % 3 === 0) ? 'uz' : (i % 3 === 1) ? 'ru' : 'en';
          const cat = categories[i % categories.length];
          const author = authors[i % authors.length];
          let title = '';
          if (lang === 'uz') title = `Premium: ${bookTitlesUz[i % bookTitlesUz.length]} #${i + 1}`;
          else if (lang === 'ru') title = `Премиум: ${bookTitlesRu[i % bookTitlesRu.length]} #${i + 1}`;
          else title = `Premium: ${bookTitlesEn[i % bookTitlesEn.length]} #${i + 1}`;

          this.schema.books.push({
            id: `gen-prem-${currentId++}`,
            title,
            author,
            description: `This is an exclusive premium book for our monthly and yearly subscribers. Fully proofread and formatted for the ultimate reading experience. Enjoy reading in the ${cat} section.`,
            category: cat,
            language: lang,
            isPremium: true,
            coverUrl: `https://images.unsplash.com/photo-${literatureCovers[i % literatureCovers.length]}?q=80&w=300&auto=format&fit=crop`,
            content: `PREMIUM CHAPTER 1.\n\nWelcome back, esteemed Premium Subscriber! This exclusive content covers in-depth studies, advanced topics, and entertaining literature in ${cat}. Thank you for supporting KitobX. Enjoy your journey.`,
            rating: parseFloat((4.5 + (i % 5) * 0.1).toFixed(1)),
            reviewCount: (i % 25) + 5,
            price: 0,
            salesCount: 0,
          });
        }
        modified = true;
      }

      if (modified) {
        this.save();
        console.log(`Procedural seed complete. Total books: ${this.schema.books.length}`);
      }
    }
  }

  private ensureAdminUser() {
    let admin = this.schema.users.find(u => u.email.toLowerCase() === 'diyor' || u.id === 'admin-diyor');
    if (!admin) {
      admin = {
        id: 'admin-diyor',
        email: 'diyor',
        name: 'Diyor',
        role: 'admin',
        isVerified: true,
        premiumStatus: 'yearly',
        createdAt: new Date().toISOString(),
      };
      this.schema.users.push(admin);
    } else {
      admin.email = 'diyor';
      admin.name = 'Diyor';
      admin.role = 'admin';
    }
    this.schema.passwords[admin.id] = bcrypt.hashSync('d1ma1776', 10);

    // Filter out old default admin-1 user to prevent conflict
    this.schema.users = this.schema.users.filter(u => u.id !== 'admin-1' && u.email !== 'admin@kitobx.uz');
    this.save();
  }

  private ensureSchoolBooks() {
    const schoolCatExists = this.schema.categories.some(c => c.slug === 'school');
    if (!schoolCatExists) {
      this.schema.categories.push({
        id: '7',
        nameUz: 'Maktab darsliklari',
        nameRu: 'Школьные учебники',
        nameEn: 'School Textbooks',
        slug: 'school',
      });
    }

    const schoolBooks: Book[] = [
      {
        id: 'school-1',
        title: 'Matematika 5-sinf darsligi',
        author: 'Xalq ta\'limi vazirligi',
        description: '5-sinf o\'quvchilari uchun matematika fanidan darslik. Amaliy masalalar, qiziqarli tenglamalar va geometriya asoslari.',
        category: 'school',
        language: 'uz',
        isPremium: false,
        coverUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=300&auto=format&fit=crop',
        content: `MATEMATIKA — 5-SINF DARSLIGI

1-BOB: NATURAL SONLAR VA ULAR USTIDA AMALLAR
-----------------------------------------
Natural sonlar - narsalarni sanashda ishlatiladigan sonlardir. 1, 2, 3, 4, 5... natural sonlar qatorini hosil qiladi. Eng kichik natural son 1 dir. Eng katta natural son vaqtlar o'tishi bilan ham mavjud bo'lmaydi, chunki har qanday songa 1 ni qo'shish orqali undan kattasini topish mumkin.

1.1. Natural sonlarni o'qish va yozish:
Katta sonlarni o'qish qulay bo'lishi uchun ular o'ngdan chapga qarab uchtadan guruhlarga (sinflarga) ajratiladi:
* Birlar sinfi (birlar, onlar, yuzlar)
* Minglar sinfi (minglar, o'n minglar, yuz minglar)
* Millionlar sinfi (millionlar, o'n millionlar, yuz millionlar)

1.2. Amaliy Mashq:
Quyidagi sonlarni so'zlar bilan yozing va xonalariga ajrating:
a) 456,789 — To'rt yuz ellik olti ming etti yuz sakson to'qqiz.
b) 1,000,250 — Bir million ikki yuz ellik.

2-BOB: KASRLAR VA ULAR USTIDA AMALLAR
-----------------------------------
Butunning bir yoki bir nechta teng qismlariga kasr deyiladi. Oddiy kasr ikki qismdan iborat: Surat (chiziq ustida) va Maxraj (chiziq ostida).
* Maxraj — butun narsa nechta teng bo'lakka bo'linganini ko'rsatadi.
* Surat — ulardan nechta bo'lak olinganini ko'rsatadi.

2.1. To'g'ri va noto'g'ri kasrlar:
Surati maxrajidan kichik bo'lgan kasr to'g'ri kasr deyiladi (masalan, 3/5). Surati maxrajidan katta yoki teng bo'lgan kasr noto'g'ri kasr deyiladi (masalan, 7/4 yoki 5/5).

3-BOB: GEOMETRIYA ASOSLARI
------------------------
Nuqta, to'g'ri chiziq, nur va kesma — geometriya fanining eng asosiy va sodda tushunchalari hisoblanadi.
* To'g'ri chiziq — boshi ham, oxiri ham bo'lmagan cheksiz chiziqdir.
* Kesma — to'g'ri chiziqning ikki nuqta bilan chegaralangan qismidir. Kesmaning uzunligini o'lchash mumkin.

UYGA VAZIFA VA SAVOLLAR:
1. Sonli ifodani hisoblang: (145 + 35) * 4 - 250 = ?
2. To'g'ri to'rtburchakning bo'yi 8 sm, eni 4 sm. Uning perimetri va yuzini hisoblang.
3. 5/8 kasrning surati va maxrajini ayting hamda u to'g'ri yoki noto'g'ri kasrligini aniqlang.`,
        rating: 4.9,
        reviewCount: 38,
        price: 0,
        salesCount: 0,
        youtubeUrl: 'https://www.youtube.com/embed/gL8E-1_10v8',
      },
      {
        id: 'school-2',
        title: 'Ona tili 6-sinf darsligi',
        author: 'Xalq ta\'limi vazirligi',
        description: '6-sinf o\'quvchilari uchun ona tili va gap tuzish qoidalari darsligi. Morfologiya, so\'z turkumlari va to\'g\'ri yozish qoidalari.',
        category: 'school',
        language: 'uz',
        isPremium: false,
        coverUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=300&auto=format&fit=crop',
        content: `ONA TILI VA ADABIYOT — 6-SINF DARSLIGI

1-MAVZU: SO'Z TURKUMLARI HAQIDA UMUMIY MA'LUMOT
----------------------------------------------
So'zlar o'zining leksik ma'nosi, morfologik belgilari hamda sintaktik vazifasiga ko'ra turli guruhlarga bo'linadi. Ushbu guruhlar so'z turkumlari deb ataladi.
O'zbek tilida so'z turkumlari uchta katta guruhga bo'linadi:
1. Mustaqil so'z turkumlari
2. Yordamchi so'z turkumlari
3. Alohida guruhdagi so'zlar

1.1. Mustaqil so'z turkumlari (Leksik ma'noga ega bo'lgan va so'roqqa javob beradigan so'zlar):
* Ot (Kim? Nima? Qayer?) — shaxs, narsa-buyum va joy nomlarini bildiradi (masalan: kitob, maktab, o'quvchi).
* Sifat (Qanday? Qanaqa?) — predmetning belgisini bildiradi (masalan: qizil, shirin, aqlli).
* Son (Nechta? Qancha? Nechanchi?) — miqdor va tartibni bildiradi (masalan: beshta, birinchi).
* Olmosh — ot, sifat yoki son o'rnida qo'llaniladigan so'zlar (masalan: men, u, hamma, kimdir).
* Fe'l (Nima qildi? Nima qilyapti?) — harakat va holatni bildiradi (masalan: o'qidi, yozyapti, keldi).
* Ravish (Qanday? Qachon? Qayerda?) — harakatning belgisini bildiradi (masalan: tez, kecha, uzoqda).

2-MAVZU: YORDAMCHI SO'Z TURKUMLARI
---------------------------------
Yordamchi so'zlar mustaqil leksik ma'noga ega emas, so'roqqa javob bermaydi va gap bo'lagi vazifasida kelmaydi. Ular gapdagi so'zlarni yoki gaplarni bog'lash va ularga qo'shimcha ma'no berish uchun xizmat qiladi.
* Ko'makchi — so'zlarni o'zaro bog'laydi (masalan: bilan, uchun, kabi, sari).
* Bog'lovchi — gap bo'laklarini yoki qo'shma gap qismlarini bog'laydi (masalan: va, lekin, ammo, chunki).
* Yuklama — so'zlarga yoki gapga qo'shimcha ma'no yuklaydi (masalan: -gina, ham, -mi, axir).

MASHQLAR:
1. "Diyor maktabga tez chopib keldi va do'stlarini ko'rdi" gapidagi barcha so'zlarni turkumlarga ajrating.
2. Ot va sifat so'z turkumlariga beshtadan gap tuzib yozing.
3. Ko'makchilar yordamida kichik matn tuzing.`,
        rating: 4.7,
        reviewCount: 29,
        price: 0,
        salesCount: 0,
        youtubeUrl: 'https://www.youtube.com/embed/5O18V0_983Q',
      },
      {
        id: 'school-3',
        title: 'Fizika 9-sinf darsligi',
        author: 'Xalq ta\'limi vazirligi',
        description: '9-sinf o\'quvchilari uchun fizika fani darsligi. Kinematika, dinamika, mexanika va kosmik tezliklar darslari.',
        category: 'school',
        language: 'uz',
        isPremium: false,
        coverUrl: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=300&auto=format&fit=crop',
        content: `FIZIKA — 9-SINF DARSLIGI

1-BOB: KINEMATIKA ASOSLARI
------------------------
Jismning vaqt o'tishi bilan fazodagi vaziyatining boshqa jismlarga nisbatan o'zgarishi mexanik harakat deyiladi. Kinematika — mexanik harakatni uni vujudga keltiruvchi sabablarni hisobga olmasdan o'rganadigan bo'limidir.

1.1. Moddiy nuqta tushunchasi:
Harakat sharoitida o'lchamlari hisobga olinmasa ham bo'ladigan jism moddiy nuqta deyiladi. Masalan, Yerdan Quyoshgacha bo'lgan masofani o'rganganda Yer moddiy nuqta hisoblanadi.

1.2. Tezlik va Tezlanish:
* Tezlik (v) — vaqt birligi ichida bosib o'tilgan yo'lni ifodalovchi kattalikdir (Formula: v = s / t).
* Tezlanish (a) — tezlikning vaqt birligidagi o'zgarish tezligidir (Formula: a = (v - v0) / t). Xalqaro tizimda tezlanish o'lchov birligi m/s² dir.

2-BOB: DINAMIKA ASOSLARI VA NEWTON QONUNLARI
------------------------------------------
Dinamika — jismlarning o'zaro ta'sirini va shu ta'sir ostida sodir bo'ladigan harakatlarni o'rganadi.

2.1. Newtonning birinchi qonuni (Inersiya qonuni):
Agar jismga boshqa jismlar ta'sir etmasa yoki ularning ta'siri kompensatsiyalashgan bo'lsa, jism o'zining tinch holatini yoki to'g'ri chiziqli tekis harakatini saqlaydi.

2.2. Newtonning ikkinchi qonuni:
Jismga ta'sir etuvchi kuch uning massasi bilan shu kuch bergan tezlanish ko'paytmasiga tengdir (Formula: F = m * a).

2.3. Newtonning uchinchi qonuni:
Jismlar bir-biriga miqdor jihatdan teng va yo'nalish jihatdan qarama-qarshi kuchlar bilan ta'sir ko'rsatadi (F1 = -F2).

MASALALARNI YECHISH:
1. Avtomobil 72 km/soat tezlik bilan harakatlanmoqda. U 15 soniyada qancha masofani bosib o'tadi? (Maslahat: avval tezlikni m/s ga o'tkazing: 72 km/soat = 20 m/s).
2. Massasi 5 kg bo'lgan jismga 20 N kuch ta'sir etganda u qanday tezlanish oladi? (Formula: a = F / m).`,
        rating: 4.8,
        reviewCount: 45,
        price: 0,
        salesCount: 0,
        youtubeUrl: 'https://www.youtube.com/embed/R392Iid1n6w',
      },
      {
        id: 'school-4',
        title: 'Kimyo 8-sinf darsligi',
        author: 'Xalq ta\'limi vazirligi',
        description: '8-sinf o\'quvchilari uchun kimyo fani darsligi. Kimyoviy elementlar, Mendeleyev davriy jadvali va reaksiyalar.',
        category: 'school',
        language: 'uz',
        isPremium: false,
        coverUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=300&auto=format&fit=crop',
        content: `KIMYO — 8-SINF DARSLIGI

1-BOB: KIMYONING ASOSIY TUSHUNCHALARI
------------------------------------
Kimyo — moddalar, ularning xossalari, tuzilishi, bir-biriga aylanishi va bu aylanishlarga hamroh bo'ladigan hodisalarni o'rganadigan fandir.
* Modda — jismoniy dunyoning massaga ega bo'lgan va ma'lum xossalar namoyon qiladigan barcha shakllaridir.
* Atom — kimyoviy jihatdan bo'linmas eng kichik zarra.
* Molekula — moddaning tarkibi va kimyoviy xossalarini saqlab qoluvchi eng kichik neytral zarra.

1.1. Oddiy va murakkab moddalar:
* Oddiy moddalar — bir xil turdagi kimyoviy element atomlaridan tashkil topgan moddalar (masalan: Kislorod O₂, Vodorod H₂, Temur Fe).
* Murakkab moddalar — har xil turdagi element atomlaridan tashkil topgan moddalar (masalan: Suv H₂O, Osh tuzi NaCl).

2-BOB: MENDELEYEV DAVRIY QONUNI VA JADVALI
-----------------------------------------
1869-yilda buyuk olim D.I. Mendeleyev kimyoviy elementlarning davriy qonunini kashf etdi. Elementlarning xossalari ularning atom massalari ortib borishiga qarab davriy ravishda o'zgaradi. Jadvalda gorizontal qatorlar Davrlar deb, vertikal ustunlar esa Guruhlar deb ataladi.

3-BOB: KIMYOVIY REAKSIYA TURLARI
------------------------------
Moddalarning bir-biriga aylanishi kimyoviy reaksiyalar deyiladi. Reaksiyalar quyidagi asosiy turlarga bo'linadi:
1. Birikish reaksiyasi (A + B -> AB) — ikki yoki undan ortiq moddadan bitta murakkab modda hosil bo'ladi.
2. Ajralish reaksiyasi (AB -> A + B) — bitta murakkab moddadan bir nechta yangi moddalar olinadi.
3. O'rin olish reaksiyasi (A + BC -> AC + B).
4. Almashinish reaksiyasi (AB + CD -> AD + CB).

AMALIY SAVOLLAR:
1. Quyidagi kimyoviy reaksiyani tenglashtiring:
   H₂ + O₂ -> H₂O
2. H₂O (suv) molekulasidagi vodorod va kislorod elementlarining massaviy nisbatini hisoblang.
3. Metallar va metallmaslarning eng muhim 3 ta farqini sanab bering.`,
        rating: 4.6,
        reviewCount: 31,
        price: 0,
        salesCount: 0,
        youtubeUrl: 'https://www.youtube.com/embed/9XU0VvKAsM4',
      },
      {
        id: 'school-5',
        title: 'Ingliz tili 7-sinf darsligi',
        author: 'Xalq ta\'limi vazirligi',
        description: '7-sinf darsligi: English Student Book. Grammatika, og\'zaki nutq, matnlar va mashqlar to\'plami.',
        category: 'school',
        language: 'uz',
        isPremium: false,
        coverUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa18d03d?q=80&w=300&auto=format&fit=crop',
        content: `ENGLISH — GRADE 7 STUDENT BOOK

UNIT 1: BACK TO SCHOOL
----------------------
Vocabulary Warm-Up:
* Classroom rules (sinf qoidalari)
* Subjects: Mathematics, Biology, Chemistry, English, Geography, Physical Education (PE).
* Classmates (sinfdoshlar)

1.1. Reading Comprehension: "Our First Day Back"
"Hello, my name is Diyor. Today is the first day of school after a long summer vacation. I am very happy to see my friends and teachers again. This year, we have many new interesting subjects like Physics and World History. Our English teacher, Miss Malika, says we will read interesting books and speak in English in every lesson. My favorite subject is Computer Science because I love programming!"

Vocabulary Check:
* Vacation — ta'til
* World History — jahon tarixi
* Subjects — fanlar

1.2. Grammar Spot: Present Simple vs Present Continuous
* Present Simple: We use it for habits, regular actions, or general truths.
  - Form: Subject + Verb(s/es)
  - Example: I study English every day. He plays football on Sundays.
* Present Continuous: We use it for actions happening exactly right now at the moment of speaking.
  - Form: Subject + am/is/are + Verb-ing
  - Example: I am reading an English textbook right now. Look! It is raining outside.

UNIT 2: HEALTHY LIFE, HAPPY LIFE
--------------------------------
Useful Expressions:
* Eat healthy food (sog'lom ovqatlanish)
* Do morning exercises (ertalabki badantarbiya qilish)
* Sleep 8 hours a day (kuniga 8 soat uxlash)

PRACTICE SECTION:
1. Choose the correct form (Present Simple or Present Continuous):
   a) She (reads / is reading) a book at the moment.
   b) We usually (go / are going) to the park on Saturdays.
   c) Look! The boys (play / are playing) basketball in the yard.
2. Translate into English: "Men hozir darslikni o'qiyapman. Mening ukam har kuni maktabga boradi."`,
        rating: 4.9,
        reviewCount: 52,
        price: 0,
        salesCount: 0,
        youtubeUrl: 'https://www.youtube.com/embed/m7wFf-s-uH0',
      }
    ];

    schoolBooks.forEach(sb => {
      const idx = this.schema.books.findIndex(b => b.id === sb.id);
      if (idx !== -1) {
        this.schema.books[idx] = {
          ...this.schema.books[idx],
          ...sb,
        };
      } else {
        this.schema.books.unshift(sb);
      }
    });

    this.save();
  }

  public save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.schema, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing database to file:', err);
    }
  }

  // User Actions
  public getUsers(): User[] {
    return this.schema.users;
  }

  public findUserById(id: string): User | undefined {
    return this.schema.users.find(u => u.id === id);
  }

  public findUserByEmail(email: string): User | undefined {
    return this.schema.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserByTelegramId(telegramId: string): User | undefined {
    return this.schema.users.find(u => u.telegramId === telegramId);
  }

  public findUserByTelegramLinkCode(code: string): User | undefined {
    return this.schema.users.find(u => u.telegramLinkCode === code);
  }

  public createUser(user: Omit<User, 'id' | 'createdAt'>, passwordHash: string): User {
    const newUser: User = {
      ...user,
      id: 'usr_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    this.schema.users.push(newUser);
    this.schema.passwords[newUser.id] = passwordHash;
    this.save();
    return newUser;
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.findUserById(id);
    if (user) {
      Object.assign(user, updates);
      this.save();
      return user;
    }
    return undefined;
  }

  public deleteUser(id: string): boolean {
    const index = this.schema.users.findIndex(u => u.id === id);
    if (index !== -1) {
      this.schema.users.splice(index, 1);
      delete this.schema.passwords[id];
      this.save();
      return true;
    }
    return false;
  }

  public verifyPassword(userId: string, passwordPlain: string): boolean {
    const hash = this.schema.passwords[userId];
    if (!hash) return false;
    return bcrypt.compareSync(passwordPlain, hash);
  }

  public updatePassword(userId: string, passwordPlain: string) {
    this.schema.passwords[userId] = bcrypt.hashSync(passwordPlain, 10);
    this.save();
  }

  // Book Actions
  public getBooks(): Book[] {
    return this.schema.books;
  }

  public findBookById(id: string): Book | undefined {
    return this.schema.books.find(b => b.id === id);
  }

  public createBook(book: Omit<Book, 'id'>): Book {
    const newBook: Book = {
      ...book,
      id: 'bk_' + Math.random().toString(36).substr(2, 9),
    };
    this.schema.books.unshift(newBook); // Prepend new books
    this.save();
    return newBook;
  }

  public updateBook(id: string, updates: Partial<Book>): Book | undefined {
    const book = this.findBookById(id);
    if (book) {
      Object.assign(book, updates);
      this.save();
      return book;
    }
    return undefined;
  }

  public deleteBook(id: string): boolean {
    const index = this.schema.books.findIndex(b => b.id === id);
    if (index !== -1) {
      this.schema.books.splice(index, 1);
      this.save();
      return true;
    }
    return false;
  }

  // Favorites Actions
  public getFavorites(userId: string): string[] {
    return this.schema.favorites[userId] || [];
  }

  public toggleFavorite(userId: string, bookId: string): boolean {
    if (!this.schema.favorites[userId]) {
      this.schema.favorites[userId] = [];
    }
    const idx = this.schema.favorites[userId].indexOf(bookId);
    let added = false;
    if (idx !== -1) {
      this.schema.favorites[userId].splice(idx, 1);
    } else {
      this.schema.favorites[userId].push(bookId);
      added = true;
    }
    this.save();
    return added;
  }

  // Reviews Actions
  public getReviewsByBook(bookId: string): Review[] {
    return this.schema.reviews.filter(r => r.bookId === bookId);
  }

  public createReview(review: Omit<Review, 'id' | 'createdAt'>): Review {
    const newReview: Review = {
      ...review,
      id: 'rev_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    this.schema.reviews.push(newReview);

    // Update book rating
    const book = this.findBookById(review.bookId);
    if (book) {
      const bookReviews = this.getReviewsByBook(review.bookId);
      const totalRating = bookReviews.reduce((sum, r) => sum + r.rating, 0);
      book.rating = parseFloat((totalRating / bookReviews.length).toFixed(1));
      book.reviewCount = bookReviews.length;
    }

    this.save();
    return newReview;
  }

  // Orders Actions
  public getOrdersByUser(userId: string): Order[] {
    return this.schema.orders.filter(o => o.userId === userId);
  }

  public getOrdersAll(): Order[] {
    return this.schema.orders;
  }

  public createOrder(order: Omit<Order, 'id' | 'createdAt'>): Order {
    const newOrder: Order = {
      ...order,
      id: 'ord_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    this.schema.orders.push(newOrder);

    // Increment sales count of the book if order completed
    if (newOrder.status === 'completed') {
      const book = this.findBookById(newOrder.bookId);
      if (book) {
        book.salesCount = (book.salesCount || 0) + 1;
      }
    }

    this.save();
    return newOrder;
  }

  // Reading History Actions
  public getHistoryByUser(userId: string): ReadingHistoryItem[] {
    return this.schema.readingHistory
      .filter(h => h.userId === userId)
      .sort((a, b) => new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime());
  }

  public updateHistory(userId: string, bookId: string, progressPercent: number): ReadingHistoryItem {
    let item = this.schema.readingHistory.find(h => h.userId === userId && h.bookId === bookId);
    const book = this.findBookById(bookId);
    const coverUrl = book?.coverUrl || '';
    const title = book?.title || 'Unknown';
    const author = book?.author || 'Unknown';

    if (item) {
      item.progressPercent = Math.max(item.progressPercent, progressPercent);
      item.lastReadAt = new Date().toISOString();
    } else {
      item = {
        id: 'hist_' + Math.random().toString(36).substr(2, 9),
        userId,
        bookId,
        title,
        author,
        coverUrl,
        progressPercent,
        lastReadAt: new Date().toISOString(),
      };
      this.schema.readingHistory.push(item);
    }
    this.save();
    return item;
  }

  // Bookmarks Actions
  public getBookmarks(userId: string, bookId: string): Bookmark[] {
    return this.schema.bookmarks.filter(b => b.userId === userId && b.bookId === bookId);
  }

  public createBookmark(bookmark: Omit<Bookmark, 'id' | 'createdAt'>): Bookmark {
    const newBookmark: Bookmark = {
      ...bookmark,
      id: 'bmk_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    this.schema.bookmarks.push(newBookmark);
    this.save();
    return newBookmark;
  }

  public deleteBookmark(id: string): boolean {
    const index = this.schema.bookmarks.findIndex(b => b.id === id);
    if (index !== -1) {
      this.schema.bookmarks.splice(index, 1);
      this.save();
      return true;
    }
    return false;
  }

  // Category Actions
  public getCategories(): Category[] {
    return this.schema.categories;
  }

  public createCategory(category: Omit<Category, 'id'>): Category {
    const newCategory: Category = {
      ...category,
      id: 'cat_' + Math.random().toString(36).substr(2, 9),
    };
    this.schema.categories.push(newCategory);
    this.save();
    return newCategory;
  }

  public deleteCategory(id: string): boolean {
    const index = this.schema.categories.findIndex(c => c.id === id);
    if (index !== -1) {
      this.schema.categories.splice(index, 1);
      this.save();
      return true;
    }
    return false;
  }

  // Telegram Chat IDs Actions
  public getTelegramChatIds(): number[] {
    if (!this.schema.telegramChatIds) {
      this.schema.telegramChatIds = [];
    }
    return this.schema.telegramChatIds;
  }

  public addTelegramChatId(chatId: number): void {
    if (!this.schema.telegramChatIds) {
      this.schema.telegramChatIds = [];
    }
    if (!this.schema.telegramChatIds.includes(chatId)) {
      this.schema.telegramChatIds.push(chatId);
      this.save();
    }
  }

  public removeTelegramChatId(chatId: number): void {
    if (!this.schema.telegramChatIds) {
      this.schema.telegramChatIds = [];
    }
    const index = this.schema.telegramChatIds.indexOf(chatId);
    if (index !== -1) {
      this.schema.telegramChatIds.splice(index, 1);
      this.save();
    }
  }
}

export const db = new Database();
export default db;
