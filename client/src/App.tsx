
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Trash2, Plus, CheckCircle2, Circle } from 'lucide-react';
import type { Todo, CreateTodoInput } from '../../server/src/schema';

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newTodoText, setNewTodoText] = useState('');
  const [isAddingTodo, setIsAddingTodo] = useState(false);

  const loadTodos = useCallback(async () => {
    try {
      const result = await trpc.getTodos.query();
      setTodos(result);
    } catch (error) {
      console.error('Failed to load todos:', error);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;

    setIsAddingTodo(true);
    try {
      const todoData: CreateTodoInput = {
        text: newTodoText.trim()
      };
      
      const newTodo = await trpc.createTodo.mutate(todoData);
      setTodos((prev: Todo[]) => [...prev, newTodo]);
      setNewTodoText('');
    } catch (error) {
      console.error('Failed to create todo:', error);
    } finally {
      setIsAddingTodo(false);
    }
  };

  const handleToggleComplete = async (todo: Todo) => {
    setIsLoading(true);
    try {
      const updatedTodo = await trpc.updateTodo.mutate({
        id: todo.id,
        completed: !todo.completed
      });
      
      setTodos((prev: Todo[]) =>
        prev.map((t: Todo) => (t.id === todo.id ? updatedTodo : t))
      );
    } catch (error) {
      console.error('Failed to update todo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTodo = async (todoId: number) => {
    setIsLoading(true);
    try {
      await trpc.deleteTodo.mutate({ id: todoId });
      setTodos((prev: Todo[]) => prev.filter((t: Todo) => t.id !== todoId));
    } catch (error) {
      console.error('Failed to delete todo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const completedCount = todos.filter((todo: Todo) => todo.completed).length;
  const totalCount = todos.length;

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="container mx-auto max-w-2xl p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-light mb-2">Todo</h1>
          <p className="text-gray-600 text-sm">
            {totalCount === 0 ? 'No tasks yet' : `${completedCount} of ${totalCount} completed`}
          </p>
        </div>

        {/* Add Todo Form */}
        <Card className="mb-8 border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <form onSubmit={handleAddTodo} className="flex gap-3">
              <Input
                value={newTodoText}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewTodoText(e.target.value)
                }
                placeholder="Add a new task..."
                className="flex-1 border-gray-300 focus:border-black focus:ring-0"
                disabled={isAddingTodo}
              />
              <Button
                type="submit"
                disabled={isAddingTodo || !newTodoText.trim()}
                className="bg-black text-white hover:bg-gray-800 px-4"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Todo List */}
        <div className="space-y-2">
          {todos.length === 0 ? (
            <div className="text-center py-12">
              <Circle className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No tasks yet. Add one above to get started.</p>
            </div>
          ) : (
            todos.map((todo: Todo) => (
              <Card
                key={todo.id}
                className={`border-gray-200 shadow-sm transition-all duration-200 hover:shadow-md ${
                  todo.completed ? 'bg-gray-50' : 'bg-white'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleToggleComplete(todo)}
                      disabled={isLoading}
                      className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      {todo.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-black" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-400 hover:text-black" />
                      )}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm leading-relaxed ${
                          todo.completed
                            ? 'text-gray-500 line-through'
                            : 'text-black'
                        }`}
                      >
                        {todo.text}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {todo.created_at.toLocaleDateString()}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteTodo(todo.id)}
                      disabled={isLoading}
                      className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Footer */}
        {todos.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>{todos.filter((t: Todo) => !t.completed).length} remaining</span>
              <span>{completedCount} completed</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
