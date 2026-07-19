variable "repository_id" {
  description = "The ID of the repository (unique within the location)."
  type        = string
}

variable "location" {
  description = "The location (region) for the repository."
  type        = string
}

variable "format" {
  description = "The format of packages stored in the repository."
  type        = string
  default     = "DOCKER"
}

variable "description" {
  description = "A description of the repository."
  type        = string
  default     = null
}

variable "keep_most_recent_versions" {
  description = "Optional cleanup policy: number of most recent versions to keep. Leave null to disable."
  type        = number
  default     = null
}

variable "labels" {
  description = "A map of labels to apply to the repository."
  type        = map(string)
  default     = {}
}
