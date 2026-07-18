<script setup>
import { useRouter } from "vue-router";
const router = useRouter();
</script>

<template>
  <main class="landing">
    <section class="hero">
      <h1 class="logo">Vibe<span class="amp">&</span>You</h1>
      <p class="lede">
        Большие языковые модели насчитывают триллионы параметров —<br />
        но всё ещё путаются в счёте букв слова «strawberry».
      </p>
      <button class="cta" @click="router.push('/profile')">
        Начать изучать <span class="arrow">→</span>
      </button>
    </section>
    <footer class="contacts">
      <a href="mailto:hello@vibeandyou.dev">hello@vibeandyou.dev</a>
    </footer>
  </main>
</template>

<style scoped>
.landing {
  height: 100dvh;
  display: flex;
  flex-direction: column;
  padding: clamp(2rem, 6vh, 5rem) clamp(1.5rem, 8vw, 6rem);
}
.hero {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: 40rem;
}
.logo {
  font-size: clamp(3rem, 9vw, 6.5rem);
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1;
  margin-bottom: 2rem;
}
.logo .amp {
  color: var(--accent);
  margin: 0 0.05em;
}
.lede {
  font-size: clamp(1rem, 2.2vw, 1.35rem);
  color: var(--text-dim);
  line-height: 1.6;
  margin-bottom: 2.5rem;
  max-width: 32rem;
}
.cta {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  background: var(--accent);
  color: #1a1500;
  border: none;
  font: inherit;
  font-weight: 600;
  font-size: 1.05rem;
  padding: 0.9rem 1.6rem;
  border-radius: 999px;
  cursor: pointer;
  transition: transform 0.15s ease, opacity 0.15s ease;
}
.cta:hover {
  transform: translateY(-2px);
  opacity: 0.92;
}
.cta .arrow {
  transition: transform 0.15s ease;
}
.cta:hover .arrow {
  transform: translateX(3px);
}
.contacts {
  display: flex;
  justify-content: flex-start;
  color: var(--text-dim);
  font-size: 0.9rem;
}
.contacts a {
  transition: color 0.15s ease;
}
.contacts a:hover {
  color: var(--accent);
}
</style>
