import Database from '@tauri-apps/plugin-sql';

// SQLite persistence layer (tauri-plugin-sql).
// All functions are safe to call outside a Tauri runtime (e.g. plain browser
// dev server): they degrade to no-ops with a console.warn instead of throwing.

let dbPromise = null;

export function getDb() {
  if (!dbPromise) {
    dbPromise = Database.load('sqlite:maildev.db')
      .catch(err => {
        dbPromise = null;
        throw err;
      });
  }
  return dbPromise;
}

async function withDb(fn) {
  try {
    const db = await getDb();
    return await fn(db);
  } catch (err) {
    console.warn('[db] SQLite unavailable, skipping:', err);
    return null;
  }
}

// Force the database connection (also applies plugin migrations) at startup.
export async function initDb() {
  return getDb();
}

// ---------- Settings (single row, JSON blob) ----------

export async function loadSettings() {
  return withDb(async db => {
    const rows = await db.select('SELECT data FROM settings WHERE id = 1');
    return rows.length ? JSON.parse(rows[0].data) : null;
  });
}

export async function saveSettings(data) {
  return withDb(async db => {
    await db.execute(
      'INSERT INTO settings (id, data) VALUES (1, $1) ON CONFLICT(id) DO UPDATE SET data = excluded.data',
      [JSON.stringify(data)]
    );
  });
}

// ---------- Mails ----------

function rowToMail(row) {
  return {
    key: row.key,
    mime: row.mime,
    headers: JSON.parse(row.headers),
    text: row.text,
    html: row.html,
    from: row.from_addr,
    to: row.to_addr,
    message_id: row.message_id,
    subject: row.subject,
    x_priority: row.x_priority,
    attachments: JSON.parse(row.attachments),
    spam_score: row.spam_score,
    spam_rules: JSON.parse(row.spam_rules),
    seen: row.seen === 1,
  };
}

export async function loadMails() {
  return withDb(async db => {
    const rows = await db.select(
      'SELECT * FROM mails ORDER BY id ASC'
    );
    return rows.map(rowToMail);
  });
}

export async function insertMail(mail) {
  return withDb(async db => {
    await db.execute(
      `INSERT OR REPLACE INTO mails
        (key, mime, headers, text, html, from_addr, to_addr, message_id, subject, x_priority, attachments, spam_score, spam_rules, seen)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        mail.key,
        mail.mime || '',
        JSON.stringify(mail.headers || []),
        mail.text || '',
        mail.html || '',
        mail.from || '',
        mail.to || '',
        mail.message_id || '',
        mail.subject || '',
        mail.x_priority || '',
        JSON.stringify(mail.attachments || []),
        mail.spam_score || '',
        JSON.stringify(mail.spam_rules || []),
        mail.seen ? 1 : 0,
      ]
    );
  });
}

export async function deleteMail(key) {
  return withDb(async db => {
    await db.execute('DELETE FROM mails WHERE key = $1', [key]);
  });
}

export async function clearMails() {
  return withDb(async db => {
    await db.execute('DELETE FROM mails');
  });
}

export async function updateMailSeen(key) {
  return withDb(async db => {
    await db.execute('UPDATE mails SET seen = 1 WHERE key = $1', [key]);
  });
}

export async function updateMailSpam(key, spam_score, spam_rules) {
  return withDb(async db => {
    await db.execute(
      'UPDATE mails SET spam_score = $1, spam_rules = $2 WHERE key = $3',
      [spam_score || '', JSON.stringify(spam_rules || []), key]
    );
  });
}
