#!/usr/bin/env node
import 'source-map-support/register.js';
import { App, Aspects } from 'aws-cdk-lib';
import { BedrockAgentsStack } from '../lib/bedrockagents-stack.ts';
import { AwsSolutionsChecks } from 'cdk-nag';

const app = new App();
new BedrockAgentsStack(app, 'BedrockAgentsStack', {
  tags: {
    POWERTOOLS_SAMPLE: 'BedrockAgentsFunction',
  },
});
Aspects.of(app).add(new AwsSolutionsChecks());
