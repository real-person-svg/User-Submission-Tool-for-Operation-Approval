import type { FastifyError, FastifyInstance } from 'fastify';

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler<FastifyError>((error, request, reply) => {
    const statusCode = error.statusCode ?? 500;
    const isServerError = statusCode >= 500;
    const message = isServerError
      ? '服务暂时不可用，请重试；审核事务出现异常时已回滚。'
      : '请求参数无效，请检查输入内容。';
    const body = {
      message,
    };

    if (isServerError) request.log.error(error);
    reply.code(statusCode).send(body);
  });
}
