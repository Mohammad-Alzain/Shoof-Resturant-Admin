export interface IUploader {
  id?: number | string;
  url?: string;
  name?: string;
  path?: string;
  full_path?: string;
  mime_type?: string;
  extension?: string;
  size?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}
