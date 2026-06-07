import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/hero"
import { Calculator } from "@/components/calculator"
import { FAQ } from "@/components/faq"
import { Guide } from "@/components/guide"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Calculator defaultTab="jdg" />
        <FAQ />
        <Guide />
      </main>
      <Footer />
    </div>
  )
}
