import {
  FileRecord,
  ProjectManifest,
  AcceptableExtensions,
} from './types';
import { ACCEPTABLE_EXTENSIONS, EMPTY_INDEX } from './constants.js';

export const endWithSlash = (str: string) => str.replace(/\/?$/, '/');

export const fetchProject = async (
  projectPath: string
): Promise<FileRecord[]> => {
  try {
    const projectDir = endWithSlash(projectPath);
    const manifestPath = `${projectDir}demo.json`;
    const manifestFetched = await fetch(manifestPath);
    const manifest = (await manifestFetched.json()) as ProjectManifest;

    const filenames = Object.keys(manifest.files || []);

    if (filenames.length && manifest.files) {

      const filesFetched: Promise<string>[] = [];
      const fileMetadata: {
        name: string;
        extension: AcceptableExtensions;
      }[] = [];

      for (const filename of filenames) {
        const [name, extensionRaw] = filename.split('.');

        if (name && extensionRaw) {
          if (extensionRaw && ACCEPTABLE_EXTENSIONS.includes(extensionRaw)) {
            const extension = extensionRaw as AcceptableExtensions;
            fileMetadata.push({ name, extension });
            const fileFetched = fetch(`${projectDir}${name}.${extension}`).then(
              response => {
                if (response.status === 404) {
                  throw new Error(
                    `Could not find file ` + `${projectDir}${name}.${extension}`
                  );
                }
                return response.text();
              }
            );
            filesFetched.push(fileFetched);
          } else {
            console.error(
              `Unsupported file extension ${extensionRaw} in ` +
                `file ${filename} in ${manifestPath}`
            );
            continue;
          }
        } else {
          console.error(
            `could not parse file name or file extension from ` +
              `${filename} in ${manifestPath}`
          );
          continue;
        }
      }

      const fileContents = await Promise.all(filesFetched);

      if (fileContents.length !== fileMetadata.length) {
        throw new Error('There was an error fetching the project files');
      }

      const fileRecords: FileRecord[] = [];

      for (let i = 0; i < fileContents.length; i++) {
        const fileContent = fileContents[i];
        const metadata = fileMetadata[i];
        const fileRecord: FileRecord = {
          name: metadata.name,
          extension: metadata.extension,
          content: fileContent
        };

        fileRecords.push(fileRecord);
      }

      if (fileRecords.length) {
        return fileRecords;
      }
    } else {
      console.error(`No files defined manifest at ${manifestPath}`);
    }

    return [EMPTY_INDEX];
  } catch (e) {
    console.error(e);
    return [EMPTY_INDEX];
  }
};


export const fetchTemplate = async (path: string): Promise<string> => {
  const fileFetched = await fetch(path);
  const textFetched = await fileFetched.text();

  return textFetched;
};

export const importJs = async (path: string): Promise<Function> => {
  const imported = await import(path);
  return imported.default;
};
