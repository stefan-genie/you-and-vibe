import { createRouter, createWebHistory } from "vue-router";
import Landing from "../views/Landing.vue";

const routes = [
  { path: "/", component: Landing },
  { path: "/profile", component: () => import("../views/Profile.vue") },
  { path: "/task/:id", component: () => import("../views/Task.vue") },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
