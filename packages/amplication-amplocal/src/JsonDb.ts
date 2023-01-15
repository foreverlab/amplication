import {
  AppInfo,
  DSGResourceData,
  Entity,
  EntityField,
  PluginInstallation,
  Role,
} from "@amplication/code-gen-types";
import { readdir, readFile, writeFile } from "fs/promises";
import { join } from "path";

function getStringSortFn<T>(
  getter: (obj: T) => string
): (a: T, b: T) => number {
  return (a: T, b: T) => stringSortFn(getter(a), getter(b));
}

function stringSortFn(a: string, b: string): number {
  if (a > b) {
    return 1;
  }

  if (a < b) {
    return -1;
  }

  return 0;
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

function getKey<T>(data: T, type: keyof DSGResourceData): string {
  switch (type) {
    case "entities":
      return (data as Entity).id;
    case "pluginInstallations":
      return "plugins";
    case "resourceInfo":
      return (data as AppInfo).id;
    case "roles":
      return `role::${(data as Role).name}`;
    default:
      throw new Error(`Type '${type}' key getter not implemented`);
  }
}

export class JsonDb {
  public definitiion!: DSGResourceData;

  private filesByKey: Map<string, string> = new Map();

  constructor(private rootDir: string, private log: (msg: string) => void) {}

  updateField(entity: Entity, field: EntityField): Entity {
    const fields: EntityField[] = entity.fields.filter(
      (f) => f.id !== field.id
    );
    fields.push(field);

    const result: Entity = {
      ...entity,
      fields: fields.sort(getStringSortFn((e) => e.name)),
    };

    return result;
  }

  async saveEntity(data: Entity): Promise<void> {
    this.write(data, "entities");
  }

  async write<T>(data: T, type: keyof DSGResourceData): Promise<void> {
    const id: string = getKey(data, type);
    const filePath: string = this.filesByKey.get(id);
    await writeFile(filePath, JSON.stringify(data, null, 2));
  }

  async load(): Promise<void> {
    const dir = this.rootDir;
    const pluginFile = join(dir, "pluginInstallations.json");
    const resourceFile = join(dir, "resourceInfo.json");
    const entityDir = join(dir, "entities");
    const roleDir = join(dir, "roles");

    let entities = await this.parseJsonDir<Entity>(
      entityDir,
      "Entity",
      "entities"
    );
    entities = mapPermanentIds(entities);

    const result: DSGResourceData = {
      resourceType: "Service",
      resourceInfo: await this.parseJsonFile<AppInfo>(
        resourceFile,
        "AppInfo",
        "resourceInfo"
      ),
      entities: entities,
      roles: await this.parseJsonDir<Role>(roleDir, "Role", "roles"),
      pluginInstallations: await this.parseJsonFile<PluginInstallation[]>(
        pluginFile,
        "PluginInstallation",
        "pluginInstallations"
      ),
    };

    this.filesByKey.forEach((k, v) => this.log(`File: ${k} -- ${v}`));

    this.definitiion = result;
  }

  async parseJsonDir<T>(
    dirPath: string,
    type: string,
    propName: keyof DSGResourceData
  ): Promise<T[]> {
    this.log(`> Finding ${type} models in '${dirPath}'...`);
    const files = await readdir(dirPath);
    const modelPromises = files.map(async (f) => {
      const fPath = join(dirPath, f);
      const model = await this.parseJsonFile<T>(fPath, type, propName);
      return model;
    });
    const results = await Promise.all(modelPromises);
    return results;
  }

  async parseJsonFile<T>(
    filePath: string,
    type: string,
    propName: keyof DSGResourceData
  ): Promise<T> {
    this.log(`> Reading ${type} model from '${filePath}'`);
    const file = await readFile(filePath, "utf8");
    const resourceData: T = JSON.parse(file);

    this.filesByKey.set(getKey(resourceData, propName), filePath);
    return resourceData;
  }
}
