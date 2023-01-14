import { Command, Flags } from "@oclif/core";
import {
  AppInfo,
  DSGResourceData,
  Entity,
  Module,
  PluginInstallation,
  Role,
} from "@amplication/code-gen-types";
import {
  createDataService,
  defaultLogger,
} from "@amplication/data-service-generator";
import { mkdir, readdir, readFile, writeFile } from "fs/promises";
import path, { dirname, join } from "path";
import { cwd } from "process";

export default class Gen extends Command {
  static description = "Generate code";

  static examples = [
    `$ amplocal gen ./myapp.json
generating lots of code...
`,
  ];

  static flags = {
    out: Flags.string({
      char: "o",
      description: "Output directory",
      required: true,
    }),
  };

  static args = [
    {
      name: "directory",
      description: "Directory containing JSON schema files",
      required: true,
    },
  ];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Gen);

    const buildSpecPath = args.directory;
    const buildOutputPath = flags.out;

    this.log(`> Reading schema from directory: ${buildSpecPath}`);
    this.log(`> Generating to output directory: ${buildOutputPath}`);
    this.log(`\n`);

    await this.generateCode(buildSpecPath, buildOutputPath);
  }

  async generateCode(source: string, destination: string): Promise<void> {
    try {
      const resourceData = await this.readInput(source);
      await writeFile(
        path.join(cwd(), "specs", "output", "test.json"),
        JSON.stringify(resourceData, null, 2)
      );

      const modules = await createDataService(resourceData, defaultLogger);
      await this.writeModules(modules, destination);
      console.log("Code generation completed successfully");
    } catch (err) {
      console.error(err);
    }
  }

  async readInput(dir: string): Promise<DSGResourceData> {
    const pluginFile = path.join(dir, "pluginInstallations.json");
    const resourceFile = path.join(dir, "resourceInfo.json");
    const entityDir = path.join(dir, "entities");
    const roleDir = path.join(dir, "roles");

    let entities = await this.readInputJsonDir<Entity>(entityDir, "Entity");
    entities = this.mapPermanentIds(entities);

    const result: DSGResourceData = {
      resourceType: "Service",
      resourceInfo: await this.readInputJson<AppInfo>(resourceFile, "AppInfo"),
      entities: entities,
      roles: await this.readInputJsonDir<Role>(roleDir, "Role"),
      pluginInstallations: await this.readInputJson<PluginInstallation[]>(
        pluginFile,
        "PluginInstallation"
      ),
    };

    return result;
  }

  // amplication uses permanentIds as references in relationships for fields
  // so we are just duplcicating the id into that field
  mapPermanentIds(entities: Entity[]): Entity[] {
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

  async readInputJsonDir<T>(dirPath: string, type: string): Promise<T[]> {
    this.log(`> Finding ${type} models in '${dirPath}'...`);
    const files = await readdir(dirPath);
    const modelPromises = files.map(async (f) => {
      const fPath = path.join(dirPath, f);
      const model = await this.readInputJson<T>(fPath, type);
      return model;
    });
    const results = await Promise.all(modelPromises);
    return results;
  }

  async readInputJson<T>(filePath: string, type: string): Promise<T> {
    this.log(`> Reading ${type} model from '${filePath}'`);
    const file = await readFile(filePath, "utf8");
    const resourceData: T = JSON.parse(file);
    return resourceData;
  }

  async writeModules(modules: Module[], destination: string): Promise<void> {
    console.log("Creating base directory");
    await mkdir(destination, { recursive: true });
    console.info(`Writing modules to ${destination} ...`);
    await Promise.all(
      modules.map(async (module) => {
        const filePath = join(destination, module.path);
        await mkdir(dirname(filePath), { recursive: true });
        await writeFile(filePath, module.code);
      })
    );
    console.info(`Successfully wrote modules to ${destination}`);
  }
}
