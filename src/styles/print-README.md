# 🖨️ Guide d'impression - GMAO Application

## 📋 Problèmes résolus

### ❌ **Avant (problématiques) :**
- Conversion mm → px approximative (× 3.78)
- Même unités pour aperçu et impression
- Décalages entre aperçu et impression réelle
- Tailles incohérentes selon les navigateurs

### ✅ **Après (corrigé) :**
- Conversion DPI correcte : `mm × (DPI/25.4)`
- Unités séparées : `px` pour aperçu, `mm` pour impression
- Aperçu fidèle à l'impression réelle
- Compatibilité multi-navigateurs

## 🎯 Solutions implémentées

### 1. **Fichier CSS dédié** (`src/styles/print.css`)
- Règles `@media print` pour l'impression réelle
- Règles `@media screen` pour l'aperçu
- Règles `@page` pour forcer la taille A4

### 2. **Unités correctes**
```css
/* Impression (300 DPI) */
@media print {
  .equipment-card img {
    height: 25mm; /* Au lieu de h-48 (192px) */
  }
}

/* Aperçu (96 DPI) */
@media screen {
  .equipment-card img {
    height: 192px; /* 25mm × 3.78 */
  }
}
```

### 3. **Conversion DPI**
- **Écran** : 96 DPI → 1mm = 3.78px
- **Impression** : 300 DPI → 1mm = 11.81px
- **A4** : 210mm × 297mm (toujours)

## 📐 Dimensions de référence

### **Pages :**
- **A4** : 210mm × 297mm
- **A3** : 297mm × 420mm
- **Letter** : 216mm × 279mm
- **Legal** : 216mm × 356mm

### **Cartes d'équipement :**
- **Image** : 25mm de hauteur
- **Padding** : 3mm
- **Marges** : 4mm entre cartes
- **Texte** : 2.5mm (titre), 2mm (contenu)

### **Tableaux :**
- **Cellules** : 1.5mm de padding
- **Bordures** : 0.2mm
- **Texte** : 2.5mm

## 🔧 Classes CSS utilisées

### **Structure :**
- `.print-page` : Conteneur de page
- `.print-content` : Contenu avec marges
- `.print-header` : En-tête de document
- `.print-footer` : Pied de page

### **Cartes :**
- `.equipment-card` : Carte d'équipement
- `.intervention-card` : Carte d'intervention
- `.image-placeholder` : Placeholder d'image
- `.health-bar` : Barre de santé

### **Grilles :**
- `.equipment-grid` : Grille d'équipements
- `.intervention-grid` : Grille d'interventions

## 🧪 Tests recommandés

### **Navigateurs :**
- ✅ Chrome (recommandé)
- ✅ Firefox
- ✅ Safari
- ✅ Edge

### **Vérifications :**
1. **Aperçu** : Dimensions correctes à l'écran
2. **Impression** : Taille A4 respectée
3. **Marges** : Pas de marges du navigateur
4. **Couleurs** : Affichage correct (si activé)

## 🚀 Utilisation

### **Import automatique :**
```typescript
import '@/styles/print.css';
```

### **Classes dans les composants :**
```tsx
<div className="print-page">
  <div className="print-content">
    <div className="equipment-grid grid-cols-3">
      <div className="equipment-card">
        <img className="equipment-image" />
      </div>
    </div>
  </div>
</div>
```

## 📊 Résultats attendus

- ✅ **Aperçu fidèle** : Ce que vous voyez = ce qui s'imprime
- ✅ **Taille A4** : Respectée sur tous les navigateurs
- ✅ **Marges nulles** : Contrôle total de la mise en page
- ✅ **Performance** : Rendu rapide et fiable
- ✅ **Compatibilité** : Fonctionne sur tous les navigateurs modernes

## 🔍 Dépannage

### **Problème** : L'aperçu ne correspond pas à l'impression
**Solution** : Vérifier que le fichier `print.css` est bien importé

### **Problème** : Marges du navigateur visibles
**Solution** : Vérifier les paramètres d'impression du navigateur

### **Problème** : Tailles incorrectes
**Solution** : Nettoyer le cache CSS et recharger la page
