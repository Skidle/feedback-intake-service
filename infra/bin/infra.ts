#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { FeedbackIntakeStack } from '../lib/feedback-intake-stack';

const app = new cdk.App();

new FeedbackIntakeStack(app, 'FeedbackIntakeStack', {
  description: 'Feedback Intake Service — API on Lambda, dashboard on S3',
});
