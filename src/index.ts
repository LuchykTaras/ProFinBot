type BotEnv = {
  TELEGRAM_WEBHOOK_SECRET?: string;
};

type TelegramUpdate = {
  message?: {
    text?: string;
    chat?: { id?: number; type?: string };
  };
};

export default {
  async fetch(request: Request, env: BotEnv): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname === '/' && request.method === 'GET') {
      return new Response('ProFin Bot працює');
    }

    if (pathname !== '/telegram/webhook') {
      return new Response('Not Found', { status: 404 });
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: { Allow: 'POST' },
      });
    }

        const expectedSecret = env.TELEGRAM_WEBHOOK_SECRET;
    const receivedSecret = request.headers.get('X-Telegram-Bot-Api-Secret-Token');

    if (!expectedSecret || receivedSecret !== expectedSecret) {
      console.warn('webhook-auth', {
        secretConfigured: Boolean(expectedSecret),
        headerReceived: Boolean(receivedSecret),
        matchesAfterTrim: Boolean(
          expectedSecret && receivedSecret &&
          expectedSecret.trim() === receivedSecret.trim()
        ),
      });

      return new Response('Forbidden', { status: 403 });
    }

    let update: TelegramUpdate | null;
    try {
      update = (await request.json()) as TelegramUpdate | null;
    } catch {
      return new Response('Invalid JSON', { status: 400 });
    }

    const message = update?.message;
    const chat = message?.chat;
    const command = message?.text;

    if (chat?.type !== 'private' || !Number.isSafeInteger(chat.id) ||
        typeof command !== 'string' || !/^\/start(?:\s|$)/.test(command)) {
      return Response.json({ ok: true });
    }

    return Response.json({
      method: 'sendMessage',
      chat_id: chat.id,
      text: 'Вітаємо! Це тестовий бот ProFin.',
    });
  },
};
