import * as AWS from 'aws-sdk'
// import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'

// const XAWS = AWSXRay.captureAWS(AWS)
const logger = createLogger('dataLayer')

import { TodoItem } from '../models/TodoItem'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'


function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    console.log('Creating a local DynamoDB instance')
    return new AWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }
  return new AWS.DynamoDB.DocumentClient()
}

export class TodoData {

  constructor(
    private readonly dynamoDBClient: DocumentClient = createDynamoDBClient(),
    private readonly todosTable = process.env.TODOS_TABLE,
    private readonly todosTableIndex = process.env.TODOS_TABLE_INDEX_NAME
  ) {
  }

  async getTodo(userId: String, todoId: String): Promise<TodoItem> {
    console.log(`Getting todo ${todoId} for user ${userId}.`)
    const result = await this.dynamoDBClient.get({
      TableName: this.todosTable,
      Key: {
        userId,
        todoId
      }
    }).promise()

    return result.Item as TodoItem
  }

  async getUserTodos(userId: String): Promise<TodoItem[]> {
    logger.info(`Getting todos for user ${userId}`)
    const result = await this.dynamoDBClient
      .query({
        TableName: this.todosTable,
        IndexName: this.todosTableIndex,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      })
      .promise()

    logger.info(`Returning ${result.Count} items for user ${userId}.`)
    return result.Items as TodoItem[]
  }

  async createTodo(todo: TodoItem): Promise<TodoItem> {
    await this.dynamoDBClient.put({
      TableName: this.todosTable,
      Item: todo
    }).promise()

    logger.info(`Created todo ${todo.todoId} for user ${todo.userId}.`)
    return todo
  }


  async updateTodoAttachmentUrl(userId: String, todoId: String, attachmentUrl: String): Promise<Boolean> {
    let isSuccess = false
    try {
      await this.dynamoDBClient
        .update({
          TableName: this.todosTable,
          Key: {
            userId,
            todoId
          },
          UpdateExpression:
            'set #attachmentUrl = :attachmentUrl',
          ExpressionAttributeValues: {
            ':attachmentUrl': attachmentUrl,
          },
          ExpressionAttributeNames: {
            '#attachmentUrl': 'attachmentUrl',
          }
        })
        .promise()
        isSuccess = true
    } catch (e) {
      logger.error('Failure updating attachment URL for todo', {
        error: e,
        data: {
          userId,
          todoId,
          attachmentUrl
        }
      })
    }
    return isSuccess
  }

  async updateTodo(userId: String, todoId: String, todo: UpdateTodoRequest): Promise<Boolean> {
    let isSuccess = false
    try {
      await this.dynamoDBClient
        .update({
          TableName: this.todosTable,
          Key: {
            userId,
            todoId
          },
          UpdateExpression:
            'set #name = :name, #dueDate = :duedate, #done = :done',
          ExpressionAttributeValues: {
            ':name': todo.name,
            ':duedate': todo.dueDate,
            ':done': todo.done
          },
          ExpressionAttributeNames: {
            '#name': 'name',
            '#dueDate': 'dueDate',
            '#done': 'done'
          }
        })
        .promise()
        isSuccess = true
    } catch (e) {
      logger.error('Failure updating todo', {
        error: e,
        data: {
          userId,
          todoId,
          todo
        }
      })
    }
    return isSuccess
  }

  async deleteTodo(userId: String, todoId: String): Promise<Boolean> {
    let success = false
    try {
      await this.dynamoDBClient.delete({
        TableName: this.todosTable,
        Key: {
          userId,
          todoId
        }
      }).promise()
      logger.info(`Successfully deleted todo ${todoId}`)
      success = true
    } catch (e) {
      logger.info('Error deleting item from database', {error: e})
    }
    return success
  }
}
