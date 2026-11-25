# 게임 허브 (Netlify)

- `public/` 정적 사이트: 허브(`/`), 짭새의 모험(`/jjapbird/`), 돼지 강화하기(`/pig/`)
- `api/index.js` 가입·로그인(아이디+숫자 4자리)·점수·랭킹. `netlify/functions/api.mjs`가 이걸 `/api`에 연결

## 배포
1. [Upstash](https://console.upstash.com)에서 Redis DB 생성 → REST URL/TOKEN 복사
2. Netlify 환경변수: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `HUB_SECRET`(임의의 긴 문자열)
3. `npx netlify-cli deploy --prod`
