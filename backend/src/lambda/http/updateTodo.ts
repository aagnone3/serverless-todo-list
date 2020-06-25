import 'source-map-support/register'

import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import { updateTodo } from '../../businessLogic/todos'
import { getUserId } from '../utils'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)
    const userId: string = getUserId(event)
    const success = await updateTodo(userId, todoId, updatedTodo)

    if (!success) {
      return {
        statusCode: 500,
        body: 'Error updating todo'
      }
    }
    return {
      statusCode: 204,
      body: ''
    }
  }
)

handler.use(
  cors({
    credentials: true
  })
)