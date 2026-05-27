'use client';

import { useState, useTransition } from 'react';
import { updateMinus, notifyGroup } from '@/app/actions/shop';
import type { MinusRecord } from '@/lib/data';
import type { LineGroup } from '@/lib/shop-config';

type Props = {
  storeId: number;
  groups: LineGroup[];
  records: MinusRecord[];
};

export default function MinusGroups({ storeId, groups, records }: Props) {
  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id ?? '');
  const [filled, setFilled] = useState<Record<string, string>>({});
  const [notifyingGroup, setNotifyingGroup] = useState<string | null>(null);
  const [notifyMessage, setNotifyMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  const selectedGroup = groups.find((g) => g.id === selectedGroupId) ?? groups[0];
  const categoryColors: Record<string, string> = {};
  selectedGroup?.categories.forEach((c) => {
    categoryColors[c.category_name] = c.category_color;
  });
  const groupRecords = records.filter((r) => r.group_id === selectedGroupId);

  const handleApply = (id: string, currentCount: number) => {
    const filledCount = Number(filled[id] || 0);
    if (filledCount <= 0) return;
    startTransition(async () => {
      await updateMinus(storeId, id, currentCount - filledCount);
      setFilled((prev) => ({ ...prev, [id]: '' }));
    });
  };

  const handleNotify = () => {
    if (!selectedGroup) return;
    if (!confirm(`${selectedGroup.group_name}のマイナスを募集しますか？`)) return;
    setNotifyingGroup(selectedGroupId);
    startTransition(async () => {
      await notifyGroup(selectedGroupId);
      setNotifyingGroup(null);
      setNotifyMessage('通知を送信しました！');
      setTimeout(() => setNotifyMessage(''), 3000);
    });
  };

  return (
    <section>
      <h2 className="section-heading">現在募集中のマイナス日</h2>
      <select
        value={selectedGroupId}
        onChange={(e) => setSelectedGroupId(e.target.value)}
        className="input-field w-full mb-4"
      >
        {groups.map((g) => (
          <option key={g.id} value={g.id}>{g.group_name}</option>
        ))}
      </select>

      {groupRecords.length === 0 ? (
        <p className="text-gray-500 text-sm">現在募集中のマイナスはありません。</p>
      ) : (
        <>
          <div className="space-y-3 mb-3">
            {groupRecords.map((record) => (
              <div
                key={record.id}
                className="rounded-xl p-4"
                style={{ backgroundColor: categoryColors[record.category] || '#f5f5f5' }}
              >
                <h4 className="font-bold text-gray-800 mb-1">
                  {record.category}（{record.date_display}）
                </h4>
                <p className="text-gray-700 text-sm">時間帯: {record.time_range}</p>
                <p className="text-gray-700 text-base font-medium">
                  あと <strong className="text-lg">{record.minus_count}</strong> 人必要
                </p>

                <div className="mt-2 flex gap-2 items-center">
                  <input
                    type="number"
                    min={0}
                    max={record.minus_count}
                    value={filled[record.id] ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || (Number(val) >= 0 && Number(val) <= record.minus_count)) {
                        setFilled((prev) => ({ ...prev, [record.id]: val }));
                      }
                    }}
                    className="w-20 border-2 border-gray-400 rounded-lg px-3 py-3 bg-white text-xl text-center font-bold"
                  />
                  <span className="text-base text-gray-600">人埋まった</span>
                  {Number(filled[record.id] || 0) > 0 && (
                    <button
                      onClick={() => handleApply(record.id, record.minus_count)}
                      disabled={isPending}
                      className="bg-[#006a38] text-white px-5 py-3 rounded-lg text-base font-medium hover:bg-green-800 disabled:opacity-50"
                    >
                      反映
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleNotify}
            disabled={isPending || notifyingGroup === selectedGroupId}
            className="btn-primary w-full"
          >
            {notifyingGroup === selectedGroupId
              ? '送信中...'
              : `${selectedGroup?.group_name}マイナス募集通知を送る`}
          </button>

          {notifyMessage && (
            <p className="mt-2 text-green-700 font-medium text-sm">{notifyMessage}</p>
          )}
        </>
      )}
    </section>
  );
}
