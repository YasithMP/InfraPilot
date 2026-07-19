import * as pulumi from "@pulumi/pulumi";
import * as compute from "@pulumi/azure-native/compute";
import * as network from "@pulumi/azure-native/network";

/**
 * Arguments for the {@link LinuxVirtualMachine} component.
 */
export interface LinuxVirtualMachineArgs {
  /** The name of the Linux virtual machine. */
  virtualMachineName: pulumi.Input<string>;
  /** The name of the network interface for the VM. */
  networkInterfaceName: pulumi.Input<string>;
  /** The resource group for the VM resources. */
  resourceGroupName: pulumi.Input<string>;
  /** The Azure location (region). */
  location: pulumi.Input<string>;
  /** The subnet ID used by the VM network interface. */
  subnetId: pulumi.Input<string>;
  /** The admin username for the Linux VM. */
  adminUsername: pulumi.Input<string>;
  /** The SSH public key for admin access (password auth is disabled). */
  adminSshPublicKey: pulumi.Input<string>;
  /** The size of the Linux virtual machine. Defaults to "Standard_B2s". */
  vmSize?: pulumi.Input<string>;
  /** The storage account type for the OS disk. Defaults to "Standard_LRS". */
  osDiskStorageAccountType?: pulumi.Input<string>;
  /** Image publisher. Defaults to "Canonical". */
  imagePublisher?: pulumi.Input<string>;
  /** Image offer. Defaults to "0001-com-ubuntu-server-jammy". */
  imageOffer?: pulumi.Input<string>;
  /** Image SKU. Defaults to "22_04-lts". */
  imageSku?: pulumi.Input<string>;
  /** Image version. Defaults to "latest". */
  imageVersion?: pulumi.Input<string>;
  /** Optional resource tags. */
  tags?: pulumi.Input<{ [key: string]: pulumi.Input<string> }>;
}

/**
 * Azure Linux Virtual Machine with an attached network interface.
 *
 * Mirrors the Terraform `linux_virtual_machine` module. SSH key authentication
 * is used; password authentication is disabled.
 */
export class LinuxVirtualMachine extends pulumi.ComponentResource {
  /** The virtual machine resource ID. */
  public readonly id: pulumi.Output<string>;
  /** The network interface resource ID. */
  public readonly networkInterfaceId: pulumi.Output<string>;
  /** The private IP address of the VM network interface. */
  public readonly privateIpAddress: pulumi.Output<string | undefined>;

  constructor(name: string, args: LinuxVirtualMachineArgs, opts?: pulumi.ComponentResourceOptions) {
    super("genops:azure:LinuxVirtualMachine", name, {}, opts);

    const vmSize = args.vmSize ?? "Standard_B2s";
    const osDiskStorageAccountType = args.osDiskStorageAccountType ?? "Standard_LRS";
    const imagePublisher = args.imagePublisher ?? "Canonical";
    const imageOffer = args.imageOffer ?? "0001-com-ubuntu-server-jammy";
    const imageSku = args.imageSku ?? "22_04-lts";
    const imageVersion = args.imageVersion ?? "latest";

    const nic = new network.NetworkInterface(
      `${name}-nic`,
      {
        networkInterfaceName: args.networkInterfaceName,
        resourceGroupName: args.resourceGroupName,
        location: args.location,
        ipConfigurations: [
          {
            name: "ipconfig1",
            subnet: { id: args.subnetId },
            privateIPAllocationMethod: network.IPAllocationMethod.Dynamic,
          },
        ],
        tags: args.tags,
      },
      { parent: this },
    );

    const vm = new compute.VirtualMachine(
      name,
      {
        vmName: args.virtualMachineName,
        resourceGroupName: args.resourceGroupName,
        location: args.location,
        networkProfile: {
          networkInterfaces: [{ id: nic.id, primary: true }],
        },
        hardwareProfile: { vmSize: vmSize },
        osProfile: {
          computerName: args.virtualMachineName,
          adminUsername: args.adminUsername,
          linuxConfiguration: {
            disablePasswordAuthentication: true,
            ssh: {
              publicKeys: [
                {
                  keyData: args.adminSshPublicKey,
                  path: pulumi.interpolate`/home/${args.adminUsername}/.ssh/authorized_keys`,
                },
              ],
            },
          },
        },
        storageProfile: {
          osDisk: {
            createOption: compute.DiskCreateOptionTypes.FromImage,
            caching: compute.CachingTypes.ReadWrite,
            managedDisk: { storageAccountType: osDiskStorageAccountType },
          },
          imageReference: {
            publisher: imagePublisher,
            offer: imageOffer,
            sku: imageSku,
            version: imageVersion,
          },
        },
        tags: args.tags,
      },
      { parent: this },
    );

    this.id = vm.id;
    this.networkInterfaceId = nic.id;
    this.privateIpAddress = nic.ipConfigurations.apply(
      (configs) => configs?.[0]?.privateIPAddress,
    );

    this.registerOutputs({
      id: this.id,
      networkInterfaceId: this.networkInterfaceId,
      privateIpAddress: this.privateIpAddress,
    });
  }
}
