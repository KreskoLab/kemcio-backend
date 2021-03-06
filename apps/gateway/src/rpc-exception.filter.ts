import { Catch, ArgumentsHost, RpcExceptionFilter } from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements RpcExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    if (exception.status) {
      return response.status(exception.status).send(exception.response);
    } else {
      const err = typeof exception === 'string' ? JSON.parse(exception) : exception;
      return response.status(err.code).send(err.msg);
    }
  }
}
