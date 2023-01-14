import {
  Entity,
  EntityField,
  EnumDataType,
  types,
} from "@amplication/code-gen-types";
import { existsSync } from "fs";
import { lstat } from "fs/promises";
import { JsonDb } from "./JsonDb";

console.log("AMPLOCAL...");

let args = process.argv;

// remove nx dev args
if (args[0].endsWith("ts-node")) {
  args = args.slice(2);
  console.log("Args", args);
}

const buildSpecPath: string = args[0];

validateJSON(buildSpecPath).catch((err) => {
  console.error(err);
  process.exit(1);
});

export default async function validateJSON(source: string): Promise<void> {
  if (!existsSync(source)) {
    throw new Error(`Source '${source}' does not exist`);
  }

  const stat = await lstat(source);
  if (!stat.isDirectory()) {
    throw new Error("Source must be a directory");
  }

  const jsonDb: JsonDb = new JsonDb(source, (msg) => console.info(msg));
  await jsonDb.load();

  validateEntities(jsonDb.definitiion.entities);
}

function validateEntities(ents: Entity[]): string[] {
  const errs: string[] = [];
  const entsById: Map<string, Entity> = new Map();
  const fieldsById: Map<string, { entity: Entity; field: EntityField }> =
    new Map();

  ents.map((e) => {
    if (entsById.has(e.id)) {
      const dupe: Entity = entsById.get(e.id);
      errs.push(`${e.name}.id is a duplicate of ${dupe.name}.id`);
    } else {
      entsById.set(e.id, e);
    }

    e.fields.map((f) => {
      if (fieldsById.has(f.id)) {
        const { entity, field } = fieldsById.get(f.id);
        errs.push(
          `${e.name}.${f.name}.id is a duplicate of ${entity.name}.${field.name}.id`
        );
      } else {
        fieldsById.set(f.id, { entity: e, field: f });
      }
    });
  });

  if (errs.length) {
    errs.map((err) => console.error(err));
    return errs;
  }

  for (let i = 0; i < ents.length; i++) {
    const ent: Entity = ents[i];
    console.info(`Validating Entity: ${ent.name}`);

    ent.fields.map((f) => {
      if (f.dataType === EnumDataType.Lookup) {
        const props: types.Lookup = f.properties as types.Lookup;
        if (!props) {
          console.error(
            `Lookup properties not found for ${ent.name}.${f.name}`
          );
        }
      }
    });
  }

  return errs;
}
