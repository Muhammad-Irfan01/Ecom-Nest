import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from "@nestjs/common";
import { Request, Response } from "express";


@Catch(HttpException)
export class HTTPExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const status = exception.getStatus();
        const exceptionResponse = exception.getResponse();

        const errorMessage = {
            statusCode : status,
            timeStamp : new Date().toISOString(),
            path : request.url,
            message : 
                typeof exceptionResponse === 'string' ? exceptionResponse : (exceptionResponse as any).message || 'HTTP exception'
        }
        response.status(status).json(errorMessage);
    }
} 