import { existsSync, readFileSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { join } from "node:path";

const root = import.meta.dirname;
const venv = join(root, "venv");
const python = join(venv, process.platform === "win32" ? "Scripts/python.exe" : "bin/python");
const envFile = join(root, ".env");

if (!existsSync(envFile)) {
  console.error("Missing apps/backend/.env. Copy .env.example and set DATABASE_URL and SECRET_KEY.");
  process.exit(1);
}

const fileEnv = Object.fromEntries(readFileSync(envFile, "utf8").split(/\r?\n/).filter((line) => /^[A-Z][A-Z0-9_]*=/.test(line)).map((line) => {
  const separator = line.indexOf("=");
  return [line.slice(0, separator), line.slice(separator + 1)];
}));

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", env: { ...process.env, ...fileEnv } });
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (!existsSync(python)) {
  console.log("Creating the backend virtual environment...");
  run(process.env.PYTHON ?? "python", ["-m", "venv", "venv"]);
}

const dependencyCheck = spawnSync(python, ["-c", "import fastapi, uvicorn, sqlalchemy, pydantic_settings; from importlib.metadata import version; assert version('bcrypt') == '4.0.1'"], { cwd: root, stdio: "ignore" });
if (dependencyCheck.status !== 0) {
  console.log("Installing backend dependencies...");
  run(python, ["-m", "pip", "install", "-r", "requirements.txt"]);
}

run(python, ["-m", "alembic", "upgrade", "head"]);

const server = spawn(python, ["-m", "uvicorn", "app.main:app", "--reload", "--host", "127.0.0.1", "--port", "8000"], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, ...fileEnv },
});

server.on("error", (error) => {
  console.error(`Could not start backend: ${error.message}`);
  process.exitCode = 1;
});
server.on("exit", (code) => {
  process.exitCode = code ?? 1;
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.kill(signal));
}
