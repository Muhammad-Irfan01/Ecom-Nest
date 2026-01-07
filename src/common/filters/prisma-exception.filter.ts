// src/common/exceptions/prisma-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let message = 'Database error occurred';
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

    switch (exception.code) {
      case 'P2002': 
        message = `Unique constraint failed on the ${exception.meta?.target}`;
        statusCode = HttpStatus.CONFLICT;
        break;
      case 'P2025': 
        message = 'Record not found';
        statusCode = HttpStatus.NOT_FOUND;
        break;
      case 'P2003': 
        message = 'Related record not found';
        statusCode = HttpStatus.BAD_REQUEST;
        break;
      default:
        message = 'Database operation failed';
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    }

    response.status(statusCode).json({
      statusCode,
      message,
      timestamp: new Date().toISOString(),
      error: 'Database Error',
    });
  }
}