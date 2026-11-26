// 게임 페이지에서 불러오는 공용 스크립트: 허브 복귀 버튼 + 점수 전송 (로그인했을 때만)
window.hubSubmit = (board, value) => {
  const token = localStorage.getItem('hub-token');
  if (!token) return;
  fetch('/api?a=score', { method: 'POST', body: JSON.stringify({ token, board, value }) }).catch(() => {});
};
{
  // 왼쪽 가장자리에 붙는 작은 탭. 게임마다 빈 자리가 달라서 <script data-top="..." data-land="bottom">으로 받는다
  const d = document.currentScript?.dataset || {};
  const st = document.createElement('style');
  st.textContent = `#hub-tab{position:fixed;left:env(safe-area-inset-left,0px);top:${d.top || '50%'};z-index:99999;font:700 13px/1 system-ui,sans-serif;color:#fff;background:#000a;padding:10px 10px 10px 8px;border-radius:0 14px 14px 0;text-decoration:none;opacity:.75;-webkit-tap-highlight-color:transparent}`
    // 가로 폰: 왼쪽 위·옆이 계기판으로 차 있으면, 두 엄지 조작 사이 아래 가운데로
    + (d.land === 'bottom' ? '@media (orientation:landscape) and (max-height:500px){#hub-tab{top:auto;left:50%;bottom:max(10px,env(safe-area-inset-bottom,0px));transform:translateX(-50%);border-radius:14px;padding:10px 12px}}' : '');
  const a = document.createElement('a');
  a.id = 'hub-tab'; a.href = '/'; a.textContent = '‹ 허브'; a.setAttribute('aria-label', '게임 허브로 돌아가기');
  document.addEventListener('DOMContentLoaded', () => { document.head.appendChild(st); document.body.appendChild(a); });
}
