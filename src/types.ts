export type AcceptableExtensions = 'js' | 'html';

export interface FileRecord {
  name: string;
  extension: AcceptableExtensions;
  content: string;
  isTemplate?: boolean;
}

export type FileExports = Array<'js' | 'css' | 'tpl'>;

export interface FileOptions {
  isTemplate?: boolean;
}

export interface ProjectManifest {
  files?: {
    [filename: string]: FileOptions;
  };
}
