/* eslint-disable @typescript-eslint/naming-convention */
export class Env {
  static readonly CLIENT_HOST = "CLIENT_HOST";

  static readonly CODE_GENERATION_REQUEST_TOPIC =
    "CODE_GENERATION_REQUEST_TOPIC";
  static readonly CODE_GENERATION_SUCCESS_TOPIC =
    "CODE_GENERATION_SUCCESS_TOPIC";
  static readonly CODE_GENERATION_FAILURE_TOPIC =
    "CODE_GENERATION_FAILURE_TOPIC";

  static readonly CREATE_PR_REQUEST_TOPIC = "CREATE_PR_REQUEST_TOPIC";
  static readonly CREATE_PR_SUCCESS_TOPIC = "CREATE_PR_SUCCESS_TOPIC";
  static readonly CREATE_PR_FAILURE_TOPIC = "CREATE_PR_FAILURE_TOPIC";

  static readonly DSG_LOG_TOPIC = "DSG_LOG_TOPIC";

  static readonly BILLING_ENABLED = "BILLING_ENABLED";
  static readonly BILLING_API_KEY = "BILLING_API_KEY";
}
