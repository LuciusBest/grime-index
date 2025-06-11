# Grime Transcription Pipeline

Ce dossier regroupe plusieurs notebooks de developpement pour experimenter la transcription et la diarisation.

## Table des matières
- [Version 06_exp_01](#version-06_exp_01)
- [Version 06_exp_02](#version-06_exp_02)
- [Version 06_exp_03](#version-06_exp_03)
- [Version 06_exp_03_Gemini](#version-06_exp_03_gemini)
- [Version 06_exp_03_Gemini_revised](#version-06_exp_03_gemini_revised)

### Version 06_exp_01
Première adaptation de la version 06 avec Whisper *large* et Pyannote.
- Conversion automatique en WAV mono 16 kHz avec option *mode_test* pour ne traiter qu'un extrait.
- Diarisation bornée (min_speakers=2, max_speakers=4).
- Fonction `split_by_diction()` pour des segments d'environ 7 mots en suivant la ponctuation.
- Export JSON contenant les segments et une liste `instrumentals` à compléter.
- Conserver la variable `token` telle quelle pour l'authentification Pyannote.

### Version 06_exp_02
Amélioration de la structure JSON et détection des chevauchements.
- Ajout d'une liste `reloads` vide pour noter les moments de "reload".
- Chaque mot porte le champ booléen `chorus` (false par défaut).
- Nouveau bloc `overlaps` avec sous-listes `manual` et `auto`.
- Les segments où plusieurs locuteurs sont actifs sont copiés dans `overlaps.auto`.
- Messages d'avertissement pour les longueurs de segments inhabituelles et les incohérences de locuteur.

### Version 06_exp_03
Intégration du téléchargement YouTube et du découpage vidéo.
- Utilise `yt-dlp` et `ffmpeg` pour récupérer et couper la vidéo selon `start_time` et `end_time`.
- Calcule automatiquement la durée du clip (`end_time - start_time`).
- Vérifie la durée réelle de la vidéo pour éviter les dépassements.
- Extraction audio synchronisée en WAV 16 kHz, présentation du clip via `Video()` et `Audio()`.
- Conserve les améliorations de la version précédente (`reloads`, `chorus`, `overlaps`).
- Nettoyage des fichiers intermédiaires après traitement.
- Nécessite un accès réseau pour télécharger la vidéo.


### Version 06_exp_03_Gemini
Version alternative incluant la cellule de téléchargement proposée par Gemini.
- Ajout de messages d'erreur détaillés lors du téléchargement et du découpage.
- Conserve les fonctionnalités de la version 06_exp_03.

### Version 06_exp_03_Gemini_revised
Amélioration mineure de la version Gemini.
- Le fichier JSON est nommé d'après `archive_title`.
- Le champ `probability` est supprimé des mots pour alléger la sortie.
