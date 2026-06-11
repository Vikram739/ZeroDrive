import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
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

function DashboardShell({ view }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/signin" replace />
  return (
    <>
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Dashboard view={view} />
        <Footer />
      </div>
      <ChatBot />
    </>
  )
}

function DashboardFolderShell() {
  const { isAuthenticated, loading } = useAuth()
  const { folderId } = useParams()
  if (loading) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/signin" replace />
  return (
    <>
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Dashboard view="myDrive" folderId={folderId} />
        <Footer />
      </div>
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
    <div className="flex h-screen flex-col overflow-hidden">
      <Navbar />
      <div className="flex min-h-0 flex-1">
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route
            path="/signin"
            element={
              <div className="flex flex-1 flex-col overflow-y-auto">
                <SignIn />
                <Footer />
              </div>
            }
          />
          <Route
            path="/signup"
            element={
              <div className="flex flex-1 flex-col overflow-y-auto">
                <SignUp />
                <Footer />
              </div>
            }
          />
          <Route path="/dashboard" element={<DashboardShell view="myDrive" />} />
          <Route path="/dashboard/recent" element={<DashboardShell view="recent" />} />
          <Route path="/dashboard/starred" element={<DashboardShell view="starred" />} />
          <Route path="/dashboard/trash" element={<DashboardShell view="trash" />} />
          <Route path="/dashboard/folder/:folderId" element={<DashboardFolderShell />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
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
