import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  icons: { icon: '/favicon.svg' },
  title: 'Mac mini · Inside｜3D 拆解探索',
  description:
    '旋转、拆解、逐层了解 2024 款 M4 Mac mini。本地交互式 3D 结构教学模型。',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
