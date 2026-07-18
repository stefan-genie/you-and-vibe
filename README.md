# Vibe & You

Образовательная платформа, которая учит языковой грамотности через практику: пользователь проходит задания от простого чтения до живого диалога с ИИ и исполнения сгенерированного кода в sandbox. Сюжет — желе-кубик на архаичной планете осваивает ИИ-ассистентов.

## Быстрый старт

```bash
cp .env.example .env
# заполните AI_BASE_URL, AI_API_KEY, AI_MODEL в .env
mkdir -p /tmp/vibe-sandbox
docker compose up --build -d
```

Откройте `http://localhost:5173`.

### Переменные окружения (.env)

| Переменная | Назначение |
|------------|-----------|
| `AI_BASE_URL` | Базовый URL OpenAI-совместимого эндпоинта (без `/chat/completions`) |
| `AI_API_KEY` | Bearer-токен для авторизации |
| `AI_MODEL` | Имя модели для поля `model` в запросах |
| `PORT` | Порт backend (по умолчанию 3000) |
| `FRONTEND_ORIGIN` | Доп. CORS-origin (помимо localhost:5173) |
| `RUNNER_IMAGE` | Docker-образ sandbox (по умолчанию `sandbox-runner:latest`) |
| `JELLY_NETWORK` | Docker-сеть для sandbox (по умолчанию `jelly-net`) |
| `SANDBOX_TMP_BASE` | Общая temp-директория для кода (по умолчанию `/tmp/vibe-sandbox`) |

## Структура репозитория

```
frontend/          Vite + Vue 3 + Pinia + Vue Router
  src/tasks/       tasks.config.ts — реестр заданий и контент
  src/components/  TaskShell, StaticInfoBlock, ComparisonBlock,
                   FakeChatBlock, RealChatBlock, ChatIdeBlock,
                   AttemptsCounter, CongratulationsOverlay
backend/           Node.js + Express
  src/routes/      chat.js, judge.js, sandbox.js
  src/sandbox.js   Docker-based исполнение кода
  src/taskPrompts.js    System-промпты по taskId
  src/judgePrompts.js   Промпты-судьи для /api/judge
sandbox/
  jelly-service/   Flask fake-сервис (GET /jelly/status)
  runner-image/    Python 3.11 + requests для исполнения кода
docker-compose.yml backend + frontend + jelly-service + runner (build-only)
```

## Задания

9 заданий по нарастающей сложности: intro-1..3 (чтение, сравнение), t1 (демо-чат), t2 (чтение), t3 (живой чат + судья), t4 (декомпозиция), t5 (IDE: генерация кода), t6 (IDE: починка кода). Прогресс хранится в localStorage.

## Ограничения MVP

- Нет аккаунтов, прогресс хранится в localStorage одного браузера.
- Один пользователь одновременно (rate-limit 20 req/мин на процесс).
- Roadmap-темы (Skills, Multi-Agent, RAG и др.) не реализованы — показаны как заблокированные карточки.
- t4 не имеет интерактива — это статичные comparison-карточки.
- Sandbox исполняет только Python, только GET-запросы к jelly-service.

## Заметка для деплоя на Coolify

1. **Docker socket**: backend требует примонтированный `/var/run/docker.sock` (read-write) для запуска sibling-контейнеров sandbox. Без этого `/api/sandbox/run` вернёт ошибку.
2. **Сеть jelly-net**: должна быть создана с `internal: true`. Sandbox-контейнеры подключаются к ней, чтобы видеть jelly-service, но не хост/internet.
3. **Bind-mount `/tmp/vibe-sandbox`**: общая директория между хостом и backend для temp-файлов кода. Должна существовать на хосте и быть примонтированной в backend по тому же пути.
4. **Сборка runner**: `docker compose build runner` — образ собирается, но не запускается как сервис.
5. **HTTPS**: AI-эндпоинт должен быть доступен с backend-контейнера. Если self-hosted — убедитесь, что URL резолвится из Docker-сети.

## Известные проблемы

- **Конфликт имён сетей**: docker compose добавляет префикс проекта к именам сетей. В compose заданы явные `name:` (`jelly-net`, `vibe-default`), но при деплое в среду с другим project name это может потребовать ручной проверки.
- **highlight.js через CDN**: подсветка кода в ChatIdeBlock зависит от внешнего CDN. При offline-деплое нужно заменить на локальный bundle.
- **t3 судья не детерминирован**: одна и та же фраза может получить разные оценки между запусками — это особенность LLM, не баг.
- **Нет retry для /api/chat**: если upstream вернул 500, пользователь видит ошибку без возможности авто-повтора.
- **Sandbox не очищает orphan-контейнеры**: при краше backend mid-execution, `docker run --rm` контейнер может остаться висеть до истечения внутреннего timeout.
