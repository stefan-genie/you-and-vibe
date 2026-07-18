<template>
  <main class="stub">
    <p class="tag">/ profile</p>
    <h1>Скоро</h1>
    <p class="note">TODO — фаза 4</p>
    <RouterLink to="/" class="back">← на главную</RouterLink>
  </main>
</template>

<style scoped>
.stub {
  height: 100dvh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 clamp(1.5rem, 8vw, 6rem);
  max-width: 40rem;
}
.tag {
  color: var(--text-dim);
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
}
.stub h1 {
  font-size: clamp(2.5rem, 6vw, 4rem);
  letter-spacing: -0.03em;
  margin-bottom: 0.75rem;
}
.note {
  color: var(--accent);
  font-size: 1.05rem;
  margin-bottom: 2rem;
}
.back {
  color: var(--text-dim);
  transition: color 0.15s ease;
}
.back:hover {
  color: var(--text);
}
</style>
