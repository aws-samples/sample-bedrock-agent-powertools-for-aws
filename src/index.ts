import { logger } from './logger.js';
import type { Context } from 'aws-lambda';
import { BedrockAgentFunctionResolver } from '@aws-lambda-powertools/event-handler/bedrock-agent-function';
import type { BedrockAgentFunctionEvent } from '@aws-lambda-powertools/event-handler/types';
import { getPlaceCoordinates, getWeatherForCoordinates } from './utils.js';

const app = new BedrockAgentFunctionResolver({ logger });

app.tool(
  async ({ city }) => {
    logger.debug('city:', { city });

    try {
      const coordinates = await getPlaceCoordinates(city);
      const weatherData = await getWeatherForCoordinates(coordinates);

      return weatherData;
    } catch (error) {
      logger.error('Error retrieving weather', { error });
      return 'Sorry, I could not find the weather for that city.';
    }
  },
  {
    name: 'getWeatherForCity',
    definition: 'Get weather for a specific city',
  }
);

app.tool(
  async ({ cities }) => {
    logger.debug('cities:', { cities });

    try {
      const weatherDataArray = await Promise.all(
        (cities as string[]).map(async (city) => {
          const coordinates = await getPlaceCoordinates(city);
          return getWeatherForCoordinates(coordinates);
        })
      );
      return weatherDataArray;
    } catch (error) {
      logger.error('Error retrieving weather', { error });
      return 'Sorry, I could not find the weather for those cities.';
    }
  },
  {
    name: 'getWeatherForMultipleCities',
    definition: 'Get weather for multiple cities',
  }
);

export const handler = async (event: unknown, context: Context) => {
  logger.debug('Event:', { event });
  return app.resolve(event as BedrockAgentFunctionEvent, context);
};
