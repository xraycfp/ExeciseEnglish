import { HashRouter, Routes, Route } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import HomePage from './pages/HomePage'
import LibraryPage from './pages/LibraryPage'
import MediaDetailPage from './pages/MediaDetailPage'
import SettingsPage from './pages/SettingsPage'
import EchoPracticePage from './pages/practice/EchoPracticePage'
import DictationPage from './pages/practice/DictationPage'

function App(): React.ReactElement {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="library" element={<LibraryPage />} />
          <Route path="media/:id" element={<MediaDetailPage />} />
          <Route path="practice/echo/:id" element={<EchoPracticePage />} />
          <Route path="practice/dictation/:id" element={<DictationPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
