import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

/**
 * Arguments for the {@link EcrRepository} component.
 */
export interface EcrRepositoryArgs {
    /** The name of the ECR repository. */
    repositoryName: pulumi.Input<string>;
    /** Image tag mutability. Defaults to "IMMUTABLE". */
    imageTagMutability?: pulumi.Input<string>;
    /** Scan images on push. Defaults to true. */
    scanOnPush?: pulumi.Input<boolean>;
    /** Optional KMS key ARN; when set, KMS encryption is used instead of AES256. */
    kmsKeyId?: pulumi.Input<string>;
    /** When set, adds a lifecycle policy keeping only the most recent N images. */
    keepLastImages?: number;
    /** Tags to apply to the ECR repository. */
    tags?: pulumi.Input<{ [key: string]: pulumi.Input<string> }>;
}

/**
 * An ECR repository with immutable tags, scan-on-push and AES256 encryption
 * by default, plus an optional keep-last-N lifecycle policy.
 */
export class EcrRepository extends pulumi.ComponentResource {
    /** The underlying ECR repository resource. */
    public readonly repository: aws.ecr.Repository;
    /** The repository name. */
    public readonly repositoryName: pulumi.Output<string>;
    /** The repository ARN. */
    public readonly repositoryArn: pulumi.Output<string>;
    /** The URL of the repository (used for docker push/pull). */
    public readonly repositoryUrl: pulumi.Output<string>;

    constructor(name: string, args: EcrRepositoryArgs, opts?: pulumi.ComponentResourceOptions) {
        super("genops:aws:EcrRepository", name, {}, opts);

        const tags = args.tags ?? {};

        this.repository = new aws.ecr.Repository(`${name}-repo`, {
            name: args.repositoryName,
            imageTagMutability: args.imageTagMutability ?? "IMMUTABLE",
            imageScanningConfiguration: {
                scanOnPush: args.scanOnPush ?? true,
            },
            encryptionConfigurations: [
                args.kmsKeyId === undefined
                    ? { encryptionType: "AES256" }
                    : { encryptionType: "KMS", kmsKey: args.kmsKeyId },
            ],
            tags: { ...tags, Name: args.repositoryName },
        }, { parent: this });

        if (args.keepLastImages !== undefined) {
            new aws.ecr.LifecyclePolicy(`${name}-lifecycle`, {
                repository: this.repository.name,
                policy: JSON.stringify({
                    rules: [{
                        rulePriority: 1,
                        description: `Keep only the last ${args.keepLastImages} images`,
                        selection: {
                            tagStatus: "any",
                            countType: "imageCountMoreThan",
                            countNumber: args.keepLastImages,
                        },
                        action: { type: "expire" },
                    }],
                }),
            }, { parent: this });
        }

        this.repositoryName = this.repository.name;
        this.repositoryArn = this.repository.arn;
        this.repositoryUrl = this.repository.repositoryUrl;

        this.registerOutputs({
            repositoryName: this.repositoryName,
            repositoryArn: this.repositoryArn,
            repositoryUrl: this.repositoryUrl,
        });
    }
}
