import * as uuid from 'uuid'

import { TodoItem } from '../models/TodoItem'
import { TodoData } from '../dataLayer/todosData'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'

const todoData = new TodoData()

export async function getUserTodos(userId: String): Promise<TodoItem[]> {
  return await todoData.getUserTodos(userId)
}

export async function getTodo(userId: String, todoId: String): Promise<TodoItem> {
  return todoData.getTodo(userId, todoId)
}

export async function deleteTodo(userId: String, todoId: String): Promise<Boolean> {
  return todoData.deleteTodo(userId, todoId)
}

export async function updateTodoAttachmentUrl(
  userId: String,
  todoId: String,
  attachmentUrl: String
): Promise<Boolean> {
  return todoData.updateTodoAttachmentUrl(userId, todoId, attachmentUrl)
}

export async function updateTodo(
  userId: String,
  todoId: String,
  updatedTodo: UpdateTodoRequest
): Promise<Boolean> {
  return todoData.updateTodo(userId, todoId, updatedTodo)
}

export async function createTodo(
  createTodoRequest: CreateTodoRequest,
  userId: string
): Promise<TodoItem> {

  return await todoData.createTodo({
    userId: userId,
    todoId: uuid.v4(),
    createdAt: new Date().toISOString(),
    name: createTodoRequest.name,
    dueDate: createTodoRequest.dueDate,
    done: false
  })
}
