import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import AuthBrandPanel from '../components/auth/AuthBrandPanel'
import content from '../config/content.json'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function SignUp() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})

  const copy = content.auth.signup

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = {}
    const v = content.auth.validation
    if (!name.trim()) {
      nextErrors.name = v.nameRequired
    }
    if (!email.trim()) {
      nextErrors.email = v.emailRequired
    } else if (!EMAIL_REGEX.test(email)) {
      nextErrors.email = v.emailInvalid
    }
    if (!password) {
      nextErrors.password = v.passwordRequired
    }
    if (!confirm) {
      nextErrors.confirm = v.confirmRequired
    } else if (password && confirm !== password) {
      nextErrors.confirm = v.passwordMismatch
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    signup(name, email, password)
    navigate('/dashboard')
  }

  const inputClass =
    'w-full rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-50 dark:focus:ring-zinc-50/10'
  const labelClass =
    'mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300'
  const errorClass = 'mt-1.5 text-xs text-red-600 dark:text-red-400'

  return (
    <div className="grid flex-1 lg:grid-cols-2">
      <AuthBrandPanel />

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {copy.title}
          </h2>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {copy.subtitle}
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
            <div>
              <label htmlFor="name" className={labelClass}>
                {copy.nameLabel}
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
              />
              {errors.name && <p className={errorClass}>{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="email" className={labelClass}>
                {copy.emailLabel}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
              {errors.email && <p className={errorClass}>{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className={labelClass}>
                {copy.passwordLabel}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={
                    showPassword
                      ? content.auth.hidePassword
                      : content.auth.showPassword
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className={errorClass}>{errors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirm" className={labelClass}>
                {copy.confirmLabel}
              </label>
              <input
                id="confirm"
                type={showPassword ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={inputClass}
              />
              {errors.confirm && <p className={errorClass}>{errors.confirm}</p>}
            </div>

            <button
              type="submit"
              className="w-full rounded-md bg-zinc-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {copy.button}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            {copy.switchText}{' '}
            <Link
              to="/signin"
              className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-50"
            >
              {copy.switchLink}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
