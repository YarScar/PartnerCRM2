import { appendFile, mkdir } from 'fs/promises';
import { dirname, resolve } from 'path';

export async function logAuditEvent(event: string, details: Record<string, unknown> = {}) {
  // Write a tiny audit trail for the important security actions.
  const entry = {
    timestamp: new Date().toISOString(),
    event,
    ...details,
  };

  const logLine = `${JSON.stringify(entry)}\n`;

  if (process.env.AUDIT_LOG_PATH) {
    try {
      // If a log file path is configured, append to it.
      const targetPath = resolve(process.env.AUDIT_LOG_PATH);
      await mkdir(dirname(targetPath), { recursive: true });
      await appendFile(targetPath, logLine);
    } catch (error) {
      console.warn('audit log write failed', error);
    }
  }

  // Also print to the server log so events are easy to trace in dev.
  console.info(`[audit] ${event}`, JSON.stringify(details));
}
