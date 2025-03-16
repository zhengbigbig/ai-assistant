import { NextRequest, NextResponse } from 'next/server';

/**
 * 处理聊天请求的 API 路由
 * @param request 请求对象
 * @returns 响应对象
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;

    // 这里是示例响应，实际项目中应该连接到真实的 AI 服务
    const response = {
      id: Date.now().toString(),
      message: `收到消息: ${message}`,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Chat API 错误:', error);
    return NextResponse.json(
      { error: '处理请求时发生错误' },
      { status: 500 }
    );
  }
}

/**
 * 获取聊天历史的 API 路由
 * @returns 响应对象
 */
export async function GET() {
  try {
    // 这里是示例响应，实际项目中应该从数据库获取聊天历史
    const chatHistory = [
      {
        id: '1',
        message: '你好，有什么可以帮助你的？',
        timestamp: new Date().toISOString(),
        role: 'assistant',
      },
    ];

    return NextResponse.json(chatHistory);
  } catch (error) {
    console.error('获取聊天历史错误:', error);
    return NextResponse.json(
      { error: '获取聊天历史时发生错误' },
      { status: 500 }
    );
  }
}
