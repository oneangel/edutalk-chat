import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { HomePage } from '@/pages/HomePage';
import { ChatPage } from '@/pages/ChatPage';
import { AssignmentsPage } from '@/pages/AssignmentsPage';
import { GradesPage } from '@/pages/GradesPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { Layout } from '@/components/Layout';
import { ClassesPage } from '@/pages/ClassesPage';
import { AssignmentDetailPage } from '@/pages/AssignmentDetailPage';
import { CourseDetailsPage } from './pages/CourseDetailsPage';
import { SubmissionsPage } from './pages/SubmissionsPage';

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
          <Route path="clases" element={<ClassesPage />} />
          <Route path="tareas" element={<AssignmentsPage />} />
          <Route path="tareas/:id" element={<AssignmentDetailPage />} />
          <Route path="calificaciones" element={<GradesPage />} />
          <Route path="calendario" element={<CalendarPage />} />
          <Route path="clases/:id" element={<CourseDetailsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App