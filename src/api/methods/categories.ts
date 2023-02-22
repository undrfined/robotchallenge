import { GetRequest, PostRequest, RequestType } from './types';
import { ApiCategory } from '../types';

export class GetCategories extends GetRequest implements RequestType {
  type = 'categories';

  resultType?: ApiCategory[];
}

export class PostCategory extends PostRequest implements RequestType {
  type = 'categories';

  constructor(public newCategory: Omit<ApiCategory, 'id' | 'createdAt' | 'updatedAt'>) {
    super();
  }

  resultType?: ApiCategory;
}

type CategoriesRequests = GetCategories | PostCategory;
export default CategoriesRequests;
