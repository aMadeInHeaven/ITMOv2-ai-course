import { fileURLToPath } from 'node:url'
import { createApp } from './app'
import { TaskStore } from './taskStore'

const store = new TaskStore(fileURLToPath(new URL('../data/tasks.json', import.meta.url)))
const clientDirectory = fileURLToPath(new URL('../dist/', import.meta.url))
const app = createApp(store, clientDirectory)
const port = Number(process.env.PORT ?? 3001)

app.listen(port, '127.0.0.1', () => {
  console.log(`FocusBoard listening on http://127.0.0.1:${port}`)
})
