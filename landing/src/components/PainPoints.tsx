import { motion } from 'framer-motion'
import { MessageSquare, ImageOff, UserX, Clock } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Pain {
  icon: LucideIcon
  title: string
  text: string
}

const pains: Pain[] = [
  {
    icon: MessageSquare,
    title: 'Ресепшен — это ваш WhatsApp',
    text: '5 мест куда пишут клиенты. Двойные брони. Забытые слоты. Знакомо?',
  },
  {
    icon: ImageOff,
    title: 'Витрина — это Instagram, который никто не видит',
    text: 'Снимаете рилсы 2 часа — 200 просмотров. А завтра аккаунт заблокируют.',
  },
  {
    icon: UserX,
    title: 'Администратора нет — клиент просто не пришёл',
    text: 'До 18% дохода теряется от неявок. Некому напомнить о визите.',
  },
  {
    icon: Clock,
    title: 'Вывеску некому повесить',
    text: 'Вы мастер, а не SMM-менеджер. На продвижение нет ни сил, ни времени.',
  },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
}

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export default function PainPoints() {
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
          <span className="inline-block rounded-full bg-rose-50 px-4 py-1.5 text-sm font-medium text-rose-600">
            Знакомо?
          </span>
        </motion.div>

        <motion.h2
          className="mb-12 text-center font-display text-3xl font-bold md:text-4xl"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          Ваш салон сейчас выглядит так
        </motion.h2>

        <motion.div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {pains.map((pain) => (
            <motion.div
              key={pain.title}
              className="group rounded-2xl border border-rose-100 bg-gradient-to-b from-rose-50/50 to-white p-6 transition-shadow hover:shadow-lg hover:shadow-rose-100/50"
              variants={item}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-500 transition-colors group-hover:bg-rose-500 group-hover:text-white">
                <pain.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold leading-snug">{pain.title}</h3>
              <p className="text-sm leading-relaxed text-text-muted">{pain.text}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
