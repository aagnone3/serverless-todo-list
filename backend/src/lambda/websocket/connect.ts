import 'source-map-support/register'

import * as middy from 'middy'
import * as AWS from 'aws-sdk'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import { createLogger } from '../../utils/logger'

const docClient = new AWS.DynamoDB.DocumentClient()
const connectionsTable = process.env.CONNECTIONS_TABLE
const logger = createLogger('websocker')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const timestamp = new Date().toISOString()
    logger.info('Websocket connect', event)

    await docClient.put({
        TableName: connectionsTable,
        Item: {
            id: event.requestContext.connectionId,
            timestamp
        }
    }).promise()

    return {
        statusCode: 200,
        body: ''
    }
  }
)