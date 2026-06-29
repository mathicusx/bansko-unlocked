import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../services/seo.service';
import { LocaleService, Locale } from '../../services/locale.service';

/**
 * Commercial landing page for the "enduro holidays no licence" cluster — the
 * single biggest non-brand differentiator in the GSC data (`enduro holidays no
 * licence`, 1236 imp; Dutch `zonder rijbewijs`).
 *
 * Localised EN / DE / FR. German targets `Enduro ohne Führerschein`
 * (see the /de blog slug `enduro-ohne-motorradfuehrerschein-bulgarien`); French
 * targets `enduro sans permis` (cf. `enduro-sans-permis-moto-bulgarie`). The URL
 * slug stays English under the locale prefix (`/de/no-licence-enduro-bulgaria`),
 * matching the site-wide convention — only the visible copy + tour titles are
 * translated. Recommended-tour titles reuse the canonical translations from the
 * difficulty-levels i18n so they don't drift.
 *
 * Copy is self-contained per locale (not the global i18n dict) — this is a
 * single, self-scoped feature, like the per-locale blog data files. hreflang
 * now emits en ↔ de ↔ fr + x-default because all three routes are live (see
 * LocaleService.MIRRORED_PATHS + STATIC_PAGES de/frMirror).
 */
interface NoLicenceCopy {
  h1: string;
  intro: string;
  whyHeading: string;
  whyParagraphs: string[];
  weekHeading: string;
  weekSteps: { heading: string; body: string }[];
  toursHeading: string;
  toursLead: string;
  tours: { slug: string; title: string; duration: string }[];
  toursFoot: {
    lead: string;
    difficultyLink: string;
    mid: string;
    toursLink: string;
    end: string;
  };
  faqHeading: string;
  faqs: { question: string; answer: string }[];
  ctaHeading: string;
  ctaBody: string;
  ctaPrimary: string;
  ctaSecondary: string;
  breadcrumb: { home: string; tours: string; current: string };
}

interface NoLicenceMeta {
  title: string;
  description: string;
  keywords: string;
}

@Component({
  selector: 'app-no-licence',
  imports: [CommonModule, RouterLink],
  templateUrl: './no-licence.component.html',
  styleUrl: './no-licence.component.scss',
})
export class NoLicenceComponent implements OnInit {
  private static readonly NEUTRAL_PATH = '/no-licence-enduro-bulgaria';

  private static readonly META: Record<Locale, NoLicenceMeta> = {
    en: {
      title: 'Enduro Holidays With No Licence — Bulgaria, Pirin Mountains',
      description:
        "Ride enduro in Bulgaria's Pirin, Rila & Rhodope Mountains with no motorcycle licence " +
        'needed. Guided beginner trails, 2026 GASGAS & Husqvarna bikes, SPA hotel ' +
        'and airport transfers all included.',
      keywords:
        'enduro holidays no licence, no licence enduro bulgaria, enduro without ' +
        'licence, enduro for beginners europe, dirt bike no licence, beginner ' +
        'enduro bulgaria, zonder rijbewijs enduro',
    },
    de: {
      title: 'Enduro ohne Führerschein — Bulgarien, Pirin-Gebirge',
      description:
        'Enduro im bulgarischen Pirin-, Rila- & Rhodopen-Gebirge — ganz ohne Motorradführerschein. ' +
        'Geführte Anfänger-Trails, GASGAS & Husqvarna 2026, SPA-Hotel und ' +
        'Flughafentransfers inklusive.',
      keywords:
        'enduro ohne führerschein, enduro bulgarien ohne führerschein, ' +
        'enduro-touren bulgarien, enduro für anfänger, enduro urlaub bulgarien, ' +
        'motorrad ohne führerschein',
    },
    fr: {
      title: 'Enduro sans permis — Bulgarie, montagnes du Pirin',
      description:
        'Roulez en enduro dans le Pirin, le Rila et les Rhodopes, en Bulgarie, sans permis moto. Sentiers ' +
        'guidés débutants, motos GASGAS & Husqvarna 2026, hôtel SPA et transferts ' +
        'aéroport inclus.',
      keywords:
        'enduro sans permis, séjour enduro bulgarie, enduro sans permis bulgarie, ' +
        'enduro débutant, vacances enduro bulgarie, moto sans permis',
    },
    nl: {
      title: 'Enduro zonder rijbewijs — Bulgarije, Pirin-gebergte',
      description:
        'Rijd enduro in het Bulgaarse Pirin-, Rila- & Rhodopegebergte zonder motorrijbewijs. ' +
        'Begeleide beginnerstrails, 2026 GASGAS & Husqvarna-motoren, SPA-hotel ' +
        'en luchthaventransfers inbegrepen.',
      keywords:
        'enduro zonder rijbewijs, enduro bulgarije zonder rijbewijs, ' +
        'enduroreizen bulgarije, enduro voor beginners, enduro vakantie ' +
        'bulgarije, motor zonder rijbewijs',
    },
  };

  private static readonly COPY: Record<Locale, NoLicenceCopy> = {
    en: {
      h1: 'Enduro Holidays in Bulgaria — No Licence Needed',
      intro:
        "You don't need a motorcycle licence to ride real enduro in Bulgaria. " +
        'On our guided tours through the Pirin Mountains above Bansko, first-time ' +
        'riders spend day one learning clutch, balance and standing on the pegs, ' +
        'then ride genuine forest trails the same week — on a brand-new 2026 ' +
        'GASGAS or Husqvarna, with a guide at your shoulder the whole way.',
      whyHeading: 'Why no licence is needed in Bulgaria',
      whyParagraphs: [
        'In the UK, Germany, Spain and most of Europe, getting on an off-road ' +
          'bike legally means a road licence, a CBT, or an expensive day at a ' +
          'closed practice track. Bulgaria is different. Bulgarian off-road law ' +
          'permits guided riding on private land and forestry roads without the ' +
          'road licence those countries require — so a complete beginner can ' +
          'spend a week riding real mountain trails, not laps of a car park.',
        'That single legal fact is why roughly four in ten of our beginner-tour ' +
          'guests have never thrown a leg over a motorcycle before. It is also ' +
          'why a no-licence enduro holiday in Bulgaria costs a fraction of the ' +
          "licence, training and bike-hire stack you'd pay to start back home.",
      ],
      weekHeading: 'What a no-licence enduro week looks like',
      weekSteps: [
        {
          heading: 'Day one — coaching, not paperwork',
          body:
            'Your guide starts you on the basics: clutch control, body position, ' +
            'braking, turning, and picking the bike up when you drop it (everyone ' +
            'does). No exam, no licence test — just riding, on quiet forest tracks ' +
            'where there is room to make mistakes.',
        },
        {
          heading: 'Mid-week — real trails at your pace',
          body:
            'Once the basics click, we ride wide forest fire-roads and gentle ' +
            'climbs above Bansko — 30 to 50 km a day with long lunches at ' +
            'mountain restaurants. The guide rides at the back to coach you ' +
            'through each corner. You ride only the lines you are ready for.',
        },
        {
          heading: 'Off the bike — everything handled',
          body:
            'Evenings are at a 4-star SPA hotel with all meals, a wellness centre ' +
            'and Bulgarian hospitality. Return airport transfers from Sofia or ' +
            'Plovdiv are included, so the only thing you organise is the flight.',
        },
      ],
      toursHeading: 'Beginner tours you can ride with no licence',
      toursLead:
        'Every tour below starts with hands-on coaching and is graded for ' +
        'first-time riders. Pick the length that suits you — your guide handles ' +
        'the rest.',
      tours: [
        { slug: 'new-riders-trail-discovery', title: "New Rider's Trail Discovery", duration: '5 Days' },
        { slug: 'weekend-wheels-adventure', title: 'Weekend Wheels Adventure', duration: '4 Days' },
        { slug: 'weeklong-adventure-retreat', title: 'Weeklong Adventure Retreat', duration: '7 Days' },
      ],
      toursFoot: {
        lead: 'Not sure which level fits? See how we grade every ride on the ',
        difficultyLink: 'enduro difficulty levels',
        mid: ' page, or browse all ',
        toursLink: 'Bulgaria enduro tours',
        end: '.',
      },
      faqHeading: 'No-licence enduro — common questions',
      faqs: [
        {
          question: 'Do I really need no motorcycle licence to ride enduro in Bulgaria?',
          answer:
            'Correct. Bulgarian off-road law does not require a motorcycle licence ' +
            'for guided riding on private and forest land, so a complete beginner ' +
            'can ride a full week of real mountain trails. No CBT, no road test, no ' +
            'licence of any kind is needed for our beginner tours.',
        },
        {
          question: 'I have never ridden a motorcycle at all. Can I still come?',
          answer:
            'Yes — about 40% of our beginner-tour guests have never ridden before. ' +
            'Day one is structured coaching at your pace; if you can ride a ' +
            'push-bike with confidence, you have enough to start. You do not need ' +
            'any road experience.',
        },
        {
          question: 'What bike will I ride as a no-licence beginner?',
          answer:
            'Brand-new 2026 GASGAS and Husqvarna enduro bikes, set up for the ' +
            'terrain and your level. Beginners typically ride a manageable ' +
            'capacity with gentle power delivery; the guide matches the bike to ' +
            'you on day one.',
        },
        {
          question: 'Is a no-licence enduro holiday actually safe for a first-timer?',
          answer:
            'It is built for first-timers. Small groups, beginner-graded forest ' +
            'tracks, full protective gear, and a guide who stays with you the ' +
            'whole ride. You progress only as fast as you are comfortable — there ' +
            'is no pressure to keep up with anyone but yourself.',
        },
      ],
      ctaHeading: 'Ready to ride — no licence required',
      ctaBody:
        "Tell us your riding experience and the dates you're considering, and " +
        "we'll match you to the right beginner tour.",
      ctaPrimary: 'View Enduro Tours',
      ctaSecondary: 'Ask a Question',
      breadcrumb: { home: 'Home', tours: 'Enduro Tours', current: 'No Licence Enduro' },
    },
    de: {
      h1: 'Enduro in Bulgarien — ganz ohne Führerschein',
      intro:
        'Für echtes Enduro in Bulgarien brauchst du keinen Motorradführerschein. ' +
        'Auf unseren geführten Touren durch das Pirin-Gebirge oberhalb von Bansko ' +
        'lernen Einsteiger am ersten Tag Kupplung, Balance und das Stehen auf den ' +
        'Fußrasten — und fahren noch in derselben Woche echte Waldtrails, auf ' +
        'einer brandneuen GASGAS oder Husqvarna von 2026, mit einem Guide direkt ' +
        'an deiner Seite.',
      whyHeading: 'Warum in Bulgarien kein Führerschein nötig ist',
      whyParagraphs: [
        'In Großbritannien, Deutschland, Spanien und den meisten Teilen Europas ' +
          'heißt „legal ins Gelände“ so viel wie: Führerschein, teure Fahrstunden ' +
          'oder ein kostspieliger Tag auf einer abgesperrten Übungsstrecke. ' +
          'Bulgarien ist anders. Das bulgarische Geländerecht erlaubt geführtes ' +
          'Fahren auf Privatgelände und Forstwegen ohne den Straßenführerschein, ' +
          'den diese Länder verlangen — ein kompletter Anfänger kann also eine ' +
          'ganze Woche echte Bergtrails fahren, statt Runden auf einem Parkplatz ' +
          'zu drehen.',
        'Diese eine rechtliche Tatsache ist der Grund, warum rund vier von zehn ' +
          'Gästen unserer Einsteiger-Touren noch nie auf einem Motorrad saßen. Sie ' +
          'ist auch der Grund, warum ein Enduro-Urlaub ohne Führerschein in ' +
          'Bulgarien nur einen Bruchteil dessen kostet, was du zu Hause für ' +
          'Führerschein, Ausbildung und Mietmaschine zusammen zahlen würdest.',
      ],
      weekHeading: 'So läuft eine Enduro-Woche ohne Führerschein ab',
      weekSteps: [
        {
          heading: 'Tag eins — Coaching statt Papierkram',
          body:
            'Dein Guide beginnt mit den Grundlagen: Kupplungskontrolle, ' +
            'Körperhaltung, Bremsen, Kurvenfahren und das Aufheben der Maschine, ' +
            'wenn du sie ablegst (das passiert jedem). Keine Prüfung, kein ' +
            'Führerscheintest — einfach Fahren, auf ruhigen Waldwegen, wo Platz ' +
            'für Fehler ist.',
        },
        {
          heading: 'Wochenmitte — echte Trails in deinem Tempo',
          body:
            'Sobald die Grundlagen sitzen, fahren wir breite Forstwege und sanfte ' +
            'Anstiege oberhalb von Bansko — 30 bis 50 km pro Tag mit langen ' +
            'Mittagspausen in Bergrestaurants. Der Guide fährt hinten und coacht ' +
            'dich durch jede Kurve. Du fährst nur die Linien, für die du bereit ' +
            'bist.',
        },
        {
          heading: 'Neben dem Fahren — alles geregelt',
          body:
            'Die Abende verbringst du in einem 4-Sterne-SPA-Hotel mit allen ' +
            'Mahlzeiten, Wellnessbereich und bulgarischer Gastfreundschaft. Die ' +
            'Flughafentransfers von Sofia oder Plovdiv sind inklusive — du ' +
            'organisierst nur den Flug.',
        },
      ],
      toursHeading: 'Einsteiger-Touren, die du ohne Führerschein fahren kannst',
      toursLead:
        'Jede Tour unten beginnt mit praktischem Coaching und ist für Erstfahrer ' +
        'ausgelegt. Wähl einfach die Länge, die zu dir passt — um den Rest ' +
        'kümmert sich dein Guide.',
      tours: [
        { slug: 'new-riders-trail-discovery', title: 'Trail-Entdeckung für Einsteiger', duration: '5 Tage' },
        { slug: 'weekend-wheels-adventure', title: 'Wochenend-Abenteuer auf zwei Rädern', duration: '4 Tage' },
        { slug: 'weeklong-adventure-retreat', title: 'Einwöchiges Abenteuer-Retreat', duration: '7 Tage' },
      ],
      toursFoot: {
        lead: 'Nicht sicher, welches Niveau passt? Sieh dir auf der Seite ',
        difficultyLink: 'Enduro-Schwierigkeitsgrade',
        mid: ' an, wie wir jede Tour einstufen — oder durchstöbere alle ',
        toursLink: 'Enduro-Touren in Bulgarien',
        end: '.',
      },
      faqHeading: 'Enduro ohne Führerschein — häufige Fragen',
      faqs: [
        {
          question: 'Brauche ich für eine Enduro-Tour in Bulgarien wirklich keinen Führerschein?',
          answer:
            'Richtig. Das bulgarische Geländerecht verlangt keinen ' +
            'Motorradführerschein für geführtes Fahren auf Privat- und ' +
            'Waldgelände — ein kompletter Anfänger kann also eine ganze Woche ' +
            'echte Bergtrails fahren. Für unsere Einsteiger-Touren ist kein ' +
            'Führerschein nötig, keine Fahrprüfung, gar nichts.',
        },
        {
          question: 'Ich bin noch nie Motorrad gefahren. Kann ich trotzdem mitkommen?',
          answer:
            'Ja — etwa 40 % unserer Einsteiger-Gäste sind vorher noch nie ' +
            'gefahren. Der erste Tag ist strukturiertes Coaching in deinem Tempo; ' +
            'wer sicher Fahrrad fährt, bringt genug mit, um anzufangen. ' +
            'Straßenerfahrung brauchst du keine.',
        },
        {
          question: 'Welche Maschine fahre ich als Anfänger ohne Führerschein?',
          answer:
            'Brandneue GASGAS- und Husqvarna-Enduros von 2026, abgestimmt auf das ' +
            'Gelände und dein Niveau. Anfänger fahren meist eine gut ' +
            'beherrschbare Hubraumklasse mit sanfter Leistungsentfaltung; der ' +
            'Guide passt die Maschine am ersten Tag an dich an.',
        },
        {
          question: 'Ist ein Enduro-Urlaub ohne Führerschein für Einsteiger wirklich sicher?',
          answer:
            'Er ist genau für Einsteiger gemacht. Kleine Gruppen, ' +
            'anfängergerechte Waldwege, komplette Schutzausrüstung und ein Guide, ' +
            'der die ganze Fahrt bei dir bleibt. Du steigerst dich nur so schnell, ' +
            'wie du dich wohlfühlst — du musst niemandem hinterherfahren außer dir ' +
            'selbst.',
        },
      ],
      ctaHeading: 'Bereit zum Fahren — ganz ohne Führerschein',
      ctaBody:
        'Sag uns deine Fahrerfahrung und die Wunschtermine, und wir finden die ' +
        'passende Einsteiger-Tour für dich.',
      ctaPrimary: 'Enduro-Touren ansehen',
      ctaSecondary: 'Frage stellen',
      breadcrumb: { home: 'Startseite', tours: 'Enduro-Touren', current: 'Ohne Führerschein' },
    },
    fr: {
      h1: 'Enduro en Bulgarie — sans permis moto',
      intro:
        'Pas besoin de permis moto pour faire du vrai enduro en Bulgarie. Sur nos ' +
        'séjours guidés dans les montagnes du Pirin, au-dessus de Bansko, les ' +
        "débutants apprennent dès le premier jour l'embrayage, l'équilibre et la " +
        'position debout sur les repose-pieds — puis roulent sur de vrais sentiers ' +
        'forestiers la même semaine, sur une GASGAS ou une Husqvarna 2026 flambant ' +
        "neuve, avec un guide juste à côté d'eux.",
      whyHeading: "Pourquoi aucun permis n'est nécessaire en Bulgarie",
      whyParagraphs: [
        "Au Royaume-Uni, en Allemagne, en Espagne et dans la plupart des pays " +
          "d'Europe, rouler légalement en tout-terrain suppose un permis route, " +
          'une formation obligatoire ou une journée coûteuse sur un circuit fermé. ' +
          "La Bulgarie, c'est différent. La loi bulgare sur le tout-terrain " +
          'autorise la conduite guidée sur terrains privés et chemins forestiers ' +
          "sans le permis route qu'exigent ces pays — un débutant complet peut " +
          'donc passer une semaine entière sur de vrais sentiers de montagne, au ' +
          "lieu de tourner sur un parking.",
        'Ce simple fait juridique explique pourquoi près de quatre clients sur ' +
          "dix de nos séjours débutants n'avaient jamais enfourché une moto. " +
          "C'est aussi pourquoi un séjour enduro sans permis en Bulgarie coûte " +
          'une fraction de ce que vous paieriez chez vous pour le permis, la ' +
          'formation et la location de moto réunis.',
      ],
      weekHeading: "À quoi ressemble une semaine d'enduro sans permis",
      weekSteps: [
        {
          heading: 'Jour un — du coaching, pas de paperasse',
          body:
            "Ton guide commence par les bases : maîtrise de l'embrayage, position " +
            'du corps, freinage, virages, et comment relever la moto quand tu la ' +
            "poses (ça arrive à tout le monde). Pas d'examen, pas de test de " +
            'permis — juste rouler, sur des chemins forestiers tranquilles où il y ' +
            'a de la place pour les erreurs.',
        },
        {
          heading: 'Milieu de semaine — de vrais sentiers à ton rythme',
          body:
            "Une fois les bases acquises, on roule sur de larges pistes " +
            'forestières et des montées douces au-dessus de Bansko — 30 à 50 km ' +
            'par jour, avec de longues pauses déjeuner dans des restaurants de ' +
            'montagne. Le guide roule derrière pour te coacher dans chaque virage. ' +
            'Tu ne prends que les trajectoires pour lesquelles tu es prêt.',
        },
        {
          heading: 'Hors de la moto — tout est pris en charge',
          body:
            'Les soirées se passent dans un hôtel SPA 4 étoiles avec tous les ' +
            "repas, un espace bien-être et l'hospitalité bulgare. Les transferts " +
            'aéroport depuis Sofia ou Plovdiv sont inclus : la seule chose que tu ' +
            "organises, c'est le vol.",
        },
      ],
      toursHeading: 'Séjours débutants à faire sans permis',
      toursLead:
        'Chaque séjour ci-dessous commence par un coaching pratique et est conçu ' +
        'pour les premiers tours de roue. Choisis simplement la durée qui te ' +
        "convient — ton guide s'occupe du reste.",
      tours: [
        { slug: 'new-riders-trail-discovery', title: 'Découverte des sentiers pour débutants', duration: '5 jours' },
        { slug: 'weekend-wheels-adventure', title: 'Aventure de week-end sur deux roues', duration: '4 jours' },
        { slug: 'weeklong-adventure-retreat', title: "Séjour aventure d'une semaine", duration: '7 jours' },
      ],
      toursFoot: {
        lead:
          'Vous ne savez pas quel niveau choisir ? Découvrez comment nous ' +
          'évaluons chaque sortie sur la page ',
        difficultyLink: 'niveaux de difficulté enduro',
        mid: ', ou parcourez tous les ',
        toursLink: 'séjours enduro en Bulgarie',
        end: '.',
      },
      faqHeading: 'Enduro sans permis — questions fréquentes',
      faqs: [
        {
          question: 'Faut-il vraiment aucun permis moto pour rouler en enduro en Bulgarie ?',
          answer:
            "Exact. La loi bulgare sur le tout-terrain n'exige aucun permis moto " +
            'pour la conduite guidée sur terrains privés et forestiers — un ' +
            'débutant complet peut donc rouler une semaine entière sur de vrais ' +
            'sentiers de montagne. Aucun permis, aucun examen, rien de tout cela ' +
            "n'est requis pour nos séjours débutants.",
        },
        {
          question: "Je n'ai jamais conduit de moto. Puis-je quand même venir ?",
          answer:
            'Oui — environ 40 % de nos clients débutants ' +
            "n'avaient jamais roulé auparavant. Le premier jour est un coaching " +
            'structuré à ton rythme ; si tu fais du vélo avec aisance, tu en sais ' +
            "assez pour commencer. Aucune expérience de la route n'est nécessaire.",
        },
        {
          question: 'Quelle moto vais-je conduire en tant que débutant sans permis ?',
          answer:
            'Des GASGAS et Husqvarna enduro 2026 flambant neuves, réglées pour le ' +
            'terrain et ton niveau. Les débutants roulent généralement sur une ' +
            'cylindrée maniable à la puissance douce ; le guide adapte la moto à ' +
            'toi dès le premier jour.',
        },
        {
          question: 'Un séjour enduro sans permis est-il vraiment sûr pour un débutant ?',
          answer:
            'Il est conçu pour les débutants. Petits groupes, pistes forestières ' +
            'adaptées aux débutants, équipement de protection complet et un guide ' +
            'qui reste avec toi toute la sortie. Tu progresses seulement aussi ' +
            "vite que tu le souhaites — tu n'as à suivre personne d'autre que " +
            'toi-même.',
        },
      ],
      ctaHeading: 'Prêt à rouler — sans permis',
      ctaBody:
        "Dis-nous ton expérience de conduite et les dates qui t'intéressent, et " +
        'nous te proposerons le séjour débutant qui te convient.',
      ctaPrimary: 'Voir les séjours enduro',
      ctaSecondary: 'Poser une question',
      breadcrumb: { home: 'Accueil', tours: 'Séjours enduro', current: 'Sans permis' },
    },
    nl: {
      h1: 'Enduroreizen in Bulgarije — zonder rijbewijs',
      intro:
        'Je hebt geen motorrijbewijs nodig om in Bulgarije echt enduro te rijden. ' +
        'Op onze begeleide tochten door het Pirin-gebergte boven Bansko leren ' +
        'beginners op dag één koppeling, balans en staan op de voetsteunen, en ' +
        'rijden ze diezelfde week echte bospaden — op een gloednieuwe 2026 GASGAS ' +
        'of Husqvarna, met een gids voortdurend aan je zij.',
      whyHeading: 'Waarom in Bulgarije geen rijbewijs nodig is',
      whyParagraphs: [
        'In het VK, Duitsland, Spanje en de meeste delen van Europa betekent ' +
          'legaal het terrein op gaan: een rijbewijs, een verplichte ' +
          'basisopleiding of een dure dag op een afgesloten oefenterrein. ' +
          'Bulgarije is anders. De Bulgaarse offroad-wetgeving staat begeleid ' +
          'rijden op privéterrein en bospaden toe zonder het wegrijbewijs dat ' +
          'die landen vereisen — een complete beginner kan dus een week lang ' +
          'echte bergtrails rijden in plaats van rondjes op een parkeerplaats.',
        'Dat ene juridische feit is de reden dat ongeveer vier op de tien ' +
          'gasten van onze beginnerstochten nooit eerder op een motor hebben ' +
          'gezeten. Het is ook de reden dat een enduro vakantie zonder rijbewijs ' +
          'in Bulgarije een fractie kost van wat je thuis zou betalen aan ' +
          'rijbewijs, opleiding en motorhuur samen.',
      ],
      weekHeading: 'Hoe een enduroweek zonder rijbewijs eruitziet',
      weekSteps: [
        {
          heading: 'Dag één — coaching, geen papierwerk',
          body:
            'Je gids begint met de basis: koppelingscontrole, lichaamshouding, ' +
            'remmen, sturen en het oprapen van de motor wanneer je hem neerlegt ' +
            '(dat doet iedereen). Geen examen, geen rijbewijstest — gewoon ' +
            'rijden, op rustige bospaden waar ruimte is om fouten te maken.',
        },
        {
          heading: 'Halverwege de week — echte trails in jouw tempo',
          body:
            'Zodra de basis zit, rijden we brede bosbrandwegen en zachte ' +
            'beklimmingen boven Bansko — 30 tot 50 km per dag met lange ' +
            'lunchpauzes in bergrestaurants. De gids rijdt achteraan om je door ' +
            'elke bocht te coachen. Je rijdt alleen de lijnen waar je klaar voor ' +
            'bent.',
        },
        {
          heading: 'Naast de motor — alles geregeld',
          body:
            'De avonden breng je door in een 4-sterren SPA-hotel met alle ' +
            'maaltijden, een wellnesscentrum en Bulgaarse gastvrijheid. De heen- ' +
            'en terugtransfers vanaf Sofia of Plovdiv zijn inbegrepen, dus het ' +
            'enige wat je zelf regelt is de vlucht.',
        },
      ],
      toursHeading: 'Beginnerstochten die je zonder rijbewijs kunt rijden',
      toursLead:
        'Elke tocht hieronder begint met praktische coaching en is afgestemd op ' +
        'beginners. Kies de lengte die bij je past — je gids regelt de rest.',
      tours: [
        { slug: 'new-riders-trail-discovery', title: 'Trailontdekking voor instappers', duration: '5 dagen' },
        { slug: 'weekend-wheels-adventure', title: 'Weekendavontuur op twee wielen', duration: '4 dagen' },
        { slug: 'weeklong-adventure-retreat', title: 'Avontuurretraite van een week', duration: '7 dagen' },
      ],
      toursFoot: {
        lead: 'Weet je niet zeker welk niveau past? Bekijk hoe we elke rit indelen op de pagina ',
        difficultyLink: 'enduro moeilijkheidsgraden',
        mid: ', of blader door alle ',
        toursLink: 'enduroreizen in Bulgarije',
        end: '.',
      },
      faqHeading: 'Enduro zonder rijbewijs — veelgestelde vragen',
      faqs: [
        {
          question: 'Heb ik echt geen motorrijbewijs nodig om enduro te rijden in Bulgarije?',
          answer:
            'Klopt. De Bulgaarse offroad-wetgeving vereist geen motorrijbewijs ' +
            'voor begeleid rijden op privé- en bosterrein, dus een complete ' +
            'beginner kan een volledige week echte bergtrails rijden. Geen ' +
            'basisopleiding, geen rijexamen, geen enkel rijbewijs is nodig voor ' +
            'onze beginnerstochten.',
        },
        {
          question: 'Ik heb nog nooit motor gereden. Kan ik toch komen?',
          answer:
            'Ja — ongeveer 40% van onze beginnerstocht-gasten heeft nooit eerder ' +
            'gereden. Dag één is gestructureerde coaching in jouw tempo; als je ' +
            'met vertrouwen kunt fietsen, heb je genoeg om te beginnen. Je hebt ' +
            'geen enkele wegervaring nodig.',
        },
        {
          question: 'Op welke motor rijd ik als beginner zonder rijbewijs?',
          answer:
            'Gloednieuwe 2026 GASGAS- en Husqvarna-enduromotoren, afgestemd op ' +
            'het terrein en jouw niveau. Beginners rijden doorgaans een goed ' +
            'beheersbare cilinderinhoud met zachte vermogensafgifte; de gids ' +
            'stemt de motor op dag één op jou af.',
        },
        {
          question: 'Is een enduro vakantie zonder rijbewijs echt veilig voor een beginner?',
          answer:
            'Het is gebouwd voor beginners. Kleine groepen, op beginners ' +
            'afgestemde bospaden, complete beschermende uitrusting en een gids ' +
            'die de hele rit bij je blijft. Je gaat alleen zo snel vooruit als je ' +
            'je prettig voelt — er is geen druk om iemand bij te houden behalve ' +
            'jezelf.',
        },
      ],
      ctaHeading: 'Klaar om te rijden — geen rijbewijs vereist',
      ctaBody:
        'Vertel ons je rijervaring en de data die je overweegt, en we koppelen ' +
        'je aan de juiste beginnerstocht.',
      ctaPrimary: 'Bekijk enduroreizen',
      ctaSecondary: 'Stel een vraag',
      breadcrumb: { home: 'Home', tours: 'Enduroreizen', current: 'Enduro zonder rijbewijs' },
    },
  };

  constructor(
    private seoService: SeoService,
    private localeService: LocaleService,
  ) {}

  get copy(): NoLicenceCopy {
    return NoLicenceComponent.COPY[this.localeService.current()];
  }

  /** Locale-aware `routerLink` targets so a click from /de or /fr keeps the
   *  prefix instead of dropping the rider onto the English route. */
  get links() {
    const p = (path: string) => this.localeService.localePath(path);
    return {
      enduroTours: p('/enduro-tours'),
      difficulty: p('/difficulty-levels'),
      contact: p('/contact'),
    };
  }

  tourLink(slug: string): string {
    return this.localeService.localePath(`/tour/${slug}`);
  }

  ngOnInit(): void {
    const locale = this.localeService.current();
    const meta = NoLicenceComponent.META[locale];
    const copy = this.copy;
    const path = NoLicenceComponent.NEUTRAL_PATH;
    const url = this.localeService.canonicalFor(path, locale);

    this.seoService.updateMetaTags({
      title: meta.title,
      description: meta.description,
      keywords: meta.keywords,
      url,
      locale: this.localeService.ogLocale(),
    });

    // All three locales are live routes, so the default ['de', 'fr'] alternate
    // set is correct — no soft-404 trap (CLAUDE.md "Hreflang").
    this.seoService.addHreflangs(this.localeService.hreflangAlternates(path));

    this.seoService.addGraphSchemas([
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        name: meta.title,
        description: meta.description,
        url,
        inLanguage: this.localeService.htmlLang(),
        isPartOf: { '@id': 'https://banskounlocked.com/#website' },
        publisher: { '@id': 'https://banskounlocked.com/#organization' },
      },
      this.seoService.getBreadcrumbSchema([
        { name: copy.breadcrumb.home, url: this.localeService.canonicalFor('/', locale) },
        { name: copy.breadcrumb.tours, url: this.localeService.canonicalFor('/enduro-tours', locale) },
        { name: copy.breadcrumb.current, url },
      ]),
      this.seoService.getFAQSchema(copy.faqs),
    ]);
  }
}
