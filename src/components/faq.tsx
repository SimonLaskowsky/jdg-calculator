"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqItems = [
  {
    question: "Ryczałt czy skala podatkowa - co się bardziej opłaca?",
    answer:
      "Zależy od wysokości dochodów i kosztów. Ryczałt (12% dla IT) jest najczęściej korzystniejszy dla programistów i freelancerów z niskimi kosztami. Skala podatkowa opłaca się przy niższych dochodach (do ~8 tys. zł/mc) lub wysokich kosztach uzyskania przychodu. Użyj naszego kalkulatora, aby porównać obie opcje dla Twojej sytuacji.",
  },
  {
    question: "Ile wynosi ZUS dla JDG w 2026 roku?",
    answer:
      "Pełny ZUS w 2026 roku wynosi około 1 774 zł miesięcznie (składki społeczne + zdrowotna). Preferencyjny ZUS (pierwsze 24 miesiące) to około 600 zł. Mały ZUS Plus zależy od przychodów. Ulga na start (pierwsze 6 miesięcy) zwalnia ze składek społecznych - płacisz tylko zdrowotną.",
  },
  {
    question: "Kiedy opłaca się założyć sp. z o.o. zamiast JDG?",
    answer:
      "Sp. z o.o. zaczyna się opłacać przy przychodach powyżej 15-20 tys. zł miesięcznie. Główne zalety to CIT 9% (mały podatnik), ograniczona odpowiedzialność i prestiż. Wady to podwójne opodatkowanie (CIT + dywidenda), droga księgowość (~800 zł/mc) i więcej formalności.",
  },
  {
    question: "B2B czy umowa o pracę - co wybrać?",
    answer:
      "B2B daje wyższe zarobki netto, ale brak płatnego urlopu, L4 i stabilności. Opłaca się gdy stawka B2B jest wyższa o ~20-30% od brutto na etacie. Na etacie masz 26 dni urlopu (warte ~10% rocznej pensji) i pełne ubezpieczenie chorobowe.",
  },
  {
    question: "Co to jest IP Box i dla kogo?",
    answer:
      "IP Box to preferencyjna stawka 5% podatku dla dochodów z kwalifikowanych praw własności intelektualnej (programy komputerowe, patenty). Wymaga prowadzenia ewidencji i dokumentacji. Opłaca się dla programistów tworzących własne oprogramowanie lub pracujących nad innowacyjnymi projektami.",
  },
  {
    question: "Jak działa ulga na start dla nowych firm?",
    answer:
      "Ulga na start zwalnia z opłacania składek społecznych ZUS przez pierwsze 6 miesięcy działalności. Płacisz tylko składkę zdrowotną (~420 zł dla minimalnej podstawy). Po 6 miesiącach możesz przejść na preferencyjny ZUS (kolejne 24 miesiące ze zniżką).",
  },
  {
    question: "Jaka stawka ryczałtu dla programisty?",
    answer:
      "Programiści najczęściej płacą ryczałt 12% od przychodu. Ta stawka obejmuje usługi IT, programowanie, doradztwo techniczne. Niektóre usługi mogą kwalifikować się do 8,5% (np. usługi dla firm). Sprawdź klasyfikację PKWiU swojej działalności.",
  },
  {
    question: "Ile wynosi składka zdrowotna w 2026?",
    answer:
      "Składka zdrowotna zależy od formy opodatkowania: Skala podatkowa - 9% dochodu (min. ~432 zł). Podatek liniowy - 4,9% dochodu (min. ~432 zł). Ryczałt - stała kwota zależna od przychodu: do 60 tys. zł/rok (~498 zł/mc), 60-300 tys. zł (~831 zł/mc), powyżej 300 tys. zł (~1 495 zł/mc).",
  },
]

export function FAQ() {
  return (
    <section id="faq" className="py-12 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Najczęściej zadawane pytania
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Odpowiedzi na popularne pytania dotyczące podatków i ZUS dla przedsiębiorców.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {faqItems.map((item, index) => (
            <Accordion key={index} multiple={false} className="w-full">
              <AccordionItem value={`item-${index}`} className="rounded-lg border border-border/50 bg-card px-4">
                <AccordionTrigger className="py-4 text-left text-sm font-medium hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ))}
        </div>
      </div>

      {/* FAQ Schema JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqItems.map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer,
              },
            })),
          }),
        }}
      />
    </section>
  )
}
