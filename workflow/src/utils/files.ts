import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";

export function projectRoot(): string {
  return path.resolve(__dirname, "..", "..", "..");
}

export function resolve(...segments: string[]): string {
  return path.join(projectRoot(), ...segments);
}

export function dirExists(dirPath: string): boolean {
  return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
}

export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
}

export function readFile(filePath: string): string {
  return fs.readFileSync(filePath, "utf-8");
}

export function writeFile(filePath: string, content: string): void {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content, "utf-8");
}

export function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

export async function readMarkdownFiles(dirPath: string): Promise<{ name: string; content: string }[]> {
  const pattern = path.join(dirPath, "*.md");
  const files = await glob(pattern);
  return files.sort().map((filePath) => ({
    name: path.basename(filePath),
    content: readFile(filePath),
  }));
}

export function moveFile(src: string, dest: string): void {
  const dir = path.dirname(dest);
  fs.mkdirSync(dir, { recursive: true });
  fs.renameSync(src, dest);
}

export function removeDir(dirPath: string): void {
  fs.rmSync(dirPath, { recursive: true, force: true });
}
