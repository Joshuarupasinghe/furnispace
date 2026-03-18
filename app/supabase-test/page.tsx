import { createClient } from "@/utils/supabase/server"

interface TodoRow {
  id: string
  name: string
}

export default async function SupabaseTestPage() {
  const supabase = await createClient()
  const { data: todos, error } = await supabase.from("todos").select("id, name")

  if (error) {
    return (
      <div className="mx-auto max-w-3xl p-8">
        <h1 className="text-2xl font-semibold">Supabase Test</h1>
        <p className="mt-4 text-sm text-red-600">Failed to fetch todos: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-semibold">Supabase Test</h1>
      <p className="mt-2 text-sm text-muted-foreground">Fetched from public.todos</p>
      <ul className="mt-6 space-y-2">
        {(todos as TodoRow[] | null)?.map((todo) => (
          <li key={todo.id} className="rounded border p-3">
            {todo.name}
          </li>
        ))}
        {!todos?.length && <li className="text-sm text-muted-foreground">No todos found.</li>}
      </ul>
    </div>
  )
}
