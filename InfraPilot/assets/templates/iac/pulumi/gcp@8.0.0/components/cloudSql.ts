import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

/**
 * Arguments for the {@link CloudSql} component.
 */
export interface CloudSqlArgs {
    /** The name of the Cloud SQL instance. */
    instanceName: pulumi.Input<string>;
    /** The region for the instance. */
    region: pulumi.Input<string>;
    /** The name of the initial database to create. */
    databaseName: pulumi.Input<string>;
    /** The name of the database user to create. */
    userName: pulumi.Input<string>;
    /**
     * The database user password. Pass via Pulumi secret/config; never
     * hardcode. Wrap with `pulumi.secret(...)` so it is encrypted in state.
     */
    password: pulumi.Input<string>;
    /** The database engine version. Defaults to "POSTGRES_16". */
    databaseVersion?: pulumi.Input<string>;
    /** The machine tier. Defaults to "db-f1-micro". */
    tier?: pulumi.Input<string>;
    /** Protect the instance from deletion. Defaults to true. */
    deletionProtection?: pulumi.Input<boolean>;
    /** Assign a public IPv4 address. Defaults to false. */
    publicIp?: pulumi.Input<boolean>;
    /** Self-link of a VPC network for private IP connectivity. */
    privateNetwork?: pulumi.Input<string>;
    /** Enable automated backups. Defaults to true. */
    backupEnabled?: pulumi.Input<boolean>;
    /** Backup start time (HH:MM, UTC). Defaults to "03:00". */
    backupStartTime?: pulumi.Input<string>;
    /** A map of user labels to apply to the instance. */
    labels?: pulumi.Input<{ [key: string]: pulumi.Input<string> }>;
}

/**
 * A Cloud SQL instance with an initial database and user, private by default
 * (no public IP) and protected from deletion.
 */
export class CloudSql extends pulumi.ComponentResource {
    /** The underlying Cloud SQL instance resource. */
    public readonly instance: gcp.sql.DatabaseInstance;
    /** The instance name. */
    public readonly instanceName: pulumi.Output<string>;
    /** The connection name used by the Cloud SQL proxy/connectors. */
    public readonly connectionName: pulumi.Output<string>;
    /** The private IP address of the instance (when private networking is configured). */
    public readonly privateIpAddress: pulumi.Output<string>;
    /** The name of the created database. */
    public readonly databaseName: pulumi.Output<string>;

    constructor(name: string, args: CloudSqlArgs, opts?: pulumi.ComponentResourceOptions) {
        super("genops:gcp:CloudSql", name, {}, opts);

        this.instance = new gcp.sql.DatabaseInstance(`${name}-instance`, {
            name: args.instanceName,
            region: args.region,
            databaseVersion: args.databaseVersion ?? "POSTGRES_16",
            deletionProtection: args.deletionProtection ?? true,
            settings: {
                tier: args.tier ?? "db-f1-micro",
                ipConfiguration: {
                    // Private by default: no public IPv4 address.
                    ipv4Enabled: args.publicIp ?? false,
                    privateNetwork: args.privateNetwork,
                },
                backupConfiguration: {
                    enabled: args.backupEnabled ?? true,
                    startTime: args.backupStartTime ?? "03:00",
                },
                userLabels: args.labels,
            },
        }, { parent: this });

        const database = new gcp.sql.Database(`${name}-database`, {
            name: args.databaseName,
            instance: this.instance.name,
        }, { parent: this });

        new gcp.sql.User(`${name}-user`, {
            name: args.userName,
            instance: this.instance.name,
            password: args.password,
        }, { parent: this });

        this.instanceName = this.instance.name;
        this.connectionName = this.instance.connectionName;
        this.privateIpAddress = this.instance.privateIpAddress;
        this.databaseName = database.name;

        this.registerOutputs({
            instanceName: this.instanceName,
            connectionName: this.connectionName,
            privateIpAddress: this.privateIpAddress,
            databaseName: this.databaseName,
        });
    }
}
