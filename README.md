# Fysic Manager Client

Een moderne React-applicatie voor het beheren van fysiotherapie praktijken, afspraken en patiënten.

## Project Overzicht

Fysic Manager Client is een webapplicatie gebouwd met React en TypeScript die een intuïtieve interface biedt voor fysiotherapie praktijken. De applicatie stelt gebruikers in staat om therapeuten, patiënten, afspraken, praktijken en werkschema's efficiënt te beheren.

### Hoofdfuncties

- **📅 Afspraak Planning**: Visuele planning met drag-and-drop functionaliteit
- **👥 Patiënt Beheer**: Uitgebreid patiëntenbeheer met zoekfunctionaliteit
- **🏥 Praktijk Beheer**: Beheer van meerdere praktijklocaties
- **👨‍⚕️ Therapeut Beheer**: Therapeuten met specialisaties en werkschema's
- **⚙️ Admin Panel**: Centrale beheerinterface voor alle entiteiten
- **🗓️ Kalender Integratie**: Geïntegreerde kalenderweergave

## Technische Stack

- **Frontend Framework**: React 18 met TypeScript
- **UI Library**: Material-UI (MUI)
- **Date Handling**: date-fns voor datummanipulatie
- **State Management**: React Hooks
- **HTTP Client**: Axios voor API communicatie
- **Build Tool**: Create React App

## API Integratie

De applicatie communiceert met een .NET backend API via RESTful endpoints. Alle API services zijn georganiseerd in de `src/services/` directory:

### API Services

- **`appointmentAPI.ts`**: CRUD operaties voor afspraken
- **`patientAPI.ts`**: Patiënt zoeken, aanmaken en bijwerken
- **`therapistAPI.ts`**: Therapeut beheer en filtering
- **`practiceAPI.ts`**: Praktijk informatie en therapeut-toewijzingen
- **`specializationAPI.ts`**: Specialisatie beheer
- **`appointmentTypeAPI.ts`**: Afspraak type configuratie
- **`workshiftAPI.ts`**: Werkschema beheer

### API Configuratie

De base URL van de API wordt geconfigureerd in `src/config/environment.ts`:

```typescript
export const API_BASE_URL = 'https://localhost:7132/api';
```

### Typering

Het project gebruikt TypeScript interfaces voor type-veiligheid:

- **Core Types**: `src/types/` - Hoofdentiteiten (Patient, Therapist, Appointment, etc.)
- **Simple Types**: `src/types/Simple/` - Vereenvoudigde versies voor API communicatie

## Project Structuur

```
src/
├── components/          # Herbruikbare React componenten
│   └── schedule/       # Planning-gerelateerde componenten
├── pages/              # Hoofdpagina componenten
├── services/           # API service laag
├── types/              # TypeScript type definities
├── config/             # Configuratie bestanden
└── App.tsx            # Hoofdapplicatie component
```

### Belangrijke Componenten

- **`ScheduleView`**: Hoofdplanning interface
- **`AdminPanel`**: Beheerinterface voor alle entiteiten
- **`CreateAppointment`**: Afspraak aanmaak formulier
- **`EditAppointment`**: Afspraak bewerkingsformulier

## Installatie en Setup

### Vereisten

- Node.js (versie 16 of hoger)
- npm of yarn
- Een draaiende instance van de Fysic Manager API

### Installatie

1. Clone de repository:
```bash
git clone <repository-url>
cd fysic-manager-client
```

2. Installeer dependencies:
```bash
npm install
```

3. Configureer de API URL in `src/config/environment.ts`

4. Start de development server:
```bash
npm start
```

De applicatie draait nu op [http://localhost:3000](http://localhost:3000)

## Beschikbare Scripts

### `npm start`
Start de applicatie in development mode. De pagina wordt automatisch herladen bij wijzigingen.

### `npm test`
Start de test runner in interactieve watch mode.

### `npm run build`
Bouwt de applicatie voor productie naar de `build` folder. De build is geoptimaliseerd voor de beste prestaties.

### `npm run eject`
**Let op: dit is een onomkeerbare operatie!**

Eject onthult alle configuratiebestanden voor volledige controle over de build setup.

## Features in Detail

### Planning Interface
- **Time-slot gebaseerde weergave**: Therapeuten als kolommen, tijdslots als rijen
- **Visuele afspraak blokken**: Kleurgecodeerd op basis van afspraak type
- **Interactieve afspraak creatie**: Klik op beschikbare tijdslots
- **Real-time updates**: Automatische refresh bij wijzigingen

### Patiënt Beheer
- **Geavanceerd zoeken**: Zoek op naam, telefoon, email of BSN
- **Autocomplete functionaliteit**: Snelle patiënt selectie
- **Uitgebreide patiënt profielen**: Contactgegevens en afspraak geschiedenis
- **Inline bewerking**: Directe updates via modal dialogen

### Admin Panel
- **Tab-gebaseerde interface**: Aparte secties per entiteit type
- **CRUD operaties**: Volledig beheer van alle data
- **Bulk acties**: Efficiënt beheer van meerdere items
- **Validatie**: Client-side en server-side validatie

## Ontwikkeling

### Code Structuur
- **Component-based architectuur**: Modulaire, herbruikbare componenten
- **Service layer**: Gescheiden API logica
- **Type-safe**: Volledige TypeScript ondersteuning
- **Material Design**: Consistente UI/UX

### Styling
- **Material-UI theming**: Aangepaste kleurenschema's
- **Responsive design**: Werkt op desktop en tablet
- **Nederlandse interface**: Volledig vertaalde gebruikersinterface

### Error Handling
- **Graceful degradation**: Elegante foutafhandeling
- **User feedback**: Duidelijke error en success berichten
- **Retry mechanismen**: Automatische herverbinding bij netwerkfouten

## Deployment

Voor productie deployment:

1. Bouw de applicatie:
```bash
npm run build
```

2. Serve de `build` folder met een statische webserver
3. Configureer de API URL voor productie environment
4. Zorg ervoor dat de backend API toegankelijk is

## Ondersteuning

Voor vragen over de implementatie of het gebruik van deze applicatie, raadpleeg de API documentatie of neem contact op met het ontwikkelteam.
