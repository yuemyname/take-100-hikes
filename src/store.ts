import fs from "node:fs/promises";
import path from "node:path";

export type ChatMessage = {
  id: number;
  userId: number;
  userName: string;
  text: string;
  createdAt: string;
};

type ChatState = { messages: ChatMessage[]; decisions: string[] };
type Database = Record<string, ChatState>;

const DATA_FILE = path.resolve("data/memory.json");
const MAX_STORED_MESSAGES = 400;
let queue = Promise.resolve();

async function readDb(): Promise<Database> {
  try {
    return JSON.parse(await fs.readFile(DATA_FILE, "utf8")) as Database;
  } catch (error: any) {
    if (error?.code === "ENOENT") return {};
    throw error;
  }
}

async function writeDb(db: Database): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  const tmp = `${DATA_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, DATA_FILE);
}

function serialized<T>(fn: () => Promise<T>): Promise<T> {
  const next = queue.then(fn, fn);
  queue = next.then(() => undefined, () => undefined);
  return next;
}

export async function addMessage(chatId: number, message: ChatMessage) {
  return serialized(async () => {
    const db = await readDb();
    const key = String(chatId);
    db[key] ??= { messages: [], decisions: [] };
    db[key].messages.push(message);
    db[key].messages = db[key].messages.slice(-MAX_STORED_MESSAGES);
    await writeDb(db);
  });
}

export async function getRecentMessages(chatId: number, limit = 40) {
  const db = await readDb();
  return db[String(chatId)]?.messages.slice(-limit) ?? [];
}

export async function addDecision(chatId: number, decision: string) {
  return serialized(async () => {
    const db = await readDb();
    const key = String(chatId);
    db[key] ??= { messages: [], decisions: [] };
    if (!db[key].decisions.includes(decision)) db[key].decisions.push(decision);
    await writeDb(db);
  });
}

export async function getDecisions(chatId: number) {
  const db = await readDb();
  return db[String(chatId)]?.decisions ?? [];
}

export async function clearChat(chatId: number) {
  return serialized(async () => {
    const db = await readDb();
    delete db[String(chatId)];
    await writeDb(db);
  });
}
