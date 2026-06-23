export function ensureEnvLoaded() {
  try {
    const hasKey = typeof process.env.RESEND_API_KEY !== 'undefined' && process.env.RESEND_API_KEY !== '';
    if (!hasKey) {
      // Load .env into process.env for local dev when env vars weren't present at start
      // Use require to avoid bundling dotenv into serverless builds unintentionally
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const dotenv = require('dotenv');
      dotenv.config();
    }
  } catch (err) {
    // ignore errors when dotenv isn't available in prod
  }
}

export default ensureEnvLoaded;
