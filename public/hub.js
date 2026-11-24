// 게임 페이지에서 불러오는 공용 스크립트: 허브 복귀 버튼 + 점수 전송 (로그인했을 때만)
window.hubSubmit = (board, value) => {
  const token = localStorage.getItem('hub-token');
  if (!token) return;
  fetch('/api?a=score', { method: 'POST', body: JSON.stringify({ token, board, value }) }).catch(() => {});
};
{
  const a = document.createElement('a');
  a.href = '/'; a.textContent = '← 허브';
  a.style.cssText = 'position:fixed;left:6px;bottom:6px;z-index:99999;font:700 12px sans-serif;color:#fff;background:#0007;padding:4px 8px;border-radius:12px;text-decoration:none;opacity:.6';
  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(a));
}
