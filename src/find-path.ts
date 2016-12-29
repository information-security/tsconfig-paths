import * as fs from "fs";
import * as path from "path";
import { matchStar } from "./match-star";

export interface FindPathParameters {
  sourceFileName: string,
  request: string,
  absoluteBaseUrl: string,
  paths: { [key: string]: Array<string> },
  fileExists?: (name: string) => boolean
}

/**
 * Finds a path from tsconfig that matches a module load request.
 * @param sourceFileName Absolute path to the file that requested the module.
 * @param request The requested module.
 * @param absoluteBaseUrl baseUrl as specified in tsconfg, but resolved to absolute form.
 * @param paths The paths to try as specified in tsconfig.
 * @param fileExists Function that checks for existance of a file.
 * @returns the found path, or undefined if no path was found.
 */

export function findPath({
  sourceFileName,
  request,
  absoluteBaseUrl,
  paths,
  fileExists = fs.existsSync
}: FindPathParameters) {

  if (request[0] !== '.' && request[0] !== path.sep && sourceFileName && request && absoluteBaseUrl && paths) {
    for (const key of Object.keys(paths)) {
      const starReplace = key === request ? '' : matchStar(key, request);
      if (starReplace !== undefined) {
        for (const pathToTry of paths[key]) {
          const possibleModule = path.resolve(absoluteBaseUrl, pathToTry.replace('*', starReplace));
          const sourceFileDir = path.dirname(sourceFileName);
          if (fileExists(possibleModule)
            || fileExists(possibleModule + '.ts')
            || fileExists(possibleModule + '.tsx')) {
            return convertToLocal(path.relative(sourceFileDir, possibleModule));
          }
        }
      }
    }
  }
  return undefined;

}

function convertToLocal(pathString: string) {
  if (pathString && pathString[0] !== ".") {
    return `.${path.sep}${pathString}`;
  }

  return pathString;
}
