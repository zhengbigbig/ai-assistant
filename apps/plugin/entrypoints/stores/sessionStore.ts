// apps/plugin/entrypoints/stores/sessionStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { localStorageAdapter } from './storage';
import dayjs from 'dayjs';
import { Message } from './chatStore';
import { v4 as uuidv4 } from 'uuid';

// 定义会话类型
export interface ChatSession {
  id: string;
  title: string;
  // 创建时间
  createdAt: number;
  // 最后更新时间
  updatedAt: number;
  // 消息列表
  messages: Message[];
}

// 会话状态
export interface SessionState {
  // 会话列表
  sessions: ChatSession[];
  // 当前活跃会话ID
  activeSessionId: string | null;
  // 搜索关键词
  searchKeyword: string;
  // 显示会话抽屉
  showSessionDrawer: boolean;

  // 操作方法
  setSessions: (sessions: ChatSession[]) => void;
  addSession: (session: ChatSession) => void;
  updateSession: (id: string, updates: Partial<ChatSession>) => void;
  removeSession: (id: string) => void;
  setActiveSessionId: (id: string | null) => void;
  setSearchKeyword: (keyword: string) => void;
  setShowSessionDrawer: (show: boolean) => void;
  toggleSessionDrawer: () => void;
  searchSessions: (keyword: string) => ChatSession[];
  getSessionsByDate: () => Record<string, ChatSession[]>;
  createNewSession: (title?: string) => string;
}

// 创建会话存储
export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSessionId: null,
      searchKeyword: '',
      showSessionDrawer: false,

      setSessions: (sessions) => set({ sessions }),
      addSession: (session) =>
        set((state) => ({ sessions: [...state.sessions, session] })),
      updateSession: (id, updates) =>
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === id ? { ...session, ...updates } : session
          ),
        })),
      removeSession: (id) =>
        set((state) => ({
          sessions: state.sessions.filter((session) => session.id !== id),
          activeSessionId: state.activeSessionId === id ? null : state.activeSessionId,
        })),
      setActiveSessionId: (id) => {
        set({ activeSessionId: id });
      },
      setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),
      setShowSessionDrawer: (show) => set({ showSessionDrawer: show }),
      toggleSessionDrawer: () => set((state) => ({ showSessionDrawer: !state.showSessionDrawer })),
      searchSessions: (keyword) => {
        const { sessions } = get();
        if (!keyword) return sessions;
        return sessions.filter(
          (session) => session.title.toLowerCase().includes(keyword.toLowerCase())
        );
      },
      getSessionsByDate: () => {
        const { sessions } = get();
        const groupedSessions: Record<string, ChatSession[]> = {};

        sessions.forEach((session) => {
          const date = dayjs(session.createdAt).format('YYYY-MM-DD');
          if (!groupedSessions[date]) {
            groupedSessions[date] = [];
          }
          groupedSessions[date].push(session);
        });

        // 对每个日期组内的会话按时间戳排序
        Object.keys(groupedSessions).forEach((date) => {
          groupedSessions[date].sort((a, b) => b.createdAt - a.createdAt);
        });

        return groupedSessions;
      },
      createNewSession: (title = '新会话') => {
        const now = Date.now();
        const newSession: ChatSession = {
          id: uuidv4(),
          title: `${title} ${dayjs(now).format('HH:mm:ss')}`,
          createdAt: now,
          updatedAt: now,
          messages: []
        };

        get().addSession(newSession);
        get().setActiveSessionId(newSession.id);
        return newSession.id;
      }
    }),
    {
      name: 'ai-assistant-sessions',
      storage: localStorageAdapter,
    }
  )
);

// 导出选择器
export const useSessions = () => useSessionStore((state) => state.sessions);
export const useActiveSessionId = () => useSessionStore((state) => state.activeSessionId);
export const useShowSessionDrawer = () => useSessionStore((state) => state.showSessionDrawer);
