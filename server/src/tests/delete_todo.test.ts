
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type DeleteTodoInput } from '../schema';
import { deleteTodo } from '../handlers/delete_todo';
import { eq } from 'drizzle-orm';

// Test input
const testInput: DeleteTodoInput = {
  id: 1
};

describe('deleteTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing todo', async () => {
    // Create a todo to delete
    const createdTodo = await db.insert(todosTable)
      .values({
        text: 'Test todo to delete',
        completed: false
      })
      .returning()
      .execute();

    const todoId = createdTodo[0].id;

    // Delete the todo
    const result = await deleteTodo({ id: todoId });

    expect(result.success).toBe(true);

    // Verify the todo is deleted from database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId))
      .execute();

    expect(todos).toHaveLength(0);
  });

  it('should return success false when todo does not exist', async () => {
    // Try to delete a non-existent todo
    const result = await deleteTodo({ id: 999 });

    expect(result.success).toBe(false);
  });

  it('should not affect other todos when deleting one', async () => {
    // Create multiple todos
    const createdTodos = await db.insert(todosTable)
      .values([
        { text: 'First todo', completed: false },
        { text: 'Second todo', completed: true },
        { text: 'Third todo', completed: false }
      ])
      .returning()
      .execute();

    const todoToDelete = createdTodos[1].id;

    // Delete the middle todo
    const result = await deleteTodo({ id: todoToDelete });

    expect(result.success).toBe(true);

    // Verify only the target todo was deleted
    const remainingTodos = await db.select()
      .from(todosTable)
      .execute();

    expect(remainingTodos).toHaveLength(2);
    expect(remainingTodos.map(t => t.id)).not.toContain(todoToDelete);
    expect(remainingTodos.map(t => t.text)).toContain('First todo');
    expect(remainingTodos.map(t => t.text)).toContain('Third todo');
  });
});
