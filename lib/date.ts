export function getTodayJST(): string {
  return new Date().toLocaleDateString('sv', { timeZone: 'Asia/Tokyo' });
}

export function getUrgentDays(): string[] {
  const todayStr = getTodayJST();
  const today = new Date(`${todayStr}T00:00:00+09:00`);
  const days: string[] = [];
  for (let i = 0; i < 4; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    days.push(`${mm}/${dd}`);
  }
  return days;
}
