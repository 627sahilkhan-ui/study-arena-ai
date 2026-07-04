import { lazy, Suspense, type ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui';

// Route-based code splitting — every page ships as its own chunk.
const Landing = lazy(() => import('@/pages/Landing'));
const Login = lazy(() => import('@/pages/Login'));
const Signup = lazy(() => import('@/pages/Signup'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Notes = lazy(() => import('@/pages/Notes'));
const Subjects = lazy(() => import('@/pages/Subjects'));
const Flashcards = lazy(() => import('@/pages/Flashcards'));
const Quizzes = lazy(() => import('@/pages/Quizzes'));
const StudyPlanner = lazy(() => import('@/pages/StudyPlanner'));
const Goals = lazy(() => import('@/pages/Goals'));
const Analytics = lazy(() => import('@/pages/Analytics'));
const Leaderboard = lazy(() => import('@/pages/Leaderboard'));
const AITutor = lazy(() => import('@/pages/AITutor'));
const VisionAI = lazy(() => import('@/pages/VisionAI'));
const Achievements = lazy(() => import('@/pages/Achievements'));
const Profile = lazy(() => import('@/pages/Profile'));
const Settings = lazy(() => import('@/pages/Settings'));
const NotFound = lazy(() => import('@/pages/NotFound'));

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg" role="status" aria-label="Loading">
      <div className="display animate-pulse text-3xl">STUDY<span className="text-primary">ARENA</span></div>
    </div>
  );
}

function Protected({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicOnly({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (session) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function LandingPage() {
  const { session, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  // Redirect authenticated users to dashboard
  if (session) return <Navigate to="/dashboard" replace />;
  return <Landing />;
}

export default function App() {
  return (
    <>
      <Suspense fallback={<FullScreenLoader />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
          <Route path="/signup" element={<PublicOnly><Signup /></PublicOnly>} />
          <Route path="/forgot-password" element={<PublicOnly><ForgotPassword /></PublicOnly>} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="/notes" element={<Protected><Notes /></Protected>} />
          <Route path="/subjects" element={<Protected><Subjects /></Protected>} />
          <Route path="/flashcards" element={<Protected><Flashcards /></Protected>} />
          <Route path="/quizzes" element={<Protected><Quizzes /></Protected>} />
          <Route path="/planner" element={<Protected><StudyPlanner /></Protected>} />
          <Route path="/goals" element={<Protected><Goals /></Protected>} />
          <Route path="/analytics" element={<Protected><Analytics /></Protected>} />
          <Route path="/leaderboard" element={<Protected><Leaderboard /></Protected>} />
          <Route path="/ai-tutor" element={<Protected><AITutor /></Protected>} />
          <Route path="/vision" element={<Protected><VisionAI /></Protected>} />
          <Route path="/achievements" element={<Protected><Achievements /></Protected>} />
          <Route path="/profile" element={<Protected><Profile /></Protected>} />
          <Route path="/settings" element={<Protected><Settings /></Protected>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <Toaster />
    </>
  );
}
