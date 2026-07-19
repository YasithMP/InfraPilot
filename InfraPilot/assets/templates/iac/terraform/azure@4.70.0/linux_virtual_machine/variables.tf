variable "virtual_machine_name" {
  description = "The name of the Linux virtual machine."
  type        = string
}

variable "network_interface_name" {
  description = "The name of the network interface for the VM."
  type        = string
}

variable "resource_group_name" {
  description = "The resource group for the VM resources."
  type        = string
}

variable "location" {
  description = "The Azure location."
  type        = string
}

variable "subnet_id" {
  description = "The subnet ID used by the VM network interface."
  type        = string
}

variable "vm_size" {
  description = "The size of the Linux virtual machine."
  type        = string
  default     = "Standard_B2s"
}

variable "admin_username" {
  description = "The admin username for the Linux VM."
  type        = string
}

variable "admin_ssh_public_key" {
  description = "The SSH public key for admin access."
  type        = string
}

variable "os_disk_storage_account_type" {
  description = "The storage account type for the OS disk."
  type        = string
  default     = "Standard_LRS"
}

variable "image_publisher" {
  description = "Image publisher for the Linux VM."
  type        = string
  default     = "Canonical"
}

variable "image_offer" {
  description = "Image offer for the Linux VM."
  type        = string
  default     = "0001-com-ubuntu-server-jammy"
}

variable "image_sku" {
  description = "Image SKU for the Linux VM."
  type        = string
  default     = "22_04-lts"
}

variable "image_version" {
  description = "Image version for the Linux VM."
  type        = string
  default     = "latest"
}