import * as pulumi from "@pulumi/pulumi";
import * as compute from "@pulumi/azure-native/compute";
import * as network from "@pulumi/azure-native/network";

/**
 * Arguments for the {@link WindowsVirtualMachine} component.
 */
export interface WindowsVirtualMachineArgs {
  /** The name of the Windows virtual machine. */
  virtualMachineName: pulumi.Input<string>;
  /** The name of the network interface for the VM. */
  networkInterfaceName: pulumi.Input<string>;
  /** The resource group for the VM resources. */
  resourceGroupName: pulumi.Input<string>;
  /** The Azure location (region). */
  location: pulumi.Input<string>;
  /** The subnet ID used by the VM network interface. */
  subnetId: pulumi.Input<string>;
  /** The admin username for the Windows VM. */
  adminUsername: pulumi.Input<string>;
  /**
   * The admin password for the Windows VM. Pass via Pulumi secret/config; never
   * hardcode. Wrap with `pulumi.secret(...)` so it is encrypted in state.
   */
  adminPassword: pulumi.Input<string>;
  /** The size of the Windows virtual machine. Defaults to "Standard_B2s". */
  vmSize?: pulumi.Input<string>;
  /** The storage account type for the OS disk. Defaults to "Standard_LRS". */
  osDiskStorageAccountType?: pulumi.Input<string>;
  /** Image publisher. Defaults to "MicrosoftWindowsServer". */
  imagePublisher?: pulumi.Input<string>;
  /** Image offer. Defaults to "WindowsServer". */
  imageOffer?: pulumi.Input<string>;
  /** Image SKU. Defaults to "2022-datacenter-azure-edition". */
  imageSku?: pulumi.Input<string>;
  /** Image version. Defaults to "latest". */
  imageVersion?: pulumi.Input<string>;
  /** Optional resource tags. */
  tags?: pulumi.Input<{ [key: string]: pulumi.Input<string> }>;
}

/**
 * Azure Windows Virtual Machine with an attached network interface.
 *
 * Mirrors the Terraform `windows_virtual_machine` module.
 */
export class WindowsVirtualMachine extends pulumi.ComponentResource {
  /** The virtual machine resource ID. */
  public readonly id: pulumi.Output<string>;
  /** The network interface resource ID. */
  public readonly networkInterfaceId: pulumi.Output<string>;
  /** The private IP address of the VM network interface. */
  public readonly privateIpAddress: pulumi.Output<string | undefined>;

  constructor(name: string, args: WindowsVirtualMachineArgs, opts?: pulumi.ComponentResourceOptions) {
    super("genops:azure:WindowsVirtualMachine", name, {}, opts);

    const vmSize = args.vmSize ?? "Standard_B2s";
    const osDiskStorageAccountType = args.osDiskStorageAccountType ?? "Standard_LRS";
    const imagePublisher = args.imagePublisher ?? "MicrosoftWindowsServer";
    const imageOffer = args.imageOffer ?? "WindowsServer";
    const imageSku = args.imageSku ?? "2022-datacenter-azure-edition";
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
          adminPassword: args.adminPassword,
          windowsConfiguration: {
            enableAutomaticUpdates: true,
            provisionVMAgent: true,
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
