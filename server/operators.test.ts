import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from './app.js';
import { initializeDatabase, openDatabase } from './db.js';
import type { Operator, SubmissionDetail } from '../shared/types.js';
import { api } from '../src/lib/api.js';

async function fixture(t: TestContext) {
  const db = openDatabase(':memory:');
  const app = await buildApp({
    db,
    logger: false,
  });

  t.after(async () => {
    await app.close();
    db.close();
  });

  return {
    db,
    app,
  };
}

test('审稿人列表可用于审核，管理接口已移除且不会修改人员', async (t) => {
  const { app } = await fixture(t);
  const response = await app.inject('/api/operators');

  assert.equal(response.statusCode, 200);

  const operators = response.json<Operator[]>();

  assert.deepEqual(operators, [
    {
      id: 1,
      name: '审核员一',
    },
    {
      id: 2,
      name: '审核员二',
    },
    {
      id: 3,
      name: '审核员三',
    },
  ]);

  for (const request of [
    {
      method: 'POST',
      url: '/api/operators',
      payload: {
        name: '新增人员',
      },
    },
    {
      method: 'GET',
      url: '/api/operators/1',
    },
    {
      method: 'PUT',
      url: '/api/operators/1',
      payload: {
        name: '修改人员',
      },
    },
    {
      method: 'DELETE',
      url: '/api/operators/1',
    },
  ] as const) {
    assert.equal((await app.inject(request)).statusCode, 404);
  }

  assert.deepEqual((await app.inject('/api/operators')).json(), operators);
});

test('兼容旧库已移除人员：保留历史记录、禁止审核且重启不会恢复', async (t) => {
  const { db, app } = await fixture(t);
  const create = async () => (await app.inject({
    method: 'POST',
    url: '/api/submissions',
    payload: {
      title: '测试投稿',
      author_name: '作者',
      category: '科技',
      content: '审核正文',
      submitted_at: '2026-10-12T00:00:00Z',
    },
  })).json<{
    id: number;
  }>().id;
  const reviewedId = await create();
  const pendingId = await create();
  const review = (id: number) => app.inject({
    method: 'POST',
    url: '/api/reviews',
    payload: {
      operatorId: 1,
      action: 'approve',
      items: [
        {
          id,
          version: 1,
        },
      ],
    },
  });

  assert.equal((await review(reviewedId)).statusCode, 200);
  db.prepare('UPDATE operators SET deleted_at = ? WHERE id = ?')
    .run('2026-10-12T00:00:00Z', 1);
  assert.equal((await review(pendingId)).statusCode, 400);

  const detail = (await app.inject(`/api/submissions/${reviewedId}`)).json<SubmissionDetail>();

  assert.equal(detail.submission.reviewer_name, '审核员一');
  assert.equal(detail.logs.length, 1);
  assert.equal(detail.logs[0].operator_name, '审核员一');
  assert.equal((await app.inject('/api/review-logs?operatorId=1')).json().length, 1);

  const pending = (await app.inject(`/api/submissions/${pendingId}`)).json<SubmissionDetail>();

  assert.equal(pending.submission.status, 'pending');
  assert.deepEqual(pending.logs, []);

  for (const id of [2, 3]) {
    db.prepare('UPDATE operators SET deleted_at = ? WHERE id = ?')
      .run('2026-10-12T00:00:00Z', id);
  }

  initializeDatabase(db);
  assert.deepEqual((await app.inject('/api/operators')).json(), []);
});

test('旧版数据库升级保留姓名及编号，重复初始化不会补回已移除人员', (t) => {
  const db = openDatabase(':memory:');

  t.after(() => db.close());
  db.exec(`CREATE TABLE operators (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
    INSERT INTO operators(id, name) VALUES (8, '原有审稿人');`);
  initializeDatabase(db);
  initializeDatabase(db);

  const operators = db.prepare('SELECT id, name, deleted_at FROM operators').all();

  assert.equal(operators.length, 1);
  assert.equal(operators[0].id, 8);
  assert.equal(operators[0].name, '原有审稿人');
  assert.equal(operators[0].deleted_at, null);
});

test('查询不发送 JSON Content-Type，有请求体的审核仍发送 JSON', async (t) => {
  const requests: RequestInit[] = [];

  t.mock.method(globalThis, 'fetch', async (_url: unknown, options: RequestInit) => {
    requests.push(options);

    return new Response('{}');
  });
  await api('/operators');
  await api('/reviews', {
    method: 'POST',
    body: JSON.stringify({
      operatorId: 1,
      action: 'approve',
      items: [
        {
          id: 1,
          version: 1,
        },
      ],
    }),
  });
  assert.equal(new Headers(requests[0].headers).has('Content-Type'), false);
  assert.equal(new Headers(requests[1].headers).get('Content-Type'), 'application/json');
});
