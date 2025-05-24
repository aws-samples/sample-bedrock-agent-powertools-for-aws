# Bedrock Agent with Powertools for AWS

This is a work in progress sample to test the ongoing implementation of the upcoming Powertools for AWS (TypeScript) Event Handler for Bedrock Agent Functions.

## Deploy

```bash
npm ci
npm run cdk deploy
```

## Test

Use the Bedrock Console to test the agent, try asking it questions like:

- What's the weather in Seattle?
- What's the weather like in Madrid and in Rome?

You can then go in CloudWatch Log Insights and run the following query to see the logs:

```sql
fields message, level, timestamp, requestId, correlation_id as sessionId, tool
| filter sessionId = "536254204126922" # Replace with your session ID
# | filter city = "city_name" # Uncomment to filter by city
| sort timestamp asc
| limit 10000
```

## Cleanup

```bash
npm run cdk destroy
```

## License

MIT
