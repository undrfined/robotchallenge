export interface RequestType {
  type: string;
  resultType?: any;
}

interface MethodType {
  method: string;
}

export class GetRequest implements MethodType {
  public method = 'GET';

  public path: (string | number | undefined)[] = [];
}

export class GetFileRequest implements MethodType {
  public method = 'GET';

  public path: (string | number | undefined)[] = [];

  resultType?: Blob;
}

export class PostFileRequest implements MethodType {
  public method = 'POST';

  constructor(public body: Blob) {
  }
}

export class PostRequest implements MethodType {
  public method = 'POST';
}
