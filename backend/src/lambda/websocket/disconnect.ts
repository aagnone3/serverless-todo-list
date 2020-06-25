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
    logger.info('Websocket disconnect', {event, timestamp})
    const connectionId = event.requestContext.connectionId

    await docClient.delete({
        TableName: connectionsTable,
        Key: {
          id: connectionId
        }
    }).promise()

    return {
        statusCode: 200,
        body: ''
    }
  }
)