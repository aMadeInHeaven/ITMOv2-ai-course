const paths = {
  overview: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  today: 'M4 5h16v16H4z M4 10h16 M8 3v4 M16 3v4 M9 15h4',
  week: 'M4 5h16v16H4z M4 10h16 M8 3v4 M16 3v4 M8 14h1 M12 14h1 M16 14h1 M8 17h1 M12 17h1',
  list: 'M9 6h12 M9 12h12 M9 18h12 M3 6l1 1 2-3 M3 12l1 1 2-3 M3 18l1 1 2-3',
  completed: 'M21 11v1a9 9 0 1 1-5.3-8.2 M21 4l-10 10-3-3',
  check: 'M4 12l5 5L20 6',
  trash: 'M3 6h18 M8 6V3h8v3 M6 6l1 15h10l1-15 M10 10v7 M14 10v7',
  plus: 'M12 5v14 M5 12h14',
}

export default function PlannerIcon({ name, size = 20 }: { name: keyof typeof paths; size?: number }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={name === 'check' ? 3 : 1.7} strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]} /></svg>
}
