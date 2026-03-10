export function info(message: string): void {
  console.log(`→ ${message}`);
}

export function success(message: string): void {
  console.log(`✓ ${message}`);
}

export function error(message: string): void {
  console.error(`✗ ${message}`);
}

export function fatal(message: string): never {
  error(message);
  process.exit(1);
}
