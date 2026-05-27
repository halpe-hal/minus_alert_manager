'use client';

import { useState, useTransition } from 'react';
import { updateDeadline, notifyDeadline } from '@/app/actions/shop';
import { getTodayJST } from '@/lib/date';

type Props = {
  storeId: number;
  currentDeadline: string | null;
};

export default function DeadlineSection({ storeId, currentDeadline }: Props) {
  const today = getTodayJST();
  const [date, setDate] = useState(currentDeadline || today);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState('');

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleNotify = () => {
    if (!currentDeadline) return;
    if (!confirm('シフト提出締切日をLINEに通知しますか？')) return;
    startTransition(async () => {
      await notifyDeadline(storeId, currentDeadline);
      showMessage('締切日をLINEに通知しました');
    });
  };

  const handleUpdate = () => {
    startTransition(async () => {
      await updateDeadline(storeId, date);
      showMessage('提出締切を更新しました');
    });
  };

  return (
    <section className="mb-8">
      <h2 className="section-heading">現在のシフト提出締切日</h2>

      {currentDeadline ? (
        <div className="mb-4">
          <p className="text-lg font-bold text-gray-700 mb-3">
            現在の締切日：{currentDeadline.slice(5).replace('-', '/')}
          </p>
          <button
            onClick={handleNotify}
            disabled={isPending}
            className="btn-primary w-full"
          >
            締切日を通知する
          </button>
        </div>
      ) : (
        <p className="text-amber-600 font-medium mb-4">
          ⚠️ まだ提出締切が登録されていません。
        </p>
      )}

      <div className="flex gap-3 items-end mt-3">
        <div className="flex-1">
          <label className="block text-sm text-gray-600 mb-1">新しい提出締切日</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input-field w-full"
          />
        </div>
        <button
          onClick={handleUpdate}
          disabled={isPending}
          className="btn-primary"
        >
          更新
        </button>
      </div>

      {message && (
        <p className="mt-2 text-green-700 font-medium">{message}</p>
      )}
    </section>
  );
}
