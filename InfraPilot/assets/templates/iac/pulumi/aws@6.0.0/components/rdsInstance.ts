import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

/**
 * Arguments for the {@link RdsInstance} component.
 */
export interface RdsInstanceArgs {
    /** The identifier for the RDS instance. */
    identifier: pulumi.Input<string>;
    /** The database engine. Defaults to "postgres". */
    engine?: pulumi.Input<string>;
    /** The engine version. Defaults to "16". */
    engineVersion?: pulumi.Input<string>;
    /** The instance class. Defaults to "db.t4g.micro". */
    instanceClass?: pulumi.Input<string>;
    /** Allocated storage in GiB. Defaults to 20. */
    allocatedStorage?: pulumi.Input<number>;
    /** The name of the initial database to create. */
    dbName?: pulumi.Input<string>;
    /** The master username. */
    username: pulumi.Input<string>;
    /**
     * The master password. Pass via Pulumi secret/config; never hardcode.
     * Wrap with `pulumi.secret(...)` so it is encrypted in state.
     */
    password: pulumi.Input<string>;
    /** The name of the DB subnet group to place the instance in. */
    dbSubnetGroupName: pulumi.Input<string>;
    /** Security group IDs to associate with the instance. */
    vpcSecurityGroupIds: pulumi.Input<pulumi.Input<string>[]>;
    /** Encrypt storage at rest. Defaults to true. */
    storageEncrypted?: pulumi.Input<boolean>;
    /** Optional KMS key ARN for storage encryption (uses the AWS-managed key when omitted). */
    kmsKeyId?: pulumi.Input<string>;
    /** Backup retention period in days. Defaults to 7. */
    backupRetentionPeriod?: pulumi.Input<number>;
    /** Skip the final snapshot on destroy. Defaults to false. */
    skipFinalSnapshot?: pulumi.Input<boolean>;
    /** Final snapshot identifier (used when skipFinalSnapshot is false). Defaults to "<identifier>-final". */
    finalSnapshotIdentifier?: pulumi.Input<string>;
    /** Tags to apply to the RDS instance. */
    tags?: pulumi.Input<{ [key: string]: pulumi.Input<string> }>;
}

/**
 * An RDS database instance with encrypted storage, no public access and a
 * final snapshot on destroy by default.
 */
export class RdsInstance extends pulumi.ComponentResource {
    /** The underlying RDS instance resource. */
    public readonly instance: aws.rds.Instance;
    /** The RDS instance ID. */
    public readonly instanceId: pulumi.Output<string>;
    /** The RDS instance ARN. */
    public readonly instanceArn: pulumi.Output<string>;
    /** The connection endpoint (address:port). */
    public readonly endpoint: pulumi.Output<string>;
    /** The hostname of the instance. */
    public readonly address: pulumi.Output<string>;
    /** The port the instance listens on. */
    public readonly port: pulumi.Output<number>;

    constructor(name: string, args: RdsInstanceArgs, opts?: pulumi.ComponentResourceOptions) {
        super("genops:aws:RdsInstance", name, {}, opts);

        const tags = args.tags ?? {};

        this.instance = new aws.rds.Instance(`${name}-db`, {
            identifier: args.identifier,
            engine: args.engine ?? "postgres",
            engineVersion: args.engineVersion ?? "16",
            instanceClass: args.instanceClass ?? "db.t4g.micro",
            allocatedStorage: args.allocatedStorage ?? 20,
            dbName: args.dbName,
            username: args.username,
            password: args.password,
            dbSubnetGroupName: args.dbSubnetGroupName,
            vpcSecurityGroupIds: args.vpcSecurityGroupIds,
            // Safe defaults: encrypted at rest, never publicly reachable.
            storageEncrypted: args.storageEncrypted ?? true,
            kmsKeyId: args.kmsKeyId,
            publiclyAccessible: false,
            backupRetentionPeriod: args.backupRetentionPeriod ?? 7,
            skipFinalSnapshot: args.skipFinalSnapshot ?? false,
            finalSnapshotIdentifier:
                args.finalSnapshotIdentifier ?? pulumi.interpolate`${args.identifier}-final`,
            tags: { ...tags, Name: args.identifier },
        }, { parent: this });

        this.instanceId = this.instance.id;
        this.instanceArn = this.instance.arn;
        this.endpoint = this.instance.endpoint;
        this.address = this.instance.address;
        this.port = this.instance.port;

        this.registerOutputs({
            instanceId: this.instanceId,
            instanceArn: this.instanceArn,
            endpoint: this.endpoint,
            address: this.address,
            port: this.port,
        });
    }
}
