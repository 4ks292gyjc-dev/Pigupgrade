# 게임 허브 (Vercel)

- `public/` 정적 사이트: 허브(`/`), 짭새의 모험(`/jjapbird/`), 돼지 강화하기(`/pig/`)
- `api/index.js` 서버리스 API: 가입·로그인(아이디+숫자 4자리)·점수·랭킹

## 배포
1. Vercel에서 이 저장소를 Import
2. Storage → Marketplace → **Upstash Redis** 연결 (환경변수 `KV_REST_API_URL`/`KV_REST_API_TOKEN` 자동 주입)
3. Settings → Environment Variables에 `HUB_SECRET` = 임의의 긴 문자열 추가 후 재배포
