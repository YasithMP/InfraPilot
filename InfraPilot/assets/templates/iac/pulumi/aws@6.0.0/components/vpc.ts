import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

/**
 * Arguments for the {@link Vpc} component.
 */
export interface VpcArgs {
    /** The name of the VPC (applied as the Name tag). */
    vpcName: pulumi.Input<string>;
    /** The IPv4 CIDR block for the VPC. Defaults to "10.10.0.0/16". */
    cidrBlock?: pulumi.Input<string>;
    /** The name of the subnet (applied as the Name tag). */
    subnetName: pulumi.Input<string>;
    /** The IPv4 CIDR block for the subnet. Defaults to "10.10.1.0/24". */
    subnetCidr?: pulumi.Input<string>;
    /** Tags to apply to the VPC resources. */
    tags?: pulumi.Input<{ [key: string]: pulumi.Input<string> }>;
}

/**
 * A VPC with DNS support/hostnames enabled and a single subnet.
 */
export class Vpc extends pulumi.ComponentResource {
    /** The underlying VPC resource. */
    public readonly vpc: aws.ec2.Vpc;
    /** The underlying subnet resource. */
    public readonly subnet: aws.ec2.Subnet;
    /** The VPC ID. */
    public readonly vpcId: pulumi.Output<string>;
    /** The subnet ID. */
    public readonly subnetId: pulumi.Output<string>;

    constructor(name: string, args: VpcArgs, opts?: pulumi.ComponentResourceOptions) {
        super("genops:aws:Vpc", name, {}, opts);

        const tags = args.tags ?? {};

        this.vpc = new aws.ec2.Vpc(`${name}-vpc`, {
            cidrBlock: args.cidrBlock ?? "10.10.0.0/16",
            enableDnsSupport: true,
            enableDnsHostnames: true,
            tags: { ...tags, Name: args.vpcName },
        }, { parent: this });

        this.subnet = new aws.ec2.Subnet(`${name}-subnet`, {
            vpcId: this.vpc.id,
            cidrBlock: args.subnetCidr ?? "10.10.1.0/24",
            tags: { ...tags, Name: args.subnetName },
        }, { parent: this });

        this.vpcId = this.vpc.id;
        this.subnetId = this.subnet.id;

        this.registerOutputs({
            vpcId: this.vpcId,
            subnetId: this.subnetId,
        });
    }
}
