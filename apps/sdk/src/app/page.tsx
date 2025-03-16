import React from 'react';

/**
 * SDK 首页组件
 * 显示 SDK 服务的基本信息和状态
 */
export default function Home() {
  return (
    <div style={{
      padding: '2rem',
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1 style={{ color: '#1677ff' }}>AI Assistant SDK</h1>
      <p>SDK 服务已成功启动，可以通过以下 API 端点进行访问：</p>

      <div style={{
        background: '#f5f5f5',
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '1rem'
      }}>
        <h3>聊天 API</h3>
        <code>POST /api/chat</code>
        <p>发送消息到聊天 API</p>

        <h4>请求示例：</h4>
        <pre style={{ background: '#e6f4ff', padding: '0.5rem', overflowX: 'auto' }}>
          {JSON.stringify({ message: "你好，AI助手" }, null, 2)}
        </pre>

        <h4>响应示例：</h4>
        <pre style={{ background: '#e6f4ff', padding: '0.5rem', overflowX: 'auto' }}>
          {JSON.stringify({
            id: "1234567890",
            message: "收到消息: 你好，AI助手",
            timestamp: new Date().toISOString()
          }, null, 2)}
        </pre>
      </div>

      <div style={{
        background: '#f5f5f5',
        padding: '1rem',
        borderRadius: '8px'
      }}>
        <h3>获取聊天历史</h3>
        <code>GET /api/chat</code>
        <p>获取聊天历史记录</p>

        <h4>响应示例：</h4>
        <pre style={{ background: '#e6f4ff', padding: '0.5rem', overflowX: 'auto' }}>
          {JSON.stringify([
            {
              id: "1",
              message: "你好，有什么可以帮助你的？",
              timestamp: new Date().toISOString(),
              role: "assistant"
            }
          ], null, 2)}
        </pre>
      </div>

      <footer style={{ marginTop: '2rem', borderTop: '1px solid #eaeaea', paddingTop: '1rem' }}>
        <p>© {new Date().getFullYear()} AI Assistant SDK</p>
      </footer>
    </div>
  );
}
