#!/usr/bin/env node
import "source-map-support/register";
import { App } from "aws-cdk-lib";
import { BedrockAgentsStack } from "../lib/bedrockagents-stack.js";

const app = new App();
new BedrockAgentsStack(app, "BedrockAgentsStack", {});