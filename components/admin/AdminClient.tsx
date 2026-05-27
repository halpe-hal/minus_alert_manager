'use client';

import { useState, useTransition } from 'react';
import type { Store } from '@/lib/permissions';
import type { ShopConfig, LineGroup, LineGroupCategory } from '@/lib/shop-config';
import {
  updateStoreToken,
  upsertDeadlineConfig,
  addLineGroup,
  updateLineGroup,
  deleteLineGroup,
  addCategory,
  updateCategory,
  deleteCategory,
} from '@/app/actions/admin';

type Props = {
  stores: Store[];
  initialConfigs: ShopConfig[];
};

export default function AdminClient({ stores, initialConfigs }: Props) {
  const [selectedStoreId, setSelectedStoreId] = useState(stores[0]?.id ?? 0);
  const config = initialConfigs.find((c) => c.id === selectedStoreId);

  return (
    <div>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">店舗</label>
        <select
          value={selectedStoreId}
          onChange={(e) => setSelectedStoreId(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
        >
          {stores.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {config ? (
        <div key={selectedStoreId} className="space-y-8">
          <StoreTokenSection storeId={selectedStoreId} lineToken={config.line_token} />
          <DeadlineConfigSection storeId={selectedStoreId} deadlineConfig={config.deadlineConfig} />
          <LineGroupsSection storeId={selectedStoreId} groups={config.groups} />
        </div>
      ) : (
        <p className="text-gray-500 text-sm">この店舗の設定がまだありません。</p>
      )}
    </div>
  );
}

function StoreTokenSection({ storeId, lineToken }: { storeId: number; lineToken: string }) {
  const [token, setToken] = useState(lineToken);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleSave = () => {
    setError('');
    startTransition(async () => {
      try {
        await updateStoreToken(storeId, token);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (e) {
        setError(e instanceof Error ? e.message : '保存に失敗しました');
      }
    });
  };

  return (
    <section>
      <h2 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2">LINE Access Token</h2>
      <p className="text-xs text-gray-500 mb-3">店舗で使用するLINE BOTのアクセストークン（全グループ共通）</p>
      <div className="space-y-3">
        <Field label="LINE Access Token" value={token} onChange={setToken} />
        <SaveButton onClick={handleSave} isPending={isPending} saved={saved} />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </section>
  );
}

function DeadlineConfigSection({
  storeId,
  deadlineConfig,
}: {
  storeId: number;
  deadlineConfig: ShopConfig['deadlineConfig'];
}) {
  const [lineGroupId, setLineGroupId] = useState(deadlineConfig?.line_group_id ?? '');
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleSave = () => {
    setError('');
    startTransition(async () => {
      try {
        await upsertDeadlineConfig(storeId, lineGroupId);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (e) {
        setError(e instanceof Error ? e.message : '保存に失敗しました');
      }
    });
  };

  return (
    <section>
      <h2 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2">シフト提出締切通知</h2>
      <p className="text-xs text-gray-500 mb-3">連絡先はLINEグループ設定の「店長名」から自動生成されます</p>
      <div className="space-y-3">
        <Field label="LINE Group ID" value={lineGroupId} onChange={setLineGroupId} />
        <SaveButton onClick={handleSave} isPending={isPending} saved={saved} />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </section>
  );
}

function LineGroupsSection({ storeId, groups }: { storeId: number; groups: LineGroup[] }) {
  const [isPending, startTransition] = useTransition();

  const handleAddGroup = () => {
    startTransition(async () => {
      await addLineGroup(storeId, '新しいグループ', '', '', '', groups.length);
    });
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-3 border-b pb-2">
        <h2 className="text-lg font-bold text-gray-800">LINEグループ設定</h2>
        <button
          onClick={handleAddGroup}
          disabled={isPending}
          className="text-sm bg-[#006a38] text-white px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          + グループ追加
        </button>
      </div>
      <div className="space-y-6">
        {groups.map((group) => (
          <LineGroupItem key={group.id} group={group} />
        ))}
        {groups.length === 0 && (
          <p className="text-gray-500 text-sm">グループがありません。追加してください。</p>
        )}
      </div>
    </section>
  );
}

function LineGroupItem({ group }: { group: LineGroup }) {
  const [groupName, setGroupName] = useState(group.group_name);
  const [managerName, setManagerName] = useState(group.manager_name ?? '');
  const [tempManagerName, setTempManagerName] = useState(group.temp_manager_name ?? '');
  const [lineGroupId, setLineGroupId] = useState(group.line_group_id);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    startTransition(async () => {
      await updateLineGroup(group.id, groupName, managerName, tempManagerName, lineGroupId);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const handleDelete = () => {
    if (!confirm(`グループ「${groupName}」を削除しますか？\nカテゴリもすべて削除されます。`)) return;
    startTransition(async () => {
      await deleteLineGroup(group.id);
    });
  };

  const handleAddCategory = () => {
    startTransition(async () => {
      await addCategory(group.id, '新しいカテゴリ', '#ffffff', group.categories.length);
    });
  };

  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
      <div className="space-y-3 mb-4">
        <Field label="グループ名" value={groupName} onChange={setGroupName} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">店長名（締切通知に表示）</label>
          <input
            type="text"
            value={managerName}
            onChange={(e) => setManagerName(e.target.value)}
            disabled={!!tempManagerName}
            placeholder={tempManagerName ? '臨時店長が設定されています' : ''}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700 disabled:bg-gray-100 disabled:text-gray-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">臨時店長名（締切通知に表示）</label>
          <input
            type="text"
            value={tempManagerName}
            onChange={(e) => setTempManagerName(e.target.value)}
            disabled={!!managerName}
            placeholder={managerName ? '店長名が設定されています' : ''}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700 disabled:bg-gray-100 disabled:text-gray-400"
          />
        </div>
        <Field label="LINE Group ID" value={lineGroupId} onChange={setLineGroupId} />
        <div className="flex gap-2">
          <SaveButton onClick={handleSave} isPending={isPending} saved={saved} />
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="text-sm text-red-600 border border-red-300 px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50"
          >
            削除
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-700">カテゴリ</p>
          <button
            onClick={handleAddCategory}
            disabled={isPending}
            className="text-xs text-[#006a38] border border-green-700 px-2 py-1 rounded hover:bg-green-50 disabled:opacity-50"
          >
            + 追加
          </button>
        </div>
        <div className="space-y-2">
          {group.categories.map((cat) => (
            <CategoryItem key={cat.id} category={cat} />
          ))}
          {group.categories.length === 0 && (
            <p className="text-xs text-gray-400">カテゴリがありません</p>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryItem({ category }: { category: LineGroupCategory }) {
  const [name, setName] = useState(category.category_name);
  const [color, setColor] = useState(category.category_color);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      await updateCategory(category.id, name, color);
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteCategory(category.id);
    });
  };

  return (
    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
      <input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        className="w-8 h-8 rounded cursor-pointer border-0"
        title="カテゴリカラー"
      />
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1 text-sm border-0 bg-transparent focus:outline-none"
      />
      <button
        onClick={handleSave}
        disabled={isPending}
        className="text-xs text-[#006a38] hover:underline disabled:opacity-50"
      >
        保存
      </button>
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="text-xs text-red-500 hover:underline disabled:opacity-50"
      >
        削除
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
      />
    </div>
  );
}

function SaveButton({
  onClick,
  isPending,
  saved,
}: {
  onClick: () => void;
  isPending: boolean;
  saved: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={isPending}
      className="text-sm bg-[#006a38] text-white px-4 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50"
    >
      {saved ? '保存しました' : isPending ? '保存中...' : '保存'}
    </button>
  );
}
