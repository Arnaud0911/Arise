# Arise — PWA futuriste

Prototype mobile installable d'Arise avec interface sombre premium, stockage local et trois pôles principaux : Training, Alimentation et Tracking.

## Expérience incluse

- Accueil premium avec Score Arise, résumé quotidien et actions rapides
- Design sombre futuriste, glassmorphism et accents bleu/cyan/violet
- Plus de 40 exercices, création guidée par activité, matériel et groupe musculaire
- Enregistrement des séries, répétitions, charges, RPE et volume
- Journal alimentaire avec calories et macronutriments
- Scan automatique des codes-barres sur iPhone, quantité consommée, type de repas et recherche Open Food Facts
- Score quotidien calculé à partir du training, de la nutrition, du repos et des habitudes
- Ajout, modification et suppression avec confirmation des workouts, séances, aliments, repos et habitudes
- Profil et espace de sécurité avec export/import des données
- PWA installable et interface principale disponible hors connexion

## Tester localement

La caméra et le service worker nécessitent HTTPS ou localhost.

```bash
cd arise-pwa
python3 -m http.server 8080
```

Ouvrir ensuite `http://localhost:8080`.

## Installer sur iPhone

Après publication sur un hébergement HTTPS :

1. Ouvrir l'adresse dans Safari.
2. Toucher **Partager**.
3. Choisir **Sur l'écran d'accueil**.
4. Lancer Arise depuis sa nouvelle icône.

## Confidentialité

- Aucun compte, publicité ou suivi analytique.
- Les données sportives et habitudes restent dans le stockage local.
- Le numéro du code-barres est envoyé à Open Food Facts lors d'une analyse produit.
- Le flux caméra n'est pas enregistré par Arise.
- Les analyses nutritionnelles sont indicatives et ne remplacent pas un avis médical.


## Arise 1.7
- Profil local indépendant par téléphone (prénom, poids, taille et référence sportive).
- Scan live de codes-barres avec caméra + Open Food Facts, quantité puis ajout automatique aux apports du jour.
- Radar de performance calculé automatiquement à partir des séances et tests récents, avec objectifs superposés.
- Tests possibles : développé couché, squat, soulevé de terre, 100 m, 5 km, marathon, saut vertical et sit & reach.

Le scan caméra nécessite GitHub Pages/HTTPS, l'autorisation caméra et une connexion Internet pour identifier le produit.
