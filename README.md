# Kalkulator ZUS i PIT 2026

Kompleksowy kalkulator podatkowy dla polskich freelancerów i przedsiębiorców. Porównaj wszystkie formy opodatkowania JDG, sp. z o.o. oraz B2B vs etat - znajdź najlepszą opcję dla siebie.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC)

## Funkcje

### JDG - Jednoosobowa Działalność Gospodarcza
- **Skala podatkowa** (12% / 32%) z kwotą wolną 30 000 zł
- **Podatek liniowy** (19%)
- **Ryczałt** - wszystkie stawki (17%, 15%, 12%, 8.5%, 5.5%, 3%, 2%)
- **IP Box** (5%) - dla programistów i twórców
- **50% koszty autorskie**
- Rodzaje ZUS: pełny, preferencyjny, mały ZUS plus, ulga na start

### Sp. z o.o.
- CIT 9% (mały podatnik) lub 19% (standardowy)
- Scenariusze wypłaty:
  - Tylko dywidenda
  - Minimalna pensja + dywidenda
  - Pełna pensja
- Automatyczny wybór najlepszej opcji

### Porównanie JDG vs Sp. z o.o.
- Bezpośrednie porównanie najlepszych opcji
- **Próg opłacalności** - przy jakim przychodzie zmienić formę
- Zalety i wady każdej formy

### B2B vs Etat
- Porównanie kontraktu B2B z umową o pracę
- Roczne podsumowanie różnic
- Zalety i wady obu form zatrudnienia

### UX
- **Suwaki real-time** - wyniki aktualizują się na żywo
- **Wykres porównawczy** - wizualizacja netto przy różnych przychodach
- Dark mode
- W pełni responsywny design

## Tech Stack

- **Next.js 15** - React framework
- **React 19** - UI library
- **TypeScript 5** - type safety
- **Tailwind CSS 4** - styling
- **Recharts** - wykresy

## Uruchomienie

```bash
# Instalacja zależności
pnpm install

# Development
pnpm dev

# Build
pnpm build

# Start production
pnpm start
```

Otwórz [http://localhost:3000](http://localhost:3000) w przeglądarce.

## Struktura projektu

```
src/
├── app/
│   ├── globals.css       # Style Tailwind
│   ├── layout.tsx        # SEO meta tags
│   └── page.tsx          # Główna strona (formularze, wyniki, wykresy)
└── lib/
    ├── constants.ts      # Stawki ZUS/PIT/CIT 2026
    ├── calculations.ts   # Obliczenia JDG
    └── calculations-spzoo.ts  # Obliczenia sp. z o.o.
```

## Stawki 2026

| Parametr | Wartość |
|----------|---------|
| Minimalne wynagrodzenie | 4 666 zł |
| Przeciętne wynagrodzenie | 8 673 zł |
| Pełny ZUS (podstawa) | 5 203,80 zł |
| Kwota wolna | 30 000 zł |
| Próg podatkowy | 120 000 zł |

## Disclaimer

Obliczenia mają charakter poglądowy i nie stanowią porady podatkowej. W przypadku wątpliwości skonsultuj się z doradcą podatkowym.

## Licencja

MIT
