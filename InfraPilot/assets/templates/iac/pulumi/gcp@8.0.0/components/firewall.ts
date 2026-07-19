import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

/**
 * Arguments for the {@link Firewall} component.
 */
export interface FirewallArgs {
    /** The name of the firewall rule. */
    name: pulumi.Input<string>;
    /** The network this firewall rule applies to (name or self link). */
    network: pulumi.Input<string>;
    /** List of TCP ports to allow. Defaults to ["22", "80", "443"]. */
    allowedPorts?: pulumi.Input<pulumi.Input<string>[]>;
    /** Source IP CIDR ranges this rule applies to. Defaults to ["0.0.0.0/0"]. */
    sourceRanges?: pulumi.Input<pulumi.Input<string>[]>;
}

/**
 * A firewall rule allowing inbound TCP traffic on the given ports.
 */
export class Firewall extends pulumi.ComponentResource {
    /** The underlying firewall resource. */
    public readonly firewall: gcp.compute.Firewall;
    /** The name of the firewall rule. */
    public readonly name: pulumi.Output<string>;
    /** The fully-qualified ID of the firewall rule. */
    public readonly firewallId: pulumi.Output<string>;

    constructor(name: string, args: FirewallArgs, opts?: pulumi.ComponentResourceOptions) {
        super("genops:gcp:Firewall", name, {}, opts);

        this.firewall = new gcp.compute.Firewall(`${name}-firewall`, {
            name: args.name,
            network: args.network,
            allows: [{
                protocol: "tcp",
                ports: args.allowedPorts ?? ["22", "80", "443"],
            }],
            sourceRanges: args.sourceRanges ?? ["0.0.0.0/0"],
        }, { parent: this });

        this.name = this.firewall.name;
        this.firewallId = this.firewall.id;

        this.registerOutputs({
            name: this.name,
            firewallId: this.firewallId,
        });
    }
}
