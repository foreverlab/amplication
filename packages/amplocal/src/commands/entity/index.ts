import { Command, Flags } from "@oclif/core";
import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname, join } from "path";
// import { DATA_TYPE_OPTIONS } from "../../../../amplication-client/src/Entity/DataTypeSelectField";
import { EnumDataType } from "@amplication/code-gen-types";

export default class Gen extends Command {
  static description = "Modify entities";

  static examples = [
    `$ amplocal entity car
`,
  ];

  static flags = {};

  static args = [
    {
      name: "entity",
      description: "Name of the entity to modify",
      required: true,
    },
  ];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Gen);

    let dataType: keyof typeof EnumDataType;
    for (dataType in EnumDataType) {
      const val = EnumDataType[dataType];
      this.log(`Option ${dataType} ${val}`);
    }

    this.log(`generating lots of code...`);
  }
}
