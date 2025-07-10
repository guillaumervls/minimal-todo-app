
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type UpdateTodoInput } from '../schema';
import { updateTodo } from '../handlers/update_todo';
import { eq } from 'drizzle-orm';

describe('updateTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update todo completion status to true', async () => {
    // Create a test todo first
    const createResult = await db.insert(todosTable)
      .values({
        text: 'Test todo',
        completed: false
      })
      .returning()
      .execute();

    const testTodo = createResult[0];

    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      completed: true
    };

    const result = await updateTodo(updateInput);

    // Verify the returned todo has updated completion status
    expect(result.id).toEqual(testTodo.id);
    expect(result.text).toEqual('Test todo');
    expect(result.completed).toEqual(true);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update todo completion status to false', async () => {
    // Create a completed test todo first
    const createResult = await db.insert(todosTable)
      .values({
        text: 'Completed todo',
        completed: true
      })
      .returning()
      .execute();

    const testTodo = createResult[0];

    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      completed: false
    };

    const result = await updateTodo(updateInput);

    // Verify the returned todo has updated completion status
    expect(result.id).toEqual(testTodo.id);
    expect(result.text).toEqual('Completed todo');
    expect(result.completed).toEqual(false);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist changes to database', async () => {
    // Create a test todo first
    const createResult = await db.insert(todosTable)
      .values({
        text: 'Persistence test todo',
        completed: false
      })
      .returning()
      .execute();

    const testTodo = createResult[0];

    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      completed: true
    };

    await updateTodo(updateInput);

    // Query the database to verify changes were persisted
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, testTodo.id))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].completed).toEqual(true);
    expect(todos[0].text).toEqual('Persistence test todo');
  });

  it('should throw error for non-existent todo', async () => {
    const updateInput: UpdateTodoInput = {
      id: 999, // Non-existent ID
      completed: true
    };

    await expect(updateTodo(updateInput)).rejects.toThrow(/not found/i);
  });
});
