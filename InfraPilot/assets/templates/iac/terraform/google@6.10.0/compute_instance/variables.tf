variable "name" {
  description = "The name of the compute instance."
  type        = string
}

variable "machine_type" {
  description = "The machine type for the instance."
  type        = string
  default     = "e2-micro"
}

variable "zone" {
  description = "The zone in which to create the instance."
  type        = string
}

variable "image" {
  description = "The boot disk image for the instance."
  type        = string
  default     = "debian-cloud/debian-12"
}

variable "subnetwork" {
  description = "The subnetwork to attach the instance to (name or self link)."
  type        = string
}

variable "labels" {
  description = "A map of labels to apply to the instance."
  type        = map(string)
  default     = {}
}
