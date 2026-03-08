import { motion } from 'framer-motion'
import { ArrowRight, Star, Users, Zap } from 'lucide-react'

export default function Hero({ botUrl }: { botUrl: string }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-rose-50 via-beige to-gold-50 px-4 pt-16 pb-20 md:pt-24 md:pb-28">
      {/* Декоративные круги */}
      <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-rose-100 opacity-40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gold-100 opacity-50 blur-3xl" />

      <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-12 md:flex-row md:gap-16">
        {/* Текст */}
        <div className="flex-1 text-center md:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="mb-4 inline-block rounded-full bg-rose-100 px-4 py-1.5 text-sm font-medium text-rose-700">
              Личный салон в Telegram
            </span>
          </motion.div>

          <motion.h1
            className="mt-4 font-display text-4xl leading-tight font-bold tracking-tight md:text-5xl lg:text-6xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Откройте свой салон красоты{' '}
            <span className="bg-gradient-to-r from-rose-500 to-rose-700 bg-clip-text text-transparent">
              в Telegram
            </span>
          </motion.h1>

          <motion.p
            className="mt-6 max-w-lg text-lg leading-relaxed text-text-muted md:text-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Витрина, ресепшен, администратор — всё в&nbsp;одном боте. Бесплатно.
          </motion.p>

          <motion.div
            className="mt-8 flex flex-col items-center gap-3 md:items-start"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <a
              href={botUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 rounded-2xl bg-rose-500 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-rose-500/25 transition-all hover:bg-rose-600 hover:shadow-xl hover:shadow-rose-500/30 active:scale-[0.98]"
            >
              Открыть салон
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </a>
            <span className="text-sm text-text-muted">
              Открытие за 3 минуты · Бесплатно
            </span>
          </motion.div>

          {/* Статистика */}
          <motion.div
            className="mt-10 flex flex-wrap justify-center gap-6 md:justify-start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            {[
              { icon: Users, label: 'Салонов открыто', value: '50+' },
              { icon: Star, label: 'Средняя оценка', value: '4.9' },
              { icon: Zap, label: 'Клиентов записалось', value: '1 200+' },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2">
                <stat.icon className="h-4 w-4 text-gold-400" />
                <span className="text-sm font-semibold">{stat.value}</span>
                <span className="text-sm text-text-muted">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Мокап телефона */}
        <motion.div
          className="flex-shrink-0"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          <div className="relative mx-auto w-[280px] md:w-[320px]">
            {/* Рамка телефона */}
            <div className="rounded-[40px] border-[8px] border-gray-800 bg-gray-800 p-1 shadow-2xl">
              {/* Нотч */}
              <div className="absolute top-0 left-1/2 z-10 h-6 w-28 -translate-x-1/2 rounded-b-2xl bg-gray-800" />
              {/* Экран */}
              <div className="relative overflow-hidden rounded-[32px] bg-white">
                <PhoneMockup />
              </div>
            </div>
            {/* Свечение */}
            <div className="absolute -inset-8 -z-10 rounded-full bg-rose-200 opacity-30 blur-3xl" />
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function PhoneMockup() {
  return (
    <div className="flex h-[520px] flex-col bg-[#FEFCF9] p-4 pt-10 text-xs">
      {/* Header */}
      <div className="mb-4 text-center">
        <div className="mx-auto mb-2 h-16 w-16 rounded-full bg-gradient-to-br from-rose-200 to-rose-400" />
        <p className="font-display text-base font-bold text-gray-800">Салон Анны</p>
        <p className="text-[10px] text-gray-500">Маникюр · Педикюр · Наращивание</p>
        <div className="mt-1 flex items-center justify-center gap-1">
          {[1,2,3,4,5].map(i => (
            <Star key={i} className="h-3 w-3 fill-gold-400 text-gold-400" />
          ))}
          <span className="ml-1 text-[10px] text-gray-500">4.9</span>
        </div>
      </div>

      {/* Портфолио */}
      <div className="mb-4 flex gap-2 overflow-hidden">
        {['from-rose-300 to-pink-200', 'from-amber-200 to-orange-200', 'from-purple-200 to-pink-200'].map((g, i) => (
          <div key={i} className={`h-16 w-16 flex-shrink-0 rounded-xl bg-gradient-to-br ${g}`} />
        ))}
      </div>

      {/* Услуги */}
      <p className="mb-2 text-[11px] font-semibold text-gray-700">Услуги</p>
      {[
        { name: 'Маникюр + покрытие', price: '1 500 ₽', time: '1.5ч' },
        { name: 'Педикюр классический', price: '2 000 ₽', time: '2ч' },
        { name: 'Наращивание ногтей', price: '3 500 ₽', time: '3ч' },
        { name: 'Снятие + маникюр', price: '1 800 ₽', time: '2ч' },
      ].map((s) => (
        <div key={s.name} className="mb-2 flex items-center justify-between rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-gray-100">
          <div>
            <p className="text-[11px] font-medium text-gray-800">{s.name}</p>
            <p className="text-[9px] text-gray-400">{s.time}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-rose-600">{s.price}</span>
            <div className="rounded-lg bg-rose-500 px-2 py-0.5 text-[9px] font-medium text-white">
              Записаться
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
