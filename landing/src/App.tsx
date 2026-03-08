import Hero from './components/Hero'
import PainPoints from './components/PainPoints'
import HowItWorks from './components/HowItWorks'
import Features from './components/Features'
import Faq from './components/Faq'
import FinalCta from './components/FinalCta'
import Footer from './components/Footer'

const BOT_URL = 'https://t.me/Beauty_100master_bot'

export default function App() {
  return (
    <div className="min-h-screen">
      <Hero botUrl={BOT_URL} />
      <PainPoints />
      <HowItWorks />
      <Features />
      <Faq />
      <FinalCta botUrl={BOT_URL} />
      <Footer botUrl={BOT_URL} />
    </div>
  )
}
