'use client';

import { useRouter } from 'next/navigation';
import type { Store } from '@/lib/permissions';

type Props = {
  stores: Store[];
  currentStoreId: number;
  storeName: string;
};

export default function ShopHeader({ stores, currentStoreId, storeName }: Props) {
  const router = useRouter();

  return (
    <div className="mb-8">
      {stores.length > 1 && (
        <div className="mb-3">
          <select
            value={currentStoreId}
            onChange={(e) => router.push(`/shop/${e.target.value}`)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
          >
            {stores.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}
      <h1 className="text-2xl font-bold text-gray-800">
        {storeName} シフトマイナス管理
      </h1>
    </div>
  );
}
