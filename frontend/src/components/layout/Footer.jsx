import content from '../../config/content.json'

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex flex-col items-center gap-4 px-4 py-6 text-center sm:px-6 md:flex-row md:justify-between md:text-left">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {content.footer.tagline}
        </p>

        <nav className="flex items-center gap-6">
          {content.footer.links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {content.footer.copy}
        </p>
      </div>
    </footer>
  )
}
