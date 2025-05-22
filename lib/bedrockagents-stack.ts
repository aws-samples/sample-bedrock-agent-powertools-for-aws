import {
  Stack,
  type StackProps,
  CfnOutput,
  RemovalPolicy,
  Arn,
} from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { CfnAgent } from 'aws-cdk-lib/aws-bedrock';
import {
  Effect,
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from 'aws-cdk-lib/aws-iam';

export class BedrockAgentsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const fnName = 'BedrockAgentsFn';
    const logGroup = new LogGroup(this, 'MyLogGroup', {
      logGroupName: `/aws/lambda/${fnName}`,
      removalPolicy: RemovalPolicy.DESTROY,
      retention: RetentionDays.ONE_DAY,
    });
    const fn = new NodejsFunction(this, 'MyFunction', {
      functionName: fnName,
      logGroup,
      runtime: Runtime.NODEJS_22_X,
      entry: './src/index.ts',
      handler: 'handler',
      bundling: {
        minify: true,
        mainFields: ['module', 'main'],
        sourceMap: true,
        format: OutputFormat.ESM,
      },
    });
    fn.addToRolePolicy(
      new PolicyStatement({
        actions: ['geo-places:Autocomplete', 'geo-places:GetPlace'],
        resources: ['*'],
        effect: Effect.ALLOW,
      })
    );

    const agentRole = new Role(this, 'MyAgentRole', {
      assumedBy: new ServicePrincipal('bedrock.amazonaws.com'),
      description: 'Role for Bedrock weather agent',
      inlinePolicies: {
        bedrock: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: [
                /* 'bedrock:InvokeModel',
                'bedrock:InvokeModelWithResponseStream',
                'bedrock:CreateAgent',
                'bedrock:UpdateAgent',
                'bedrock:DeleteAgent',
                'bedrock:PrepareAgent', */
                'bedrock:*',
              ],
              resources: [
                Arn.format(
                  {
                    service: 'bedrock',
                    resource: 'foundation-model/*',
                    region: 'us-*',
                    account: '',
                  },
                  Stack.of(this)
                ),
                Arn.format(
                  {
                    service: 'bedrock',
                    resource: 'inference-profile/*',
                    region: 'us-*',
                    account: '*',
                  },
                  Stack.of(this)
                ),
              ],
            }),
          ],
        }),
      },
    });

    const agent = new CfnAgent(this, 'MyCfnAgent', {
      agentName: 'weatherAgent',

      // the properties below are optional
      actionGroups: [
        {
          actionGroupName: 'weatherActionGroup',

          actionGroupExecutor: {
            lambda: fn.functionArn,
          },
          functionSchema: {
            functions: [
              {
                name: 'getWeatherForCity',

                description: 'Get weather for a specific city',
                parameters: {
                  city: {
                    type: 'string',
                    description: 'The name of the city to get the weather for',
                    required: true,
                  },
                },
              },
              {
                name: 'getWeatherForMultipleCities',

                description: 'Get weather for multiple cities',
                parameters: {
                  cities: {
                    type: 'array',
                    description:
                      'The names of the cities to get the weather for',
                    required: true,
                  },
                },
              },
            ],
          },
        },
      ],
      agentResourceRoleArn: agentRole.roleArn,
      autoPrepare: true,
      description: 'A simple weather agent',
      foundationModel:
        // 'arn:aws:bedrock:us-west-2::foundation-model/amazon.nova-pro-v1:0',
        `arn:aws:bedrock:us-west-2:${Stack.of(this).account}:inference-profile/us.amazon.nova-pro-v1:0`,
      instruction:
        // 'You are a weather forecast news anchor. You will be asked to provide a weather forecast for one or more cities. You will be provided with the current weather conditions. You will provide a weather forecast for each city as if you were a TV news anchor. You will provide the forecast in a conversational tone, as if you were speaking to a viewer on a TV news program.',
        'You are a middle ages weather diviner. You will be asked to provide a weather forecast for one or more cities. You will be provided with the current weather conditions. You will provide a weather forecast for each city as if you were a person in the middle ages using English from that time and as if you were a diviner.',
    });
    fn.addPermission('BedrockAgentInvokePermission', {
      principal: new ServicePrincipal('bedrock.amazonaws.com'),
      action: 'lambda:InvokeFunction',
      sourceAccount: this.account,
      sourceArn: `arn:aws:bedrock:${this.region}:${this.account}:agent/${agent.attrAgentId}`,
    });

    new CfnOutput(this, 'FunctionArn', {
      value: fn.functionArn,
    });
  }
}
