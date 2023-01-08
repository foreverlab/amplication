import { Command, Flags } from "@oclif/core";
import { DSGResourceData, Module } from "@amplication/code-gen-types";
import {
  createDataService,
  defaultLogger,
} from "@amplication/data-service-generator";
import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname, join } from "path";

export default class Gen extends Command {
  static description = "Generate code";

  static examples = [
    `$ amplocal gen ./myapp.json
generating lots of code...
`,
  ];

  static flags = {
    in: Flags.string({
      char: "i",
      description: "Input JSON",
      required: true,
    }),
    out: Flags.string({
      char: "o",
      description: "Output directory",
      required: true,
    }),
  };

  static args = [
    // { name: "person", description: "Person to say hello to", required: true },
  ];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Gen);

    const buildSpecPath = flags.in;
    const buildOutputPath = flags.out;

    // this.log(`hello ${args.person} from ${flags.from}! (./src/commands/hello/index.ts)`)
    this.log(`generating lots of code...`);
    await this.generateCode(buildSpecPath, buildOutputPath);
  }

  async generateCode(source: string, destination: string): Promise<void> {
    try {
      const resourceData = await this.readInputJson(source);

      // const modules = await createDataService(resourceData, defaultLogger);
      // await this.writeModules(modules, destination);
      console.log("Code generation completed successfully");
    } catch (err) {
      console.error(err);
    }
  }

  async readInputJson(filePath: string): Promise<DSGResourceData> {
    const file = await readFile(filePath, "utf8");
    const resourceData: DSGResourceData = JSON.parse(file);
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
