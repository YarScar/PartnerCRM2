import { appendFile, mkdir } from 'fs/promises';
import { dirname, resolve } from 'path';

export async function logAuditEvent(event: string, details: Record<string, unknown> = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    event,
    ...details,
  };

  const logLine = `${JSON.stringify(entry)}\n`;

  if (process.env.AUDIT_LOG_PATH) {
    try {
      const targetPath = resolve(process.env.AUDIT_LOG_PATH);
      await mkdir(dirname(targetPath), { recursive: true });
      await appendFile(targetPath, logLine);
    } catch (error) {
      console.warn('audit log write failed', error);
    }
  }

  console.info(`[audit] ${event}`, JSON.stringify(details));
}
