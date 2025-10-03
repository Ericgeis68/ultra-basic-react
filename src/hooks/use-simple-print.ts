import { useCallback } from 'react';

export const useSimplePrint = () => {
  const handlePrint = useCallback(() => {
    // Ajouter une classe au body pour les styles d'impression
    document.body.classList.add('printing');
    
    // Attendre que les styles soient appliqués
    setTimeout(() => {
      window.print();
      
      // Supprimer la classe après l'impression
      document.body.classList.remove('printing');
    }, 100);
  }, []);

  return { handlePrint };
};
