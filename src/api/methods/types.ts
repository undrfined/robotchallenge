export interface RequestType {
  type: string;
  resultType?: any;
}

interface MethodType {
  method: string;
}

export class GetRequest implements MethodType {
  public method = 'GET';

  public path: (string | undefined)[] = [];
}

export class PostRequest implements MethodType {
  public method = 'POST';

  constructor(public body: Blob) {
  }
}
