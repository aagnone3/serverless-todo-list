import { SNSHandler, SNSEvent, S3Event } from 'aws-lambda'
import 'source-map-support/register'
import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { createLogger } from '../../utils/logger'

const XAWS = AWSXRay.captureAWS(AWS)
const docClient = new XAWS.DynamoDB.DocumentClient()
const connectionsTable = process.env.CONNECTIONS_TABLE
const stage = process.env.STAGE
const apiId = process.env.API_ID
const logger = createLogger('websocker')
const apiGateway = new AWS.ApiGatewayManagementApi({
    apiVersion: "2018-11-29",
    endpoint: `${apiId}.execute-api.us-east-1.amazonaws.com/${stage}`
})

export const handler: SNSHandler = async (event: SNSEvent) => {
  logger.info('Processing SNS event ', JSON.stringify(event))
  for (const snsRecord of event.Records) {
    const s3EventStr = snsRecord.Sns.Message
    const s3Event = JSON.parse(s3EventStr)
    logger.info('Processing S3 event', s3EventStr)
    await processS3Event(s3Event)
  }
}

async function processS3Event(s3Event: S3Event) {
  for (const record of s3Event.Records) {
    const key = record.s3.object.key
    const connections = await docClient.scan({
        TableName: connectionsTable
    }).promise()
    const payload = {
        imageId: key
    }

    logger.info('Processing S3 item', key)
    for (const connection of connections.Items) {
        const connectionId = connection.id
        await sendMessageToClient(connectionId, payload)
    }
  }
}

async function sendMessageToClient(connectionId, payload) {
  try {
    const data = JSON.stringify(payload)
    logger.info('Sending message to a connection', {
      message: data,
      connectionId,
    })
    await apiGateway.postToConnection({
      ConnectionId: connectionId,
      Data: data,
    }).promise()

    
  } catch (e) {
    logger.info('Failed to send message', {
      error: JSON.stringify(e),
      connectionId
    })
    if (e.statusCode === 410) {
      logger.info('Stale connection', {connectionId})
      await docClient.delete({
        TableName: connectionsTable,
        Key: {
          id: connectionId
        }
      }).promise()
    }
  }
}