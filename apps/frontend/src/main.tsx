import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './hooks/useAuth'

// Components
import { ProtectedRoute } from './components/ProtectedRoute'
import { Login } from './features/auth/Login'
import { ParentLayout } from './features/parent/ParentLayout'
import { ParentHome } from './features/parent/ParentHome'
import { CreateRequest } from './features/parent/CreateRequest'
import { ManagerLayout } from './features/manager/ManagerLayout'
import { ManagerHome } from './features/manager/ManagerHome'
import { ReviewRequest } from './features/manager/ReviewRequest'

import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Login />} />

          {/* Protected Parent Routes */}
          <Route element={<ProtectedRoute allowedRoles={['parent']} />}>
            <Route element={<ParentLayout />}>
              <Route path="/parent" element={<ParentHome />} />
              <Route path="/create-request" element={<CreateRequest />} />
            </Route>
          </Route>

          {/* Protected Manager Routes */}
          <Route element={<ProtectedRoute allowedRoles={['manager']} />}>
            <Route element={<ManagerLayout />}>
              <Route path="/manager" element={<ManagerHome />} />
              <Route path="/review-request" element={<ReviewRequest />} />
            </Route>
          </Route>
          
          {/* Placeholder for Tutor */}
          <Route element={<ProtectedRoute allowedRoles={['tutor']} />}>
            <Route path="/tutor" element={<div className="p-10 font-bold">Tutor Dashboard (Coming Soon)</div>} />
          </Route>
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
