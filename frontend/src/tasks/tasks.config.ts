export type TaskType = "static" | "fakeChat" | "comparison" | "realChat" | "chatIde";
export type Difficulty = "easy" | "medium" | "hard";

export interface Task {
  id: string;
  type: TaskType;
  difficulty?: Difficulty;
  title: string;
  unlocksAfter: string | null;
  content: null;
}

export const tasks: Task[] = [
  { id: "intro-1", type: "static", title: "Что такое языковая модель", unlocksAfter: null, content: null },
  { id: "intro-2", type: "static", title: "Откуда берутся галлюцинации", unlocksAfter: "intro-1", content: null },
  { id: "intro-3", type: "comparison", title: "Человек против модели", unlocksAfter: "intro-2", content: null },
  { id: "t1", type: "fakeChat", difficulty: "easy", title: "Первый диалог с ИИ", unlocksAfter: "intro-3", content: null },
  { id: "t2", type: "static", difficulty: "easy", title: "Анатомия промпта", unlocksAfter: "t1", content: null },
  { id: "t3", type: "realChat", difficulty: "medium", title: "Живой разговор", unlocksAfter: "t2", content: null },
  { id: "t4", type: "comparison", difficulty: "medium", title: "Две модели, один вопрос", unlocksAfter: "t3", content: null },
  { id: "t5", type: "chatIde", difficulty: "hard", title: "IDE-ассистент: автодополнение", unlocksAfter: "t4", content: null },
  { id: "t6", type: "chatIde", difficulty: "hard", title: "Рефакторинг кода с ИИ", unlocksAfter: "t5", content: null },
];

export const roadmapStubs: string[] = [
  "Skills для агентов",
  "Multi-Agent Patterns",
  "RAG",
  "Reasoning Patterns",
  "Memory Management",
  "Prompt Chaining",
  "Self-Consistency",
];
