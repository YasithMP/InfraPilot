import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

/**
 * Arguments for the {@link VpcNetwork} component.
 */
export interface VpcNetworkArgs {
    /** The name of the VPC network. */
    networkName: pulumi.Input<string>;
    /** The name of the subnetwork. */
    subnetName: pulumi.Input<string>;
    /** The region for the subnetwork. */
    region: pulumi.Input<string>;
    /** The IPv4 CIDR range for the subnetwork. Defaults to "10.10.1.0/24". */
    subnetCidr?: pulumi.Input<string>;
}

/**
 * A VPC network with an explicitly managed subnetwork
 * (auto-created subnetworks are disabled).
 */
export class VpcNetwork extends pulumi.ComponentResource {
    /** The underlying VPC network resource. */
    public readonly network: gcp.compute.Network;
    /** The underlying subnetwork resource. */
    public readonly subnetwork: gcp.compute.Subnetwork;
    /** The name of the VPC network. */
    public readonly name: pulumi.Output<string>;
    /** The fully-qualified ID of the VPC network. */
    public readonly networkId: pulumi.Output<string>;
    /** The fully-qualified ID of the subnetwork. */
    public readonly subnetId: pulumi.Output<string>;
    /** The URI (self link) of the VPC network. */
    public readonly networkSelfLink: pulumi.Output<string>;

    constructor(name: string, args: VpcNetworkArgs, opts?: pulumi.ComponentResourceOptions) {
        super("genops:gcp:VpcNetwork", name, {}, opts);

        this.network = new gcp.compute.Network(`${name}-network`, {
            name: args.networkName,
            autoCreateSubnetworks: false,
        }, { parent: this });

        this.subnetwork = new gcp.compute.Subnetwork(`${name}-subnet`, {
            name: args.subnetName,
            network: this.network.id,
            ipCidrRange: args.subnetCidr ?? "10.10.1.0/24",
            region: args.region,
        }, { parent: this });

        this.name = this.network.name;
        this.networkId = this.network.id;
        this.subnetId = this.subnetwork.id;
        this.networkSelfLink = this.network.selfLink;

        this.registerOutputs({
            name: this.name,
            networkId: this.networkId,
            subnetId: this.subnetId,
            networkSelfLink: this.networkSelfLink,
        });
    }
}
