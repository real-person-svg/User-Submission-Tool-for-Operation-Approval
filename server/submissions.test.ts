import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from './app.js';
import { initializeDatabase, openDatabase } from './db.js';
import type {
  ReviewInput,
  ReviewResult,
  SubmissionDetail,
  SubmissionInput,
  SubmissionListResult,
} from '../shared/types.js';
import { api, beijingTime } from '../src/lib/api.js';

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

  const create = async (input: Partial<SubmissionInput> = {}) => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/submissions',
      payload: {
        title: '投稿标题',
        author_name: '作者',
        category: '科技',
        content: '完整正文',
        submitted_at: '2026-10-12T00:00:00.000Z',
        ...input,
      },
    });

    assert.equal(response.statusCode, 201, response.body);

    return response.json<{
      id: number;
    }>().id;
  };

  const list = async (query = '') => {
    const response = await app.inject(`/api/submissions${query}`);

    assert.equal(response.statusCode, 200, response.body);

    return response.json<SubmissionListResult>();
  };

  const review = (
    items: ReviewInput['items'],
    action: 'approve' | 'reject' = 'approve',
    reason?: string,
  ) => app.inject({
    method: 'POST',
    url: '/api/reviews',
    payload: {
      items,
      action,
      reason,
      operatorId: 1,
    },
  });

  return {
    db,
    app,
    create,
    list,
    review,
  };
}

test('空库、页面录入、默认待审及详情完整内容', async (t) => {
  const {
    app,
    create,
    list,
    review,
  } = await fixture(t);
  const empty = await list();

  assert.equal(empty.hasSubmissions, false);
  assert.equal(empty.total, 0);
  assert.equal(empty.page, 1);

  const content = '完整正文\n'.repeat(100);
  const id = await create({
    title: '  标题  ',
    content,
  });
  const result = await list();

  assert.equal(result.items[0].title, '标题');
  assert.equal(result.items[0].version, 1);
  assert.ok(result.items[0].summary.endsWith('…'));

  const detail = (await app.inject(`/api/submissions/${id}`)).json<SubmissionDetail>();

  assert.equal(detail.submission.content, content.trim());
  assert.equal(detail.submission.reviewer_name, null);
  assert.deepEqual(detail.logs, []);
  await review([
    {
      id,
      version: 1,
    },
  ]);

  const noPending = await list();

  assert.equal(noPending.total, 0);
  assert.equal(noPending.hasSubmissions, true);
  assert.equal((await list('?status=all')).total, 1);
});

test('服务端分页、稳定排序、总数及越界页回退', async (t) => {
  const {
    create,
    list,
    review,
  } = await fixture(t);

  for (let index = 0; index < 21; index++) await create();

  const first = await list();

  assert.equal(first.items.length, 20);
  assert.equal(first.total, 21);
  assert.equal(first.items[0].id, 21);

  const second = await list('?page=2');

  assert.equal(second.items.length, 1);
  assert.equal(second.items[0].id, 1);
  await review([
    {
      id: 1,
      version: 1,
    },
  ]);

  const fallback = await list('?page=2');

  assert.equal(fallback.page, 1);
  assert.equal(fallback.total, 20);
  assert.equal((await list('?page=999999999')).page, 1);
});

test('组合筛选、关键词三个字段、字面量匹配及北京时间全天边界', async (t) => {
  const {
    create,
    list,
    review,
  } = await fixture(t);

  await create({
    title: '边界开始',
    submitted_at: '2026-10-11T16:00:00.000Z',
  });
  await create({
    author_name: '边界作者',
    submitted_at: '2026-10-12T15:59:59.999Z',
  });
  await create({
    content: '边界正文',
    submitted_at: '2026-10-12T04:00:00.000Z',
  });
  await create({
    title: '边界前',
    submitted_at: '2026-10-11T15:59:59.999Z',
  });
  await create({
    title: '边界后',
    submitted_at: '2026-10-12T16:00:00.000Z',
  });

  const approved = await create({
    title: '边界已审',
  });

  await review([
    {
      id: approved,
      version: 1,
    },
  ]);

  const result = await list(
    `?keyword=${encodeURIComponent(' 边界 ')}&startDate=2026-10-12&endDate=2026-10-12`,
  );

  assert.equal(result.total, 3);
  assert.equal((await list('?status=approved')).total, 1);
  await create({
    title: '100%_精确',
  });
  assert.equal((await list('?keyword=%25_')).total, 1);
  assert.equal((await list(`?keyword=${encodeURIComponent('\' OR 1=1 --')}`)).total, 0);
});

test('非法查询、日期、录入字段和空白内容返回 400', async (t) => {
  const { app } = await fixture(t);

  for (const query of [
    '?page=0',
    '?page=1.5',
    '?pageSize=101',
    '?status=unknown',
    '?startDate=2026-02-30',
    '?startDate=2026-10-13&endDate=2026-10-12',
  ]) {
    assert.equal((await app.inject(`/api/submissions${query}`)).statusCode, 400, query);
  }

  for (const payload of [
    {},
    {
      title: ' ',
      author_name: '甲',
      category: '乙',
      content: '丙',
      submitted_at: '2026-10-12T00:00:00Z',
    },
    {
      title: '甲',
      author_name: '乙',
      category: '丙',
      content: '丁',
      submitted_at: '2026-02-30T00:00:00Z',
    },
  ]) {
    assert.equal((await app.inject({
      method: 'POST',
      url: '/api/submissions',
      payload,
    })).statusCode, 400);
  }

  assert.equal((await app.inject('/api/submissions/999')).statusCode, 404);
});

test('单条通过记录操作人、时间、版本与日志，重复审核失败', async (t) => {
  const {
    app,
    create,
    review,
    list,
  } = await fixture(t);
  const id = await create();
  const response = await review([
    {
      id,
      version: 1,
    },
  ]);

  assert.equal(response.statusCode, 200);

  const result = response.json<ReviewResult>();

  assert.deepEqual(result.successIds, [id]);

  const detail = (await app.inject(`/api/submissions/${id}`)).json<SubmissionDetail>();

  assert.equal(detail.submission.status, 'approved');
  assert.equal(detail.submission.version, 2);
  assert.equal(detail.submission.reviewer_name, '审核员一');
  assert.equal(detail.submission.reject_reason, null);
  assert.ok(detail.submission.reviewed_at);
  assert.equal(detail.logs[0].batch_id, result.batchId);
  assert.equal(detail.logs[0].from_status, 'pending');

  const repeated = (await review([
    {
      id,
      version: 1,
    },
  ])).json<ReviewResult>();

  assert.equal(repeated.failures[0].code, 'STATUS_CONFLICT');
  assert.equal((await list()).total, 0);
});

test('驳回原因必填，统一原因去除首尾空白，批次日志关联', async (t) => {
  const {
    app,
    create,
    review,
  } = await fixture(t);
  const ids = [await create(), await create()];
  const items = ids.map(id => ({
    id,
    version: 1,
  }));

  for (const reason of [
    undefined,
    '',
    ' \n ',
  ]) {
    assert.equal((await review(items, 'reject', reason)).statusCode, 400);
  }

  const result = (await review(items, 'reject', '  内容需要补充  ')).json<ReviewResult>();

  assert.deepEqual(result.successIds, ids);

  for (const id of ids) {
    const detail = (await app.inject(`/api/submissions/${id}`)).json<SubmissionDetail>();

    assert.equal(detail.submission.reject_reason, '内容需要补充');
    assert.equal(detail.logs[0].batch_id, result.batchId);
    assert.equal(detail.logs[0].reason, '内容需要补充');
  }

  assert.equal((await app.inject('/api/review-logs?operatorId=1')).json().length, 2);
  assert.equal((await app.inject(`/api/review-logs?submissionId=${ids[0]}`)).json().length, 1);
  assert.equal((await app.inject('/api/review-logs?operatorId=2')).json().length, 0);
});

test('混合批次逐条返回已审、版本冲突和不存在，其余可成功', async (t) => {
  const { create, review } = await fixture(t);
  const done = await create();
  const stale = await create();
  const valid = await create();

  await review([
    {
      id: done,
      version: 1,
    },
  ]);

  const result = (await review([
    {
      id: done,
      version: 1,
    },
    {
      id: stale,
      version: 99,
    },
    {
      id: 999,
      version: 1,
    },
    {
      id: valid,
      version: 1,
    },
  ])).json<ReviewResult>();

  assert.deepEqual(result.successIds, [valid]);
  assert.deepEqual(
    result.failures.map(item => item.code),
    [
      'STATUS_CONFLICT',
      'STATUS_CONFLICT',
      'NOT_FOUND',
    ],
  );
});

test('未选择/无效操作人、重复投稿及空批次不得审核', async (t) => {
  const { app, create } = await fixture(t);
  const id = await create();

  for (const payload of [
    {
      items: [
        {
          id,
          version: 1,
        },
      ],
      action: 'approve',
    },
    {
      items: [
        {
          id,
          version: 1,
        },
      ],
      action: 'approve',
      operatorId: 999,
    },
    {
      items: [
        {
          id,
          version: 1,
        },
        {
          id,
          version: 1,
        },
      ],
      action: 'approve',
      operatorId: 1,
    },
    {
      items: [],
      action: 'approve',
      operatorId: 1,
    },
  ]) {
    assert.equal((await app.inject({
      method: 'POST',
      url: '/api/reviews',
      payload,
    })).statusCode, 400);
  }
});

test('并发审核同一版本只有一次成功，只有一条日志', async (t) => {
  const {
    app,
    create,
    review,
  } = await fixture(t);
  const id = await create();
  const responses = await Promise.all([
    review([
      {
        id,
        version: 1,
      },
    ]),
    review([
      {
        id,
        version: 1,
      },
    ], 'reject', '测试'),
  ]);

  assert.equal(
    responses.reduce((sum, response) => sum + response.json<ReviewResult>().successIds.length, 0),
    1,
  );

  const detail = (await app.inject(`/api/submissions/${id}`)).json<SubmissionDetail>();

  assert.equal(detail.logs.length, 1);
});

test('批次第二条日志写入异常时，回滚整个批次的状态和日志', async (t) => {
  const {
    db,
    app,
    create,
    review,
  } = await fixture(t);
  const first = await create();
  const second = await create();

  db.exec(`CREATE TRIGGER fail_log BEFORE INSERT ON review_logs WHEN NEW.submission_id = ${second}
    BEGIN SELECT RAISE(ABORT, 'forced log failure'); END;`);
  assert.equal((await review([
    {
      id: first,
      version: 1,
    },
    {
      id: second,
      version: 1,
    },
  ])).statusCode, 500);

  for (const id of [first, second]) {
    const detail = (await app.inject(`/api/submissions/${id}`)).json<SubmissionDetail>();

    assert.equal(detail.submission.status, 'pending');
    assert.equal(detail.submission.version, 1);
    assert.equal(detail.submission.reviewed_by, null);
    assert.deepEqual(detail.logs, []);
  }
});

test('北京时间展示不依赖运行机器时区', () => {
  assert.equal(beijingTime('2026-10-11T16:00:00Z'), '2026-10-12 00:00');
  assert.equal(beijingTime('2026-10-12T15:59:59Z', true), '2026-10-12 23:59:59');
});

test('重启初始化不重复创建操作人，也不覆盖已有投稿', async (t) => {
  const {
    db,
    create,
    list,
  } = await fixture(t);
  const id = await create();

  initializeDatabase(db);
  assert.equal(Number(db.prepare('SELECT count(*) AS count FROM operators').get()!.count), 3);
  assert.deepEqual((await list()).items.map(item => item.id), [id]);
});

test('请求工具提供中文断网和超时提示，保留业务错误且不自动重复提交', async (t) => {
  let behavior: () => Promise<Response> = () => Promise.reject(new TypeError('Failed to fetch'));
  const fetchMock = t.mock.method(globalThis, 'fetch', () => behavior());

  await assert.rejects(api('/reviews', {
    method: 'POST',
  }), /网络连接失败/);
  behavior = () => Promise.reject(new DOMException('timeout', 'TimeoutError'));
  await assert.rejects(api('/reviews', {
    method: 'POST',
  }), /请求超时/);
  behavior = async () => new Response(JSON.stringify({
    message: '请选择有效的操作人。',
  }), {
    status: 400,
  });
  await assert.rejects(api('/reviews', {
    method: 'POST',
  }), /请选择有效的操作人/);
  assert.equal(fetchMock.mock.callCount(), 3);
});
