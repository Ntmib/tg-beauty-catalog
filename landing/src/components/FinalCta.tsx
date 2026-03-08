import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export default function FinalCta({ botUrl }: { botUrl: string }) {
  return (
    <section className="px-4 py-20 md:py-28">
      <motion.div
        className="mx-auto max-w-3xl overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 via-rose-600 to-rose-700 px-8 py-16 text-center shadow-2xl shadow-rose-500/20 md:px-16"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="font-display text-3xl font-bold text-white md:text-4xl">
          Откройте свой салон — это бесплатно
        </h2>
        <p className="mt-4 text-lg text-rose-100">
          Откройте салон за 3 минуты и&nbsp;пригласите первого клиента.
        </p>
        <a
          href={botUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-lg font-semibold text-rose-600 shadow-lg transition-all hover:bg-rose-50 hover:shadow-xl active:scale-[0.98]"
        >
          Открыть салон
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
        </a>
        <p className="mt-4 text-sm text-rose-200">
          Без оплаты · Без установки · Работает сразу
        </p>
      </motion.div>
    </section>
  )
}
