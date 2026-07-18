import { defineStore } from "pinia";

export const useProgressStore = defineStore("progress", {
  state: () => ({
    completed: [],
    attempts: {},
    current: null,
  }),
});
