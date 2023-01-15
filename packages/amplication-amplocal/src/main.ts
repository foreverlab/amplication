import {
  Entity,
  EntityField,
  EnumDataType,
  types,
} from "@amplication/code-gen-types";
import { existsSync } from "fs";
import { lstat } from "fs/promises";
import { JsonDb } from "./JsonDb";
import { prompt } from "enquirer";
import { boolean } from "@amplication/code-gen-types/schemas";

console.log("AMPLOCAL...");

let args = process.argv;

// remove nx dev args
// if (args[0].endsWith("ts-node")) {
args = args.slice(2);
// }
// console.log("Args", args);

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

  const log = (msg: string) => {
    // do nothing
  };
  // const log = (msg: string) => console.info(msg);
  const jsonDb: JsonDb = new JsonDb(source, log);
  await jsonDb.load();

  await validateEntities(jsonDb);
}

async function validateEntities(jsonDb: JsonDb): Promise<string[]> {
  const ents: Entity[] = jsonDb.definitiion.entities;
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
    // console.log(`Validating Entity: ${ent.name}`);

    for (let n = 0; n < ent.fields.length; n++) {
      // ent.fields.map(async (f) => {
      const f = ent.fields[n];
      if (f.dataType === EnumDataType.Lookup) {
        const props: types.Lookup = f.properties as types.Lookup;
        if (!props) {
          // console.info(`Lookup properties not found for ${ent.name}.${f.name}`);
          console.info(`\n ### ${ent.name}.${f.name} ###`);
          console.info(
            `  > This field needs to point to a related field containing the related objects.
  > e.g. city.countryId => country.cities
  > Let's figure out what ${f.name} on ${ent.name} should point to...\n`
          );

          console.info(
            `  [Hint: Id fields probably don't need multiple selection]`
          );
          const resp: { multiSelection: boolean } = await prompt({
            type: "confirm",
            name: "multiSelection",
            message: `Allow Multiple Selection for ${ent.name}.${f.name}?`,
          });
          // console.log("Multi: ", resp.multiSelection);

          const entResp: { entity: string } = await prompt({
            type: "select",
            name: "entity",
            message: `On which entity is '${f.name}'?`,
            choices: ents.map((nt) => nt.name),
          });
          // console.log("Ent: ", entResp.entity);

          if (resp.multiSelection) {
            console.info(`  [Hint: The field might be '${ent.name} + ID']`);
          } else {
            console.info(
              `  [Hint: The field might be the plural version of ${ent.name}]`
            );
          }

          const foundEnt = ents.find((nt) => nt.name === entResp.entity);
          const fieldResp: { field: string } = await prompt({
            type: "select",
            name: "field",
            message: `Which field on ${entResp.entity}?`,
            choices: foundEnt.fields.map((f) => f.name),
          });

          const foundField = foundEnt.fields.find(
            (f) => f.name === fieldResp.field
          );
          const props: types.Lookup = {
            allowMultipleSelection: resp.multiSelection,
            relatedEntityId: foundEnt.id,
            relatedFieldId: foundField.id,
          };
          f.properties = props;

          console.info(`\nFinal Field: ${JSON.stringify(f, null, 2)}`);

          const saveResp: { save: boolean } = await prompt({
            type: "confirm",
            name: "save",
            message: "Should we write this to file?",
          });

          if (saveResp.save) {
            console.info(`Saving entity '${ent.name}' (${ent.id})\n`);
            const newEnt: Entity = jsonDb.updateField(ent, f);
            await jsonDb.saveEntity(newEnt);
          } else {
            console.info("Okay. Skipping save. Moving on...\n");
          }
        }
      }
      // });
    }
  }

  return errs;
}
