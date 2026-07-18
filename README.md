# Vibe & You

A monorepo for the Vibe & You platform.

## Локальный запуск sandbox

Sandbox исполняет сгенерированный ИИ Python-код в изолированном Docker-контейнере
и проверяет, достиг ли он целевого HTTP-статуса на fake-сервисе `jelly-service`.

### Шаги ручной проверки

1. Соберите runner-image (один раз, запуска как сервиса не требует):

   ```bash
   docker compose build runner
   ```

2. Создайте общую temp-директорию для sandbox (bind-mount между хостом и backend):

   ```bash
   mkdir -p /tmp/vibe-sandbox
   ```

3. Поднимите backend и jelly-service:

   ```bash
   docker compose up -d backend jelly-service
   ```

4. Убедитесь, что jelly-service отвечает:

   ```bash
   curl http://localhost:8080/jelly/status
   # ожидается: {"energy":42,"status":"ok"}
   ```

5. Отправьте код в sandbox. Созданный ИИ код обязан последней строкой
   напечатать `RESULT_STATUS:<code>` — sandbox парсит это маркером результата:

   ```bash
   curl -X POST http://localhost:3000/api/sandbox/run \
     -H "content-type: application/json" \
     -d '{"code":"import requests\nr = requests.get(\"http://jelly-service:8080/jelly/status\")\nprint(f\"RESULT_STATUS:{r.status_code}\")"}'
   ```

   Ожидаемый ответ (код внутри контейнера обращается к jelly-service по имени
   хоста, т.к. sandbox-контейнер подключён к `jelly-net`):

   ```json
   {"passed":true,"statusCode":200,"stdout":"RESULT_STATUS:200\n","stderr":""}
   ```

### Как это работает под капотом

Backend (сам контейнер) запускает **sibling**-контейнеры через примонтированный
`/var/run/docker.sock`. Чтобы host-демон Docker увидел temp-файл с кодом,
backend пишет его в bind-mounted директорию `/tmp/vibe-sandbox` (одинаковый путь
на хосте и в контейнере backend). Sibling-контейнер монтирует этот файл как
`/app/main.py:ro` и исполняет `python /app/main.py`.

### Ограничения безопасности sandbox

- `--network=jelly-net` — контейнер видит только jelly-service, не host/internet.
- `--memory=128m --cpus=0.5 --pids-limit=64` — лимиты ресурсов против DoS/fork-бомб.
- `--read-only` + `--tmpfs /tmp` — файловая система read-only, писать можно только в /tmp.
- `timeout 10` внутри контейнера + 15s таймаут на `execFile` — жёсткий потолок исполнения.
- Код монтируется как `:ro`, временная директория удаляется в `finally`.
