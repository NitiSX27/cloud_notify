output "alb_dns_name" {
  description = "The DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "ecr_repository_url" {
  description = "The URL of the ECR repository"
  value       = aws_ecr_repository.backend.repository_url
}

output "s3_bucket_name" {
  description = "The name of the S3 bucket for uploads"
  value       = aws_s3_bucket.uploads.id
}

output "sqs_queue_url" {
  description = "The URL of the SQS queue for notifications"
  value       = aws_sqs_queue.notifications.url
}

output "rds_endpoint" {
  description = "The endpoint of the RDS PostgreSQL database"
  value       = aws_db_instance.postgres.endpoint
}

output "redis_endpoint" {
  description = "The endpoint of the ElastiCache Redis cluster"
  value       = aws_elasticache_cluster.redis.cache_nodes[0].address
}
