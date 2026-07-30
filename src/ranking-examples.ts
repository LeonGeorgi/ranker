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
        'Kurzer Arbeitsweg',
        'Zusätzliches Arbeitszimmer',
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
        'Sinnvolle Tätigkeit',
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
      ],
    },
    'desert-island': {
      title: 'Was würde ich auf eine einsame Insel mitnehmen?',
      items: [
        'Messer',
        'Feuerzeug',
        'Wasserfilter',
        'Angel',
        'Erste-Hilfe-Set',
        'Satellitentelefon',
        'Ein sehr langes Buch',
      ],
    },
    'travel-destinations': {
      title: 'Wohin würde ich am liebsten reisen?',
      items: [
        'Japan',
        'Island',
        'Italien',
        'Neuseeland',
        'Kanada',
        'Griechenland',
        'Vietnam',
      ],
    },
    'ice-cream-flavors': {
      title: 'Welche Eissorte mag ich am liebsten?',
      items: [
        'Schokolade',
        'Erdbeere',
        'Pistazie',
        'Stracciatella',
        'Mango',
        'Karamell',
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
        'Short commute',
        'Separate home office',
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
        'Meaningful work',
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
      ],
    },
    'desert-island': {
      title: 'What would I take to a desert island?',
      items: [
        'Knife',
        'Lighter',
        'Water filter',
        'Fishing rod',
        'First aid kit',
        'Satellite phone',
        'A very long book',
      ],
    },
    'travel-destinations': {
      title: 'Where would I most like to travel?',
      items: [
        'Japan',
        'Iceland',
        'Italy',
        'New Zealand',
        'Canada',
        'Greece',
        'Vietnam',
      ],
    },
    'ice-cream-flavors': {
      title: 'Which ice cream flavor do I like best?',
      items: [
        'Chocolate',
        'Strawberry',
        'Pistachio',
        'Stracciatella',
        'Mango',
        'Caramel',
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
