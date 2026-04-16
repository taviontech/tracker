resource "aws_sqs_queue" "dlq" {
  name                      = "${var.project}-conversion-tasks-dlq"
  message_retention_seconds = 1209600
}

resource "aws_sqs_queue" "tasks" {
  name                       = "${var.project}-conversion-tasks"
  visibility_timeout_seconds = 360
  message_retention_seconds  = 86400

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = 3
  })
}

resource "aws_cloudwatch_metric_alarm" "dlq_not_empty" {
  alarm_name          = "${var.project}-dlq-not-empty"
  alarm_description   = "Messages in DLQ — conversion tasks are failing"
  namespace           = "AWS/SQS"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  dimensions = {
    QueueName = aws_sqs_queue.dlq.name
  }
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 1
  threshold           = 1
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"
}
