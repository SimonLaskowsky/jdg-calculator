import Link from "next/link"
import { Calculator } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left">
          <div className="flex flex-col items-center gap-2 md:items-start">
            <Link href="/" className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">ilezostanie.com</span>
            </Link>
            <p className="max-w-md text-sm text-muted-foreground">
              Kalkulator ZUS i PIT 2026 dla przedsiębiorców. Porównaj formy opodatkowania i wybierz najkorzystniejszą opcję.
            </p>
          </div>

          <nav className="flex flex-wrap justify-center gap-6 text-sm">
            <Link href="#kalkulator" className="text-muted-foreground transition-colors hover:text-foreground">
              Kalkulator
            </Link>
            <Link href="#faq" className="text-muted-foreground transition-colors hover:text-foreground">
              FAQ
            </Link>
            <Link href="#poradnik" className="text-muted-foreground transition-colors hover:text-foreground">
              Poradnik
            </Link>
          </nav>
        </div>

        <div className="mt-8 border-t border-border/50 pt-8">
          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            Obliczenia mają charakter poglądowy i nie stanowią porady podatkowej. 
            W przypadku wątpliwości skonsultuj się z doradcą podatkowym lub księgowym.
          </p>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} ilezostanie.com. Wszelkie prawa zastrzeżone.
          </p>
        </div>
      </div>
    </footer>
  )
}
