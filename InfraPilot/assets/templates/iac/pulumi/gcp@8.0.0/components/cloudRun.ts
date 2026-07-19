import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

/**
 * Arguments for the {@link CloudRun} component.
 */
export interface CloudRunArgs {
    /** The name of the Cloud Run service. */
    serviceName: pulumi.Input<string>;
    /** The location (region) for the Cloud Run service. */
    location: pulumi.Input<string>;
    /** The container image to deploy. */
    image: pulumi.Input<string>;
    /** The container port the service listens on. Defaults to 8080. */
    port?: pulumi.Input<number>;
    /** A map of labels to apply to the service. */
    labels?: pulumi.Input<{ [key: string]: pulumi.Input<string> }>;
}

/**
 * A Cloud Run (v2) service running a single container.
 */
export class CloudRun extends pulumi.ComponentResource {
    /** The underlying Cloud Run v2 service resource. */
    public readonly service: gcp.cloudrunv2.Service;
    /** The fully-qualified ID of the service. */
    public readonly serviceId: pulumi.Output<string>;
    /** The name of the service. */
    public readonly serviceName: pulumi.Output<string>;
    /** The URI at which the service is reachable. */
    public readonly serviceUri: pulumi.Output<string>;

    constructor(name: string, args: CloudRunArgs, opts?: pulumi.ComponentResourceOptions) {
        super("genops:gcp:CloudRun", name, {}, opts);

        this.service = new gcp.cloudrunv2.Service(`${name}-service`, {
            name: args.serviceName,
            location: args.location,
            template: {
                containers: [{
                    image: args.image,
                    ports: {
                        containerPort: args.port ?? 8080,
                    },
                }],
            },
            labels: args.labels,
        }, { parent: this });

        this.serviceId = this.service.id;
        this.serviceName = this.service.name;
        this.serviceUri = this.service.uri;

        this.registerOutputs({
            serviceId: this.serviceId,
            serviceName: this.serviceName,
            serviceUri: this.serviceUri,
        });
    }
}
