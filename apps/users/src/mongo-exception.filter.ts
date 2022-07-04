import { Catch, ExceptionFilter } from '@nestjs/common';
import { MongoError } from 'mongodb';
import { throwError } from 'rxjs';

@Catch(MongoError)
export class MongoExceptionFilter implements ExceptionFilter {
  catch(exception: MongoError) {
    switch (exception.code) {
      case 11000:
        const err = JSON.stringify({ code: 409, msg: 'User already exists' });
        return throwError(() => err);
    }
  }
}
