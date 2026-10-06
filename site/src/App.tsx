import { Routes, Route, Link, NavLink, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Home from './pages/Home'
import Methods from './pages/Methods'
import About from './pages/About'
import Chapter1 from './chapters/Chapter1'
import ComingSoon from './chapters/ComingSoon'
import { CHAPTERS } from './lib/chapters'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <ScrollToTop />
      <header className="sticky top-0 z-30 bg-blush/85 backdrop-blur border-b border-hairline">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between gap-4">
          <Link to="/" className="display text-lg sm:text-xl font-semibold tracking-tight text-berry">
            The Women's Health Record
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <NavLink to="/" end className={({ isActive }) => isActive ? 'text-berry font-medium' : 'text-ink-2 hover:text-berry'}>Chapters</NavLink>
            <NavLink to="/methods" className={({ isActive }) => isActive ? 'text-berry font-medium' : 'text-ink-2 hover:text-berry'}>Methods</NavLink>
            <NavLink to="/about" className={({ isActive }) => isActive ? 'text-berry font-medium' : 'text-ink-2 hover:text-berry'}>About</NavLink>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/methods" element={<Methods />} />
          <Route path="/about" element={<About />} />
          <Route path="/chapters/tested-on-men" element={<Chapter1 />} />
          {CHAPTERS.filter(c => c.status !== 'live').map(c => (
            <Route key={c.slug} path={`/chapters/${c.slug}`} element={<ComingSoon chapter={c} />} />
          ))}
        </Routes>
      </main>
      <footer className="border-t border-hairline mt-16">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-ink-2 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div>
            <span className="display text-berry font-semibold">The Women's Health Record</span>
            <span className="mx-2 text-ink-3">·</span>
            <span>by Lucca Labs</span>
          </div>
          <div className="flex gap-4">
            <Link to="/methods" className="hover:text-berry">Methods &amp; sources</Link>
            <a href="https://github.com/lucylepoidevin/thewomenshealthrecord" className="hover:text-berry" target="_blank" rel="noreferrer">Code &amp; data</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
