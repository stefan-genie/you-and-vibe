import { execFile } from "node:child_process";
import { mkdtemp, writeFile, rm, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const RUNNER_IMAGE = process.env.RUNNER_IMAGE || "sandbox-runner:latest";
const JELLY_NETWORK = process.env.JELLY_NETWORK || "jelly-net";
const SANDBOX_TMP_BASE = process.env.SANDBOX_TMP_BASE || tmpdir();
const HOST_TIMEOUT_MS = 15_000;
const CONTAINER_TIMEOUT_S = 10;
const MEM_LIMIT = "128m";
const CPU_LIMIT = "0.5";
const PID_LIMIT = 64;
const RESULT_RE = /RESULT_STATUS:\s*(-?\d+)/;

// TODO(phase 7): system prompt for AI code generation must instruct the model to
// end every program by printing "RESULT_STATUS:<code>" as the final line, where
// <code> is the HTTP status code observed by the generated code. runInSandbox
// parses this marker to decide pass/fail.

export async function runInSandbox(code) {
  if (typeof code !== "string" || code.length === 0) {
    return {
      passed: false,
      statusCode: null,
      stdout: "",
      stderr: "No code provided.",
    };
  }

  let dir;
  try {
    try {
      await mkdir(SANDBOX_TMP_BASE, { recursive: true });
    } catch {
      // may already exist or be read-only; mkdtemp will surface real errors
    }
    dir = await mkdtemp(join(SANDBOX_TMP_BASE, "vibe-sandbox-"));
  } catch (err) {
    return {
      passed: false,
      statusCode: null,
      stdout: "",
      stderr: `Failed to create temp dir: ${err.message}`,
    };
  }

  const tmpFile = join(dir, "main.py");

  try {
    await writeFile(tmpFile, code, { mode: 0o444 });

    const args = [
      "run", "--rm",
      "--network", JELLY_NETWORK,
      "--memory", MEM_LIMIT,
      "--cpus", CPU_LIMIT,
      "--pids-limit", String(PID_LIMIT),
      "--read-only",
      "--tmpfs", "/tmp",
      "-v", `${tmpFile}:/app/main.py:ro`,
      RUNNER_IMAGE,
      "timeout", String(CONTAINER_TIMEOUT_S), "python", "/app/main.py",
    ];

    const result = await new Promise((resolve) => {
      execFile(
        "docker",
        args,
        { timeout: HOST_TIMEOUT_MS, maxBuffer: 1 << 20, windowsHide: true },
        (err, stdout, stderr) => {
          resolve({
            exitCode: err ? (err.code ?? null) : 0,
            signal: err && err.signal ? err.signal : null,
            stdout: typeof stdout === "string" ? stdout : "",
            stderr: typeof stderr === "string" ? stderr : "",
          });
        }
      );
    });

    if (result.signal === "SIGTERM" || result.signal === "SIGKILL") {
      return {
        passed: false,
        statusCode: null,
        stdout: result.stdout,
        stderr: `Sandbox execution timed out (${CONTAINER_TIMEOUT_S}s).`,
      };
    }

    const match = result.stdout.match(RESULT_RE);
    const statusCode = match ? parseInt(match[1], 10) : null;
    const passed = statusCode !== null && statusCode >= 200 && statusCode <= 299;

    return {
      passed,
      statusCode,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  } catch (err) {
    return {
      passed: false,
      statusCode: null,
      stdout: "",
      stderr: `Sandbox runtime error: ${err.message}`,
    };
  } finally {
    try {
      await rm(dir, { recursive: true, force: true });
    } catch {
      // best-effort cleanup; temp dir is inside OS tmpdir
    }
  }
}
