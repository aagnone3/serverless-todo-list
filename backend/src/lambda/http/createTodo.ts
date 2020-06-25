import 'source-map-support/register'

import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import { TodoItem } from '../../models/TodoItem'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { createTodo } from '../../businessLogic/todos'
import { createLogger } from '../../utils/logger'
import { getUserId } from '../utils'

const logger = createLogger('dataLayer')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const newTodo: CreateTodoRequest = JSON.parse(event.body)
    const userId: string = getUserId(event)
    logger.info(`User id parsed: ${userId}`)

    // verify a name is given
    if (!newTodo.name) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Must supply a name for the new todo.'
        })
      }
    }

    // create the item
    let item: TodoItem
    try {
      item = await createTodo(newTodo, userId)
    } catch (e) {
      logger.error('Error creating todo', {
        error: e
      })
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Error creating todo.'
        })
      }
    }

    // return the created item
    return {
      statusCode: 201,
      body: JSON.stringify({
        item: item
      })
    }
  }
)

handler.use(
  cors({
    credentials: true
  })
)