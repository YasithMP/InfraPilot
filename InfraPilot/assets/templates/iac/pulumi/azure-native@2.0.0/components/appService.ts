import * as pulumi from "@pulumi/pulumi";
import * as web from "@pulumi/azure-native/web";

/**
 * Arguments for the {@link AppService} component.
 */
export interface AppServiceArgs {
  /** The name of the App Service (Linux Web App). */
  appServiceName: pulumi.Input<string>;
  /** The name of the App Service Plan. */
  servicePlanName: pulumi.Input<string>;
  /** The resource group for the App Service resources. */
  resourceGroupName: pulumi.Input<string>;
  /** The Azure location (region). */
  location: pulumi.Input<string>;
  /** The SKU name for the App Service Plan. Defaults to "B1". */
  skuName?: pulumi.Input<string>;
  /** Whether Always On is enabled for the App Service. Defaults to true. */
  alwaysOn?: pulumi.Input<boolean>;
  /** Optional resource tags. */
  tags?: pulumi.Input<{ [key: string]: pulumi.Input<string> }>;
}

/**
 * Azure Linux App Service backed by an App Service Plan.
 *
 * Mirrors the Terraform `app_service` module (Linux web app).
 */
export class AppService extends pulumi.ComponentResource {
  /** The App Service (web app) resource ID. */
  public readonly id: pulumi.Output<string>;
  /** The default hostname of the App Service. */
  public readonly defaultHostname: pulumi.Output<string>;
  /** The App Service Plan resource ID. */
  public readonly servicePlanId: pulumi.Output<string>;

  constructor(name: string, args: AppServiceArgs, opts?: pulumi.ComponentResourceOptions) {
    super("genops:azure:AppService", name, {}, opts);

    const skuName = args.skuName ?? "B1";
    const alwaysOn = args.alwaysOn ?? true;

    const plan = new web.AppServicePlan(
      `${name}-plan`,
      {
        name: args.servicePlanName,
        resourceGroupName: args.resourceGroupName,
        location: args.location,
        // Linux plans require reserved = true.
        kind: "Linux",
        reserved: true,
        sku: { name: skuName },
        tags: args.tags,
      },
      { parent: this },
    );

    const app = new web.WebApp(
      name,
      {
        name: args.appServiceName,
        resourceGroupName: args.resourceGroupName,
        location: args.location,
        serverFarmId: plan.id,
        httpsOnly: true,
        siteConfig: {
          alwaysOn: alwaysOn,
          minTlsVersion: web.SupportedTlsVersions.SupportedTlsVersions_1_2,
        },
        tags: args.tags,
      },
      { parent: this },
    );

    this.id = app.id;
    this.defaultHostname = app.defaultHostName;
    this.servicePlanId = plan.id;

    this.registerOutputs({
      id: this.id,
      defaultHostname: this.defaultHostname,
      servicePlanId: this.servicePlanId,
    });
  }
}
