export interface PaginationResult<T> {
  count: number;
  limit: number;
  page: number;
  pages: number;
  rows: T[];
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  status: number;
}