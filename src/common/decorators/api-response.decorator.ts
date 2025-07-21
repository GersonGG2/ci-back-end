import { applyDecorators } from '@nestjs/common';
import { ApiResponse as SwaggerApiResponse, getSchemaPath } from '@nestjs/swagger';
import { ApiResponse } from '../interfaces/pagination-result.interface';

export function ApiPaginatedResponse(model: any) {
  return applyDecorators(
    SwaggerApiResponse({
      schema: {
        allOf: [
          {
            properties: {
              data: {
                type: 'object',
                properties: {
                  count: { type: 'number', example: 100 },
                  limit: { type: 'number', example: 10 },
                  page: { type: 'number', example: 1 },
                  pages: { type: 'number', example: 10 },
                  rows: {
                    type: 'array',
                    items: { $ref: getSchemaPath(model) },
                  },
                },
              },
              message: { type: 'string', example: 'Datos encontrados exitosamente' },
              status: { type: 'number', example: 200 },
            },
          },
        ],
      },
    }),
  );
}