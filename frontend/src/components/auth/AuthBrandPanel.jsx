import { Check } from 'lucide-react'
import content from '../../config/content.json'

export default function AuthBrandPanel() {
  return (
    <div className="flex flex-1 flex-col justify-between bg-zinc-900 p-10 dark:bg-zinc-100 lg:p-16">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white dark:bg-zinc-900">
          <span className="text-lg font-bold text-zinc-900 dark:text-white">
            {content.brand.logoLetter}
          </span>
        </div>
        <span className="text-base font-semibold text-white dark:text-zinc-900">
          {content.brand.name}
        </span>
      </div>

      <h1 className="max-w-sm text-4xl font-semibold leading-tight text-white dark:text-zinc-900">
        {content.brand.tagline}
      </h1>

      <ul className="space-y-4">
        {content.auth.features.map((feature) => (
          <li
            key={feature}
            className="flex items-center gap-3 text-zinc-200 dark:text-zinc-700"
          >
            <Check size={18} className="shrink-0" />
            <span className="text-sm">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
