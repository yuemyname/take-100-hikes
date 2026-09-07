# 🏔️ MountainBot

친구와 Telegram 그룹에서 앱을 같이 기획/개발하면서 필요할 때만 AI를 부르는 TypeScript 봇입니다.

## 동작 방식

- 그룹의 일반 메시지는 **기억만** 합니다.
- `@봇아이디 질문` 또는 봇 메시지에 답장할 때만 AI가 응답합니다.
- `/summary`로 최근 대화를 회의록 형태로 요약합니다.
- `/decision ...`으로 중요한 프로젝트 결정을 영구 메모리에 저장합니다.
- 저장 데이터는 로컬 `data/memory.json`에 기록됩니다.

> ⚠️ 그룹의 일반 대화까지 기억하게 하려면 Telegram BotFather에서 **Privacy Mode를 꺼야 합니다.**

## 1. Telegram 봇 만들기

1. Telegram에서 `@BotFather` 검색
2. `/newbot`
3. 봇 이름 입력: 예) `Mountain Dev Bot`
4. username 입력: 예) `my_mountain_dev_bot`
5. 발급된 Bot Token을 복사

### Privacy Mode 끄기

BotFather에서:

1. `/mybots`
2. 만든 봇 선택
3. **Bot Settings**
4. **Group Privacy**
5. **Turn off**

이미 그룹에 봇을 넣었다면 Privacy Mode 변경 후 **그룹에서 봇을 제거했다가 다시 추가**하는 것이 안전합니다.

## 2. OpenAI API Key 준비

OpenAI Platform에서 API key를 만든 뒤 환경변수에 넣습니다.

ChatGPT Plus 구독과 OpenAI API 과금은 별도입니다.

기본 모델은 `gpt-5.6-luna`입니다.

## 3. 실행

```bash
npm install
npm run build
npm run start:prod
```

필수 환경변수:

```env
TELEGRAM_BOT_TOKEN=텔레그램_봇_토큰
OPENAI_API_KEY=OpenAI_API_Key
OPENAI_MODEL=gpt-5.6-luna
```

## 명령어

```text
/start
/summary
/decision 인증 반경은 산별로 설정한다
/decisions
/reset
```

## 프로젝트 구조

```text
src/
  index.ts   Telegram bot / commands
  ai.ts      OpenAI Responses API
  store.ts   group memory

data/
  memory.json  # 런타임에 자동 생성
```

## 보안

- `.env`는 Git에 커밋하지 마세요.
- Telegram Bot Token이 노출되면 BotFather에서 즉시 재발급하세요.
- OpenAI API key도 공개 저장소에 올리지 마세요.
