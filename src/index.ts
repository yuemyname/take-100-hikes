import "dotenv/config";
import { Bot, Context } from "grammy";
import { addDecision, addMessage, clearChat, getDecisions, getRecentMessages } from "./store.js";
import { answerQuestion, summarizeConversation } from "./ai.js";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error("TELEGRAM_BOT_TOKEN is missing");
if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is missing");

const bot = new Bot(token);
const me = await bot.api.getMe();
const botUsername = me.username;
const botMention = `@${botUsername}`;

const adminIds = new Set((process.env.ADMIN_USER_IDS || "").split(",").map((x) => x.trim()).filter(Boolean).map(Number));

function displayName(ctx: Context) {
  const u = ctx.from;
  if (!u) return "Unknown";
  return [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username || String(u.id);
}
function isMentioned(text: string) { return text.toLowerCase().includes(botMention.toLowerCase()); }
function stripMention(text: string) { return text.replace(new RegExp(`@${botUsername}`, "ig"), "").trim(); }
function isReplyToBot(ctx: Context) { return ctx.message?.reply_to_message?.from?.id === me.id; }
async function sendLong(ctx: Context, text: string) {
  const chunks = text.match(/[\s\S]{1,3900}/g) ?? [text];
  for (const chunk of chunks) await ctx.reply(chunk);
}

bot.command("start", async (ctx) => {
  await ctx.reply(`🏔️ MountainBot 준비 완료!\n\n그룹에서는 ${botMention} 을 붙여 질문해줘.\n예) ${botMention} GPS 인증 구조 어떻게 잡을까?\n\n명령어\n/summary - 최근 대화 요약\n/decision <내용> - 결정사항 저장\n/decisions - 저장된 결정사항\n/reset - 이 그룹의 저장된 대화/결정 삭제`);
});

bot.command("summary", async (ctx) => {
  const messages = await getRecentMessages(ctx.chat.id, 80);
  const decisions = await getDecisions(ctx.chat.id);
  await ctx.replyWithChatAction("typing");
  await sendLong(ctx, await summarizeConversation(messages, decisions));
});

bot.command("decision", async (ctx) => {
  const text = ctx.message?.text?.replace(/^\/decision(?:@\w+)?\s*/i, "").trim();
  if (!text) return ctx.reply("사용법: /decision 인증 반경은 산별로 설정한다");
  await addDecision(ctx.chat.id, text);
  await ctx.reply(`✅ 결정사항 저장: ${text}`);
});

bot.command("decisions", async (ctx) => {
  const decisions = await getDecisions(ctx.chat.id);
  await ctx.reply(decisions.length ? `📌 결정사항\n${decisions.map((d, i) => `${i + 1}. ${d}`).join("\n")}` : "아직 저장된 결정사항이 없어.");
});

bot.command("reset", async (ctx) => {
  if (adminIds.size > 0 && (!ctx.from || !adminIds.has(ctx.from.id))) return ctx.reply("이 명령은 관리자만 사용할 수 있어.");
  await clearChat(ctx.chat.id);
  await ctx.reply("🧹 이 그룹에 저장된 MountainBot 메모리를 초기화했어.");
});

bot.on("message:text", async (ctx) => {
  const text = ctx.message.text;
  if (text.startsWith("/")) return;
  await addMessage(ctx.chat.id, { id: ctx.message.message_id, userId: ctx.from.id, userName: displayName(ctx), text, createdAt: new Date(ctx.message.date * 1000).toISOString() });
  const shouldAnswer = ctx.chat.type === "private" || isMentioned(text) || isReplyToBot(ctx);
  if (!shouldAnswer) return;
  const question = stripMention(text) || "최근 대화 흐름을 보고 답해줘.";
  const recentMessages = await getRecentMessages(ctx.chat.id, 50);
  const decisions = await getDecisions(ctx.chat.id);
  try {
    await ctx.replyWithChatAction("typing");
    await sendLong(ctx, await answerQuestion({ question, recentMessages, decisions }));
  } catch (error) {
    console.error(error);
    await ctx.reply("AI 호출 중 오류가 났어. 서버 로그와 API 키/요금 상태를 확인해줘.");
  }
});

bot.catch((err) => console.error("Bot error:", err.error));
console.log(`MountainBot started as ${botMention}`);
await bot.start();
