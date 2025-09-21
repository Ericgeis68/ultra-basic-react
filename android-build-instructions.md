# Instructions pour compiler l'application Android

## Prérequis
- Node.js et npm installés
- Android Studio installé
- Java Development Kit (JDK) installé
- Variables d'environnement ANDROID_HOME et JAVA_HOME configurées

## Étapes pour compiler l'application

1. **Exporter le projet vers GitHub**
   - Cliquez sur le bouton "Exporter vers GitHub" dans l'interface de Lovable
   - Clonez le dépôt sur votre machine locale

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Ajouter la plateforme Android**
   ```bash
   npx cap add android
   ```

4. **Construire l'application**
   ```bash
   npm run build
   ```

5. **Synchroniser les fichiers avec le projet Android**
   ```bash
   npx cap sync android
   ```

6. **Ouvrir le projet dans Android Studio**
   ```bash
   npx cap open android
   ```

7. **Dans Android Studio**
   - Assurez-vous que le fichier AndroidManifest.xml contient les permissions nécessaires :
     ```xml
     <uses-permission android:name="android.permission.INTERNET" />
     <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
     <uses-permission android:name="android.permission.CAMERA" />
     ```
   - Vous pouvez maintenant compiler l'application en cliquant sur "Build > Build Bundle(s) / APK(s) > Build APK(s)"
   - Ou exécuter l'application sur un appareil connecté en cliquant sur "Run > Run 'app'"

8. **Pour générer un APK signé pour distribution**
   - Dans Android Studio, allez dans "Build > Generate Signed Bundle / APK"
   - Suivez les instructions pour créer une clé de signature si vous n'en avez pas déjà une
   - Choisissez "APK" comme type de sortie
   - Sélectionnez le mode "release"
   - Suivez les instructions restantes pour générer l'APK signé

## Résolution des problèmes courants

- **Erreur de permissions** : Assurez-vous que les permissions sont correctement définies dans AndroidManifest.xml
- **Erreur de camera** : Vérifiez que le plugin @capacitor/camera est correctement installé et configuré
- **Erreurs de build** : Essayez de nettoyer le projet avec `./gradlew clean` dans le dossier android

## Test sur un appareil réel

Pour tester l'application sur un appareil Android réel :

1. Activez le mode développeur sur votre appareil Android
2. Activez le débogage USB
3. Connectez votre appareil à votre ordinateur
4. Exécutez `npx cap run android` ou lancez directement depuis Android Studio

L'application devrait maintenant être capable de scanner tous types de codes QR avec une bonne robustesse.
