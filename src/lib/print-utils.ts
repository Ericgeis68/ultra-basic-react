/**
 * Utilitaires pour l'impression - gestion des champs vides
 */

/**
 * Remplace les valeurs vides par des espaces invisibles pour l'impression
 * @param value - La valeur à traiter
 * @param fallback - La valeur de fallback si value est vide (par défaut: espaces)
 * @returns La valeur ou des espaces si vide
 */
export const getEmptyFieldValue = (value: string | null | undefined, fallback: string = '\u00A0\u00A0\u00A0'): string => {
  if (!value || value.trim() === '') {
    return fallback;
  }
  return value;
};

/**
 * Remplace les valeurs vides par des espaces invisibles pour l'impression
 * Version spéciale pour les champs qui peuvent être null/undefined
 * @param value - La valeur à traiter
 * @param fallback - La valeur de fallback si value est vide (par défaut: espaces)
 * @returns La valeur ou des espaces si vide
 */
export const getEmptyFieldValueSafe = (value: any, fallback: string = '\u00A0\u00A0\u00A0'): string => {
  if (value === null || value === undefined || value === '' || (typeof value === 'string' && value.trim() === '')) {
    return fallback;
  }
  return String(value);
};

/**
 * Remplace les valeurs vides par des espaces invisibles pour l'impression
 * Version pour les listes/tableaux
 * @param values - Les valeurs à traiter
 * @param separator - Le séparateur entre les valeurs (par défaut: ', ')
 * @param fallback - La valeur de fallback si toutes les valeurs sont vides
 * @returns La chaîne jointe ou des espaces si vide
 */
export const getEmptyFieldListValue = (
  values: (string | null | undefined)[] | null | undefined, 
  separator: string = ', ', 
  fallback: string = '\u00A0\u00A0\u00A0'
): string => {
  if (!values || values.length === 0) {
    return fallback;
  }
  
  const validValues = values.filter(v => v && v.trim() !== '');
  if (validValues.length === 0) {
    return fallback;
  }
  
  return validValues.join(separator);
};

/**
 * Remplace les valeurs vides par des espaces invisibles pour l'impression
 * Version pour les dates
 * @param dateValue - La valeur de date à traiter
 * @param fallback - La valeur de fallback si dateValue est vide
 * @returns La date formatée ou des espaces si vide
 */
export const getEmptyDateValue = (dateValue: string | null | undefined, fallback: string = '\u00A0\u00A0\u00A0'): string => {
  if (!dateValue || dateValue.trim() === '') {
    return fallback;
  }
  
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      return fallback;
    }
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch {
    return fallback;
  }
};

/**
 * Remplace les valeurs vides par des espaces invisibles pour l'impression
 * Version pour les nombres
 * @param numberValue - La valeur numérique à traiter
 * @param fallback - La valeur de fallback si numberValue est vide
 * @returns Le nombre formaté ou des espaces si vide
 */
export const getEmptyNumberValue = (numberValue: number | null | undefined, fallback: string = '\u00A0\u00A0\u00A0'): string => {
  if (numberValue === null || numberValue === undefined || isNaN(numberValue)) {
    return fallback;
  }
  return String(numberValue);
};

/**
 * Nettoie les noms des techniciens en supprimant les préfixes "ID:" indésirables
 * @param technicians - Liste des noms de techniciens
 * @param separator - Séparateur entre les noms (par défaut: ', ')
 * @param fallback - Valeur de fallback si aucun technicien valide
 * @returns Chaîne des noms nettoyés ou fallback
 */
export const cleanTechnicianNames = (
  technicians: (string | null | undefined)[] | null | undefined,
  separator: string = ', ',
  fallback: string = 'Aucun technicien assigné'
): string => {
  if (!technicians || technicians.length === 0) {
    return fallback;
  }
  
  const validTechnicians = technicians
    .filter(t => t && t.trim() !== '')
    .map(t => {
      // Supprimer "ID:" au début du nom si présent
      const cleaned = t!.trim();
      return cleaned.startsWith('ID:') ? cleaned.substring(3).trim() : cleaned;
    });
  
  if (validTechnicians.length === 0) {
    return fallback;
  }
  
  return validTechnicians.join(separator);
};
