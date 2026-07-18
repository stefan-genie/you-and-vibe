import type { TaskType } from "./tasks.config";

export type SpriteState =
  | "landing"
  | "calm"
  | "happy"
  | "sad"
  | "sick"
  | "puzzled";

export type SpriteEvent = "pass" | "fail" | null;

const DEFAULT_BY_TYPE: Record<TaskType, SpriteState> = {
  static: "puzzled",
  comparison: "puzzled",
  fakeChat: "calm",
  realChat: "calm",
  chatIde: "calm",
};

const TASK_OVERRIDE: Record<string, SpriteState> = {
  t3: "sick",
};

export function spriteForTask(taskId: string, taskType: TaskType): SpriteState {
  return TASK_OVERRIDE[taskId] ?? DEFAULT_BY_TYPE[taskType] ?? "calm";
}

export function spriteForEvent(event: SpriteEvent, baseState: SpriteState): SpriteState {
  if (event === "pass") return "happy";
  if (event === "fail") return "sad";
  return baseState;
}
