import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

/**
 * Arguments for the {@link Ec2Instance} component.
 */
export interface Ec2InstanceArgs {
    /** The name of the EC2 instance (applied as the Name tag). */
    name: pulumi.Input<string>;
    /** The AMI ID to launch the instance from. */
    ami: pulumi.Input<string>;
    /** The EC2 instance type. Defaults to "t3.micro". */
    instanceType?: pulumi.Input<string>;
    /** The subnet ID to launch the instance into. */
    subnetId: pulumi.Input<string>;
    /** Security group IDs to associate with the instance. Defaults to []. */
    vpcSecurityGroupIds?: pulumi.Input<pulumi.Input<string>[]>;
    /** Tags to apply to the EC2 instance. */
    tags?: pulumi.Input<{ [key: string]: pulumi.Input<string> }>;
}

/**
 * An EC2 instance with an encrypted root volume.
 */
export class Ec2Instance extends pulumi.ComponentResource {
    /** The underlying EC2 instance resource. */
    public readonly instance: aws.ec2.Instance;
    /** The instance ID. */
    public readonly instanceId: pulumi.Output<string>;
    /** The instance private IP address. */
    public readonly privateIp: pulumi.Output<string>;

    constructor(name: string, args: Ec2InstanceArgs, opts?: pulumi.ComponentResourceOptions) {
        super("genops:aws:Ec2Instance", name, {}, opts);

        const tags = args.tags ?? {};

        this.instance = new aws.ec2.Instance(`${name}-instance`, {
            ami: args.ami,
            instanceType: args.instanceType ?? "t3.micro",
            subnetId: args.subnetId,
            vpcSecurityGroupIds: args.vpcSecurityGroupIds ?? [],
            rootBlockDevice: {
                encrypted: true,
            },
            tags: { ...tags, Name: args.name },
        }, { parent: this });

        this.instanceId = this.instance.id;
        this.privateIp = this.instance.privateIp;

        this.registerOutputs({
            instanceId: this.instanceId,
            privateIp: this.privateIp,
        });
    }
}
