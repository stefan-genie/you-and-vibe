import { watch } from "vue";

export function persist(store, key) {
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      store.$patch(JSON.parse(saved));
    } catch {
      // corrupted entry — ignore and start fresh
    }
  }
  watch(
    () => store.$state,
    (state) => localStorage.setItem(key, JSON.stringify(state)),
    { deep: true }
  );
}
