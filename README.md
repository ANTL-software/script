# Script Vendeur ANTL - Documentation Technique

Application React/TypeScript pour le call center ANTL. Interface vendeur pour la gestion des prospects, appels, commandes et ventes.

## Table des matières

- [Stack Technique](#stack-technique)
- [Installation](#installation)
- [Architecture Globale](#architecture-globale)
- [Gestion d'Etat (Contexts)](#gestion-detat-contexts)
- [Couche API](#couche-api)
- [Systeme de Types](#systeme-de-types)
- [Composants](#composants)
- [Flux de Donnees](#flux-de-donnees)
- [Design System](#design-system)
- [Conventions](#conventions)

---

## Stack Technique

| Categorie | Technologie | Version |
|-----------|-------------|---------|
| Framework | React | 19.x |
| Langage | TypeScript | 5.x |
| Build Tool | Vite | 7.x |
| Routing | React Router DOM | 7.x |
| HTTP Client | Axios | 1.x |
| Styling | SASS/SCSS | - |
| Icons | React Icons | 5.x |

---

## Installation

### Prerequis

- Node.js 18+
- npm ou yarn
- Backend API olympe en cours d'execution sur le port 8800

### Etapes

```bash
# Cloner et installer
cd script
npm install

# Configurer l'environnement
cp .env.example .env
# Editer .env avec l'URL de l'API

# Demarrer le serveur de developpement
npm run dev
```

### Variables d'environnement

```env
VITE_API_BASE_URL=http://localhost:8800/api
VITE_APP_NAME=ANTL Script Vendeur
VITE_APP_VERSION=1.0.0
VITE_NODE_ENV=development
```

### Scripts disponibles

| Script | Description |
|--------|-------------|
| `npm run dev` | Serveur de developpement (port 5173) |
| `npm run build` | Build de production |
| `npm run preview` | Preview du build |
| `npm run lint` | Linter le code |

---

## Architecture Globale

```
script/src/
├── API/                          # Couche API
│   ├── config.ts                 # Client Axios (Singleton)
│   ├── APICalls.tsx              # Methodes HTTP generiques
│   ├── apiHelpers.ts             # Helpers (throwIfApiError, extractPaginatedData)
│   ├── models/                   # Modeles avec logique metier
│   │   ├── User.model.ts
│   │   ├── Prospect.model.ts
│   │   ├── Campaign.model.ts
│   │   ├── Produit.model.ts
│   │   └── index.ts
│   ├── services/                 # Services API (Singletons)
│   │   ├── User.service.ts
│   │   ├── Prospect.service.ts
│   │   ├── Campaign.service.ts
│   │   ├── Produit.service.ts
│   │   ├── Appel.service.ts
│   │   ├── Vente.service.ts
│   │   └── index.ts
│   └── index.ts
├── context/                      # Contexts React
│   ├── userContext/
│   ├── prospectContext/
│   ├── campaignContext/
│   ├── cartContext/
│   ├── appContext/
│   └── index.ts
├── hooks/                        # Hooks personnalises
│   ├── useUser.ts
│   ├── useProspect.ts
│   ├── useCampaign.ts
│   ├── useCart.ts
│   ├── useApp.ts
│   ├── createContextHook.ts      # Factory pour hooks
│   └── index.ts
├── utils/
│   ├── scripts/utils.tsx         # Fonctions utilitaires
│   ├── styles/                   # Styles globaux
│   │   ├── global.scss
│   │   ├── reset.scss
│   │   ├── _variables.scss
│   │   └── _mixins.scss
│   └── types/                    # Types TypeScript
│       ├── user.types.ts
│       ├── prospect.types.ts
│       ├── campaign.types.ts
│       ├── cart.types.ts
│       ├── appel.types.ts
│       ├── vente.types.ts
│       ├── api.types.ts
│       └── index.ts
├── views/
│   ├── components/               # Composants reutilisables
│   └── layouts/                  # Pages principales
├── App.tsx                       # Routing
└── main.tsx                      # Point d'entree + Providers
```

### Principes Architecturaux

L'application suit les principes SOLID :

1. **Single Responsibility** : Chaque fichier a une responsabilite unique
   - `config.ts` : Configuration Axios uniquement
   - `User.service.ts` : Communication API utilisateurs uniquement
   - `UserProvider.tsx` : Gestion de l'etat d'authentification uniquement

2. **Open/Closed** : Extensions sans modification
   - Services extensibles via heritage
   - Modeles extensibles sans toucher aux existants

3. **Dependency Inversion** : Abstraction des dependances
   ```
   Component → useHook → Context → Service → ApiCalls → ApiClient
   ```

---

## Gestion d'Etat (Contexts)

L'application utilise 5 contexts principaux. Chaque context suit le pattern :
- `Context.tsx` : Definition du context et interface
- `Provider.tsx` : Implementation avec useState/useCallback

### Hierarchie des Providers

```tsx
// main.tsx
<AppProvider>           // Etat global (modales, vues, notifications)
  <UserProvider>        // Authentification
    <CampaignProvider>  // Campagne active + produits
      <ProspectProvider>  // Prospect en cours + appels + ventes
        <CartProvider>      // Panier de commande
          <App />
        </CartProvider>
      </ProspectProvider>
    </CampaignProvider>
  </UserProvider>
</AppProvider>
```

---

### 1. UserContext - Authentification

**Fichiers** : `context/userContext/`

**Interface** :
```typescript
interface UserContextType {
  // Donnees
  user: Employe | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}
```

**Flux d'authentification** :
```
1. LoginPage → login({ email, password })
2. UserService → POST /auth/login
3. Backend → { token, refreshToken, employe }
4. ApiClient → stocke tokens en localStorage
5. UserModel → sauvegarde employe en localStorage
6. UserProvider → setUser(employe)
7. Navigate → redirect vers '/'
```

**Persistence** (localStorage) :
- `accessToken` : JWT access token (8h)
- `refreshToken` : JWT refresh token (7j)
- `employe` : Donnees utilisateur serialisees

**Hook** : `useUser()`

---

### 2. ProspectContext - Prospect et Historiques

**Fichiers** : `context/prospectContext/`

**Interface** :
```typescript
interface ProspectContextType {
  // Prospect
  currentProspect: Prospect | null;
  isLoading: boolean;
  error: string | null;
  fullName: string;                    // Computed: raison_sociale || prenom + nom
  typeFiche: TypeFiche;               // Computed: jamais_appele|deja_appele|recycle|client

  // Appels
  appels: Appel[];
  appelsLoading: boolean;
  appelsError: string | null;
  appelsPagination: { page: number; totalPages: number; total: number };

  // Ventes
  ventes: Vente[];
  ventesLoading: boolean;
  ventesError: string | null;

  // Actions Prospect
  loadProspect: (id: number) => Promise<void>;
  loadProspectByPhone: (phone: string) => Promise<void>;
  clearProspect: () => void;
  clearError: () => void;

  // Actions Appels
  loadAppels: (page?: number) => Promise<void>;
  updateAppelNotes: (appelId: number, notes: string) => Promise<void>;
  clearAppelsError: () => void;

  // Actions Ventes
  loadVentes: () => Promise<void>;
  createVente: (data: CreateVenteData) => Promise<Vente>;
  clearVentesError: () => void;
}
```

**Dependances Services** : `prospectService`, `appelService`, `venteService`

**Hook** : `useProspect()`

---

### 3. CampaignContext - Campagne et Catalogue

**Fichiers** : `context/campaignContext/`

**Interface** :
```typescript
interface CampaignContextType {
  // Campagne
  currentCampaign: Campaign | null;
  isLoading: boolean;
  error: string | null;

  // Produits
  produits: Produit[];               // Liste plate
  categories: CategorieProduit[];    // Categories uniques
  categoriesTree: CategorieProduit[]; // Arbre hierarchique
  produitsLoading: boolean;
  produitsError: string | null;

  // Actions
  loadCampaign: (id: number) => Promise<void>;
  loadProduits: () => Promise<void>;           // Liste paginee
  loadProduitsGrouped: () => Promise<void>;    // Arbre avec prix
  clearCampaign: () => void;
  clearError: () => void;
  clearProduitsError: () => void;
}
```

**Modes de chargement produits** :
- `loadProduits()` : Liste paginee standard
- `loadProduitsGrouped()` : Arbre hierarchique avec prix extraits des tarifs

**Hook** : `useCampaign()`

---

### 4. CartContext - Panier

**Fichiers** : `context/cartContext/`

**Interface** :
```typescript
interface CartContextType {
  items: CartItem[];
  total: number;      // Computed avec remises
  itemCount: number;  // Somme des quantites

  // Actions
  addItem: (produit: Produit, quantite?: number, remise?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantite: number) => void;
  updateRemise: (productId: number, remise: number) => void;
  clearCart: () => void;
  getItem: (productId: number) => CartItem | undefined;
}
```

**Logique de prix** (priorite) :
```typescript
// 1. Tarif campagne prioritaire sur prix produit
const tarifPrix = produit.tarif?.prix_unitaire;
const produitPrix = produit.prix_unitaire;
const rawPrix = tarifPrix ?? produitPrix;

// 2. Prix promo prioritaire si > 0
const prixFinal = (prixPromo !== null && prixPromo > 0) ? prixPromo : prixUnitaire;
```

**Hook** : `useCart()`

---

### 5. AppContext - Etat Global Application

**Fichiers** : `context/appContext/`

**Interface** :
```typescript
type ModalType = 'qui-est-ce' | 'qui-sommes-nous' | 'objections' | 'plan-appel' | null;
type ViewType = 'default' | 'historique-appels' | 'historique-offres' | 'commande';

interface AppContextType {
  currentModal: ModalType;
  currentView: ViewType;
  notifications: Notification[];
  isAppLoading: boolean;

  // Actions
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
  setView: (view: ViewType) => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  setAppLoading: (loading: boolean) => void;
}
```

**Systeme de notifications** :
- Types : `success`, `error`, `warning`, `info`
- Auto-dismiss avec `duration` (ms)
- ID unique genere : `notif-${Date.now()}-${Math.random()}`

**Hook** : `useApp()`

---

## Couche API

### Architecture

```
Composant
    ↓ useHook()
Context Provider
    ↓ service.method()
Service (Singleton)
    ↓ apiCalls.get/post/put/patch/delete()
APICalls
    ↓ api.request()
ApiClient (config.ts)
    ↓ axios instance
Backend API
```

---

### ApiClient (`API/config.ts`)

**Pattern** : Singleton via `ApiClient.getInstance()`

**Configuration** :
- Base URL : `VITE_API_BASE_URL` (default: `http://localhost:8800/api`)
- Timeout : 30 secondes
- Headers : Content-Type application/json

**Intercepteurs Request** :
```typescript
// Ajoute automatiquement le token Bearer
config.headers.Authorization = `Bearer ${accessToken}`;
```

**Intercepteurs Response** :
- Refresh automatique sur 401 (sauf endpoints auth)
- Queue des requetes pendant le refresh
- Redirect vers `/login` si refresh echoue

**Methodes** :
```typescript
getAccessToken(): string | null
getRefreshToken(): string | null
setTokens(accessToken: string, refreshToken: string): void
clearTokens(): void
hasValidToken(): boolean
```

---

### APICalls (`API/APICalls.tsx`)

**Methodes generiques avec retry logic** :
```typescript
get<T>(endpoint: string, params?: object): Promise<T>
post<T>(endpoint: string, data?: object): Promise<T>
put<T>(endpoint: string, data?: object): Promise<T>
patch<T>(endpoint: string, data?: object): Promise<T>
delete<T>(endpoint: string): Promise<T>
```

**Retry Logic** :
- Max retries : 3 tentatives
- Delai progressif : 1s, 2s, 3s
- Condition : Erreurs reseau uniquement (timeout, perte connexion)
- Log : Console warnings

---

### API Helpers (`API/apiHelpers.ts`)

```typescript
// Lance une erreur si la reponse API n'est pas success
function throwIfApiError<T>(response: ApiResponse<T>, defaultMessage: string): T

// Extrait les donnees paginées d'une reponse API
function extractPaginatedData<T>(
  response: ApiResponse<T>,
  itemsKey: string,
  defaultMessage: string
): {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}
```

---

### Services

Tous les services suivent le pattern Singleton avec `getInstance()`.

#### UserService
```typescript
login(credentials: LoginCredentials): Promise<UserModel>
logout(): Promise<void>
getCurrentUser(): Promise<UserModel>
refreshToken(): Promise<string>
getStoredUser(): UserModel | null
hasValidToken(): boolean
clearSession(): void
```

#### ProspectService
```typescript
getProspectById(id: number): Promise<ProspectModel>
getProspectByPhone(phone: string): Promise<ProspectModel>
getProspects(params: {
  page?: number;
  limit?: number;
  statut?: ProspectStatut;
  type_prospect?: ProspectType;
  search?: string;
}): Promise<{ prospects, total, page, totalPages }>
```

#### AppelService
```typescript
createAppel(data: CreateAppelData): Promise<Appel>
getAppelById(id: number): Promise<Appel>
getAppelsByProspect(prospectId: number, params: {
  page?: number;
  limit?: number;
}): Promise<{ appels, total, page, totalPages }>
updateAppel(id: number, data: UpdateAppelData): Promise<Appel>
terminerAppel(id: number): Promise<Appel>
```

#### VenteService
```typescript
createVente(data: CreateVenteData): Promise<Vente>
getVenteById(id: number): Promise<Vente>
getVentesByProspect(prospectId: number, params?: {
  page?: number;
  limit?: number;
}): Promise<{ ventes, total, page, totalPages }>
updateStatut(id: number, statut: StatutVente): Promise<Vente>
```

#### ProduitService
```typescript
getProduitById(id: number): Promise<ProduitModel>
getProduits(params?: {
  page?: number;
  limit?: number;
  categorie?: number;
  actif?: boolean;
  search?: string;
  grouped?: boolean;
}): Promise<{ produits, total, page, totalPages }>
getProduitsGrouped(params?: { actif?: boolean }): Promise<{
  categories: CategorieProduit[];  // Arbre hierarchique avec produits et prix
  totalProducts: number;
}>
getProduitsByCampaign(campaignId: number, params?: {
  page?: number;
  limit?: number;
}): Promise<{ produits, pagination }>
```

#### CampaignService
```typescript
getCampaignById(id: number): Promise<CampaignModel>
getCampaigns(params?: {
  page?: number;
  limit?: number;
  actif?: boolean;
}): Promise<{ campaigns, total, page, totalPages }>
```

---

### Modeles (`API/models/`)

Les modeles encapsulent la logique metier et la transformation des donnees.

#### UserModel
```typescript
class UserModel {
  // Donnees
  id_employe: number;
  nom: string;
  prenom: string;
  email: string;
  // ...

  // Methodes
  getFullName(): string
  toJSON(): Employe
  saveToLocalStorage(): void

  // Statiques
  static fromJSON(data: Employe): UserModel
  static fromLocalStorage(): UserModel | null
}
```

#### ProspectModel
```typescript
class ProspectModel {
  // Methodes
  getFullName(): string          // raison_sociale || prenom + nom
  getTypeFiche(): TypeFiche      // jamais_appele|deja_appele|recycle|client
  toJSON(): Prospect

  // Statiques
  static fromJSON(data: Prospect): ProspectModel
}
```

---

## Systeme de Types

### Types Prospect (`types/prospect.types.ts`)

```typescript
type ProspectType = 'Particulier' | 'Entreprise';

type ProspectStatut =
  | 'nouveau'
  | 'contacte'
  | 'interesse'
  | 'rappel'
  | 'non_interesse'
  | 'vente_conclue';

type TypeFiche = 'jamais_appele' | 'deja_appele' | 'recycle' | 'client';

interface Prospect {
  id_prospect: number;
  type_prospect: ProspectType;
  nom: string;
  prenom?: string;
  raison_sociale?: string;
  email?: string;
  telephone: string;
  adresse?: string;
  code_postal?: string;
  ville?: string;
  pays?: string;
  statut: ProspectStatut;
  notes?: string;
  created_at: string;
  updated_at: string;
}
```

### Types Appel (`types/appel.types.ts`)

```typescript
type StatutAppel =
  | 'abouti'
  | 'non_abouti'
  | 'occupe'
  | 'pas_de_reponse'
  | 'messagerie'
  | 'rdv_pris'
  | 'vente_conclue'
  | 'refus_definitif';

interface Appel {
  id_appel: number;
  id_prospect: number;
  id_agent: number;
  id_campagne: number;
  date_appel: string;
  duree_secondes?: number | null;
  statut: StatutAppel;
  notes?: string | null;
  abouti: boolean;
  created_at: string;
  updated_at: string;
  Employe?: Employe;
}

interface CreateAppelData {
  id_prospect: number;
  id_campagne: number;
  statut: StatutAppel;
  notes?: string;
}

interface UpdateAppelData {
  duree_secondes?: number;
  statut?: StatutAppel;
  notes?: string;
}
```

### Types Vente (`types/vente.types.ts`)

```typescript
type StatutVente = 'en_attente' | 'validee' | 'annulee';
type ModePaiement = 'CB' | 'Prelevement' | 'Cheque' | 'Virement';

interface Vente {
  id_vente: number;
  id_prospect: number;
  id_agent: number;
  id_campagne: number;
  id_appel?: number | null;
  date_vente: string;
  montant_total: number;
  mode_paiement?: ModePaiement | null;
  statut: StatutVente;
  created_at: string;
  updated_at: string;
  details?: DetailVente[];
  DetailsVentes?: DetailVente[];  // Alias Sequelize
}

interface DetailVente {
  id_detail?: number;
  id_produit: number;
  quantite: number;
  prix_unitaire: number;
  remise: number;
  montant_ligne?: number;
  Produit?: Produit;
}

interface CreateVenteData {
  id_prospect: number;
  id_campagne: number;
  mode_paiement?: ModePaiement;
  notes?: string;
  adresse_livraison?: string;
  code_postal_livraison?: string;
  ville_livraison?: string;
  pays_livraison?: string;
  details: Array<{
    id_produit: number;
    quantite: number;
    prix_unitaire: number;
    remise: number;
  }>;
}
```

### Types Utilisateur (`types/user.types.ts`)

```typescript
interface Employe {
  id_employe: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  date_embauche?: string;
  id_poste?: number;
  id_departement?: number;
  actif: boolean;
  created_at?: string;
  updated_at?: string;
  Poste?: Poste;
  Departement?: Departement;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    refreshToken: string;
    employe: Employe;
  };
}
```

### Types Produit et Panier (`types/cart.types.ts`)

```typescript
interface Produit {
  id_produit: number;
  code_produit?: string;
  nom_produit: string;
  description?: string;
  type_produit?: string;
  prix_unitaire?: string | number;
  prix_promo?: string | number;
  id_categorie?: number;
  attributs_specifiques?: Record<string, unknown>;
  actif: boolean;
  created_at: string;
  updated_at: string;
  categorie?: CategorieProduit;
  Categorie?: CategorieProduit;  // Alias
  tarif?: Tarif;                 // Premier tarif disponible
}

interface CategorieProduit {
  id_categorie: number;
  nom_categorie: string;
  description?: string;
  id_parent?: number | null;
  niveau?: number;
  created_at?: string;
  updated_at?: string;
  sousCategories?: CategorieProduit[];  // Enfants (arbre)
  produits?: Produit[];                  // Produits de cette categorie
  categorieParente?: CategorieProduit;
}

interface Tarif {
  id_tarif: number;
  id_produit?: number;
  id_campagne?: number;
  prix_unitaire?: string | number;
  prix_promo?: string | number;
  date_debut_validite?: string;
  date_fin_validite?: string;
  devise?: string;
  created_at?: string;
  updated_at?: string;
}

interface CartItem {
  produit: Produit;
  quantite: number;
  prix_unitaire: number;  // Prix final utilise
  remise: number;         // Remise en euros
}
```

### Types API (`types/api.types.ts`)

```typescript
interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

interface Pagination {
  page: number;
  totalPages: number;
  total: number;
}

interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

---

## Composants

### Arborescence des Composants

```
views/
├── layouts/
│   ├── loginPage/
│   │   ├── LoginPage.tsx
│   │   └── loginPage.scss
│   └── landingPage/
│       ├── LandingPage.tsx
│       └── landingPage.scss
└── components/
    ├── button/
    ├── input/
    ├── loader/
    ├── errorMessage/
    ├── header/
    ├── footer/
    ├── protectedRoute/
    ├── typeFicheBadge/
    ├── prospectInfoHeader/
    ├── actionButtons/
    ├── historiqueAppels/
    │   ├── HistoriqueAppels.tsx
    │   ├── AppelCard.tsx
    │   └── index.ts
    ├── historiqueVentes/
    │   ├── HistoriqueVentes.tsx
    │   ├── VenteCard.tsx
    │   └── index.ts
    ├── catalogueProduits/
    │   ├── CatalogueProduits.tsx
    │   ├── CategoryTree.tsx
    │   ├── ProduitCard.tsx
    │   └── index.ts
    ├── panier/
    │   ├── Panier.tsx
    │   ├── PanierItem.tsx
    │   └── index.ts
    └── confirmOrderModal/
        ├── ConfirmOrderModal.tsx
        └── index.ts
```

---

### Layouts

#### LoginPage

**Fichier** : `views/layouts/loginPage/LoginPage.tsx`

**Props** : Aucune

**Hooks** : `useUser`, `useNavigate`

**Etat local** :
```typescript
formData: { email: string; password: string }
formErrors: { email: string; password: string }
attemptCount: number
isBlocked: boolean
```

**Fonctionnalites** :
- Validation email (regex) et password (min 6 chars)
- Protection brute-force : 5 tentatives → blocage 60s
- Redirect automatique si deja authentifie
- Effacement erreurs a la saisie

---

#### LandingPage

**Fichier** : `views/layouts/landingPage/LandingPage.tsx`

**Props** : Aucune

**Hooks** : `useProspect`, `useCampaign`

**Etat local** :
```typescript
activeView: 'default' | 'appels' | 'offres' | 'commande'
isModalOpen: boolean
showSuccessMessage: boolean
```

**Composants enfants** :
- `ProspectInfoHeader` - Informations prospect
- `ActionButtons` - Boutons de navigation
- `HistoriqueAppels` - (si activeView === 'appels')
- `HistoriqueVentes` - (si activeView === 'offres')
- `CatalogueProduits` + `Panier` - (si activeView === 'commande')
- `ConfirmOrderModal` - (si isModalOpen)

**Initialisation** :
```typescript
useEffect(() => {
  loadProspect(1);
  loadCampaign(1);
}, []);
```

---

### Composants Metier

#### ProspectInfoHeader

**Fichier** : `views/components/prospectInfoHeader/ProspectInfoHeader.tsx`

**Props** : Aucune (utilise `useProspect`)

**Affiche** :
- Nom complet du prospect (computed)
- Badge TypeFiche avec couleur
- Tableau : nom, prenom, telephone, email, ville, type_prospect

---

#### ActionButtons

**Fichier** : `views/components/actionButtons/ActionButtons.tsx`

**Props** :
```typescript
interface ActionButtonsProps {
  onInformationProspect?: () => void;
  onQuiEstCe?: () => void;
  onQuiSommesNous?: () => void;
  onHistoriqueAppels?: () => void;
  onHistoriqueOffres?: () => void;
  onCommande?: () => void;
}
```

**Structure** : Deux groupes de boutons (secondaires et primaires)

---

#### HistoriqueAppels

**Fichier** : `views/components/historiqueAppels/HistoriqueAppels.tsx`

**Props** : Aucune (utilise `useProspect`)

**Fonctionnalites** :
- Pagination avec boutons prev/next
- Edition inline des notes d'appel
- Etats : loading, error, empty
- Affiche le total d'appels

**Composant enfant** : `AppelCard`

---

#### AppelCard

**Fichier** : `views/components/historiqueAppels/AppelCard.tsx`

**Props** :
```typescript
interface AppelCardProps {
  appel: Appel;
  onUpdateNotes: (appelId: number, notes: string) => Promise<void>;
}
```

**Affiche** :
- Date/heure (format francais)
- Duree (MM:SS)
- Statut avec badge colore
- Agent
- Notes editables (click Modifier → edition inline → Save/Cancel)

**Statuts et couleurs** :
| Statut | Couleur |
|--------|---------|
| abouti, vente_conclue | success (vert) |
| rdv_pris | warning (orange) |
| non_abouti, occupe, pas_de_reponse, messagerie, refus_definitif | danger (rouge) |

---

#### HistoriqueVentes

**Fichier** : `views/components/historiqueVentes/HistoriqueVentes.tsx`

**Props** : Aucune (utilise `useProspect`)

**Fonctionnalites** :
- Charge les ventes au mount
- Etats : loading, error, empty

**Composant enfant** : `VenteCard`

---

#### VenteCard

**Fichier** : `views/components/historiqueVentes/VenteCard.tsx`

**Props** :
```typescript
interface VenteCardProps {
  vente: Vente;
}
```

**Fonctionnalites** :
- Expand/collapse anime pour voir les details
- Tableau des produits (nom, qte, prix, remise, total ligne)
- Supporte `details` et `DetailsVentes` (alias Sequelize)

**Affiche** :
- Date (format francais)
- Statut avec badge
- Montant total (EUR)
- Mode de paiement

---

#### CatalogueProduits

**Fichier** : `views/components/catalogueProduits/CatalogueProduits.tsx`

**Props** : Aucune (utilise `useCampaign`, `useCart`)

**Etat local** :
```typescript
viewMode: 'tree' | 'search'
searchTerm: string
```

**Fonctionnalites** :
- Deux modes : arbre hierarchique ou recherche
- Recherche sur : nom_produit, description, code_produit
- Bascule auto vers mode search a la saisie
- Charge les produits groupes au mount

**Composants enfants** :
- `CategoryTree` - (mode tree)
- `ProduitCard` - (mode search/grid)

---

#### CategoryTree

**Fichier** : `views/components/catalogueProduits/CategoryTree.tsx`

**Props** :
```typescript
interface CategoryTreeProps {
  categories: CategorieProduit[];
  onAddToCart: (produit: Produit) => void;
}
```

**Fonctionnalites** :
- Composant recursif pour navigation hierarchique
- Affiche les produits de chaque categorie
- Sous-categories expandables

---

#### ProduitCard

**Fichier** : `views/components/catalogueProduits/ProduitCard.tsx`

**Props** :
```typescript
interface ProduitCardProps {
  produit: Produit;
  onAddToCart: (produit: Produit) => void;
}
```

**Affiche** :
- Nom du produit
- Description (tronquee)
- Badge categorie
- Prix (avec logique tarif/promo)
- Bouton "Ajouter au panier"

**Logique de prix** :
```typescript
// Priorite: tarif campagne > prix produit
const tarifPrix = produit.tarif?.prix_unitaire;
const produitPrix = produit.prix_unitaire;
const rawPrix = tarifPrix ?? produitPrix;

// Promo prioritaire si presente
const prixFinal = (prixPromo > 0) ? prixPromo : prixUnitaire;
```

---

#### Panier

**Fichier** : `views/components/panier/Panier.tsx`

**Props** :
```typescript
interface PanierProps {
  onValidateOrder?: () => void;
}
```

**Hooks** : `useCart`

**Fonctionnalites** :
- Badge compteur d'items
- Etat vide avec message
- Calcul total automatique
- Confirmation avant vidage
- Callback validation commande

**Composant enfant** : `PanierItem`

---

#### PanierItem

**Fichier** : `views/components/panier/PanierItem.tsx`

**Props** :
```typescript
interface PanierItemProps {
  item: CartItem;
  onUpdateQuantity: (productId: number, quantite: number) => void;
  onRemove: (productId: number) => void;
}
```

**Fonctionnalites** :
- Boutons +/- pour quantite (min: 1)
- Bouton supprimer
- Affiche : prix unitaire, remise, sous-total

---

#### ConfirmOrderModal

**Fichier** : `views/components/confirmOrderModal/ConfirmOrderModal.tsx`

**Props** :
```typescript
interface ConfirmOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}
```

**Hooks** : `useCart`, `useProspect`, `useCampaign`, `useUser`

**Champs du formulaire** :
- **Livraison** : adresse, code_postal, ville, pays
- **Paiement** : radio (Prelevement, Cheque, Virement)
- **Notes** : textarea

**Validation** :
```typescript
{
  adresse: 'Adresse requise',
  code_postal: 'Code postal requis (5 chiffres)', // regex: ^\d{5}$
  ville: 'Ville requise',
  pays: 'Pays requis'
}
```

**Fonctionnalites** :
- Recap des items du panier
- Pre-remplissage depuis donnees prospect
- Calcul totaux par ligne
- Loading state pendant soumission
- Vide le panier apres succes

---

### Composants UI Reutilisables

#### Button

**Props** :
```typescript
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  fullWidth?: boolean;
}
```

#### Input

**Props** : Standard HTMLInputElement + `label`, `error`

#### Loader

**Props** :
```typescript
interface LoaderProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'white' | 'gray';
}
```

#### ErrorMessage

**Props** :
```typescript
interface ErrorMessageProps {
  message: string;
  onClose?: () => void;
}
```

#### TypeFicheBadge

**Props** :
```typescript
interface TypeFicheBadgeProps {
  typeFiche: TypeFiche;
}
```

**Couleurs** :
| Type | Couleur | Label |
|------|---------|-------|
| jamais_appele | Vert | Jamais appele |
| deja_appele | Orange | Deja appele |
| recycle | Bleu | Recycle |
| client | Violet | Client |

#### ProtectedRoute

**Props** :
```typescript
interface ProtectedRouteProps {
  children: ReactNode;
}
```

**Comportement** : Redirige vers `/login` si non authentifie

---

## Flux de Donnees

### Chargement Prospect

```
LandingPage (useEffect)
  → useProspect().loadProspect(1)
    → ProspectProvider.loadProspect
      → prospectService.getProspectById
        → apiCalls.get('/prospects/1')
          → ApiClient.request
            → Backend GET /api/prospects/1
        → ProspectModel.fromJSON(response.data)
      → setCurrentProspect(prospectModel)
      → setFullName(computed)
      → setTypeFiche(computed)
```

### Creation de Commande

```
ConfirmOrderModal (submit)
  → useProspect().createVente(data)
    → ProspectProvider.createVente
      → venteService.createVente({
          id_prospect,
          id_campagne,
          mode_paiement,
          notes,
          adresse_livraison,
          code_postal_livraison,
          ville_livraison,
          pays_livraison,
          details: [ { id_produit, quantite, prix_unitaire, remise }, ... ]
        })
        → apiCalls.post('/ventes', data)
          → Backend POST /api/ventes
      → loadVentes() // Refresh
  → useCart().clearCart()
  → onSuccess()
  → onClose()
```

### Ajout au Panier

```
ProduitCard (click "Ajouter")
  → useCart().addItem(produit)
    → CartProvider.addItem
      → Check si item existe deja
        → Si oui: incrementer quantite
        → Si non: creer CartItem
          → Calculer prix (tarif > produit, promo > unitaire)
          → Ajouter a items[]
      → Recalculer total et itemCount
```

---

## Design System

### Variables SCSS (`_variables.scss`)

```scss
// Couleurs principales
$colorPrimary: #007aff;
$colorSuccess: #34c759;
$colorWarning: #ff9500;
$colorDanger: #ff3b30;

// Grayscale
$colorBlack: #1d1d1f;
$colorGray900: #424245;
$colorGray300: #d2d2d7;
$colorWhite: #ffffff;

// Types de fiche
$colorJamaisAppele: #34c759;  // Vert
$colorDejaAppele: #ff9500;    // Orange
$colorRecycle: #007aff;       // Bleu
$colorClient: #5e5ce6;        // Violet

// Spacing
$spacing-xs: 0.25rem;   // 4px
$spacing-sm: 0.5rem;    // 8px
$spacing-md: 1rem;      // 16px
$spacing-lg: 1.5rem;    // 24px
$spacing-xl: 2rem;      // 32px
$spacing-2xl: 3rem;     // 48px
$spacing-3xl: 4rem;     // 64px

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

// Z-index
$z-dropdown: 1000;
$z-modal: 1050;
$z-tooltip: 1070;
```

### Mixins SCSS (`_mixins.scss`)

```scss
// Flexbox
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

// Responsive
@mixin responsive($breakpoint) {
  @if $breakpoint == sm {
    @media (min-width: vars.$breakpoint-sm) { @content; }
  } @else if $breakpoint == md {
    @media (min-width: vars.$breakpoint-md) { @content; }
  } @else if $breakpoint == lg {
    @media (min-width: vars.$breakpoint-lg) { @content; }
  } @else if $breakpoint == xl {
    @media (min-width: vars.$breakpoint-xl) { @content; }
  }
}

// Button base
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

// Focus ring (accessibilite)
@mixin focus-ring($color: vars.$colorPrimary) {
  outline: none;
  box-shadow: 0 0 0 3px rgba($color, 0.2);
}
```

### Utilisation

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

---

## Conventions

### Nommage des Fichiers

| Type | Convention | Exemple |
|------|------------|---------|
| Composants | PascalCase + `.tsx` | `Button.tsx` |
| Styles | camelCase + `.scss` | `button.scss` |
| Hooks | camelCase + `use` prefix | `useUser.ts` |
| Types | camelCase + `.types.ts` | `user.types.ts` |
| Services | PascalCase + `.service.ts` | `User.service.ts` |
| Models | PascalCase + `.model.ts` | `User.model.ts` |
| Context | PascalCase + `Context.tsx` | `UserContext.tsx` |
| Provider | PascalCase + `Provider.tsx` | `UserProvider.tsx` |

### Organisation des Imports

```typescript
// 1. Styles
import './component.scss';

// 2. React et libs externes
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// 3. Types (avec 'type' keyword)
import type { ComponentProps } from './types';

// 4. Hooks et contexts
import { useUser, useProspect } from '../../hooks';

// 5. Composants
import Button from '../button/Button';
import Loader from '../loader/Loader';
```

### Patterns de Code

**Composant fonctionnel** :
```typescript
interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

export default function MyComponent({ title, onAction }: MyComponentProps) {
  // hooks
  const { user } = useUser();
  const [state, setState] = useState<string>('');

  // handlers
  const handleClick = useCallback(() => {
    onAction?.();
  }, [onAction]);

  // render
  return (
    <div className="my-component">
      <h1>{title}</h1>
      <Button onClick={handleClick}>Action</Button>
    </div>
  );
}
```

**Hook personnalise** :
```typescript
import { createContextHook } from './createContextHook';
import { MyContext } from '../context/myContext';

export const useMyContext = createContextHook(MyContext, 'useMyContext', 'MyProvider');
```

---

## Troubleshooting

### Erreur CORS

Verifier que le backend autorise l'origine `http://localhost:5173` :
```javascript
// olympe - CORS config
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### Token expire

Le token est automatiquement rafraichi. Si le refresh echoue :
1. Tokens effaces
2. Redirect vers `/login`

### Erreur de connexion

1. Verifier que le backend est demarre : `cd olympe && npm run dev`
2. Verifier `VITE_API_BASE_URL` dans `.env`
3. Verifier les credentials

### Prix non affiches

Verifier que l'endpoint `/api/produits?grouped=true` retourne bien les prix.
Les prix sont extraits de la table `tarifs` et non de la table `produits`.

---

## Routing

**Fichier** : `App.tsx`

```typescript
<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route
    path="/"
    element={
      <ProtectedRoute>
        <Header props={{ pageTitle: 'Script Vendeur' }} />
        <LandingPage />
      </ProtectedRoute>
    }
  />
</Routes>
```

---

## Informations Projet

- **Version** : 1.0.0
- **Derniere mise a jour** : Janvier 2025
- **Auteur** : Nicolas DECRESSAC
- **Backend** : olympe (Node.js/Express/PostgreSQL)
- **Frontend** : script (React/TypeScript/Vite)
