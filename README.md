# WorkFeed & Anonymous Emoji Timeline 🦹🥱🙅‍♂️🪦👍

회사에서도 눈치 보지 않고 안전하고 가볍게 속마음을 남길 수 있는 **익명 이모지 변환 타임라인 웹 애플리케이션**입니다.

## ✨ 핵심 기능

1. **3가지 입력 창**:
   - **FROM**: 닉네임 / 보내는 사람
   - **TO**: 대상 (예: @월요일회의, @옆자리PM)
   - **속마음/욕설 입력창**: 회사 스트레스, 분노, 하고 싶은 말을 자유롭게 입력
2. **Gemini AI 자동 이모지 변환**:
   - `[등록]` 버튼 클릭 시 원문 텍스트는 서버에 저장되지 않고, Gemini 2.5 Flash AI 모델이 맥락을 분석해 위트 있는 이모지 연쇄 스토크(`🦹🥱🙅‍♂️🪦👍`)로 변환하여 저장합니다.
   - API 키가 없는 환경에서는 한글 감정/욕설 룰 엔진이 자동 작동합니다.
3. **회사용 Minimal UI (Slack/Notion Style)**:
   - 다크 모드 / 라이트 모드 지원
   - 카드 이모지 마우스 호버 시 감정 뉘앙스 해독 툴팁 및 해독기 기능
   - 카드 이모지 복사 & 좋아요 공감 카운터
4. **경량 무한 스크롤 (IntersectionObserver)**:
   - 스크롤을 내릴 때마다 최신 메시지가 무한 페이징 로딩됩니다.
   - TO 대상 검색 필터링 지원

---

## 🛠️ 설정 및 실행

### 1. 환경 변수 세팅 (`.env`)

`.env` 파일에 발급받으신 Supabase 및 Gemini 키를 입력합니다:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_GEMINI_API_KEY=your-gemini-api-key
```

### 2. Supabase DB 구동

프로젝트 루트의 `supabase_schema.sql` 구문을 Supabase **SQL Editor**에 복사하여 실행하세요.

### 3. 로컬 개발 서버 구동

```bash
npm install
npm run dev
```
