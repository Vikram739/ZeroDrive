import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import Sidebar from './components/layout/Sidebar'
import ChatBot from './components/ai/ChatBot'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import Dashboard from './pages/Dashboard'
import content from './config/content.json'

function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white dark:bg-zinc-950">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 dark:bg-white">
        <span className="text-2xl font-bold text-white dark:text-zinc-900">
          {content.brand.logoLetter}
        </span>
      </div>
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-50" />
    </div>
  )
}

function ProtectedDashboard() {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/signin" replace />
  return (
    <>
      <Sidebar />
      <Dashboard />
      <ChatBot />
    </>
  )
}

function HomeRedirect() {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return null
  return <Navigate to={isAuthenticated ? '/dashboard' : '/signin'} replace />
}

function AppShell() {
  const { loading } = useAuth()

  if (loading) return <LoadingScreen />

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1 flex-col">
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/dashboard" element={<ProtectedDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <AppShell />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
