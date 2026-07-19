import * as pulumi from "@pulumi/pulumi";
import * as web from "@pulumi/azure-native/web";

/**
 * Arguments for the {@link FunctionApp} component.
 */
export interface FunctionAppArgs {
  /** The name of the Function App. */
  functionAppName: pulumi.Input<string>;
  /** The name of the (consumption) App Service Plan. */
  servicePlanName: pulumi.Input<string>;
  /** The resource group for the Function App resources. */
  resourceGroupName: pulumi.Input<string>;
  /** The Azure location (region). */
  location: pulumi.Input<string>;
  /** The name of an existing storage account used by the Functions runtime. */
  storageAccountName: pulumi.Input<string>;
  /**
   * An access key for the storage account. Pass via Pulumi secret/config;
   * never hardcode. Wrap with `pulumi.secret(...)` so it is encrypted in state.
   */
  storageAccountAccessKey: pulumi.Input<string>;
  /** The Linux runtime stack (linuxFxVersion), e.g. "Node|20" or "Python|3.12". Defaults to "Node|20". */
  runtimeStack?: pulumi.Input<string>;
  /** The Functions extension version. Defaults to "~4". */
  functionsExtensionVersion?: pulumi.Input<string>;
  /** Optional resource tags. */
  tags?: pulumi.Input<{ [key: string]: pulumi.Input<string> }>;
}

/**
 * Azure Linux Function App on a consumption (Y1) plan, wired to an existing
 * storage account, with HTTPS-only, TLS 1.2 minimum and a system-assigned
 * managed identity.
 *
 * Mirrors the Terraform `function_app` module.
 */
export class FunctionApp extends pulumi.ComponentResource {
  /** The Function App resource ID. */
  public readonly id: pulumi.Output<string>;
  /** The Function App name. */
  public readonly name: pulumi.Output<string>;
  /** The default hostname of the Function App. */
  public readonly defaultHostname: pulumi.Output<string>;
  /** The App Service Plan resource ID. */
  public readonly servicePlanId: pulumi.Output<string>;
  /** The principal ID of the system-assigned managed identity. */
  public readonly principalId: pulumi.Output<string>;

  constructor(name: string, args: FunctionAppArgs, opts?: pulumi.ComponentResourceOptions) {
    super("genops:azure:FunctionApp", name, {}, opts);

    const runtimeStack = pulumi.output(args.runtimeStack ?? "Node|20");
    const functionsExtensionVersion = args.functionsExtensionVersion ?? "~4";
    // FUNCTIONS_WORKER_RUNTIME is the lowercase runtime name (e.g. "node").
    const workerRuntime = runtimeStack.apply(stack => stack.split("|")[0].toLowerCase());
    const storageConnectionString = pulumi.interpolate`DefaultEndpointsProtocol=https;AccountName=${args.storageAccountName};AccountKey=${args.storageAccountAccessKey};EndpointSuffix=core.windows.net`;

    const plan = new web.AppServicePlan(
      `${name}-plan`,
      {
        name: args.servicePlanName,
        resourceGroupName: args.resourceGroupName,
        location: args.location,
        // Linux consumption plan.
        kind: "functionapp",
        reserved: true,
        sku: { name: "Y1", tier: "Dynamic" },
        tags: args.tags,
      },
      { parent: this },
    );

    const app = new web.WebApp(
      name,
      {
        name: args.functionAppName,
        resourceGroupName: args.resourceGroupName,
        location: args.location,
        serverFarmId: plan.id,
        kind: "functionapp,linux",
        httpsOnly: true,
        identity: {
          type: web.ManagedServiceIdentityType.SystemAssigned,
        },
        siteConfig: {
          linuxFxVersion: runtimeStack,
          minTlsVersion: web.SupportedTlsVersions.SupportedTlsVersions_1_2,
          appSettings: [
            { name: "AzureWebJobsStorage", value: storageConnectionString },
            { name: "FUNCTIONS_EXTENSION_VERSION", value: functionsExtensionVersion },
            { name: "FUNCTIONS_WORKER_RUNTIME", value: workerRuntime },
          ],
        },
        tags: args.tags,
      },
      { parent: this },
    );

    this.id = app.id;
    this.name = app.name;
    this.defaultHostname = app.defaultHostName;
    this.servicePlanId = plan.id;
    this.principalId = app.identity.apply(identity => identity?.principalId ?? "");

    this.registerOutputs({
      id: this.id,
      name: this.name,
      defaultHostname: this.defaultHostname,
      servicePlanId: this.servicePlanId,
      principalId: this.principalId,
    });
  }
}
