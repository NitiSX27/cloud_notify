variable "aws_region" {
  description = "AWS region to deploy resources to"
  type        = string
  default     = "ap-south-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "community-platform"
}

variable "environment" {
  description = "Environment name (e.g. prod, staging, dev)"
  type        = string
  default     = "prod"
}

variable "db_username" {
  description = "Database administrator username"
  type        = string
  default     = "postgres"
  sensitive   = true
}

variable "db_password" {
  description = "Database administrator password"
  type        = string
  sensitive   = true
}

variable "jwt_access_secret" {
  description = "JWT Access Secret"
  type        = string
  sensitive   = true
}

variable "jwt_refresh_secret" {
  description = "JWT Refresh Secret"
  type        = string
  sensitive   = true
}

variable "ses_from_email" {
  description = "Verified SES Email Address"
  type        = string
}
