import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

import axios from 'axios';

import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
} from '@prisma/client/runtime/library';

import { ValidationError } from 'class-validator';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();

    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const error = this.parseError(exception);

    this.logError(exception, request);

    response.status(error.statusCode).json({
      success: false,
      statusCode: error.statusCode,
      message: error.message,
      errors: error.errors ?? null,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private logError(exception: unknown, request: Request) {
    this.logger.error({
      method: request.method,
      url: request.originalUrl,
      ip: request.ip,
      body: request.body,
      params: request.params,
      query: request.query,
      exception,
    });

    if (exception instanceof Error) {
      this.logger.error(exception.stack);
    }
  }

  private extractPrismaMessage(message: string): string {
  const match = message.match(/Argument `(.+?)` is missing\./);

  if (match) {
    return `Required field '${match[1]}' is missing.`;
  }

  return 'Invalid request data.';
}

  private parseError(error: any) {
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Something went wrong';

    let errors: any = null;

    if (error instanceof PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          statusCode = 409;

          const fields = Array.isArray(error.meta?.target)
            ? error.meta.target.join(', ')
            : String(error.meta?.target);

          message = `${fields} already exists.`;
          break;

        case 'P2003':
          statusCode = 400;
          message = 'Invalid reference to related record.';
          break;

        case 'P2025':
          statusCode = 404;
          message = 'Record not found.';
          break;

        case 'P2022':
          statusCode = 500;
          message = 'Database schema mismatch.';
          errors = error.meta;
          break;

        default:
          message = error.message;
      }

    } 
    
    else if (error instanceof PrismaClientInitializationError) {
      statusCode = 500;
      message = 'Unable to connect to the database.';
    } else if (
      typeof error?.message === 'string' &&
      error.message.includes('Invalid `this.prisma')
    ) {
      statusCode = 400;
      message = this.extractPrismaMessage(error.message);
    //   errors = error.message;
    } 
    
    else if (error instanceof HttpException) {
      statusCode = error.getStatus();

      const response = error.getResponse();

      if (typeof response === 'string') {
        message = response;
      } else {
        const obj = response as Record<string, any>;

        if (Array.isArray(obj.message) && typeof obj.message[0] === 'string') {
          message = obj.message.join(', ');
        } else if (
          Array.isArray(obj.message) &&
          typeof obj.message[0] === 'object'
        ) {
          message = 'Validation failed';
          errors = obj.message;
        } else {
          message = obj.message || obj.error || message;
          errors = obj.errors;
        }
      }
    } 
    
    else if (axios.isAxiosError(error)) {
      statusCode = error.response?.status ?? 502;

      const data = error.response?.data;

      if (typeof data === 'object') {
        message =
          data.message ??
          data.error ??
          data.detail ??
          'External service request failed.';
      } else {
        message = error.message;
      }

      errors = {
        service: 'Chowdeck Relay',
        status: error.response?.status,
        response: data,
      };
    } 
    
    else if (Array.isArray(error) && error[0] instanceof ValidationError) {
      statusCode = 422;

      message = 'Validation failed';

      errors = error.map((e) => ({
        field: e.property,
        constraints: e.constraints,
      }));
    } else if (error?.name === 'TokenExpiredError') {
      statusCode = 401;
      message = 'Token has expired.';
    } else if (error?.name === 'JsonWebTokenError') {
      statusCode = 401;
      message = 'Invalid authentication token.';
    } else {
      message = error?.message || message;
    }
    return { statusCode, message, errors };
  }
}
