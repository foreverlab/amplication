import { Module, AppInfo } from "@amplication/code-gen-types";
import { isEmpty } from "lodash";
import { readCode } from "@amplication/code-gen-utils";
import { replacePlaceholdersInCode } from "../util/text-file-parser";

const templatePath = require.resolve("./create-dotenv.template.env");

/**
 * Creates the .env file based on the given template with placeholder.
 * The function replaces any placeholder in a ${name} format based on the key in the appInfo.settings
 * @returns grants JSON module
 */
export async function createDotEnvModule(
  appInfo: AppInfo,
  baseDirectory: string
): Promise<Module> {
  const MODULE_PATH = `${baseDirectory}/.env`;
  const code = await readCode(templatePath);

  if (
    !isEmpty(appInfo.settings.dbName) &&
    !appInfo.settings.dbName.startsWith("/")
  ) {
    appInfo.settings.dbName = `/${appInfo.settings.dbName}`;
  }

  const serviceSettingsDic: { [key: string]: any } = appInfo.settings;

  return {
    path: MODULE_PATH,
    code: replacePlaceholdersInCode(code, serviceSettingsDic),
  };
}
