import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { renderApp } from './test/renderApp'
import { server } from './test/server'

const destinations = [
  ['Обзор', '/'],
  ['Сегодня', '/today'],
  ['На этой неделе', '/week'],
  ['Все задачи', '/tasks'],
  ['Выполненные', '/completed'],
]

beforeEach(() => {
  server.use(
    http.get('*/api/tasks', () => HttpResponse.json({ tasks: [] })),
    http.get('*/api/tasks/missing', () => new HttpResponse(null, { status: 404 })),
  )
})
afterEach(() => vi.unstubAllGlobals())

test('each sidebar link opens its page and identifies the current route', async () => {
  const user = userEvent.setup()
  renderApp()
  const navigation = screen.getByRole('navigation', { name: 'Навигация по задачам' })
  for (const [label, path] of destinations) {
    const link = within(navigation).getByRole('link', { name: label })
    expect(link.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    expect(link).toHaveTextContent(label)
    await user.click(link)
    expect(window.location.pathname).toBe(path)
    expect(within(navigation).getAllByRole('link', { current: 'page' })).toEqual([link])
    expect(within(screen.getByRole('main')).getByRole('heading', { name: label })).toBeVisible()
  }
})

test('details share the sidebar and retain their return link to Overview', async () => {
  const user = userEvent.setup()
  renderApp('/tasks/missing')
  const navigation = screen.getByRole('navigation', { name: 'Навигация по задачам' })
  expect(within(navigation).getByRole('link', { name: 'Все задачи', current: 'page' })).toBeVisible()
  await screen.findByText('Задача не найдена.')
  await user.click(screen.getByRole('link', { name: 'Назад к задачам' }))
  expect(within(navigation).getByRole('link', { name: 'Обзор', current: 'page' })).toBeVisible()
})

test('Tab reaches navigation links in order and Enter opens the focused route', async () => {
  const user = userEvent.setup()
  renderApp()
  const navigation = within(screen.getByRole('navigation', { name: 'Навигация по задачам' }))
  await user.tab()
  expect(navigation.getByRole('link', { name: 'Обзор' })).toHaveFocus()
  await user.tab()
  expect(navigation.getByRole('link', { name: 'Сегодня' })).toHaveFocus()
  await user.keyboard('{Enter}')
  expect(window.location.pathname).toBe('/today')
  expect(navigation.getByRole('link', { name: 'Сегодня', current: 'page' })).toHaveFocus()
})

test('narrow screens expose all destinations in a horizontally scrollable row', () => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('max-width'), media: query,
    addEventListener: () => {}, removeEventListener: () => {},
  }))
  renderApp('/completed')
  const navigation = screen.getByRole('navigation', { name: 'Навигация по задачам' })
  expect(navigation).toHaveStyle({ flexDirection: 'row', overflowX: 'auto' })
  expect(within(navigation).getAllByRole('link')).toHaveLength(5)
  expect(within(navigation).getByRole('link', { name: 'Выполненные', current: 'page' })).toBeVisible()
})
