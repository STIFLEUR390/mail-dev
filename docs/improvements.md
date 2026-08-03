# Analyse & Améliorations — Mail-Dev

> Analyse du code source (frontend + backend) réalisée le 2026-02-16.
> Objectif : lister les améliorations possibles **avec les packages déjà présents**
> dans le projet (aucune ou quasi aucune nouvelle dépendance requise), classées par priorité.
>
> Référentiel : Vue 3 + Pinia + Vue Router + Vite 8 + Tailwind 4 (frontend) ·
> Tauri 2 + mailin 0.6 + mailparse 0.16 + lettre 0.11 (backend Rust) ·
> SQLite via `tauri-plugin-sql` · `tauri-plugin-updater` pour les mises à jour.

---

## 1. Résumé de l'analyse

### Points forts
- Architecture claire et légère : 2 écrans, 2 stores Pinia, backend SMTP autonome.
- Persistance SQLite complète (mails + réglages), avec dégradation propre hors runtime Tauri (`db.js`).
- Sécurité de base déjà correcte : sandbox d'iframe, capacités Tauri restreintes par domaine HTTP
  (`spamcheck.postmarkapp.com` uniquement), AUTH SMTP PLAIN/LOGIN optionnelle.
- Auto-update fonctionnel via GitHub Releases (`tauri-plugin-updater` + `tauri-action`).

### Points faibles / risques identifiés
| # | Zone | Problème | Impact |
|---|------|----------|--------|
| 1 | `src-tauri/src/window.rs` | Singleton **`unsafe`** avec `static mut` + `transmute` de `Box` | UB potentiel, fuite mémoire, crash |
| 2 | `src-tauri/src/smtp.rs` | Serveur SMTP : aucun cycle de vie (pas de stop, double-start possible) | Port occupé, comportement incohérent |
| 3 | `src-tauri/src/smtp.rs`, `forward.rs` | Multiples `unwrap()` sur des données non fiables (MIME, adresses) | **Panics** → connexion/commande cassées |
| 4 | `src-tauri/src/smtp.rs` | `String::from_utf8(...).unwrap()` sur le corps du mail | MIME 8-bit (ISO-8859-1, UTF-8 sans charset) → panic |
| 5 | `src/components/MailContent.vue` | iframe avec `allow-scripts allow-same-origin` sur du HTML **non fiable** | **Risque XSS** (script dans un email) |
| 6 | `src-tauri/tauri.conf.json` | CSP malformée : `img-src: 'self'` collé dans `default-src` | Directive ignorée → images non contrôlées |
| 7 | `src/screens/Mailbox.vue` | `strokeWidth={2}` (syntaxe React) dans les SVG | Attribut SVG invalide → trait non appliqué |
| 8 | `src/stores/setting.js` | Réglage `spamChecking` **mort** (jamais lu) | Code mort / fonctionnalité fantôme |
| 9 | `src/App.vue`, `Mailbox.vue`, `Settings.vue` | Logique `startServer` dupliquée et divergente (les erreurs sont avalées dans Mailbox) | Incohérences de statut serveur |
| 10 | `src/stores/mailbox.js` | `key: Math.random().toString()` | Collisions possibles → mails écrasés (`INSERT OR REPLACE`) |

---

## 2. Améliorations prioritaires (sécurité & stabilité)

### 2.1 Supprimer le singleton `unsafe` — `src-tauri/src/window.rs`
**Problème** : `static mut SINGLETON` + `std::mem::transmute(Box::new(window))` est du code
`unsafe` non justifié, sujet à UB et qui fuit la `Box`.

**Solution (packages actuels)** :
- Passer le `AppHandle`/`WebviewWindow` en paramètre des commandes Tauri (`app: tauri::AppHandle`)
  et l'injecter dans la closure du thread SMTP — plus aucun état global.
- Ou, à défaut, remplacer par un `OnceLock<Mutex<WebviewWindow>>` (std, Rust 1.70+) :
  ```rust
  static WINDOW: OnceLock<Mutex<WebviewWindow>> = OnceLock::new();
  pub(crate) fn set_main_window(w: WebviewWindow) { let _ = WINDOW.set(Mutex::new(w)); }
  pub(crate) fn main_window() -> WebviewWindow { WINDOW.get().unwrap().lock().unwrap().clone() }
  ```
**Bénéfice** : suppression du `unsafe`, code idiomatique, plus de risque de double-free.

### 2.2 Remplacer les `unwrap()` par des `Result` — `smtp.rs`, `forward.rs`
Emplacements à traiter :
- `parse_mail(mime.as_ref()).unwrap()` (MIME invalide → panic dans le thread de connexion).
- `.get("filename").unwrap()` sur les pièces jointes (attachement sans `filename` → panic).
- `String::from_utf8(Vec::from(buf)).unwrap()` (voir 2.3).
- `email_to.parse().unwrap()` / `username.parse::<Address>().unwrap()` dans `forward.rs`
  (saisie utilisateur invalide → panic de la commande asynchrone).

**Solution** : retourner `Result<(), String>` depuis les commandes (`forward_mail`, `start_smtp_server`)
et logger / émettre l'erreur vers le frontend au lieu de paniquer.

### 2.3 Support des MIME 8-bit — `smtp.rs`
**Problème** : le corps d'un email peut être encodé en ISO-8859-1, Shift-JIS, etc.
`String::from_utf8(...).unwrap()` panique sur tout octet > 0x7F non UTF-8.

**Solution** : `String::from_utf8_lossy(&buf).into_owned()` (ou décodage via le charset
déclaré dans le header `Content-Type`).

### 2.4 Durcir le sandbox de l'iframe HTML — `MailContent.vue`
**Problème** : `sandbox="allow-same-origin allow-scripts allow-popups allow-forms"` sur un
`blob:` contenant le HTML d'un email **non fiable** → un email malveillant peut exécuter du JS.

**Solution (aucun package requis)** :
```html
<iframe sandbox="allow-popups allow-popups-to-escape-sandbox" ...></iframe>
```
- Retirer `allow-scripts` et `allow-same-origin` (c'est la combinaison qui autorise le XSS).
- Conséquence : `resizeIframe()` (accès `contentWindow.document`) ne fonctionnera plus —
  le remplacer par un iframe en `h-full w-full` avec défilement interne (`scrolling="auto"`).
- Bonus : désactiver le chargement des images distantes (tracking) tant qu'aucun réglage
  « charger les images » n'existe.

### 2.5 Corriger la CSP — `src-tauri/tauri.conf.json`
**Problème** : `"default-src blob: data: filesystem: ws: wss: http: https: tauri: 'unsafe-eval' 'unsafe-inline' 'self' img-src: 'self'"` —
`img-src: 'self'` n'est pas une directive valide, c'est collé dans la liste des sources de
`default-src` et donc ignoré par le navigateur.

**Solution** :
```
default-src 'self' tauri: blob: data: filesystem: ws: wss: http: https: 'unsafe-eval' 'unsafe-inline';
img-src 'self' data: blob:;
style-src 'self' 'unsafe-inline';
```
(à ajuster selon les besoins réels du preview HTML ; l'objectif est de borner `img-src`
et de supprimer les sources inutiles de `default-src`).

### 2.6 Corriger `strokeWidth={2}` → `stroke-width="2"` — `Mailbox.vue`
**Problème** : syntaxe JSX/React dans des templates Vue ; `strokeWidth` n'est pas un attribut
SVG valide (casse sensible) → les icônes « corbeille » (supprimer / tout supprimer)
s'affichent avec le trait par défaut.

**Solution** : remplacer `strokeWidth={2}` par `stroke-width="2"` (2 occurrences, lignes 32 et 87).

### 2.7 Cycle de vie du serveur SMTP — `smtp.rs` + stores
**Problème** : `start_smtp_server` spawn un thread dont le `JoinHandle` est perdu :
- aucune commande `stop_smtp_server` ;
- un 2ᵉ clic sur « Start Server » tente un 2ᵉ bind → erreur non gérée côté Mailbox ;
- l'état réel du serveur n'est pas reflété (le frontend `setSrvStatus(true)` à l'aveugle).

**Solution (packages actuels)** :
- Stocker `TcpListener` + `JoinHandle` dans un `tauri::State` (`Mutex<Option<SmtpServerHandle>>`) ;
- nouvelle commande `stop_smtp_server` qui arrête l'écoute (drop du listener) et coupe les threads ;
- `start_smtp_server` retourne une erreur explicite si déjà démarré ;
- le frontend rafraîchit `srvStatus` à partir du résultat de la commande (jamais « à l'aveugle ») ;
- arrêt automatique à la fermeture de l'app (drop naturel via l'état Tauri).

---

## 3. Améliorations fonctionnelles (packages actuels)

### 3.1 Câbler le réglage `spamChecking` — `setting.js` + `Mailbox.vue`
Le réglage existe (`spamChecking: true`) mais n'est **jamais lu**. La requête
`spamcheck.postmarkapp.com` part à chaque ouverture de l'onglet « Spam Reports ».
**Solution** : ne déclencher `getSpamScore()` que si `setting.spamChecking === true`,
ajouter un état « chargement »/« erreur » + un timeout sur le `fetch`.

### 3.2 Factoriser `startServer` — composable `useSmtpServer()`
`Mailbox.vue` et `Settings.vue` dupliquent la même logique, avec un comportement **divergent**
(Mailbox ignore la réponse de la commande, Settings la traite). Extraire dans
`src/composables/useSmtpServer.js` (invoke + gestion de la réponse + statut + notification).

### 3.3 Clés de mail robustes — `mailbox.js`
Remplacer `key: Math.random().toString()` par `crypto.randomUUID()` (disponible dans
WebView2 / WKWebView / WebKitGTK 4.1) pour éviter les collisions sur `INSERT OR REPLACE`.

### 3.4 Persistance : débounce + gestion d'erreurs — `App.vue`, `db.js`
- `setting.$subscribe` écrit tout l'état SQLite à **chaque** mutation ; ajouter un
  debounce (~500 ms) pour grouper les écritures.
- `insertMail`, `updateMailSeen`, `updateMailSpam`, `deleteMail` sont fire-and-forget :
  ajouter `.catch()` / gestion d'échec (file d'attente simple en mémoire en cas d'échec).

### 3.5 Lazy-load du router — `src/router/index.js`
Importer `Mailbox.vue` et `Settings.vue` via `() => import(...)` → code splitting Vite,
démarrage plus rapide. Aucun package requis.

### 3.6 Forward : retour d'erreur + timeouts — `forward.rs`, `App.vue`
- `forward_mail` ne renvoie rien → le frontend ne sait jamais si le mail est parti.
  Retourner `Result<String, String>` (ex. « Email sent », ou l'erreur du dernier mode TLS).
- Ajouter des timeouts (`SmtpTransport::builder_dangerous(...).timeout(Duration)`) car
  la boucle TLS peut se bloquer longtemps sur un hôte injoignable.
- Afficher l'état du forward dans les réglages (dernier envoi OK/échec).

### 3.7 Évolutivité du schéma SQLite — `lib.rs`
La migration v1 n'a pas de `MigrationKind::Down` et le schéma est figé.
Ajouter la migration Down de la v1 et prévoir des migrations incrémentales (ex. v2
pour BLOB de pièces jointes ou index sur `created_at`).

### 3.8 Raccourcis clavier — `Mailbox.vue`
Aucun package requis : `Delete` (supprimer le mail sélectionné), `←/→` (mail précédent/suivant),
`Ctrl/Cmd + A` (tout sélectionner si pertinent). Événements `keydown` sur l'écran Mailbox.

### 3.9 Stockage des pièces jointes hors JSON — `smtp.rs`, `db.js`
Aujourd'hui les pièces jointes binaires sont sérialisées en **base64 dans le JSON** de la
colonne `attachments` → DB enflée, lenteurs.
**Solution avec `plugin-fs` (déjà présent)** : sauvegarder les pièces jointes sur disque
(dans le dossier de données de l'app) et ne stocker en SQLite que le chemin + métadonnées ;
ou passer à des colonnes `BLOB` via une migration v2.

### 3.10 Optimisations de build Vite — `vite.config.mjs`
Ajouter `build.rollupOptions.output.manualChunks` (séparer `vue`, `pinia`, `vue-router`,
`@tauri-apps/*`) pour un cache navigateur plus efficace, et `reportCompressedSize: false`.

### 3.11 Détails UI/UX
- État vide : la page d'accueil affiche l'adresse du serveur mais pas le statut réel ;
  lier à `srvStatus` réel (cf. 2.7).
- Boutons « Start/Stop Server » avec état de chargement pendant le bind.
- Confirmation avant « Delete all mails » (destructif, irréversible).

---

## 4. Outillage & CI (packages actuels)

### 4.1 Scripts `package.json`
Ajouter :
```json
"scripts": {
  "lint": "eslint .",            // après ajout d'ESLint (voir 5)
  "format": "prettier --write .",
  "test": "vitest run",
  "check": "vue-tsc --noEmit"    // si passage TypeScript
}
```

### 4.2 Workflow CI (à côté de `publish.yml`)
Créer `.github/workflows/ci.yml` déclenché sur `push`/`pull_request` :
- `bun install && bun run build` (frontend)
- `cargo fmt --check && cargo clippy -- -D warnings && cargo test` (dans `src-tauri`)
- mise en cache Rust (`dtolnay/rust-toolchain` + `Swatinem/rust-cache`) et Bun
- Upload des artefacts de build sur échec pour diagnostic.

### 4.3 Cargo.toml
- `edition = "2021"` → `"2024"` (rustc 1.97 supporté) ;
- compléter les métadonnées : `homepage`, `readme`, `repository` (déjà présent), `keywords` ;
- `tauri.conf.json` : renseigner `copyright`, `shortDescription`, `longDescription`
  (actuellement vides → installateurs génériques).

---

## 5. Améliorations optionnelles (nouveaux packages — hors périmètre « packages présents »)

| Idée | Package | Bénéfice |
|------|---------|----------|
| Empêcher deux instances (conflit sur le port 25/2525) | `tauri-plugin-single-instance` | Une seule instance active |
| Logs structurés (fichier + console) au lieu de `println!` | `log` + `tauri-plugin-log` | Debugging serveur SMTP |
| Ouvrir les liens dans le navigateur système | `tauri-plugin-opener` | UX lien « GitHub Releases » |
| Info plateforme (dossier de config par OS) | `tauri-plugin-os` | Chemins robustes pour pièces jointes |
| Passage progressif à TypeScript | `typescript`, `vue-tsc` | Sécurité de typage (payloads MIME, stores) |
| Tests frontend | `vitest`, `@vue/test-utils`, `jsdom` | Couverture stores + composants |
| Listes de mails longues (virtualisation) | `vue-virtual-scroller` | Fluidité au-delà de ~1000 mails |
| Lint/format | `eslint` + `eslint-plugin-vue`, `prettier` | Cohérence du code |

---

## 6. Documentation

- **README** : la section « Requirement » indique `NodeJS 18+`, mais **Vite 8 exige
  `^20.19.0 || >=22.12.0`** (`node_modules/vite/package.json` → `engines`). À corriger.
- `docs/index.md` duplique le README (obsolète : « Forward emails [WIP] », « Auto update »
  non coché alors que tout est fait). Remplacer par un lien vers le README ou le synchroniser.
- Ajouter des badges (CI, release) et une section « Development » (dev/build/run).

---

## 7. Checklist récapitulative

> ✅ État au 2026-02-16 : tout le bloc 🔴 et la quasi-totalité du bloc 🟠 ont été
> implémentés dans la version **0.8.0**. Restent en attente : 3.9 (pièces jointes
> hors SQLite), la recherche de mails, et les tests frontend (Vitest).

### 🔴 Priorité haute (sécurité / stabilité)
- [x] 2.1 Supprimer le singleton `unsafe` (`window.rs` — fichier supprimé, `AppHandle` injecté)
- [x] 2.2 Remplacer les `unwrap()` par des `Result` (`smtp.rs`, `forward.rs`)
- [x] 2.3 MIME 8-bit : octets bruts conservés, charset décodé par mailparse (tests ISO-8859-1)
- [x] 2.4 Durcir le sandbox iframe (retiré `allow-scripts`/`allow-same-origin`)
- [x] 2.5 Corriger la CSP (`img-src` et `style-src` séparés)
- [x] 2.6 `stroke-width="2"` dans les SVG (`Mailbox.vue`)
- [x] 2.7 Cycle de vie SMTP : `stop_smtp_server`, anti double-start, statut réel + test d'intégration TCP

### 🟠 Priorité moyenne (fonctionnel)
- [x] 3.1 Câbler `spamChecking` (toggle Settings) + timeout 15 s + message d'erreur
- [x] 3.2 Composable `useSmtpServer()` (dédupliqué Mailbox/Settings)
- [x] 3.3 `crypto.randomUUID()` pour les clés de mail
- [x] 3.4 Débounce `saveSettings` (400 ms) + gestion d'erreurs des écritures DB
- [x] 3.5 Lazy-load des routes + `manualChunks` Vite (Rolldown)
- [x] 3.6 Forward : `Result<String, String>` + timeout 10 s + retour visuel (console)
- [x] 3.7 Migrations SQLite (ajout du `Down` de la v1)
- [x] 3.8 Raccourcis clavier (Delete, ↑/↓) + confirmations de suppression (`ask`)
- [ ] 3.9 Pièces jointes sur disque / BLOB — **en attente** (migration de schéma)
- [x] 3.10 `manualChunks` Vite — fait avec 3.5
- [x] 3.11 Confirmations UI (delete all/delete) — fait avec 3.8

### 🟢 Outillage
- [x] 4.1 Scripts npm (`fmt`, `clippy`, `test:rust`)
- [x] 4.2 Workflow CI (`ci.yml` : build frontend, fmt, clippy, tests)
- [x] 4.3 Métadonnées Cargo + `edition 2024` + description/copyright du bundle
- [x] 6.1 README : Node 20.19+ / docs sync — fait avant l'implémentation
- [ ] 3.9b / Frontend : tests Vitest — **en attente** (nouveaux packages, cf. section 5)
