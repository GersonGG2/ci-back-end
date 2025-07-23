import { Injectable } from '@nestjs/common';
import { ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm';
import { PaginationQueryDto } from '../dto/pagination-query.dto';
import { PaginationResult } from '../interfaces/pagination-result.interface';

@Injectable()
export class PaginationService {
    async paginate<T extends ObjectLiteral>(
        queryBuilder: SelectQueryBuilder<T>,
        paginationQuery: PaginationQueryDto,
        searchableColumns: string[] = [],
    ): Promise<PaginationResult<T>> {
        const { page = 1, limit = 10, sort, order = 'ASC', searchValue } = paginationQuery;

        // Aplicar búsqueda si se proporciona
        if (searchValue && searchableColumns.length > 0) {
            queryBuilder.andWhere(
                `(${searchableColumns
                    .map(column => `${column} LIKE :search`)
                    .join(' OR ')})`,
                { search: `%${searchValue}%` },
            );
        }

        // Aplicar ordenamiento si se proporciona
        if (sort) {
            const ormOrder: "ASC" | "DESC" = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
            queryBuilder.orderBy(`${sort}`, ormOrder);
        }

        // Obtener el total de registros
        const count = await queryBuilder.getCount();

        // Calcular total de páginas
        const pages = Math.ceil(count / limit);

        // Aplicar paginación
        queryBuilder.skip((page - 1) * limit).take(limit);

        // Ejecutar consulta
        const rows = await queryBuilder.getMany();

        return {
            count,
            limit,
            page,
            pages,
            rows,
        };
    }
}