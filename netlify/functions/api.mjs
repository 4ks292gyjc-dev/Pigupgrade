// Netlify 함수: api/index.js(Vercel식 req/res 핸들러)를 그대로 감싸서 /api 에 연결
import handler from '../../api/index.js';

export default async (req) => {
  const url = new URL(req.url);
  const r = { method: req.method, query: Object.fromEntries(url.searchParams), body: req.method === 'POST' ? await req.text() : undefined };
  return new Promise((resolve) => {
    let status = 200;
    const headers = { 'content-type': 'application/json; charset=utf-8' };
    const res = {
      setHeader: (k, v) => { headers[k] = v; },
      status(s) { status = s; return res; },
      json: (o) => resolve(new Response(JSON.stringify(o), { status, headers })),
    };
    handler(r, res);
  });
};

export const config = { path: '/api' };
