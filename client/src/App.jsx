import { Route, Routes } from 'react-router-dom'

import AppLayout from './layouts/AppLayout'
import CoursePage from './pages/CoursePage'
import HomePage from './pages/HomePage'
import LessonPage from './pages/LessonPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/courses/:courseId" element={<CoursePage />} />
        <Route path="/lessons/:lessonId" element={<LessonPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
