# Script Vendeur ANTL - Frontend

Application React/TypeScript pour le call center ANTL. Interface vendeur pour la gestion des prospects, appels et ventes téléphoniques.

## 📋 Table des matières

- [Stack Technique](#stack-technique)
- [Architecture](#architecture)
- [Installation](#installation)
- [Développement](#développement)
- [Authentication](#authentication)
- [Composants Réutilisables](#composants-réutilisables)
- [Conventions](#conventions)

## 🛠 Stack Technique

- **Framework** : React 19.2
- **Language** : TypeScript 5.9
- **Build Tool** : Vite 7.2
- **Routing** : React Router DOM 7.10
- **HTTP Client** : Axios 1.13
- **Styling** : SASS/SCSS
- **Icons** : React Icons 5.5

## 🏗 Architecture

### Structure des dossiers

```
script/src/
├── API/                          # Couche API et services
│   ├── config.ts                 # Configuration Axios (Singleton)
│   ├── APICalls.tsx              # Méthodes HTTP génériques (GET, POST, PUT, PATCH, DELETE) + Retry logic
│   ├── models/                   # Modèles avec logique métier
│   │   ├── User.model.ts         # Modèle User (Employe)
│   │   ├── Prospect.model.ts     # Modèle Prospect (fullName, typeFiche, etc.)
│   │   ├── Campaign.model.ts     # Modèle Campaign
│   │   ├── Produit.model.ts      # Modèle Produit
│   │   └── index.ts
│   ├── services/                 # Services API (Singletons)
│   │   ├── User.service.ts       # Authentication (login, logout, refresh)
│   │   ├── Prospect.service.ts   # CRUD prospects, recherche par téléphone
│   │   ├── Campaign.service.ts   # CRUD campagnes
│   │   ├── Produit.service.ts    # Catalogue produits, filtres
│   │   ├── Appel.service.ts      # Gestion des appels (create, update, terminer)
│   │   ├── Vente.service.ts      # Gestion des ventes (panier multi-produits)
│   │   └── index.ts
│   └── index.ts
├── context/                      # Contexts React
│   ├── userContext/
│   │   ├── UserContext.tsx       # Context authentification
│   │   ├── UserProvider.tsx      # Provider avec login/logout
│   │   └── index.ts
│   ├── prospectContext/
│   │   ├── ProspectContext.tsx   # Context prospect en cours
│   │   ├── ProspectProvider.tsx  # Provider avec loadProspect()
│   │   └── index.ts
│   ├── campaignContext/
│   │   ├── CampaignContext.tsx   # Context campagne active
│   │   ├── CampaignProvider.tsx  # Provider avec loadCampaign()
│   │   └── index.ts
│   ├── cartContext/
│   │   ├── CartContext.tsx       # Context panier de commande
│   │   ├── CartProvider.tsx      # Provider avec addItem, removeItem, etc.
│   │   └── index.ts
│   ├── appContext/
│   │   ├── AppContext.tsx        # Context état global app
│   │   ├── AppProvider.tsx       # Provider modales/vues/notifications
│   │   └── index.ts
│   └── index.ts
├── hooks/                        # Hooks personnalisés
│   ├── useUser.ts                # Hook pour UserContext
│   ├── useProspect.ts            # Hook pour ProspectContext
│   ├── useCampaign.ts            # Hook pour CampaignContext
│   ├── useCart.ts                # Hook pour CartContext
│   ├── useApp.ts                 # Hook pour AppContext
│   └── index.ts
├── utils/                        # Utilitaires
│   ├── scripts/
│   │   └── utils.tsx             # Fonctions utilitaires (getSalutation, useClock)
│   ├── styles/                   # Styles globaux
│   │   ├── global.scss           # Styles globaux
│   │   ├── reset.scss            # Reset CSS
│   │   ├── _variables.scss       # Variables SCSS (100 lignes: couleurs, spacing, etc.)
│   │   └── _mixins.scss          # Mixins SCSS (127 lignes: flex, responsive, etc.)
│   └── types/                    # Types TypeScript
│       ├── user.types.ts         # Types utilisateur (Employe, Poste, Departement)
│       ├── prospect.types.ts     # Types prospect (Prospect, ProspectStatut, TypeFiche)
│       ├── campaign.types.ts     # Types campagne
│       ├── produit.types.ts      # Types produit
│       ├── appel.types.ts        # Types appel (StatutAppel, CreateAppelData)
│       ├── vente.types.ts        # Types vente (CreateVenteData, DetailVente)
│       ├── cart.types.ts         # Types panier (CartItem, Cart)
│       ├── api.types.ts          # Types API (ApiResponse, ApiError)
│       └── index.ts
├── views/                        # Composants visuels
│   ├── components/               # Composants réutilisables
│   │   ├── button/
│   │   │   ├── Button.tsx
│   │   │   └── button.scss
│   │   ├── input/
│   │   │   ├── Input.tsx
│   │   │   └── input.scss
│   │   ├── loader/
│   │   │   ├── Loader.tsx
│   │   │   └── loader.scss
│   │   ├── errorMessage/
│   │   │   ├── ErrorMessage.tsx
│   │   │   └── errorMessage.scss
│   │   ├── typeFicheBadge/
│   │   │   ├── TypeFicheBadge.tsx
│   │   │   └── typeFicheBadge.scss
│   │   ├── prospectInfoHeader/
│   │   │   ├── ProspectInfoHeader.tsx
│   │   │   └── prospectInfoHeader.scss
│   │   ├── actionButtons/
│   │   │   ├── ActionButtons.tsx
│   │   │   └── actionButtons.scss
│   │   ├── historiqueAppels/
│   │   │   ├── HistoriqueAppels.tsx   # Liste des appels avec pagination
│   │   │   ├── AppelCard.tsx          # Card individuelle d'appel
│   │   │   ├── historiqueAppels.scss
│   │   │   ├── appelCard.scss
│   │   │   └── index.ts
│   │   ├── historiqueVentes/
│   │   │   ├── HistoriqueVentes.tsx   # Liste des ventes
│   │   │   ├── VenteCard.tsx          # Card expandable de vente
│   │   │   ├── historiqueVentes.scss
│   │   │   ├── venteCard.scss
│   │   │   └── index.ts
│   │   ├── header/
│   │   │   ├── Header.tsx
│   │   │   └── header.scss
│   │   ├── footer/
│   │   │   ├── Footer.tsx
│   │   │   └── footer.scss
│   │   └── protectedRoute/
│   │       └── ProtectedRoute.tsx
│   └── layouts/                  # Pages/Layouts
│       ├── loginPage/
│       │   ├── LoginPage.tsx
│       │   └── loginPage.scss
│       └── landingPage/
│           ├── LandingPage.tsx   # Page principale avec fiche prospect
│           └── landingPage.scss
├── App.tsx                       # Composant principal avec routing
└── main.tsx                      # Point d'entrée avec hiérarchie des Providers
```

### Principes SOLID

L'architecture suit les principes SOLID pour une meilleure maintenabilité :

#### 1. Single Responsibility Principle (SRP)
- **config.ts** : Configuration Axios et gestion des tokens uniquement
- **APICalls.tsx** : Méthodes HTTP génériques uniquement
- **User.model.ts** : Logique métier de l'utilisateur
- **User.service.ts** : Communication API pour les utilisateurs
- **UserProvider.tsx** : Gestion de l'état d'authentification

#### 2. Open/Closed Principle (OCP)
- Les méthodes HTTP génériques peuvent être réutilisées pour toutes les entités
- Les modèles peuvent être étendus sans modification
- Nouveaux services ajoutables sans toucher aux existants

#### 3. Dependency Inversion Principle (DIP)
```
Component → useUser() → UserContext → UserService → apiCalls → apiClient
```

### Flux de données d'authentification

```
LoginPage
  ↓ useUser().login(credentials)
UserProvider
  ↓ userService.login(credentials)
UserService
  ↓ apiCalls.post('/auth/login', credentials)
APICalls
  ↓ api.post(endpoint, data)
ApiClient (config.ts)
  ↓ axios instance with interceptors
Backend API (/auth/login)
  ↓ { success, message, data: { token, refreshToken, employe } }
UserService
  ↓ apiClient.setTokens(token, refreshToken)
  ↓ userModel.saveToLocalStorage()
UserProvider
  ↓ setUser(userModel.toJSON())
Component
  ↓ isAuthenticated = true
  ↓ navigate('/')
```

## 🌐 Services API

L'application utilise des services Singleton pour communiquer avec l'API backend. Chaque service encapsule la logique métier et les appels API pour une entité spécifique.

### Architecture des services

- **APICalls** : Couche bas niveau avec retry logic (3 tentatives max sur erreurs réseau)
- **Services** : Couche métier (UserService, ProspectService, CampaignService, etc.)
- **Models** : Classes avec méthodes utilitaires et validation

### Services disponibles

#### 1. UserService (Authentication)

```typescript
import { userService } from '../API/services';

// Connexion
const loginData = await userService.login({ email, password });
// Retourne: { token, refreshToken, employe }

// Déconnexion
await userService.logout();

// Récupérer l'utilisateur actuel
const employe = await userService.getCurrentUser();
```

#### 2. ProspectService

```typescript
import { prospectService } from '../API/services';

// Récupérer un prospect par ID
const prospect = await prospectService.getProspectById(1);

// Rechercher par téléphone
const prospect = await prospectService.getProspectByPhone('0612345678');

// Liste avec pagination et filtres
const { prospects, total, page, totalPages } = await prospectService.getProspects({
  page: 1,
  limit: 20,
  statut: 'interesse',
  search: 'Dupont'
});
```

#### 3. CampaignService

```typescript
import { campaignService } from '../API/services';

// Récupérer une campagne
const campaign = await campaignService.getCampaignById(1);

// Liste des campagnes
const { campaigns, total } = await campaignService.getCampaigns({
  page: 1,
  limit: 10,
  actif: true
});
```

#### 4. ProduitService

```typescript
import { produitService } from '../API/services';

// Récupérer un produit
const produit = await produitService.getProduitById(1);

// Liste avec filtres
const { produits, total } = await produitService.getProduits({
  page: 1,
  limit: 20,
  categorie: 1,
  actif: true,
  search: 'assurance'
});

// Produits d'une campagne
const produits = await produitService.getProduitsByCampaign(1);
```

#### 5. AppelService

```typescript
import { appelService } from '../API/services';

// Créer un appel
const appel = await appelService.createAppel({
  id_prospect: 1,
  id_campagne: 1,
  statut: 'abouti',
  notes: 'Client intéressé'
});

// Mettre à jour un appel
const updated = await appelService.updateAppel(1, {
  duree_secondes: 300,
  notes: 'Complément d\'information'
});

// Terminer un appel (calcul durée automatique)
const finished = await appelService.terminerAppel(1);

// Historique d'un prospect
const { appels, total } = await appelService.getAppelsByProspect(1, {
  page: 1,
  limit: 10
});
```

#### 6. VenteService

```typescript
import { venteService } from '../API/services';

// Créer une vente
const vente = await venteService.createVente({
  id_prospect: 1,
  id_campagne: 1,
  mode_paiement: 'CB',
  details: [
    {
      id_produit: 1,
      quantite: 2,
      prix_unitaire: 49.99,
      remise: 5.00
    }
  ]
});

// Historique des ventes d'un prospect
const { ventes, total } = await venteService.getVentesByProspect(1);

// Liste des ventes avec filtres
const { ventes } = await venteService.getVentes({
  page: 1,
  limit: 20,
  statut: 'validee',
  campagne: 1
});

// Changer le statut
const updated = await venteService.updateStatut(1, 'validee');
```

### Retry Logic

Toutes les requêtes bénéficient d'une retry logic automatique :

- **Max retries** : 3 tentatives
- **Délai** : 1s, 2s, 3s (progressif)
- **Condition** : Uniquement sur erreurs réseau (timeout, perte de connexion)
- **Logging** : Console warnings pour traçabilité

```typescript
// Exemple automatique
try {
  const prospect = await prospectService.getProspectById(1);
  // Si erreur réseau : 3 tentatives automatiques
} catch (error) {
  // Après 3 échecs, erreur remontée
}
```

### Gestion des erreurs

```typescript
try {
  await prospectService.getProspectById(999);
} catch (error: ApiError) {
  console.error(error.message); // Message d'erreur API
  console.error(error.status);  // Code HTTP (404, 500, etc.)
  console.error(error.errors);  // Détails validation (optionnel)
}
```

## 📦 Installation

### Prérequis

- Node.js 18+
- npm ou yarn
- Backend API olympe en cours d'exécution

### Étapes

```bash
# 1. Installer les dépendances
cd script
npm install

# 2. Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec l'URL de l'API

# 3. Démarrer le serveur de développement
npm run dev
```

### Variables d'environnement

Fichier `.env` :

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8800/api

# Application Configuration
VITE_APP_NAME=ANTL Script Vendeur
VITE_APP_VERSION=1.0.0

# Environment
VITE_NODE_ENV=development
```

## 🚀 Développement

### Scripts disponibles

```bash
npm run dev        # Démarrer le serveur de développement (port 5173)
npm run build      # Build de production
npm run preview    # Preview du build
npm run lint       # Linter le code
```

### Ajouter une nouvelle entité

Pour ajouter une nouvelle entité (exemple : Prospect), suivre ce pattern :

#### 1. Créer le modèle

```typescript
// API/models/Prospect.model.ts
export class ProspectModel {
  constructor(data: Prospect) { /* ... */ }

  // Méthodes métier
  public getFullName(): string { /* ... */ }
  public toJSON(): Prospect { /* ... */ }

  // Méthodes statiques
  public static fromJSON(data: Prospect): ProspectModel { /* ... */ }
}
```

#### 2. Créer le service

```typescript
// API/services/Prospect.service.ts
export class ProspectService {
  private static instance: ProspectService;

  public async getProspects(): Promise<ProspectModel[]> {
    const response = await apiCalls.get('/prospects');
    return response.data.items.map(ProspectModel.fromJSON);
  }
}

export const prospectService = ProspectService.getInstance();
```

#### 3. Créer le contexte (optionnel)

```typescript
// context/prospectContext/ProspectContext.tsx
export interface ProspectContextType {
  currentProspect: Prospect | null;
  loadProspect: (id: number) => Promise<void>;
}

export const ProspectContext = createContext<ProspectContextType>();
```

#### 4. Créer le hook

```typescript
// hooks/useProspect.ts
export const useProspect = (): ProspectContextType => {
  const context = useContext(ProspectContext);
  if (!context) throw new Error('useProspect must be used within ProspectProvider');
  return context;
};
```

## 🔐 Authentication

### Système d'authentification

L'application utilise JWT (JSON Web Tokens) pour l'authentification :

- **Access Token** : 8 heures (renouvelable)
- **Refresh Token** : 7 jours
- **Storage** : localStorage

### UserContext

Le contexte utilisateur expose :

```typescript
interface UserContextType {
  user: Employe | null;              // Données utilisateur
  isAuthenticated: boolean;          // Statut authentification
  isLoading: boolean;                // Chargement en cours
  error: string | null;              // Message d'erreur

  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}
```

### Utilisation dans un composant

```typescript
import { useUser } from '../hooks/useUser';

const MyComponent = () => {
  const { user, login, logout, isLoading, error } = useUser();

  const handleLogin = async () => {
    await login({ email: 'test@antl.com', password: '123456' });
  };

  return (
    <div>
      {user && <p>Bonjour {user.prenom} {user.nom}</p>}
      {error && <p>{error}</p>}
      <button onClick={handleLogin} disabled={isLoading}>
        {isLoading ? 'Connexion...' : 'Se connecter'}
      </button>
    </div>
  );
};
```

### Refresh automatique des tokens

Les tokens sont automatiquement rafraîchis par les intercepteurs Axios :

1. Requête API → 401 Unauthorized
2. Intercepteur détecte le 401
3. Appel automatique à `/auth/refresh`
4. Si succès → Nouveau token stocké + Rejeu de la requête originale
5. Si échec → Déconnexion + Redirection `/login`

### Routes protégées

Utiliser le composant `ProtectedRoute` :

```typescript
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

### Sécurité

- ✅ Protection CSRF (tokens)
- ✅ Rate limiting (5 tentatives max)
- ✅ Validation côté client (email, password)
- ✅ Tokens stockés en localStorage (HTTPS uniquement en prod)
- ✅ Refresh automatique des tokens
- ✅ Déconnexion automatique sur 401
- ✅ Gestion des erreurs réseau

## 🗂️ State Management - Contexts

L'application utilise la Context API pour gérer l'état global. 5 contexts principaux sont disponibles :

### 1. UserContext (Authentication)

Gestion de l'authentification et de l'utilisateur connecté.

```typescript
interface UserContextType {
  user: Employe | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

// Usage
const { user, isAuthenticated, login, logout } = useUser();
```

### 2. ProspectContext

Gestion du prospect en cours de consultation/appel.

```typescript
interface ProspectContextType {
  currentProspect: Prospect | null;
  isLoading: boolean;
  error: string | null;
  loadProspect: (id: number) => Promise<void>;
  loadProspectByPhone: (phone: string) => Promise<void>;
  clearProspect: () => void;
  clearError: () => void;
}

// Usage
const { currentProspect, loadProspect } = useProspect();

// Charger un prospect
await loadProspect(1);

// Rechercher par téléphone
await loadProspectByPhone('0612345678');
```

### 3. CampaignContext

Gestion de la campagne active de l'agent.

```typescript
interface CampaignContextType {
  currentCampaign: Campaign | null;
  isLoading: boolean;
  error: string | null;
  loadCampaign: (id: number) => Promise<void>;
  clearCampaign: () => void;
  clearError: () => void;
}

// Usage
const { currentCampaign, loadCampaign } = useCampaign();
await loadCampaign(1);
```

### 4. CartContext

Gestion du panier de commande (multi-produits).

```typescript
interface CartContextType {
  items: CartItem[];
  total: number;
  itemCount: number;
  addItem: (produit: Produit, quantite?: number, remise?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantite: number) => void;
  updateRemise: (productId: number, remise: number) => void;
  clearCart: () => void;
  getItem: (productId: number) => CartItem | undefined;
}

// Usage
const { items, total, addItem, removeItem, clearCart } = useCart();

// Ajouter un produit
addItem(produit, 2, 5.00); // quantité: 2, remise: 5€

// Modifier quantité
updateQuantity(productId, 3);

// Supprimer
removeItem(productId);

// Vider le panier
clearCart();
```

### 5. AppContext

Gestion de l'état global de l'application (modales, vues, notifications).

```typescript
type ModalType = 'qui-est-ce' | 'qui-sommes-nous' | 'objections' | 'plan-appel' | null;
type ViewType = 'default' | 'historique-appels' | 'historique-offres' | 'commande';

interface AppContextType {
  currentModal: ModalType;
  currentView: ViewType;
  notifications: Notification[];
  isAppLoading: boolean;
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
  setView: (view: ViewType) => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  setAppLoading: (loading: boolean) => void;
}

// Usage
const { currentView, setView, openModal, addNotification } = useApp();

// Changer de vue
setView('historique-appels');

// Ouvrir une modale
openModal('qui-est-ce');

// Ajouter une notification
addNotification({
  type: 'success',
  message: 'Commande enregistrée',
  duration: 3000
});
```

### Hiérarchie des Providers

Les providers sont imbriqués dans `main.tsx` dans cet ordre :

```typescript
<AppProvider>           // État global app
  <UserProvider>        // Authentification
    <CampaignProvider>  // Campagne active
      <ProspectProvider>  // Prospect en cours
        <CartProvider>      // Panier
          <App />
        </CartProvider>
      </ProspectProvider>
    </CampaignProvider>
  </UserProvider>
</AppProvider>
```

## 🧩 Composants Réutilisables

### Button

```typescript
<Button
  variant="primary"      // primary | secondary | danger | ghost
  size="medium"          // small | medium | large
  isLoading={false}
  fullWidth={false}
  onClick={handleClick}
>
  Cliquer ici
</Button>
```

### Input

```typescript
<Input
  label="Email"
  type="email"
  placeholder="votre.email@antl.com"
  error="Email invalide"
  helperText="Texte d'aide"
  required
/>
```

### Loader

```typescript
<Loader
  size="medium"          // small | medium | large
  color="primary"        // primary | white | gray
/>
```

### ErrorMessage

```typescript
<ErrorMessage
  message="Une erreur est survenue"
  onClose={() => clearError()}
/>
```

### ProtectedRoute

```typescript
<ProtectedRoute>
  <PrivatePage />
</ProtectedRoute>
```

### TypeFicheBadge

Badge coloré pour afficher le type de fiche prospect.

```typescript
<TypeFicheBadge type="jamais_appele" />
// Affiche un badge vert "Jamais appelé"

<TypeFicheBadge type="deja_appele" />
// Affiche un badge orange "Déjà appelé"

<TypeFicheBadge type="recycle" />
// Affiche un badge bleu "Recyclé"

<TypeFicheBadge type="client" />
// Affiche un badge violet "Client"
```

### ProspectInfoHeader

Composant d'affichage des informations principales d'un prospect.

```typescript
<ProspectInfoHeader prospect={currentProspect} />
// Affiche: Nom, Prénom, Téléphone, Email, Ville, Type de fiche
```

### ActionButtons

Boutons d'action pour afficher historiques et autres vues.

```typescript
<ActionButtons
  onInformationProspect={() => setView('default')}
  onQuiEstCe={() => openModal('qui-est-ce')}
  onQuiSommesNous={() => openModal('qui-sommes-nous')}
  onHistoriqueAppels={() => setView('historique-appels')}
  onHistoriqueOffres={() => setView('historique-offres')}
/>
```

### HistoriqueAppels

Composant d'affichage de l'historique des appels d'un prospect avec pagination.

```typescript
<HistoriqueAppels />
// Utilise automatiquement le currentProspect du ProspectContext
// Affiche la liste des appels avec:
// - Date/heure formatée (format français)
// - Durée de l'appel (MM:SS)
// - Statut avec badge coloré (success/warning/danger)
// - Agent ayant effectué l'appel
// - Notes éditables (click "Modifier" → édition inline → Save/Cancel)
// - Pagination (20 appels par page)
// - États: loading, error, empty
```

**Fonctionnalités** :
- ✅ Édition inline des notes d'appel
- ✅ Pagination automatique (prev/next)
- ✅ 8 statuts d'appel supportés avec codes couleur
- ✅ Formatage automatique durée (minutes + secondes)
- ✅ Tri chronologique DESC (plus récents en premier)

**Composants enfants** :
- `AppelCard.tsx` : Card individuelle pour chaque appel

### HistoriqueVentes

Composant d'affichage de l'historique des ventes/offres d'un prospect.

```typescript
<HistoriqueVentes />
// Utilise automatiquement le currentProspect du ProspectContext
// Affiche la liste des ventes avec:
// - Date formatée (format français)
// - Statut avec badge coloré (validee/en_attente/annulee)
// - Montant total formaté (EUR)
// - Mode de paiement (CB, Prélèvement, Chèque, Virement)
// - Bouton "Voir détails" → expand/collapse animé
// - Tableau détaillé des produits (nom, qté, prix, remise, total)
// - États: loading, error, empty
```

**Fonctionnalités** :
- ✅ Expand/collapse animé pour voir détails produits
- ✅ Tableau complet des produits commandés
- ✅ Calcul automatique du total ligne (prix × qté - remise)
- ✅ Formatage currency EUR (ex: "149,99 €")
- ✅ Support DetailsVentes et details (alias Sequelize)
- ✅ Tri chronologique DESC (plus récentes en premier)

**Composants enfants** :
- `VenteCard.tsx` : Card expandable pour chaque vente

## 🎨 Design System

L'application utilise un design system complet inspiré du design Apple.

### Variables SCSS (_variables.scss)

Toutes les variables de design sont centralisées dans `utils/styles/_variables.scss` :

```scss
// Couleurs principales
$colorPrimary: #007aff;
$colorSuccess: #34c759;
$colorWarning: #ff9500;
$colorDanger: #ff3b30;

// Palette grayscale
$colorBlack: #1d1d1f;
$colorGray900: #424245;
$colorGray300: #d2d2d7;
$colorWhite: #ffffff;

// Couleurs type de fiche
$colorJamaisAppele: #34c759;      // Vert
$colorDejaAppele: #ff9500;        // Orange
$colorRecycle: #007aff;           // Bleu
$colorClient: #5e5ce6;            // Violet

// Spacing scale
$spacing-xs: 0.25rem;    // 4px
$spacing-sm: 0.5rem;     // 8px
$spacing-md: 1rem;       // 16px
$spacing-lg: 1.5rem;     // 24px
$spacing-xl: 2rem;       // 32px
$spacing-2xl: 3rem;      // 48px
$spacing-3xl: 4rem;      // 64px

// Border radius
$radius-sm: 4px;
$radius-md: 8px;
$radius-lg: 12px;
$radius-xl: 16px;
$radius-full: 9999px;

// Shadows
$shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
$shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
$shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);

// Breakpoints
$breakpoint-xs: 480px;
$breakpoint-sm: 640px;
$breakpoint-md: 768px;
$breakpoint-lg: 1024px;
$breakpoint-xl: 1280px;
$breakpoint-2xl: 1536px;

// Z-index layers
$z-dropdown: 1000;
$z-modal: 1050;
$z-tooltip: 1070;
```

### Mixins SCSS (_mixins.scss)

Mixins réutilisables pour styles communs :

```scss
// Flexbox utilities
@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

@mixin flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

// Responsive breakpoints
@mixin responsive($breakpoint) {
  @if $breakpoint == lg {
    @media (min-width: vars.$breakpoint-lg) { @content; }
  }
  // Autres breakpoints...
}

// Button base styles
@mixin button-base {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: all vars.$transition-base;
  border-radius: vars.$radius-md;
}

// Custom scrollbar
@mixin custom-scrollbar($width: 8px) {
  &::-webkit-scrollbar {
    width: $width;
  }
  &::-webkit-scrollbar-thumb {
    background: vars.$colorGray300;
    border-radius: vars.$radius-full;
  }
}

// Focus ring (accessibilité)
@mixin focus-ring($color: vars.$colorPrimary) {
  outline: none;
  box-shadow: 0 0 0 3px rgba($color, 0.2);
}
```

### Utilisation dans les composants

```scss
@use '../../utils/styles/variables' as vars;
@use '../../utils/styles/mixins' as mix;

.my-component {
  padding: vars.$spacing-lg;
  border-radius: vars.$radius-md;
  box-shadow: vars.$shadow-md;

  @include mix.flex-between;

  .button {
    @include mix.button-base;
    background: vars.$colorPrimary;

    &:focus {
      @include mix.focus-ring;
    }
  }

  @include mix.responsive(lg) {
    padding: vars.$spacing-xl;
  }
}
```

## 📝 Conventions

### Nommage des fichiers

- **Composants** : PascalCase + `.tsx` (ex: `Button.tsx`)
- **Styles** : camelCase + `.scss` (ex: `button.scss`)
- **Hooks** : camelCase + `use` prefix (ex: `useUser.ts`)
- **Types** : camelCase + `.types.ts` (ex: `user.types.ts`)
- **Services** : PascalCase + `.service.ts` (ex: `User.service.ts`)
- **Models** : PascalCase + `.model.ts` (ex: `User.model.ts`)

### Organisation du code

1. **Imports** regroupés par catégorie :
   ```typescript
   // Styles
   import './component.scss';

   // React et libs externes
   import { useState } from 'react';
   import { useNavigate } from 'react-router-dom';

   // Types
   import type { ComponentProps } from './types';

   // Hooks et contexts
   import { useUser } from '../hooks/useUser';

   // Composants
   import Button from '../button/Button';
   ```

2. **Composants fonctionnels** avec TypeScript
3. **Props typées** avec interfaces
4. **Export default** pour les composants
5. **Export named** pour les utils et types

### Gestion d'état

- **Context API** pour état global (user, theme, etc.)
- **useState** pour état local des composants
- **useCallback** pour fonctions stables
- **useMemo** pour valeurs calculées coûteuses

### Styles

- **SCSS** avec nesting
- **Variables** centralisées dans `_variables.scss`
- **Mixins** dans `_mixins.scss`
- **BEM** pour nommage des classes (optionnel)
- **Mobile first** pour le responsive

## 🧪 Tests (à venir)

```bash
npm run test          # Lancer les tests
npm run test:coverage # Coverage des tests
```

## 🐛 Troubleshooting

### Erreur CORS

Vérifier que l'API backend autorise l'origine `http://localhost:5173` dans la configuration CORS.

### Token expiré

Le token est automatiquement rafraîchi. Si le refresh échoue, vous serez redirigé vers `/login`.

### Erreur de connexion

Vérifier que :
1. Le backend API est démarré (`cd olympe && npm run dev`)
2. L'URL de l'API dans `.env` est correcte
3. Les credentials sont valides

## 📄 License

© 2025 ANTL - Tous droits réservés

## 👥 Équipe

- **Développement** : Nicolas DECRESSAC
- **Backend API** : olympe (Node.js/Express/PostgreSQL)
- **Frontend** : script (React/TypeScript/Vite)

---

**Version** : 1.0.0 (Sprint 3 complété - 29/29 points)
**Dernière mise à jour** : 2025-12-15

## 📈 Progression du projet

- ✅ **Sprint 1** : Base de données + API Core (36/41 points - 87.8%)
- ✅ **Sprint 2** : API Endpoints complets (36/36 points - 100%)
- ✅ **Sprint 3** : Script Auth & Base (29/29 points - 100%)
- 🔄 **Sprint 4** : Historiques & Commandes (0/26 points - À faire)
- 📅 **Sprint 5** : RDV & Support vente (20 points)
- 📅 **Sprint 6** : Notifications & Tests (18 points)

**Total** : 101/170 points complétés (59.4%)
