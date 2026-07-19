import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

/**
 * Arguments for the {@link ComputeInstance} component.
 */
export interface ComputeInstanceArgs {
    /** The name of the compute instance. */
    name: pulumi.Input<string>;
    /** The zone in which to create the instance. */
    zone: pulumi.Input<string>;
    /** The subnetwork to attach the instance to (name or self link). */
    subnetwork: pulumi.Input<string>;
    /** The machine type for the instance. Defaults to "e2-micro". */
    machineType?: pulumi.Input<string>;
    /** The boot disk image for the instance. Defaults to "debian-cloud/debian-12". */
    image?: pulumi.Input<string>;
    /** A map of labels to apply to the instance. */
    labels?: pulumi.Input<{ [key: string]: pulumi.Input<string> }>;
}

/**
 * A Compute Engine VM instance attached to a given subnetwork.
 */
export class ComputeInstance extends pulumi.ComponentResource {
    /** The underlying compute instance resource. */
    public readonly instance: gcp.compute.Instance;
    /** The name of the instance. */
    public readonly name: pulumi.Output<string>;
    /** The fully-qualified ID of the instance. */
    public readonly instanceId: pulumi.Output<string>;
    /** The internal (private) IP address of the instance's primary NIC. */
    public readonly internalIp: pulumi.Output<string>;

    constructor(name: string, args: ComputeInstanceArgs, opts?: pulumi.ComponentResourceOptions) {
        super("genops:gcp:ComputeInstance", name, {}, opts);

        this.instance = new gcp.compute.Instance(`${name}-instance`, {
            name: args.name,
            machineType: args.machineType ?? "e2-micro",
            zone: args.zone,
            bootDisk: {
                initializeParams: {
                    image: args.image ?? "debian-cloud/debian-12",
                },
            },
            networkInterfaces: [{
                subnetwork: args.subnetwork,
            }],
            labels: args.labels,
        }, { parent: this });

        this.name = this.instance.name;
        this.instanceId = this.instance.id;
        this.internalIp = this.instance.networkInterfaces.apply(
            (nics) => nics[0].networkIp,
        );

        this.registerOutputs({
            name: this.name,
            instanceId: this.instanceId,
            internalIp: this.internalIp,
        });
    }
}
