import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { HomePage } from '@/pages/HomePage';
import { ChatPage } from '@/pages/ChatPage';
import { CoursesPage } from '@/pages/CoursesPage';
import { AssignmentsPage } from '@/pages/AssignmentsPage';
import { GradesPage } from '@/pages/GradesPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { Layout } from '@/components/Layout';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="cursos" element={<CoursesPage />} />
          <Route path="tareas" element={<AssignmentsPage />} />
          <Route path="calificaciones" element={<GradesPage />} />
          <Route path="calendario" element={<CalendarPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;