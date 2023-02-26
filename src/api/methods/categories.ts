import type { RequestType } from './types';
import { GetRequest, PostRequest } from './types';
import type { ApiCategory } from '../types';

const BASE = 'categories';
export class GetCategories extends GetRequest implements RequestType {
  type = BASE;

  resultType?: ApiCategory[];
}

export class PostCategory extends PostRequest implements RequestType {
  type = BASE;

  constructor(public newCategory: Omit<ApiCategory, 'id' | 'createdAt' | 'updatedAt'>) {
    super();
  }

  resultType?: ApiCategory;
}

type CategoriesRequests = GetCategories | PostCategory;
export default CategoriesRequests;
