import { createRouter, createWebHistory } from "vue-router";
import Landing from "../views/Landing.vue";
import { hasAccessCode } from "../utils/access.js";

const routes = [
  { path: "/", component: Landing },
  { path: "/access", component: () => import("../views/AccessView.vue") },
  { path: "/profile", component: () => import("../views/Profile.vue"), meta: { requiresAccess: true } },
  { path: "/task/:id", component: () => import("../views/Task.vue"), meta: { requiresAccess: true } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  if (to.meta.requiresAccess && !hasAccessCode()) {
    return { path: "/access" };
  }
});

export default router;
