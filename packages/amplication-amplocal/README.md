# amplocal

> The power of amplication + CLI + local JSON storage

## Getting started

- Get or create your service definition files
  - TODO: Create example to look at
  - TODO: Create a script which creates the input JSON in this folder format
- Run the validator on it and fix any errors it finds
  - From the root `amplication` directory
    - `npm nx build amplication-amplocal`
    - `node ./dist/packages/amplication-amplocal/main.js ~/specs/services/example-svc/`
- Fix up the .env file in `packages\amplication-data-service-generator-runner`
  - `BUILD_SPEC_PATH` should point to the directory that your service definition lives in
    ```sh
    BUILD_OUTPUT_PATH="~/generated"
    BUILD_SPEC_PATH="~/specs/services/example-svc"
    SKIP_HTTP="TRUE"
    ```
- Run the generator
  - `npm nx generate-custom-code amplication-data-service-generator-runner`