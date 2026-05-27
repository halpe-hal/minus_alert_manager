'use client';

import { useState, useTransition } from 'react';
import { insertMinus } from '@/app/actions/shop';
import { getTodayJST } from '@/lib/date';
import type { LineGroup } from '@/lib/shop-config';

type Props = {
  storeId: number;
  groups: LineGroup[];
};

const HALF_HOUR_TIMES = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, '0');
  const m = i % 2 === 0 ? '00' : '30';
  return `${h}:${m}`;
});

export default function MinusForm({ storeId, groups }: Props) {
  const today = getTodayJST();

  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id ?? '');
  const selectedGroup = groups.find((g) => g.id === selectedGroupId) ?? groups[0];
  const categories = selectedGroup?.categories ?? [];

  const [category, setCategory] = useState(categories[0]?.category_name ?? '');
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('13:00');
  const [count, setCount] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);

  const handleGroupChange = (groupId: string) => {
    setSelectedGroupId(groupId);
    const g = groups.find((g) => g.id === groupId);
    setCategory(g?.categories[0]?.category_name ?? '');
  };

  const handleSubmit = () => {
    const d = new Date(`${date}T00:00:00+09:00`);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateDisplay = `${mm}/${dd}`;
    const timeRange = `${startTime}〜${endTime}`;

    startTransition(async () => {
      await insertMinus(storeId, selectedGroupId, category, dateDisplay, date, timeRange, count);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    });
  };

  return (
    <section className="mb-8">
      <h2 className="section-heading">マイナスの新規登録</h2>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-3">
        <div className="md:col-span-1">
          <label className="block text-sm text-gray-600 mb-1">グループ</label>
          <select
            value={selectedGroupId}
            onChange={(e) => handleGroupChange(e.target.value)}
            className="input-field w-full"
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.group_name}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-1">
          <label className="block text-sm text-gray-600 mb-1">カテゴリ</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input-field w-full"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.category_name}>{c.category_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">日付</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input-field w-full"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">開始</label>
          <select
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="input-field w-full"
          >
            {HALF_HOUR_TIMES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">終了</label>
          <select
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="input-field w-full"
          >
            {HALF_HOUR_TIMES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">人数</label>
          <select
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="input-field w-full"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n}人</option>
            ))}
          </select>
        </div>
      </div>

      <button onClick={handleSubmit} disabled={isPending} className="btn-primary w-full">
        {isPending ? '登録中...' : '登録'}
      </button>

      {success && <p className="mt-2 text-green-700 font-medium">登録しました！</p>}
    </section>
  );
}
