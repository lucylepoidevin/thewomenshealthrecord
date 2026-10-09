import { Routes, Route, Link, NavLink, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Home from './pages/Home'
import Methods from './pages/Methods'
import About from './pages/About'
import Data from './pages/Data'
import Record from './pages/Record'
import Chapter1 from './chapters/Chapter1'
import Chapter2 from './chapters/Chapter2'
import Chapter3 from './chapters/Chapter3'
import Chapter4 from './chapters/Chapter4'
import Chapter5 from './chapters/Chapter5'
import Chapter6 from './chapters/Chapter6'
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
      <header className="sticky top-0 z-30 bg-blush/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 min-h-14 py-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <Link to="/" className="display text-base sm:text-xl font-medium tracking-tight text-berry whitespace-nowrap">
            The Women's Health Record
          </Link>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] sm:text-[13px] font-semibold tracking-wide">
            <NavLink to="/" end className={({ isActive }) => isActive ? 'text-berry font-medium' : 'text-ink-2 hover:text-berry'}>Chapters</NavLink>
            <NavLink to="/record" className={({ isActive }) => isActive ? 'text-berry font-medium' : 'text-ink-2 hover:text-berry'}>The record</NavLink>
            <NavLink to="/methods" className={({ isActive }) => isActive ? 'text-berry font-medium' : 'text-ink-2 hover:text-berry'}>Methods</NavLink>
            <NavLink to="/data" className={({ isActive }) => isActive ? 'text-berry font-medium' : 'text-ink-2 hover:text-berry'}>Data</NavLink>
            <NavLink to="/about" className={({ isActive }) => isActive ? 'text-berry font-medium' : 'text-ink-2 hover:text-berry'}>About</NavLink>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/methods" element={<Methods />} />
          <Route path="/about" element={<About />} />
          <Route path="/data" element={<Data />} />
          <Route path="/record" element={<Record />} />
          <Route path="/chapters/tested-on-men" element={<Chapter1 />} />
          <Route path="/chapters/pain-gap" element={<Chapter2 />} />
          <Route path="/chapters/funding-vs-burden" element={<Chapter3 />} />
          <Route path="/chapters/who-gets-studied" element={<Chapter4 />} />
          <Route path="/chapters/sent-home-with-a-label" element={<Chapter5 />} />
          <Route path="/chapters/male-default" element={<Chapter6 />} />
          {CHAPTERS.filter(c => c.status !== 'live').map(c => (
            <Route key={c.slug} path={`/chapters/${c.slug}`} element={<ComingSoon chapter={c} />} />
          ))}
        </Routes>
      </main>
      <footer className="mt-20">
        <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-ink-2 border-t border-hairline/70 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div>
            <span className="display text-berry font-semibold">The Women's Health Record</span>
            <span className="mx-2 text-ink-3">·</span>
            <span>by Lucy LePoidevin</span>
          </div>
          <div className="flex gap-4">
            <a href="https://substack.com/@thewomenshealthrecord" className="hover:text-berry" target="_blank" rel="noreferrer">Substack</a>
            <Link to="/methods" className="hover:text-berry">Methods &amp; sources</Link>
            <Link to="/data" className="hover:text-berry">Data</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
