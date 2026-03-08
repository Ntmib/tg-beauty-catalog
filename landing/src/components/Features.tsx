import { motion } from 'framer-motion'
import { Sparkles, CalendarCheck, Bell, Smartphone, Shield, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Feature {
  icon: LucideIcon
  title: string
  text: string
  color: string
  bg: string
}

const features: Feature[] = [
  {
    icon: Sparkles,
    title: 'Витрина',
    text: 'Услуги, фото работ, цены — красивая витрина вашего салона в Telegram.',
    color: 'text-rose-500',
    bg: 'bg-rose-50',
  },
  {
    icon: CalendarCheck,
    title: 'Ресепшен',
    text: 'Клиент выбирает дату и время сам. Записывается без переписок и звонков.',
    color: 'text-gold-500',
    bg: 'bg-gold-50',
  },
  {
    icon: Bell,
    title: 'Администратор',
    text: 'Напомнит клиенту о визите за 24ч и за 2ч. Неявки снижаются на 70%.',
    color: 'text-rose-500',
    bg: 'bg-rose-50',
  },
  {
    icon: Smartphone,
    title: 'Адрес салона',
    text: 'Ваша ссылка t.me/ваш_бот — вместо сайта, Instagram и CRM.',
    color: 'text-gold-500',
    bg: 'bg-gold-50',
  },
  {
    icon: Shield,
    title: 'Только ваш салон',
    text: 'Никакого маркетплейса. Никаких конкурентов рядом. Только вы.',
    color: 'text-rose-500',
    bg: 'bg-rose-50',
  },
  {
    icon: Zap,
    title: 'Открытие за 3 минуты',
    text: 'Три шага — и салон работает. Проще, чем пост в Instagram.',
    color: 'text-gold-500',
    bg: 'bg-gold-50',
  },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function Features() {
  return (
    <section className="bg-white px-4 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <motion.div
          className="mb-4 text-center"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <span className="inline-block rounded-full bg-gold-50 px-4 py-1.5 text-sm font-medium text-gold-500">
            Ваш салон
          </span>
        </motion.div>

        <motion.h2
          className="mb-12 text-center font-display text-3xl font-bold md:text-4xl"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          Что есть в вашем салоне
        </motion.h2>

        <motion.div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {features.map((feat) => (
            <motion.div
              key={feat.title}
              className="group rounded-2xl border border-gray-100 bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-gray-100/60"
              variants={item}
            >
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${feat.bg} ${feat.color}`}>
                <feat.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{feat.title}</h3>
              <p className="text-sm leading-relaxed text-text-muted">{feat.text}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
