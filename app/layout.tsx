import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'シフトマイナス管理',
  description: 'Liaグループ シフトマイナス管理システム',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 text-gray-800">{children}</body>
    </html>
  );
}
