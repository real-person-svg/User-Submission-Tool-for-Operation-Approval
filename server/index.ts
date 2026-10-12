import { buildApp } from './app.js';

const app = await buildApp();
try {
  await app.listen({ host: '127.0.0.1', port: Number(process.env.PORT ?? 3000) });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, async () => {
    await app.close();
    process.exit(0);
  });
}
