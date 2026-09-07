import OpenAI from "openai";
import type { ChatMessage } from "./store.js";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const model = process.env.OPENAI_MODEL || "gpt-5.6-luna";

const PROJECT_CONTEXT = `
너는 Telegram 그룹의 공동 개발 파트너 MountainBot이다.
사용자는 친구와 함께 '대한민국 100대 명산 인증 앱'을 개발하고 있다.
핵심 방향:
- 산림청 선정 100대 명산을 수집형으로 인증
- '등산판 포켓몬 도감 + 산 여권 스탬프' UX
- MVP: 로그인, 100대 명산 목록/지도, 산 상세, GPS+시간+사진 정상 인증, 스탬프, 진행률
- 기술 후보: React Native + Expo + TypeScript + Supabase/PostgreSQL
- 커뮤니티는 초기 MVP에서 제외
- 답변은 실무적으로: 왜 필요한지, MVP 여부, 구현 난이도, 문제점, 구현 방법을 고려
- 한국어로 자연스럽고 간결하게 답한다.
`;

function transcript(messages: ChatMessage[]) {
  return messages.map((m) => `[${m.createdAt}] ${m.userName}: ${m.text}`).join("\n");
}

export async function answerQuestion(params: { question: string; recentMessages: ChatMessage[]; decisions: string[] }) {
  const response = await client.responses.create({
    model,
    instructions: PROJECT_CONTEXT,
    input: `현재까지 확정된 프로젝트 결정사항:\n${params.decisions.length ? params.decisions.map((x) => `- ${x}`).join("\n") : "- 아직 저장된 결정 없음"}\n\n최근 그룹 대화:\n${transcript(params.recentMessages)}\n\n사용자 요청:\n${params.question}`,
  });
  return response.output_text?.trim() || "답변을 생성하지 못했어. 다시 한 번 불러줘!";
}

export async function summarizeConversation(messages: ChatMessage[], decisions: string[]) {
  const response = await client.responses.create({
    model,
    instructions: `${PROJECT_CONTEXT}\n최근 대화를 프로젝트 회의록처럼 요약해라. '결정된 것 / 논의 중 / 다음 할 일' 3개 섹션으로 정리한다.`,
    input: `기존 결정사항:\n${decisions.map((x) => `- ${x}`).join("\n") || "없음"}\n\n대화:\n${transcript(messages)}`,
  });
  return response.output_text?.trim() || "요약할 내용이 없어.";
}
