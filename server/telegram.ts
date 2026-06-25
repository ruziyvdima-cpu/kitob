import db from './db';

const TELEGRAM_TOKEN = '8678738574:AAFgaIp_LXokwfZn4pP86qJ-XJ-F5Y4Mimo';
const BASE_URL = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

// Function to send a message to a single chatId
export async function sendMessage(chatId: number, text: string, parseMode: 'Markdown' | 'HTML' = 'HTML') {
  try {
    const response = await fetch(`${BASE_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: parseMode,
      }),
    });
    if (!response.ok) {
      const errText = await response.text();
      console.error(`Failed to send telegram message to ${chatId}:`, errText);
    }
  } catch (err) {
    console.error('Error sending Telegram message:', err);
  }
}

// Function to broadcast a message to all subscribed administrators/chats
export async function broadcastMessage(text: string, parseMode: 'Markdown' | 'HTML' = 'HTML') {
  const chatIds = db.getTelegramChatIds();
  if (!chatIds || chatIds.length === 0) {
    console.log('No Telegram chat IDs subscribed to receive notifications.');
    return;
  }
  console.log(`Broadcasting telegram message to ${chatIds.length} chats...`);
  await Promise.all(chatIds.map(chatId => sendMessage(chatId, text, parseMode)));
}

// Simple Telegram Long Polling Bot
let lastUpdateId = 0;
let isPolling = false;

export function startTelegramBot() {
  if (isPolling) return;
  isPolling = true;
  console.log('Telegram Bot service starting long polling...');
  pollUpdates();
}

async function pollUpdates() {
  while (isPolling) {
    try {
      const response = await fetch(`${BASE_URL}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`);
      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as any;
      if (data && data.ok && data.result) {
        for (const update of data.result) {
          lastUpdateId = update.update_id;
          if (update.message) {
            await handleTelegramMessage(update.message);
          }
        }
      }
    } catch (err) {
      console.error('Telegram polling error:', err);
      // Wait 5 seconds before retrying to prevent hot looping in case of network failures
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    // Small delay between polls
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

async function handleTelegramMessage(message: any) {
  const chatId = message.chat?.id;
  const text = message.text?.trim() || '';
  const fromName = message.from?.first_name || 'Foydalanuvchi';

  if (!chatId) return;

  if (text.startsWith('/start')) {
    db.addTelegramChatId(chatId);
    const welcome = `<b>Assalomu alaykum, ${fromName}!</b> 🌟

KitobX Telegram botiga muvaffaqiyatli ulandingiz.

Ushbu chat orqali KitobX tizimidagi yangi buyurtmalar, yangi foydalanuvchilar ro'yxatdan o'tishi va kitoblarga qoldirilgan yangi sharhlar haqida birinchi bo'lib bildirishnoma olasiz! 📚⚡️

<b>Mavjud buyruqlar:</b>
📊 /status - Saytning hozirgi holati va statistikasi
📚 /books - Eng so'nggi kitoblar ro'yxati
🛍️ /orders - Oxirgi buyurtmalar ro'yxati
❌ /stop - Bildirishnomalarni o'chirish`;
    await sendMessage(chatId, welcome);
  } else if (text.startsWith('/stop')) {
    db.removeTelegramChatId(chatId);
    await sendMessage(chatId, `<b>Siz muvaffaqiyatli ravishda bildirishnomalarni o'chirdingiz.</b> ❌\nAgar yana bog'lanishni xohlasangiz, /start buyrug'ini yuboring.`);
  } else if (text.startsWith('/status')) {
    const usersCount = db.getUsers().length;
    const booksCount = db.getBooks().length;
    const orders = db.getOrdersAll();
    const ordersCount = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.price || 0), 0);

    const statusText = `📊 <b>KitobX saytining holati va statistikasi:</b>

• <b>Jami foydalanuvchilar:</b> ${usersCount} ta
• <b>Jami kitoblar:</b> ${booksCount} ta
• <b>Jami sotuvlar (buyurtmalar):</b> ${ordersCount} ta
• <b>Umumiy tushum:</b> $${totalRevenue.toFixed(2)}`;
    await sendMessage(chatId, statusText);
  } else if (text.startsWith('/books')) {
    const books = db.getBooks().slice(0, 10);
    let booksText = `📚 <b>KitobX saytidagi eng so'nggi 10 ta kitob:</b>\n\n`;
    books.forEach((b, idx) => {
      const typeStr = b.price > 0 ? `$${b.price}` : (b.isPremium ? '💎 PREMIUM' : '🟢 BEPUL');
      booksText += `${idx + 1}. <b>${b.title}</b> - <i>${b.author}</i> (${typeStr})\n`;
    });
    await sendMessage(chatId, booksText);
  } else if (text.startsWith('/orders')) {
    const orders = db.getOrdersAll().slice(-5).reverse();
    if (orders.length === 0) {
      await sendMessage(chatId, `🛍️ <b>Hozircha buyurtmalar mavjud emas.</b>`);
    } else {
      let ordersText = `🛍️ <b>Oxirgi 5 ta buyurtma:</b>\n\n`;
      orders.forEach((o, idx) => {
        const user = db.findUserById(o.userId);
        const userName = user ? `${user.name} (${user.email})` : 'Noma\'lum xaridor';
        ordersText += `${idx + 1}. <b>${o.title}</b>\n   👤 Xaridor: ${userName}\n   💵 Narxi: $${o.price}\n   📅 Sana: ${new Date(o.createdAt).toLocaleString()}\n\n`;
      });
      await sendMessage(chatId, ordersText);
    }
  } else {
    // Default fallback
    const fallbackText = `Kechirasiz, men faqat belgilangan buyruqlarga javob bera olaman. 🤖

<b>Mavjud buyruqlar:</b>
📊 /status - Statistikani ko'rish
📚 /books - Kitoblarni ko'rish
🛍️ /orders - Oxirgi buyurtmalar
❌ /stop - Bildirishnomalardan chiqish`;
    await sendMessage(chatId, fallbackText);
  }
}
