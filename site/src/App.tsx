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
import CyclingBrain from './cycling/pages/CyclingBrain'
import CyclingBrainMethods from './cycling/pages/CyclingBrainMethods'
import CyclingBrainData from './cycling/pages/CyclingBrainData'
import PregnantBrain from './pregnancy/pages/PregnantBrain'
import PregnantBrainMethods from './pregnancy/pages/PregnantBrainMethods'
import PregnantBrainData from './pregnancy/pages/PregnantBrainData'
import MaleBrain from './male/pages/MaleBrain'
import MaleBrainMethods from './male/pages/MaleBrainMethods'
import MaleBrainData from './male/pages/MaleBrainData'
import YourDose from './dose/pages/YourDose'
import YourDoseMethods from './dose/pages/YourDoseMethods'
import YourDoseData from './dose/pages/YourDoseData'
import Experiments from './experiments/pages/Experiments'
import IngredientCheck from './ingredients/pages/IngredientCheck'
import IngredientCheckMethods from './ingredients/pages/IngredientCheckMethods'
import IngredientCheckData from './ingredients/pages/IngredientCheckData'
import DenseBreast from './density/pages/DenseBreast'
import DenseBreastMethods from './density/pages/DenseBreastMethods'
import DenseBreastData from './density/pages/DenseBreastData'
import MammographyAccess from './deserts/pages/MammographyAccess'
import MammographyAccessMethods from './deserts/pages/MammographyAccessMethods'
import MammographyAccessData from './deserts/pages/MammographyAccessData'
import MammoAI from './mammoai/pages/MammoAI'
import MammoAIMethods from './mammoai/pages/MammoAIMethods'
import MammoAIData from './mammoai/pages/MammoAIData'
import { CHAPTERS } from './lib/chapters'

import { EXPERIMENTS } from './experiments/list'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

/** Experiments run on the inverted colourway: dark plum, blush type. */
function Theme() {
  const { pathname } = useLocation()
  const dark = pathname.startsWith('/experiments') || EXPERIMENTS.some(e => pathname.startsWith(e.path))
  useEffect(() => {
    if (dark) document.documentElement.dataset.theme = 'dark'
    else delete document.documentElement.dataset.theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#180C12' : '#FDF2F5')
  }, [dark])
  return null
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <ScrollToTop />
      <Theme />
      <header className="sticky top-0 z-30 bg-blush border-b border-hairline">
        <div className="mx-auto max-w-6xl px-4 min-h-14 py-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <Link to="/" className="display text-base sm:text-xl font-medium tracking-tight text-berry whitespace-nowrap">
            The Women's Health Record
          </Link>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] font-medium">
            <NavLink to="/" end className={({ isActive }) => isActive ? 'text-berry font-medium' : 'text-ink-2 hover:text-berry'}>Chapters</NavLink>
            <NavLink to="/record" className={({ isActive }) => isActive ? 'text-berry font-medium' : 'text-ink-2 hover:text-berry'}>The record</NavLink>
            <NavLink to="/methods" className={({ isActive }) => isActive ? 'text-berry font-medium' : 'text-ink-2 hover:text-berry'}>Methods</NavLink>
            <NavLink to="/data" className={({ isActive }) => isActive ? 'text-berry font-medium' : 'text-ink-2 hover:text-berry'}>Data</NavLink>
            <NavLink to="/about" className={({ isActive }) => isActive ? 'text-berry font-medium' : 'text-ink-2 hover:text-berry'}>About</NavLink>
            {/* Experiments: dark chips, set apart from the chapters */}
            <span className="nav-divider" aria-hidden />
            {EXPERIMENTS.map(e => (
              <NavLink key={e.path} to={e.path} className={({ isActive }) => `nav-exp ${isActive ? 'is-active' : ''}`}>{e.label}</NavLink>
            ))}
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
          <Route path="/cycling-brain" element={<CyclingBrain />} />
          <Route path="/cycling-brain/methods" element={<CyclingBrainMethods />} />
          <Route path="/cycling-brain/data" element={<CyclingBrainData />} />
          <Route path="/pregnancy-brain" element={<PregnantBrain />} />
          <Route path="/pregnancy-brain/methods" element={<PregnantBrainMethods />} />
          <Route path="/pregnancy-brain/data" element={<PregnantBrainData />} />
          <Route path="/male-brain" element={<MaleBrain />} />
          <Route path="/male-brain/methods" element={<MaleBrainMethods />} />
          <Route path="/male-brain/data" element={<MaleBrainData />} />
          <Route path="/experiments" element={<Experiments />} />
          <Route path="/your-dose" element={<YourDose />} />
          <Route path="/your-dose/methods" element={<YourDoseMethods />} />
          <Route path="/your-dose/data" element={<YourDoseData />} />
          <Route path="/ingredient-check" element={<IngredientCheck />} />
          <Route path="/ingredient-check/methods" element={<IngredientCheckMethods />} />
          <Route path="/ingredient-check/data" element={<IngredientCheckData />} />
          <Route path="/dense-breast" element={<DenseBreast />} />
          <Route path="/dense-breast/methods" element={<DenseBreastMethods />} />
          <Route path="/dense-breast/data" element={<DenseBreastData />} />
          <Route path="/mammography-access" element={<MammographyAccess />} />
          <Route path="/mammography-access/methods" element={<MammographyAccessMethods />} />
          <Route path="/mammography-access/data" element={<MammographyAccessData />} />
          <Route path="/mammography-ai" element={<MammoAI />} />
          <Route path="/mammography-ai/methods" element={<MammoAIMethods />} />
          <Route path="/mammography-ai/data" element={<MammoAIData />} />
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
