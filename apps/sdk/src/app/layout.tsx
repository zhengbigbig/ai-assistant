import React from 'react';
import type { Metadata } from 'next';

/**
 * 网站元数据配置
 */
export const metadata: Metadata = {
  title: 'AI Assistant SDK',
  description: 'AI Assistant SDK 服务端 API',
};

/**
 * 根布局组件
 * 为所有页面提供通用布局结构
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
