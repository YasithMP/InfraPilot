import * as pulumi from "@pulumi/pulumi";
import * as keyvault from "@pulumi/azure-native/keyvault";

/**
 * Arguments for the {@link KeyVault} component.
 */
export interface KeyVaultArgs {
  /** The name of the Key Vault. */
  keyVaultName: pulumi.Input<string>;
  /** The resource group for the Key Vault. */
  resourceGroupName: pulumi.Input<string>;
  /** The Azure location (region). */
  location: pulumi.Input<string>;
  /** The Azure AD tenant ID used by the Key Vault. */
  tenantId: pulumi.Input<string>;
  /** The Key Vault SKU name. Defaults to "standard". */
  skuName?: pulumi.Input<keyvault.SkuName | string>;
  /** Soft delete retention in days. Defaults to 90. */
  softDeleteRetentionDays?: pulumi.Input<number>;
  /** Enable purge protection. Defaults to true. */
  purgeProtectionEnabled?: pulumi.Input<boolean>;
  /** Optional resource tags. */
  tags?: pulumi.Input<{ [key: string]: pulumi.Input<string> }>;
}

/**
 * Azure Key Vault configured for RBAC authorization (no hardcoded access policies).
 *
 * Mirrors the Terraform `key_vault` module.
 */
export class KeyVault extends pulumi.ComponentResource {
  /** The Key Vault resource ID. */
  public readonly id: pulumi.Output<string>;
  /** The Key Vault name. */
  public readonly name: pulumi.Output<string>;
  /** The Key Vault URI. */
  public readonly vaultUri: pulumi.Output<string>;

  constructor(name: string, args: KeyVaultArgs, opts?: pulumi.ComponentResourceOptions) {
    super("genops:azure:KeyVault", name, {}, opts);

    const skuName = (args.skuName ?? keyvault.SkuName.Standard) as pulumi.Input<keyvault.SkuName>;
    const softDeleteRetentionDays = args.softDeleteRetentionDays ?? 90;
    const purgeProtectionEnabled = args.purgeProtectionEnabled ?? true;

    const vault = new keyvault.Vault(
      name,
      {
        vaultName: args.keyVaultName,
        resourceGroupName: args.resourceGroupName,
        location: args.location,
        properties: {
          tenantId: args.tenantId,
          sku: {
            family: keyvault.SkuFamily.A,
            name: skuName,
          },
          // Prefer RBAC over access policies; no secrets hardcoded.
          enableRbacAuthorization: true,
          enableSoftDelete: true,
          softDeleteRetentionInDays: softDeleteRetentionDays,
          enablePurgeProtection: purgeProtectionEnabled,
        },
        tags: args.tags,
      },
      { parent: this },
    );

    this.id = vault.id;
    this.name = vault.name;
    this.vaultUri = vault.properties.vaultUri;

    this.registerOutputs({
      id: this.id,
      name: this.name,
      vaultUri: this.vaultUri,
    });
  }
}
