import * as pulumi from "@pulumi/pulumi";
import * as dbforpostgresql from "@pulumi/azure-native/dbforpostgresql";

/**
 * Arguments for the {@link PostgresqlFlexibleServer} component.
 */
export interface PostgresqlFlexibleServerArgs {
  /** The name of the PostgreSQL Flexible Server. */
  serverName: pulumi.Input<string>;
  /** The name of the initial database to create on the server. */
  databaseName: pulumi.Input<string>;
  /** The resource group for the server. */
  resourceGroupName: pulumi.Input<string>;
  /** The Azure location (region). */
  location: pulumi.Input<string>;
  /** The administrator login name for the server. */
  administratorLogin: pulumi.Input<string>;
  /**
   * The administrator password. Pass via Pulumi secret/config; never
   * hardcode. Wrap with `pulumi.secret(...)` so it is encrypted in state.
   */
  administratorPassword: pulumi.Input<string>;
  /** The PostgreSQL major version. Defaults to "16". */
  version?: pulumi.Input<string>;
  /** The compute SKU name. Defaults to "Standard_B1ms". */
  skuName?: pulumi.Input<string>;
  /** The compute tier. Defaults to "Burstable". */
  skuTier?: pulumi.Input<string>;
  /** Storage size in GB. Defaults to 32. */
  storageSizeGb?: pulumi.Input<number>;
  /** Backup retention in days. Defaults to 7. */
  backupRetentionDays?: pulumi.Input<number>;
  /** Enable geo-redundant backups. Defaults to false. */
  geoRedundantBackup?: pulumi.Input<boolean>;
  /** Optional resource tags. */
  tags?: pulumi.Input<{ [key: string]: pulumi.Input<string> }>;
}

/**
 * Azure Database for PostgreSQL Flexible Server with an initial database.
 *
 * Mirrors the Terraform `postgresql_flexible_server` module.
 */
export class PostgresqlFlexibleServer extends pulumi.ComponentResource {
  /** The server resource ID. */
  public readonly id: pulumi.Output<string>;
  /** The server name. */
  public readonly name: pulumi.Output<string>;
  /** The fully qualified domain name of the server. */
  public readonly fullyQualifiedDomainName: pulumi.Output<string>;
  /** The database resource ID. */
  public readonly databaseId: pulumi.Output<string>;

  constructor(name: string, args: PostgresqlFlexibleServerArgs, opts?: pulumi.ComponentResourceOptions) {
    super("genops:azure:PostgresqlFlexibleServer", name, {}, opts);

    const version = args.version ?? "16";
    const skuName = args.skuName ?? "Standard_B1ms";
    const skuTier = args.skuTier ?? "Burstable";
    const storageSizeGb = args.storageSizeGb ?? 32;
    const backupRetentionDays = args.backupRetentionDays ?? 7;
    const geoRedundantBackup = pulumi.output(args.geoRedundantBackup ?? false);

    const server = new dbforpostgresql.Server(
      name,
      {
        serverName: args.serverName,
        resourceGroupName: args.resourceGroupName,
        location: args.location,
        version: version,
        administratorLogin: args.administratorLogin,
        administratorLoginPassword: args.administratorPassword,
        sku: {
          name: skuName,
          tier: skuTier,
        },
        storage: {
          storageSizeGB: storageSizeGb,
        },
        backup: {
          backupRetentionDays: backupRetentionDays,
          geoRedundantBackup: geoRedundantBackup.apply(geo => (geo ? "Enabled" : "Disabled")),
        },
        tags: args.tags,
      },
      { parent: this },
    );

    const database = new dbforpostgresql.Database(
      `${name}-db`,
      {
        databaseName: args.databaseName,
        resourceGroupName: args.resourceGroupName,
        serverName: server.name,
        charset: "UTF8",
        collation: "en_US.utf8",
      },
      { parent: this },
    );

    this.id = server.id;
    this.name = server.name;
    this.fullyQualifiedDomainName = server.fullyQualifiedDomainName;
    this.databaseId = database.id;

    this.registerOutputs({
      id: this.id,
      name: this.name,
      fullyQualifiedDomainName: this.fullyQualifiedDomainName,
      databaseId: this.databaseId,
    });
  }
}
