import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

/**
 * Arguments for the {@link SecretsManagerSecret} component.
 */
export interface SecretsManagerSecretArgs {
    /** The name of the secret. */
    secretName: pulumi.Input<string>;
    /** An optional description of the secret. */
    description?: pulumi.Input<string>;
    /**
     * Optional initial secret value; a secret version is created only when
     * this is set. Pass via Pulumi secret/config; never hardcode. Wrap with
     * `pulumi.secret(...)` so it is encrypted in state.
     */
    secretValue?: pulumi.Input<string>;
    /** Recovery window in days before permanent deletion. Defaults to 30. */
    recoveryWindowInDays?: pulumi.Input<number>;
    /** Optional KMS key ARN for encryption (uses the AWS-managed key when omitted). */
    kmsKeyId?: pulumi.Input<string>;
    /** Tags to apply to the secret. */
    tags?: pulumi.Input<{ [key: string]: pulumi.Input<string> }>;
}

/**
 * A Secrets Manager secret with an optional initial version.
 *
 * When `secretValue` is omitted, only the secret container is created — add
 * versions separately, sourcing values from config or an external store.
 */
export class SecretsManagerSecret extends pulumi.ComponentResource {
    /** The underlying secret resource. */
    public readonly secret: aws.secretsmanager.Secret;
    /** The secret ID. */
    public readonly secretId: pulumi.Output<string>;
    /** The secret ARN. */
    public readonly secretArn: pulumi.Output<string>;
    /** The secret name. */
    public readonly secretName: pulumi.Output<string>;

    constructor(name: string, args: SecretsManagerSecretArgs, opts?: pulumi.ComponentResourceOptions) {
        super("genops:aws:SecretsManagerSecret", name, {}, opts);

        const tags = args.tags ?? {};

        this.secret = new aws.secretsmanager.Secret(`${name}-secret`, {
            name: args.secretName,
            description: args.description,
            kmsKeyId: args.kmsKeyId,
            recoveryWindowInDays: args.recoveryWindowInDays ?? 30,
            tags,
        }, { parent: this });

        if (args.secretValue !== undefined) {
            new aws.secretsmanager.SecretVersion(`${name}-version`, {
                secretId: this.secret.id,
                secretString: args.secretValue,
            }, { parent: this });
        }

        this.secretId = this.secret.id;
        this.secretArn = this.secret.arn;
        this.secretName = this.secret.name;

        this.registerOutputs({
            secretId: this.secretId,
            secretArn: this.secretArn,
            secretName: this.secretName,
        });
    }
}
