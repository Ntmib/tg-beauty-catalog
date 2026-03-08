import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

interface FaqItem {
  q: string
  a: string
}

const faqs: FaqItem[] = [
  {
    q: 'Открыть салон — бесплатно?',
    a: 'Да. До 5 услуг и 20 фото — полностью бесплатно и без ограничений по времени. Для большего объёма будет Pro-тариф, но базовый салон всегда бесплатен.',
  },
  {
    q: 'Мне нужен свой бот?',
    a: 'Да — это вывеска вашего салона. Создать её — 1 минута. Откройте @BotFather в Telegram, нажмите /newbot, придумайте имя. Готово.',
  },
  {
    q: 'А если я уже веду запись в тетради или Excel?',
    a: 'Оформите витрину — добавьте услуги — и отправьте ссылку клиентам. Они начнут записываться сами. Тетрадь больше не нужна.',
  },
  {
    q: 'Клиенты увидят других мастеров?',
    a: 'Нет. Это ваш личный салон, а не маркетплейс. Никаких конкурентов рядом, никакой чужой рекламы.',
  },
  {
    q: 'Работает без Instagram?',
    a: 'Именно для этого и сделано. Ваш салон в Telegram — полная замена Instagram. Витрина, запись, напоминания — всё внутри.',
  },
]

export default function Faq() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="bg-gradient-to-b from-bg to-beige px-4 py-20 md:py-28">
      <div className="mx-auto max-w-2xl">
        <motion.div
          className="mb-4 text-center"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <span className="inline-block rounded-full bg-rose-50 px-4 py-1.5 text-sm font-medium text-rose-600">
            Вопросы
          </span>
        </motion.div>

        <motion.h2
          className="mb-12 text-center font-display text-3xl font-bold md:text-4xl"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          Частые вопросы
        </motion.h2>

        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {faqs.map((faq, i) => {
            const isOpen = open === i
            return (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-rose-100 bg-white transition-shadow hover:shadow-sm"
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between px-6 py-5 text-left"
                >
                  <span className="pr-4 font-semibold">{faq.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 flex-shrink-0 text-rose-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                <div
                  className="grid transition-all duration-200"
                  style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-5 text-sm leading-relaxed text-text-muted">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
