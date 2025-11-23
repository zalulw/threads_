import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";

const PATH = "./data/database.sqlite";

if (!fs.existsSync(path.dirname(PATH))) {
  fs.mkdirSync(path.dirname(PATH), { recursive: true });
}

const db = new Database(PATH);

function init() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      passHash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      recipient_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      parent_msg_id INTEGER,
      is_read INTEGER DEFAULT 0,
      FOREIGN KEY (sender_id) REFERENCES users(id),
      FOREIGN KEY (recipient_id) REFERENCES users(id),
      FOREIGN KEY (parent_msg_id) REFERENCES messages(id)
    );

    CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages (recipient_id);
    CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages (sender_id);
    CREATE INDEX IF NOT EXISTS idx_messages_parent_msg_id ON messages (parent_msg_id);
  `);
}

init();

function seed() {
  // Check if users exist
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) return;

  // Create users
  const users = [
    { username: 'alice', email: 'alice@example.com', password: 'password123' },
    { username: 'bob', email: 'bob@example.com', password: 'password123' },
    { username: 'charlie', email: 'charlie@example.com', password: 'password123' },
  ];

  for (const user of users) {
    const hash = bcrypt.hashSync(user.password, 10);
    db.prepare('INSERT INTO users (username, email, passHash) VALUES (?, ?, ?)').run(user.username, user.email, hash);
  }

  // Get user ids
  const alice = db.prepare('SELECT id FROM users WHERE username = ?').get('alice') as { id: number };
  const bob = db.prepare('SELECT id FROM users WHERE username = ?').get('bob') as { id: number };
  const charlie = db.prepare('SELECT id FROM users WHERE username = ?').get('charlie') as { id: number };

  // Create messages
  const messages = [
    { sender: alice.id, recipient: bob.id, content: 'Hello Bob!' },
    { sender: bob.id, recipient: alice.id, content: 'Hi Alice! How are you?' },
    { sender: alice.id, recipient: bob.id, content: 'I\'m good, thanks! What about you?' },
    { sender: charlie.id, recipient: alice.id, content: 'Hey Alice, long time no see!' },
    { sender: alice.id, recipient: charlie.id, content: 'Hi Charlie! Yes, it has been.' },
  ];

  for (const msg of messages) {
    db.prepare('INSERT INTO messages (sender_id, recipient_id, content) VALUES (?, ?, ?)').run(msg.sender, msg.recipient, msg.content);
  }

  // Create threaded messages
  const threadRoot = db.prepare('SELECT id FROM messages WHERE content = ?').get('Hello Bob!') as { id: number };
  db.prepare('INSERT INTO messages (sender_id, recipient_id, content, parent_msg_id) VALUES (?, ?, ?, ?)').run(bob.id, alice.id, 'This is a reply to your hello!', threadRoot.id);
  db.prepare('INSERT INTO messages (sender_id, recipient_id, content, parent_msg_id) VALUES (?, ?, ?, ?)').run(alice.id, bob.id, 'And this is a reply to the reply!', threadRoot.id);
}

seed();

//#region User Queries

const createUserStatement = db.prepare(`
    INSERT INTO users (username, email, passHash) VALUES (?, ?, ?);`);

function createUser(username: string, email: string, passHash: string) {
  const info = createUserStatement.run(username, email, passHash);
  return getUserById(info.lastInsertRowid as number);
}

const getUserByIdStatement = db.prepare(
  `SELECT id, username, email, created_at AS createdAt FROM users WHERE id = ?;`
);

function getUserById(id: number) {
  return getUserByIdStatement.get(id) || null;
}

const getUserByEmailStatement = db.prepare(
  `SELECT * FROM users WHERE email = ?;`
);
function getUserByEmail(email: string) {
  return getUserByEmailStatement.get(email) || null;
}

const findUserByUsernameStatement = db.prepare(
  `SELECT id, username, email, passHash, created_at AS createdAt FROM users WHERE username = ?;`
);

function findUserByUsername(username: string) {
  return findUserByUsernameStatement.get(username) || null;
}

const listUsersStatement = db.prepare(
  `SELECT id, username, email, created_at AS createdAt FROM users WHERE id != ?;`
);
function listUsers(excludeUserId: number | null = null) {
  const param = excludeUserId ?? -1;
  return listUsersStatement.all(param);
}

//#endregion User Queries

//#region Message Queries
const createMessageStatement = db.prepare(
  `INSERT INTO messages (sender_id, recipient_id, content, parent_msg_id) VALUES (@senderId, @recipientId, @content, @parentMsgId);`
);
function createMessage(
  senderId: number,
  recipientId: number,
  content: string,
  parentMsgId?: number | null
) {
  const info = createMessageStatement.run({
    senderId,
    recipientId,
    content,
    parentMsgId: parentMsgId ?? null,
  });
  return getMessageById(info.lastInsertRowid as number);
}

const getMessageByIdStatement = db.prepare(`
  SELECT m.id, m.sender_id AS senderId, m.recipient_id AS recipientId, m.content, m.created_at AS createdAt, m.parent_msg_id AS parentMsgId, m.is_read AS isRead, s.username AS senderUsername, r.username AS recipientUsername
  FROM messages m
  JOIN users s ON s.id = m.sender_id
  JOIN users r ON r.id = m.recipient_id
  WHERE m.id = ?
`);

function getMessageById(id: number) {
  return getMessageByIdStatement.get(id) || null;
}

const getMessagesForUserStatement =
  db.prepare(`SELECT m.id, m.sender_id AS senderId, m.recipient_id AS recipientId, m.content, m.created_at AS createdAt, m.parent_msg_id AS parentMsgId, m.is_read AS isRead, s.username AS senderUsername, r.username AS recipientUsername
  FROM messages m
  JOIN users s ON s.id = m.sender_id
  JOIN users r ON r.id = m.recipient_id
  WHERE m.sender_id = @userId OR m.recipient_id = @userId
  ORDER BY m.created_at DESC`);

function getMessagesForUser(userId: number) {
  return getMessagesForUserStatement.all({ userId });
}

//#endregion Message Queries

const getConversationStatement =
  db.prepare(`SELECT m.id, m.sender_id AS senderId, m.recipient_id AS recipientId, m.content, m.created_at AS createdAt, m.parent_msg_id AS parentMsgId, m.is_read AS isRead, s.username AS senderUsername, r.username AS recipientUsername
  FROM messages m
  JOIN users s ON s.id = m.sender_id
  JOIN users r ON r.id = m.recipient_id
  WHERE (m.sender_id = @a AND m.recipient_id = @b) OR (m.sender_id = @b AND m.recipient_id = @a)
  ORDER BY m.created_at ASC`);

function getConversation(userA: number, userB: number) {
  return getConversationStatement.all({ a: userA, b: userB });
}

const getThreadStatement =
  db.prepare(`WITH RECURSIVE thread_tree(id, sender_id, recipient_id, content, created_at, parent_msg_id, is_read) AS (SELECT id, sender_id, recipient_id, content, created_at, parent_msg_id, is_read FROM messages WHERE id = ?
    UNION ALL
    SELECT m.id, m.sender_id, m.recipient_id, m.content, m.created_at, m.parent_msg_id, m.is_read
    FROM messages m
    INNER JOIN thread_tree tt ON m.parent_msg_id = tt.id
  )
  SELECT tt.id, tt.sender_id AS senderId, tt.recipient_id AS recipientId, tt.content, tt.created_at AS createdAt, tt.parent_msg_id AS parentMsgId, tt.is_read AS isRead, s.username AS senderUsername, r.username AS recipientUsername
  FROM thread_tree tt
  JOIN users s ON s.id = tt.sender_id
  JOIN users r ON r.id = tt.recipient_id
  ORDER BY tt.created_at ASC`);

function getThread(rootMessageId: number) {
  return getThreadStatement.all(rootMessageId);
}

export {
  db,
  init,
  createUser,
  getUserById,
  getUserByEmail,
  findUserByUsername,
  listUsers,
  createMessage,
  getMessageById,
  getMessagesForUser,
  getConversation,
  getThread,
};
