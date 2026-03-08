import { motion } from 'framer-motion'
import { Tag, Palette, DoorOpen } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Step {
  num: string
  icon: LucideIcon
  title: string
  text: string
}

const steps: Step[] = [
  {
    num: '01',
    icon: Tag,
    title: 'Повесьте вывеску',
    text: 'Создайте бота с вашим именем через @BotFather. Это вход в ваш салон — 1 минута.',
  },
  {
    num: '02',
    icon: Palette,
    title: 'Оформите витрину',
    text: 'Добавьте услуги, фото работ и расписание. Мы проведём за руку — за 3 минуты всё готово.',
  },
  {
    num: '03',
    icon: DoorOpen,
    title: 'Откройте двери',
    text: 'Отправьте ссылку клиентам. Они заходят в ваш салон, выбирают услугу и записываются сами.',
  },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
}

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export default function HowItWorks() {
  return (
    <section className="bg-gradient-to-b from-beige to-bg px-4 py-20 md:py-28">
      <div className="mx-auto max-w-5xl">
        <motion.div
          className="mb-4 text-center"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <span className="inline-block rounded-full bg-gold-100 px-4 py-1.5 text-sm font-medium text-gold-500">
            Открытие салона
          </span>
        </motion.div>

        <motion.h2
          className="mb-14 text-center font-display text-3xl font-bold md:text-4xl"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          Как открыть салон
        </motion.h2>

        <motion.div
          className="relative grid gap-8 md:grid-cols-3 md:gap-12"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {/* Соединительная линия (десктоп) */}
          <div className="pointer-events-none absolute top-16 right-[16.7%] left-[16.7%] hidden h-px bg-gradient-to-r from-rose-200 via-gold-400 to-rose-200 md:block" />

          {steps.map((step) => (
            <motion.div
              key={step.num}
              className="relative flex flex-col items-center text-center"
              variants={item}
            >
              {/* Номер + иконка */}
              <div className="relative mb-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-lg shadow-rose-100/40 ring-1 ring-rose-100">
                  <step.icon className="h-8 w-8 text-rose-500" />
                </div>
                <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white shadow-md">
                  {step.num}
                </span>
              </div>

              <h3 className="mb-2 text-xl font-semibold">{step.title}</h3>
              <p className="max-w-xs text-sm leading-relaxed text-text-muted">{step.text}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
