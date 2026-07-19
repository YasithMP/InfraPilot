import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

/**
 * Arguments for the {@link AppRunner} component.
 */
export interface AppRunnerArgs {
    /** The name of the App Runner service. */
    serviceName: pulumi.Input<string>;
    /** The container image identifier (e.g. an ECR or public registry URI). */
    imageIdentifier: pulumi.Input<string>;
    /** The type of image repository (ECR or ECR_PUBLIC). Defaults to "ECR_PUBLIC". */
    imageRepositoryType?: pulumi.Input<string>;
    /** The port the container listens on. Defaults to 8080. */
    port?: pulumi.Input<number>;
    /** CPU units reserved for the service. Defaults to "1024". */
    cpu?: pulumi.Input<string>;
    /** Memory (in MiB) reserved for the service. Defaults to "2048". */
    memory?: pulumi.Input<string>;
    /** Tags to apply to the App Runner service. */
    tags?: pulumi.Input<{ [key: string]: pulumi.Input<string> }>;
}

/**
 * An App Runner service backed by a container image, with auto-deployments
 * disabled by default.
 */
export class AppRunner extends pulumi.ComponentResource {
    /** The underlying App Runner service resource. */
    public readonly service: aws.apprunner.Service;
    /** The App Runner service ID. */
    public readonly serviceId: pulumi.Output<string>;
    /** The App Runner service ARN. */
    public readonly serviceArn: pulumi.Output<string>;
    /** The App Runner service URL. */
    public readonly serviceUrl: pulumi.Output<string>;

    constructor(name: string, args: AppRunnerArgs, opts?: pulumi.ComponentResourceOptions) {
        super("genops:aws:AppRunner", name, {}, opts);

        const tags = args.tags ?? {};
        const port = pulumi.output(args.port ?? 8080);

        this.service = new aws.apprunner.Service(`${name}-service`, {
            serviceName: args.serviceName,
            sourceConfiguration: {
                imageRepository: {
                    imageIdentifier: args.imageIdentifier,
                    imageRepositoryType: args.imageRepositoryType ?? "ECR_PUBLIC",
                    imageConfiguration: {
                        port: port.apply(p => `${p}`),
                    },
                },
                autoDeploymentsEnabled: false,
            },
            instanceConfiguration: {
                cpu: args.cpu ?? "1024",
                memory: args.memory ?? "2048",
            },
            tags: { ...tags, Name: args.serviceName },
        }, { parent: this });

        this.serviceId = this.service.serviceId;
        this.serviceArn = this.service.arn;
        this.serviceUrl = this.service.serviceUrl;

        this.registerOutputs({
            serviceId: this.serviceId,
            serviceArn: this.serviceArn,
            serviceUrl: this.serviceUrl,
        });
    }
}
