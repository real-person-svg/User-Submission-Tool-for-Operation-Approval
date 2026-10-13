import type { DatabaseSync, SQLInputValue } from 'node:sqlite';
import type {
  Submission,
  SubmissionInput,
  SubmissionListItem,
  SubmissionListResult,
  SubmissionQuery,
} from '../../shared/submissions.js';

const detailSelect = `SELECT s.*, o.name AS reviewer_name
  FROM submissions s LEFT JOIN operators o ON o.id = s.reviewed_by`;

// 根据投稿查询条件构建 SQL 过滤语句及绑定参数。
function buildSubmissionFilter(query: SubmissionQuery) {
  // 条件只拼接固定 SQL 片段，用户输入通过占位符绑定。
  const conditions: string[] = [];
  const params: SQLInputValue[] = [];

  const {
    status,
    startDate,
    endDate,
  } = query;
  const keyword = query.keyword.trim();

  if (status !== 'all') {
    conditions.push('status = ?');
    params.push(status);
  }

  if (keyword) {
    // instr 按字面包含匹配，关键词中的 % 和 _ 不作为通配符。
    conditions.push('(instr(title, ?) > 0 OR instr(author_name, ?) > 0 OR instr(content, ?) > 0)');
    params.push(keyword, keyword, keyword);
  }

  // 将北京时间的起止日全天边界转换为 UTC，与存储格式一致。
  if (startDate) {
    const startTimestamp = new Date(`${startDate}T00:00:00+08:00`).toISOString();

    conditions.push('submitted_at >= ?');
    params.push(startTimestamp);
  }

  if (endDate) {
    const endTimestamp = new Date(`${endDate}T23:59:59.999+08:00`).toISOString();

    conditions.push('submitted_at <= ?');
    params.push(endTimestamp);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  return {
    where,
    params,
  };
}

// 按查询条件分页获取投稿列表及总数等分页信息。
export function listSubmissions(db: DatabaseSync, query: SubmissionQuery): SubmissionListResult {
  const { where, params } = buildSubmissionFilter(query);

  const countSql = `SELECT count(*) AS total FROM submissions ${where}`;
  const countStatement = db.prepare(countSql);
  const countRow = countStatement.get(...params)!;
  const total = Number(countRow.total);

  const pageSize = query.pageSize;
  const pageCount = Math.ceil(total / pageSize);
  const lastPage = Math.max(1, pageCount);

  // 无匹配时返回第一页，越界页回退到最后一页。
  const page = Math.min(query.page, lastPage);
  const offset = (page - 1) * pageSize;

  // 列表仅取正文摘要；时间相同时用编号倒序保证分页顺序稳定。
  const listSql = `SELECT id, title, author_name, category, status, submitted_at, version,
    substr(content, 1, 240) || CASE WHEN length(content) > 240 THEN '…' ELSE '' END AS summary
    FROM submissions ${where} ORDER BY submitted_at DESC, id DESC LIMIT ? OFFSET ?`;
  const listStatement = db.prepare(listSql);
  const rows = listStatement.all(...params, pageSize, offset) as unknown as SubmissionListItem[];

  const items = rows.map((row) => {
    const summary = row.summary.replace(/\s+/g, ' ').trim();

    return {
      ...row,
      summary,
    };
  });

  // 查询全库是否有投稿，供前端区分空库和筛选无匹配。
  const existenceStatement = db.prepare('SELECT 1 FROM submissions LIMIT 1');
  const hasSubmissions = Boolean(existenceStatement.get());

  const result = {
    items,
    total,
    hasSubmissions,
    page,
    pageSize,
  };

  return result;
}

// 清理投稿输入并写入数据库，返回新投稿的编号。
export function createSubmission(db: DatabaseSync, input: SubmissionInput) {
  const title = input.title.trim();
  const authorName = input.author_name.trim();
  const category = input.category.trim();

  const content = input.content.trim();
  // 时间统一存为 UTC ISO 字符串，便于按时间范围比较和排序。
  const submittedAt = new Date(input.submitted_at).toISOString();

  const sql = `INSERT INTO submissions(title, author_name, category, content, submitted_at)
    VALUES (?, ?, ?, ?, ?)`;
  const statement = db.prepare(sql);
  const result = statement.run(title, authorName, category, content, submittedAt);
  const id = Number(result.lastInsertRowid);

  return id;
}

// 根据投稿编号查询投稿详情及审核人信息。
export function findSubmission(db: DatabaseSync, id: number) {
  const sql = `${detailSelect} WHERE s.id = ?`;
  const statement = db.prepare(sql);
  const submission = statement.get(id) as unknown as Submission | undefined;

  return submission;
}
