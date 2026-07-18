<script setup>
import { onMounted } from "vue";
import { setAccessCode } from "./utils/access.js";

onMounted(() => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  if (code) {
    setAccessCode(code);
    const url = window.location.pathname + window.location.hash;
    window.history.replaceState({}, document.title, url);
  }
});
</script>

<template>
  <router-view />
</template>
