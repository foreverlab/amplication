import {
  AppInfo,
  DSGResourceData,
  Entity,
  PluginInstallation,
  Role,
} from "@amplication/code-gen-types";
import { readdir, readFile } from "fs/promises";
import { join } from "path";

export async function readInputJsonDir(dir: string): Promise<DSGResourceData> {
  const pluginFile = join(dir, "pluginInstallations.json");
  const resourceFile = join(dir, "resourceInfo.json");
  const entityDir = join(dir, "entities");
  const roleDir = join(dir, "roles");

  let entities = await parseJsonDir<Entity>(entityDir, "Entity");
  entities = mapPermanentIds(entities);

  const result: DSGResourceData = {
    resourceType: "Service",
    resourceInfo: await parseJsonFile<AppInfo>(resourceFile, "AppInfo"),
    entities: entities,
    roles: await parseJsonDir<Role>(roleDir, "Role"),
    pluginInstallations: await parseJsonFile<PluginInstallation[]>(
      pluginFile,
      "PluginInstallation"
    ),
  };

  return result;
}

// amplication uses permanentIds as references in relationships for fields
// so we are just duplcicating the id into that field
function mapPermanentIds(entities: Entity[]): Entity[] {
  return entities.map((e) => {
    const ent = {
      ...e,
    };

    ent.fields = ent.fields.map((f) => ({
      ...f,
      permanentId: f.id,
    }));

    return ent;
  });
}

async function parseJsonDir<T>(dirPath: string, type: string): Promise<T[]> {
  console.info(`> Finding ${type} models in '${dirPath}'...`);
  const files = await readdir(dirPath);
  const modelPromises = files.map(async (f) => {
    const fPath = join(dirPath, f);
    const model = await parseJsonFile<T>(fPath, type);
    return model;
  });
  const results = await Promise.all(modelPromises);
  return results;
}

async function parseJsonFile<T>(filePath: string, type: string): Promise<T> {
  console.info(`> Reading ${type} model from '${filePath}'`);
  const file = await readFile(filePath, "utf8");
  const resourceData: T = JSON.parse(file);
  return resourceData;
}
