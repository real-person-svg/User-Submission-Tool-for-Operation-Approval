export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;

  try {
    const url = `/api${path}`;
    const signal = options.signal ?? AbortSignal.timeout(15000);

    const headers = new Headers(options.headers);

    if (options.body !== undefined && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const request: RequestInit = {
      ...options,
      signal,
      headers,
    };

    response = await fetch(url, request);
  } catch (error) {
    const isTimeout = error instanceof DOMException && error.name === 'TimeoutError';
    const message = isTimeout
      ? '请求超时，请重试。'
      : '网络连接失败，请确认服务已启动后重试。';

    throw new Error(message, {
      cause: error,
    });
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = body?.message ?? '请求失败，请稍后重试。';

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : '请求失败，请重试。';
}

export function beijingTime(value: string, seconds = false) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  const date = new Date(value);
  const parts = formatter.formatToParts(date);

  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(item => item.type === type)!.value;

  const formattedDate = `${part('year')}-${part('month')}-${part('day')}`;
  const formattedTime = `${part('hour')}:${part('minute')}`;
  const formattedSeconds = seconds ? `:${part('second')}` : '';

  return `${formattedDate} ${formattedTime}${formattedSeconds}`;
}
