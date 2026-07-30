import type { Language } from './i18n.ts'

export const RANKING_EXAMPLE_IDS = [
  'apartment-features',
  'working-conditions',
  'superpowers',
  'essential-inventions',
  'desert-island',
  'travel-destinations',
  'ice-cream-flavors',
] as const

export type RankingExampleId = (typeof RANKING_EXAMPLE_IDS)[number]

export interface RankingExample {
  readonly title: string
  readonly items: readonly string[]
}

export const rankingExamplesByLanguage = {
  de: {
    'apartment-features': {
      title: 'Was ist mir bei einer Wohnung am wichtigsten?',
      items: [
        'Gute Lage',
        'Niedrige Miete',
        'Großer Balkon',
        'Viel Tageslicht',
        'Ruhige Umgebung',
        'Große Küche',
        'Kurzer Arbeitsweg',
        'Badewanne',
        'Zusätzliches Arbeitszimmer',
        'Schöner Ausblick',
      ],
    },
    'working-conditions': {
      title: 'Was ist mir bei der Arbeit am wichtigsten?',
      items: [
        'Hohes Gehalt',
        'Flexible Arbeitszeiten',
        'Viel Homeoffice',
        'Spannende Aufgaben',
        'Nette Kolleg:innen',
        'Sicherer Arbeitsplatz',
        'Gute Führung',
        'Sinnvolle Tätigkeit',
        'Aufstiegsmöglichkeiten',
        'Wenig Überstunden',
      ],
    },
    superpowers: {
      title: 'Welche Superkraft hätte ich am liebsten?',
      items: [
        'Fliegen',
        'Teleportation',
        'Unsichtbarkeit',
        'Gedanken lesen',
        'Zeit anhalten',
        'Unter Wasser atmen',
        'Mit Tieren sprechen',
        'Superschnell sein',
        'Heilen können',
        'In die Zukunft sehen',
      ],
    },
    'essential-inventions': {
      title: 'Auf welche Erfindung könnte ich am wenigsten verzichten?',
      items: [
        'Internet',
        'Kühlschrank',
        'Waschmaschine',
        'Smartphone',
        'Elektrisches Licht',
        'Fahrrad',
        'Kaffeemaschine',
        'Klimaanlage',
        'Geschirrspüler',
        'Kopfhörer',
      ],
    },
    'desert-island': {
      title: 'Was würde ich auf eine einsame Insel mitnehmen?',
      items: [
        'Messer',
        'Feuerzeug',
        'Wasserfilter',
        'Hängematte',
        'Solarladegerät',
        'Angel',
        'Erste-Hilfe-Set',
        'Satellitentelefon',
        'Kochtopf',
        'Ein sehr langes Buch',
      ],
    },
    'travel-destinations': {
      title: 'Wohin würde ich am liebsten reisen?',
      items: [
        'Japan',
        'Island',
        'Italien',
        'Norwegen',
        'Neuseeland',
        'Portugal',
        'Kanada',
        'Griechenland',
        'Vietnam',
        'Schottland',
      ],
    },
    'ice-cream-flavors': {
      title: 'Welche Eissorte mag ich am liebsten?',
      items: [
        'Vanille',
        'Schokolade',
        'Erdbeere',
        'Pistazie',
        'Stracciatella',
        'Mango',
        'Zitrone',
        'Karamell',
        'Haselnuss',
        'Cookies',
      ],
    },
  },
  en: {
    'apartment-features': {
      title: 'What matters most to me in an apartment?',
      items: [
        'Good location',
        'Low rent',
        'Large balcony',
        'Plenty of natural light',
        'Quiet neighborhood',
        'Large kitchen',
        'Short commute',
        'Bathtub',
        'Separate home office',
        'Beautiful view',
      ],
    },
    'working-conditions': {
      title: 'What matters most to me at work?',
      items: [
        'High salary',
        'Flexible hours',
        'Remote work',
        'Interesting tasks',
        'Friendly colleagues',
        'Job security',
        'Good leadership',
        'Meaningful work',
        'Career opportunities',
        'Little overtime',
      ],
    },
    superpowers: {
      title: 'Which superpower would I most like to have?',
      items: [
        'Flying',
        'Teleportation',
        'Invisibility',
        'Reading minds',
        'Stopping time',
        'Breathing underwater',
        'Talking to animals',
        'Super speed',
        'Healing powers',
        'Seeing the future',
      ],
    },
    'essential-inventions': {
      title: 'Which invention could I least live without?',
      items: [
        'Internet',
        'Refrigerator',
        'Washing machine',
        'Smartphone',
        'Electric light',
        'Bicycle',
        'Coffee maker',
        'Air conditioning',
        'Dishwasher',
        'Headphones',
      ],
    },
    'desert-island': {
      title: 'What would I take to a desert island?',
      items: [
        'Knife',
        'Lighter',
        'Water filter',
        'Hammock',
        'Solar charger',
        'Fishing rod',
        'First aid kit',
        'Satellite phone',
        'Cooking pot',
        'A very long book',
      ],
    },
    'travel-destinations': {
      title: 'Where would I most like to travel?',
      items: [
        'Japan',
        'Iceland',
        'Italy',
        'Norway',
        'New Zealand',
        'Portugal',
        'Canada',
        'Greece',
        'Vietnam',
        'Scotland',
      ],
    },
    'ice-cream-flavors': {
      title: 'Which ice cream flavor do I like best?',
      items: [
        'Vanilla',
        'Chocolate',
        'Strawberry',
        'Pistachio',
        'Stracciatella',
        'Mango',
        'Lemon',
        'Caramel',
        'Hazelnut',
        'Cookies and cream',
      ],
    },
  },
} satisfies Readonly<
  Record<Language, Readonly<Record<RankingExampleId, RankingExample>>>
>

const DISPLAYED_EXAMPLE_COUNT = 3

export function pickRankingExampleIds(
  excludedIds: readonly RankingExampleId[] = [],
  random: () => number = Math.random,
): readonly RankingExampleId[] {
  const excludedIdSet = new Set(excludedIds)
  const candidates = RANKING_EXAMPLE_IDS.filter(
    (id) => !excludedIdSet.has(id),
  )
  const selectedIds: RankingExampleId[] = []

  while (
    selectedIds.length < DISPLAYED_EXAMPLE_COUNT &&
    candidates.length > 0
  ) {
    const candidateIndex = Math.floor(random() * candidates.length)
    const [selectedId] = candidates.splice(candidateIndex, 1)

    if (selectedId !== undefined) {
      selectedIds.push(selectedId)
    }
  }

  return selectedIds
}
