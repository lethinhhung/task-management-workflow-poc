import { execFileSync } from "child_process";
import * as logger from "../utils/logger";
import { projectRoot } from "../utils/files";

export interface ClaudeResult {
  stdout: string;
  success: boolean;
}

export function invoke(prompt: string): ClaudeResult {
  logger.info("Invoking Claude Code...");
  try {
    const stdout = execFileSync("claude", ["-p", prompt], {
      cwd: projectRoot(),
      encoding: "utf-8",
      maxBuffer: 50 * 1024 * 1024, // 50MB
      timeout: 600_000, // 10 minutes
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { stdout: stdout.trim(), success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`Claude Code invocation failed: ${message}`);
    return { stdout: "", success: false };
  }
}
