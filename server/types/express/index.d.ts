declare namespace Express {
  export interface Request {
    file?: {
      filename: string;
      path: string;
      mimetype: string;
      size: number;
    };
  }
}
