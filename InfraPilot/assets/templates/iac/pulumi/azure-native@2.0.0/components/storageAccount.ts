import * as pulumi from "@pulumi/pulumi";
import * as storage from "@pulumi/azure-native/storage";

/**
 * Arguments for the {@link StorageAccount} component.
 */
export interface StorageAccountArgs {
  /** Globally unique storage account name. */
  storageAccountName: pulumi.Input<string>;
  /** The resource group for the storage account. */
  resourceGroupName: pulumi.Input<string>;
  /** The Azure location (region). */
  location: pulumi.Input<string>;
  /** Storage account tier. Defaults to "Standard". */
  accountTier?: pulumi.Input<string>;
  /** Storage replication type. Defaults to "LRS". */
  accountReplicationType?: pulumi.Input<string>;
  /** Optional resource tags. */
  tags?: pulumi.Input<{ [key: string]: pulumi.Input<string> }>;
}

/**
 * Azure Storage Account with safe defaults (HTTPS only, TLS 1.2 minimum).
 *
 * Mirrors the Terraform `storage_account` module. The SKU name is derived from
 * the account tier and replication type (e.g. "Standard" + "LRS" => "Standard_LRS").
 */
export class StorageAccount extends pulumi.ComponentResource {
  /** The storage account resource ID. */
  public readonly id: pulumi.Output<string>;
  /** The storage account name. */
  public readonly name: pulumi.Output<string>;
  /** The primary blob endpoint. */
  public readonly primaryBlobEndpoint: pulumi.Output<string>;

  constructor(name: string, args: StorageAccountArgs, opts?: pulumi.ComponentResourceOptions) {
    super("genops:azure:StorageAccount", name, {}, opts);

    const accountTier = args.accountTier ?? "Standard";
    const replicationType = args.accountReplicationType ?? "LRS";
    const skuName = pulumi
      .all([accountTier, replicationType])
      .apply(([tier, repl]) => `${tier}_${repl}`);

    const account = new storage.StorageAccount(
      name,
      {
        accountName: args.storageAccountName,
        resourceGroupName: args.resourceGroupName,
        location: args.location,
        kind: storage.Kind.StorageV2,
        sku: { name: skuName },
        // Safe defaults.
        minimumTlsVersion: storage.MinimumTlsVersion.TLS1_2,
        enableHttpsTrafficOnly: true,
        allowBlobPublicAccess: false,
        tags: args.tags,
      },
      { parent: this },
    );

    this.id = account.id;
    this.name = account.name;
    this.primaryBlobEndpoint = account.primaryEndpoints.blob;

    this.registerOutputs({
      id: this.id,
      name: this.name,
      primaryBlobEndpoint: this.primaryBlobEndpoint,
    });
  }
}
