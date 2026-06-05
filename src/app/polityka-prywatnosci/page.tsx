import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: "Polityka prywatności",
  description:
    "Polityka prywatności serwisu ilezostanie.com – kalkulatora ZUS i PIT. Dowiedz się, jak przetwarzamy dane i jakie pliki zapisujemy w przeglądarce.",
  alternates: { canonical: "/polityka-prywatnosci" },
  robots: { index: true, follow: true },
}

const updated = "5 czerwca 2026"

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="py-12 sm:py-14">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Polityka prywatności
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">Ostatnia aktualizacja: {updated}</p>

            <div className="mt-8 space-y-8 text-[15px] leading-relaxed text-muted-foreground">
              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground">1. Informacje ogólne</h2>
                <p>
                  Niniejsza polityka prywatności dotyczy serwisu <strong>ilezostanie.com</strong> (dalej:
                  „Serwis") — bezpłatnego kalkulatora ZUS i PIT, który pomaga porównać formy opodatkowania
                  działalności gospodarczej. Serwis ma charakter informacyjny, a przedstawiane obliczenia
                  są poglądowe i nie stanowią porady podatkowej.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground">2. Administrator danych</h2>
                <p>
                  Administratorem danych jest właściciel Serwisu. W sprawach dotyczących prywatności
                  i ochrony danych możesz skontaktować się pod adresem:{" "}
                  <a href="mailto:simonlaskowsky@gmail.com" className="text-primary underline underline-offset-4">
                    simonlaskowsky@gmail.com
                  </a>
                  .
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground">3. Dane wpisywane w kalkulatorze</h2>
                <p>
                  Wszystkie wartości, które wprowadzasz w kalkulatorze (przychód, koszty, rodzaj ZUS,
                  stawki itp.) są przetwarzane <strong>wyłącznie lokalnie w Twojej przeglądarce</strong>.
                  Nie wysyłamy ich na serwer, nie zapisujemy w bazie danych ani nie udostępniamy podmiotom
                  trzecim. Po zamknięciu lub odświeżeniu strony dane te nie są przez nas przechowywane.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground">4. Pamięć lokalna (localStorage)</h2>
                <p>
                  W pamięci lokalnej Twojej przeglądarki zapisujemy jedynie <strong>preferencję motywu</strong>{" "}
                  (jasny/ciemny), aby zapamiętać Twój wybór przy kolejnych wizytach. Informacja ta pozostaje
                  na Twoim urządzeniu i nie jest do nas przesyłana. Możesz ją w każdej chwili usunąć,
                  czyszcząc dane przeglądarki.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground">5. Logi serwera</h2>
                <p>
                  Dostawca hostingu może automatycznie zapisywać standardowe logi techniczne (m.in. adres IP,
                  typ przeglądarki, data i godzina żądania) w celu zapewnienia bezpieczeństwa i prawidłowego
                  działania Serwisu. Podstawą prawną jest prawnie uzasadniony interes administratora
                  (art. 6 ust. 1 lit. f RODO).
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground">6. Pliki cookies i analityka</h2>
                <p>
                  Serwis nie wykorzystuje plików cookies do śledzenia ani profilowania reklamowego. Jeżeli
                  w przyszłości zostaną wdrożone narzędzia analityczne (np. statystyki odwiedzin), niniejsza
                  polityka zostanie odpowiednio zaktualizowana, a w razie potrzeby poprosimy o Twoją zgodę.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground">7. Twoje prawa</h2>
                <p>
                  W zakresie, w jakim przetwarzamy dane osobowe, przysługuje Ci prawo dostępu do danych,
                  ich sprostowania, usunięcia lub ograniczenia przetwarzania, prawo do sprzeciwu oraz prawo
                  wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych (PUODO).
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground">8. Zmiany polityki prywatności</h2>
                <p>
                  Zastrzegamy sobie prawo do aktualizacji niniejszej polityki w razie zmian w działaniu
                  Serwisu lub przepisów prawa. Aktualna wersja jest zawsze dostępna na tej stronie wraz
                  z datą ostatniej aktualizacji.
                </p>
              </section>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
