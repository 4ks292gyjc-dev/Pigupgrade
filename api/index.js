// 허브 API 한 파일: /api?a=register|login|score|rank
// 저장소: Upstash Redis REST (Vercel Marketplace 연동 시 자동 주입되는 환경변수 사용)
const crypto = require('crypto');

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOK = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const SECRET = process.env.HUB_SECRET; // 로그인 토큰 서명용 (필수)

const redis = async (...cmd) => {
  const r = await fetch(URL_, { method: 'POST', headers: { Authorization: `Bearer ${TOK}` }, body: JSON.stringify(cmd) });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
};

// 게임판: 이름 → 정렬 방향. jj-* = 클리어 시간(초, 낮을수록), pig = 최고 Day(높을수록)
const BOARDS = { 'jj-0': 'LT', 'jj-1': 'LT', 'jj-2': 'LT', 'jj-3': 'LT', 'jj-full': 'LT', 'jj-hard': 'LT', pig: 'GT' };
// shortcut: 점수는 클라이언트가 보내는 값을 믿고 범위만 검사한다; 부정행위가 문제되면 서버 검증 추가
const VALID = { LT: (v) => v >= 20 && v <= 36000, GT: (v) => Number.isInteger(v) && v >= 1 && v <= 500 };

const sign = (s) => crypto.createHmac('sha256', SECRET).update(s).digest('base64url');
const makeToken = (id) => { const p = `${id}.${Date.now() + 30 * 864e5}`; return `${p}.${sign(p)}`; };
const readToken = (t) => {
  const [id, exp, sig] = String(t || '').split('.');
  if (!sig || sig !== sign(`${id}.${exp}`) || +exp < Date.now()) return null;
  return id;
};
const hash = (pin, salt) => crypto.scryptSync(pin, salt, 32).toString('hex');
const idOk = (s) => typeof s === 'string' && /^[0-9A-Za-z가-힣_]{2,12}$/.test(s);
const pinOk = (s) => typeof s === 'string' && /^\d{4}$/.test(s);

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!URL_ || !TOK || !SECRET) return res.status(500).json({ error: '서버 설정(Redis, HUB_SECRET)이 없습니다' });
  try {
    const a = req.query.a;
    if (a === 'rank') {
      const board = req.query.board;
      if (!BOARDS[board]) return res.status(400).json({ error: '없는 게임판' });
      const rev = BOARDS[board] === 'GT' ? 'REV' : null;
      const flat = await redis('ZRANGE', `rank:${board}`, 0, 49, ...(rev ? [rev] : []), 'WITHSCORES');
      const rows = [];
      for (let i = 0; i < flat.length; i += 2) rows.push({ id: flat[i], score: +flat[i + 1] });
      return res.json({ rows });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST만 가능' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};

    if (a === 'register' || a === 'login') {
      const { id, pin } = body;
      if (!idOk(id)) return res.status(400).json({ error: '아이디는 2~12자 (한글·영문·숫자·_)' });
      if (!pinOk(pin)) return res.status(400).json({ error: '비밀번호는 숫자 4자리' });
      const key = `user:${id.toLowerCase()}`;
      if (a === 'register') {
        const salt = crypto.randomBytes(16).toString('hex');
        const ok = await redis('SET', key, JSON.stringify({ id, salt, h: hash(pin, salt) }), 'NX');
        if (!ok) return res.status(409).json({ error: '이미 있는 아이디' });
        return res.json({ token: makeToken(id), id });
      }
      // 4자리 PIN은 경우의 수가 1만 개뿐이라 아이디당 10분에 5번까지만 시도 허용
      const fails = +(await redis('GET', `fail:${key}`)) || 0;
      if (fails >= 5) return res.status(429).json({ error: '실패가 많아 10분간 잠겼습니다' });
      const raw = await redis('GET', key);
      const u = raw && JSON.parse(raw);
      const good = u && crypto.timingSafeEqual(Buffer.from(hash(pin, u.salt), 'hex'), Buffer.from(u.h, 'hex'));
      if (!good) {
        await redis('INCR', `fail:${key}`);
        await redis('EXPIRE', `fail:${key}`, 600);
        return res.status(401).json({ error: '아이디 또는 비밀번호가 틀렸습니다' });
      }
      await redis('DEL', `fail:${key}`);
      return res.json({ token: makeToken(u.id), id: u.id });
    }

    if (a === 'score') {
      const id = readToken(body.token);
      if (!id) return res.status(401).json({ error: '로그인이 필요합니다' });
      const { board, value } = body;
      const dir = BOARDS[board];
      if (!dir || typeof value !== 'number' || !VALID[dir](value)) return res.status(400).json({ error: '잘못된 점수' });
      // LT/GT: 기존 기록보다 나을 때만 갱신
      await redis('ZADD', `rank:${board}`, dir, value, id);
      return res.json({ ok: true });
    }
    return res.status(404).json({ error: '없는 요청' });
  } catch (e) {
    return res.status(500).json({ error: '서버 오류' });
  }
};
