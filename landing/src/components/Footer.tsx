export default function Footer({ botUrl }: { botUrl: string }) {
  return (
    <footer className="border-t border-rose-100 bg-white px-4 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-text-muted sm:flex-row">
        <div className="flex items-center gap-2">
          <span className="font-display text-lg font-bold text-rose-500">GlowUp</span>
          <span className="text-gray-300">·</span>
          <span>Каталог красоты в Telegram</span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href={botUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-rose-500"
          >
            Открыть бота
          </a>
          <span className="text-gray-300">·</span>
          <span>&copy; {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  )
}
