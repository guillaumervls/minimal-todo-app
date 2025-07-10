
import { db } from '../db';
import { todosTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type DeleteTodoInput } from '../schema';

export const deleteTodo = async (input: DeleteTodoInput): Promise<{ success: boolean }> => {
  try {
    // Delete the todo item
    const result = await db.delete(todosTable)
      .where(eq(todosTable.id, input.id))
      .returning()
      .execute();

    // Return success based on whether any rows were deleted
    return { success: result.length > 0 };
  } catch (error) {
    console.error('Todo deletion failed:', error);
    throw error;
  }
};
