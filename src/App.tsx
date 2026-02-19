import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './stores/appStore';
import { MainLayout, DashboardLayout } from './components/layout';
import { Onboarding } from './pages/Onboarding';
import { SubjectsList } from './pages/Subjects';
import { SubjectWorkspace } from './pages/SubjectWorkspace';
import { GlobalKnowledgeMap } from './pages/GlobalKnowledgeMap';
import { TopicLessonPage } from './pages/TopicLessonPage';
import './styles/globals.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isOnboarded } = useAppStore();

  if (!isOnboarded) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  const { isOnboarded } = useAppStore();

  return (
    <BrowserRouter>
      <Routes>
        {/* Onboarding flow */}
        <Route element={<MainLayout />}>
          <Route
            path="/"
            element={
              isOnboarded ? <Navigate to="/subjects" replace /> : <Onboarding />
            }
          />
        </Route>

        {/* Main app with header */}
        <Route element={<DashboardLayout />}>
          <Route
            path="/subjects"
            element={
              <ProtectedRoute>
                <SubjectsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subjects/:subjectId"
            element={
              <ProtectedRoute>
                <SubjectWorkspace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subjects/:subjectId/topic/:topicId"
            element={
              <ProtectedRoute>
                <TopicLessonPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/knowledge-map"
            element={
              <ProtectedRoute>
                <GlobalKnowledgeMap />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
