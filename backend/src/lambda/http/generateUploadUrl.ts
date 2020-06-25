import 'source-map-support/register'

import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import { createLogger } from '../../utils/logger'
import { getUserId } from '../utils'
import { updateTodoAttachmentUrl } from '../../businessLogic/todos'

const XAWS = AWSXRay.captureAWS(AWS)

const s3 = new XAWS.S3({
  signatureVersion: 'v4'
})

const logger = createLogger('generateUploadUrl')
const bucket = process.env.TODOS_S3_BUCKET
const signedUrlExpiration = process.env.SIGNED_URL_EXPIRATION

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    const userId: string = getUserId(event)

    // check for missing todo id
    if (!todoId) {
      return {
        statusCode: 400,
        body: JSON.stringify({error: 'Please supply a todoId parameter'})
      }
    }

    const success = await updateTodoAttachmentUrl(userId, todoId, `https://${bucket}.s3.amazonaws.com/${todoId}`)
    if (!success) {
      return {
        statusCode: 500,
        body: JSON.stringify({error: 'Internal error occurred updating attachment URL'})
      }
    }
    
    const signedUrl = s3.getSignedUrl('putObject', {
      Bucket: bucket,
      Key: todoId,
      Expires: signedUrlExpiration
    })
    logger.info(`Generated signed url for a TODO`, {
      url: signedUrl,
      todoId: todoId
    })

    // return a presigned URL to upload a file for a TODO item with the provided id
    return {
      statusCode: 200,
      body: JSON.stringify({
        uploadUrl: signedUrl
      })
    }
  }
)

handler.use(
  cors({
    credentials: true
  })
)