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
│   ├── APICalls.tsx              # Méthodes HTTP génériques (GET, POST, PUT, PATCH, DELETE)
│   ├── models/                   # Modèles avec logique métier
│   │   ├── User.model.ts         # Modèle User (Employe)
│   │   └── index.ts
│   ├── services/                 # Services API
│   │   ├── User.service.ts       # Service User (Singleton)
│   │   └── index.ts
│   └── index.ts
├── context/                      # Contexts React
│   ├── userContext/
│   │   ├── UserContext.tsx       # Définition du context
│   │   ├── UserProvider.tsx      # Provider avec logique
│   │   └── index.ts
│   └── index.ts
├── hooks/                        # Hooks personnalisés
│   ├── useUser.ts                # Hook pour UserContext
│   └── index.ts
├── utils/                        # Utilitaires
│   ├── scripts/
│   │   └── utils.tsx             # Fonctions utilitaires (getSalutation, useClock)
│   ├── styles/                   # Styles globaux
│   │   ├── global.scss           # Styles globaux
│   │   ├── reset.scss            # Reset CSS
│   │   ├── _variables.scss       # Variables SCSS
│   │   └── _mixins.scss          # Mixins SCSS
│   └── types/                    # Types TypeScript
│       ├── user.types.ts         # Types utilisateur (Employe, Poste, Departement)
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
│           ├── LandingPage.tsx
│           └── landingPage.scss
├── App.tsx                       # Composant principal avec routing
└── main.tsx                      # Point d'entrée (avec UserProvider)
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

**Version** : 1.0.0
**Dernière mise à jour** : 2025-12-12
