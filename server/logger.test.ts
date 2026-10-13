import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

test('原生日志以单行 JSON 保留请求、对象和错误堆栈，支持关闭日志', () => {
  const script = `
    import { buildApp } from './server/app.ts';
    import { openDatabase } from './server/db.ts';

    const db = openDatabase(':memory:');
    const app = await buildApp({
      db,
    });

    try {
      app.log.info({
        context: {
          id: 1,
          status: 'pending',
        },
      }, 'SINGLELINE_LOG');
      app.log.error(new Error('SINGLELINE_ERROR'));
      await app.inject('/api/health');
    } finally {
      await app.close();
    }

    const silentApp = await buildApp({
      db,
      logger: false,
    });

    try {
      silentApp.log.info('DISABLED_LOG');
      await silentApp.inject('/api/health');
    } finally {
      await silentApp.close();
      db.close();
    }
  `;

  const result = spawnSync(process.execPath, [
    '--import=tsx',
    '--input-type=module',
    '--eval',
    script,
  ], {
    cwd: process.cwd(),
    encoding: 'utf8',
    timeout: 15000,
  });

  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);

  const lines = result.stdout.trim().split(/\r?\n/);
  const logs = lines.map(line => JSON.parse(line));

  assert.equal(logs.length, 4);

  for (const log of logs) {
    assert.equal(typeof log.time, 'number');
    assert.equal(typeof log.level, 'number');
  }

  const info = logs.find(log => log.msg === 'SINGLELINE_LOG');
  const error = logs.find(log => log.msg === 'SINGLELINE_ERROR');
  const request = logs.find(log => log.msg === 'incoming request');
  const response = logs.find(log => log.msg === 'request completed');

  assert.deepEqual(info?.context, {
    id: 1,
    status: 'pending',
  });
  assert.equal(error?.level, 50);
  assert.match(error?.err.stack, /^Error: SINGLELINE_ERROR\n\s+at /);
  assert.equal(request?.req.method, 'GET');
  assert.equal(request?.req.url, '/api/health');
  assert.equal(response?.res.statusCode, 200);
  assert.equal(response?.reqId, request?.reqId);
  assert.doesNotMatch(result.stdout, /DISABLED_LOG/);
});
