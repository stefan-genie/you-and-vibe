<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { findTask } from "../tasks/tasks.config";
import TaskShell from "../components/TaskShell.vue";
import StaticInfoBlock from "../components/StaticInfoBlock.vue";
import ComparisonBlock from "../components/ComparisonBlock.vue";
import FakeChatBlock from "../components/FakeChatBlock.vue";
import RealChatBlock from "../components/RealChatBlock.vue";

const route = useRoute();
const task = computed(() => findTask(route.params.id));
</script>

<template>
  <div v-if="!task">
    <main class="missing">
      <p>Задание не найдено.</p>
      <RouterLink to="/profile" class="back">← К списку заданий</RouterLink>
    </main>
  </div>
  <TaskShell v-else :task="task" #default="{ pass }">
    <StaticInfoBlock
      v-if="task.type === 'static'"
      :content="task.content"
      :pass="pass"
    />
    <ComparisonBlock
      v-else-if="task.type === 'comparison'"
      :content="task.content"
      :pass="pass"
    />
    <FakeChatBlock
      v-else-if="task.type === 'fakeChat'"
      :content="task.content"
      :pass="pass"
    />
    <RealChatBlock
      v-else-if="task.type === 'realChat'"
      :content="task.content"
      :pass="pass"
    />
    <p v-else class="todo">Этот тип задания появится в следующих фазах.</p>
  </TaskShell>
</template>

<style scoped>
.missing {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: var(--text-dim);
}
.back {
  color: var(--accent);
}
.todo {
  color: var(--text-dim);
  font-size: 1rem;
}
</style>
