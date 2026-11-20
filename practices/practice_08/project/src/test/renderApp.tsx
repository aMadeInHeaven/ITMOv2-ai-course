import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import App from '../App'

export function renderApp(path = '/') {
  window.history.replaceState(null, '', path)
  return render(<BrowserRouter><App /></BrowserRouter>)
}
