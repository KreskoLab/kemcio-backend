import { Catch, ArgumentsHost, RpcExceptionFilter, ExceptionFilter } from '@nestjs/common';
import { MongoError } from 'mongodb';
import { Response } from 'express';
import { Observable, throwError } from 'rxjs';
import { RpcException } from '@nestjs/microservices';

@Catch(MongoError)
export class MongoExceptionFilter implements ExceptionFilter {
  catch(exception: MongoError, host: ArgumentsHost) {
    switch (exception.code) {
      case 11000:
        const err = JSON.stringify({ code: 409, msg: 'User already exists' });
        return throwError(() => err);
    }
  }
}
