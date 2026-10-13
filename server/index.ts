import { buildApp } from './app.js';

const app = await buildApp();

const host = '127.0.0.1';
const port = Number(process.env.PORT ?? 3000);
const listenOptions = {
  host,
  port,
};

try {
  await app.listen(listenOptions);
} catch (error) {
  app.log.error(error);
  process.exit(1);
}

const signals = ['SIGINT', 'SIGTERM'] as const;

// 退出前关闭服务，触发数据库连接的清理钩子。
for (const signal of signals) {
  process.once(signal, async () => {
    await app.close();
    process.exit(0);
  });
}
