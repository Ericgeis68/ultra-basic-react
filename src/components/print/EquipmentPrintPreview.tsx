import React, { forwardRef } from 'react';
import { Equipment } from '@/types/equipment';
import { EquipmentGroup } from '@/types/equipmentGroup';
import { Building } from '@/types/building';
import { Service } from '@/types/service';
import { Location } from '@/types/location';
import { ExportOptions } from '@/services/PDFExportService';
import EquipmentCard from '@/components/equipment/EquipmentCard';
import EquipmentPrintListView from './EquipmentPrintListView';

interface EquipmentPrintPreviewProps {
  equipments: Equipment[];
  groups: EquipmentGroup[];
  buildings: Building[];
  services: Service[];
  locations: Location[];
  options: ExportOptions;
}

const EquipmentPrintPreview = forwardRef<HTMLDivElement, EquipmentPrintPreviewProps>(
  ({ equipments, groups, buildings, services, locations, options }, ref) => {
    // Si le format est "list", utiliser le composant de liste
    if (options.format === 'list') {
      return (
        <div ref={ref} className="print-preview bg-muted/30" style={{ padding: '16px' }}>
          <div 
            className={`print-page print-content bg-white ${options.orientation === 'landscape' ? 'landscape' : 'portrait'}`}
            style={{
              width: `${options.orientation === 'landscape' ? '297mm' : '210mm'}`,
              minHeight: `${options.orientation === 'landscape' ? '210mm' : '297mm'}`,
              margin: '0 auto 12px',
              padding: '10mm',
              boxSizing: 'border-box',
              overflow: 'hidden',
              fontSize: '12px',
              lineHeight: '1.4',
              boxShadow: '0 0 0 1px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.1)',
              transform: options.orientation === 'portrait' ? 'scale(0.9)' : 'scale(0.8)',
              transformOrigin: 'top center',
            }}
          >
            {options.showHeaders && (
              <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0', color: '#000' }}>
                  {options.title || 'Liste des équipements'}
                </h1>
                <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>
                  Généré le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}
                </p>
              </div>
            )}
            
            <EquipmentPrintListView
              equipments={equipments}
              groups={groups}
              buildings={buildings}
              services={services}
              locations={locations}
              options={options}
            />
            
            {options.showFooters && (
              <div style={{ marginTop: '20px', textAlign: 'center', borderTop: '1px solid #ddd', paddingTop: '10px' }}>
                <p style={{ fontSize: '10px', color: '#666', margin: 0 }}>
                  Document généré automatiquement - GMAO Application
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Code existant pour le format grille
    const getPageDims = () => {
      const size = options.pageSize || 'a4';
      const dims: Record<string, { w: number; h: number }> = {
        a4: { w: 210, h: 297 },
        a3: { w: 297, h: 420 },
        letter: { w: 216, h: 279 },
        legal: { w: 216, h: 356 },
      };
      const { w, h } = dims[size] || dims.a4;
      return options.orientation === 'landscape' ? { w: h, h: w } : { w, h };
    };

    const getItemsPerPage = () => {
      if (options.format === 'list') return 20;
      
      // Calculer dynamiquement le nombre d'éléments par page
      const { w, h } = getPageDims();
      const availableWidth = w - 10;
      // Ajuster la hauteur disponible selon les options d'en-tête et pied de page
      let availableHeight = h - 6;
      if (options.showHeaders) availableHeight -= 8;
      if (options.showFooters) availableHeight -= 8;
      const gapSize = 3;
      const CARD_RATIO = 2.16;
      
      // Calculer la disposition optimale
      const calculateOptimalLayout = () => {
        let bestLayout = { cols: 1, rows: 1, totalCards: 1 };
        
        for (let cols = 1; cols <= 8; cols++) {
          for (let rows = 1; rows <= 6; rows++) {
            const totalCards = cols * rows;
            
            const maxCardWidth = (availableWidth - (cols - 1) * gapSize) / cols;
            const maxCardHeight = (availableHeight - (rows - 1) * gapSize) / rows;
            
            let cardWidth, cardHeight;
            
            if (maxCardWidth * CARD_RATIO <= maxCardHeight) {
              cardWidth = maxCardWidth;
              cardHeight = maxCardWidth * CARD_RATIO;
            } else {
              cardHeight = maxCardHeight;
              cardWidth = maxCardHeight / CARD_RATIO;
            }
            
            const totalWidth = cols * cardWidth + (cols - 1) * gapSize;
            const totalHeight = rows * cardHeight + (rows - 1) * gapSize;
            
            if (totalWidth <= availableWidth && totalHeight <= availableHeight) {
              if (totalCards > bestLayout.totalCards) {
                bestLayout = { cols, rows, totalCards };
              }
            }
          }
        }
        
        return bestLayout;
      };
      
      const optimalLayout = calculateOptimalLayout();
      
      // Appliquer des contraintes basées sur la taille demandée
      const sizeConstraints = {
        single: { maxCols: 1, maxRows: 1, minCardWidth: 80, useFullHeight: true },
        xlarge: { maxCols: 2, maxRows: 3, minCardWidth: 80, useFullHeight: false },
        large: { maxCols: 3, maxRows: 3, minCardWidth: 60, useFullHeight: false },
        medium: { maxCols: 4, maxRows: 4, minCardWidth: 45, useFullHeight: false },
        small: { maxCols: 5, maxRows: 4, minCardWidth: 35, useFullHeight: false },
        xsmall: { maxCols: 6, maxRows: 5, minCardWidth: 25, useFullHeight: false }
      };
      
      const constraint = sizeConstraints[options.gridSize] || sizeConstraints.medium;
      
      // Gestion spéciale pour le mode "single"
      if (options.gridSize === 'single') {
        return 1; // Une seule carte par page
      }
      
      if (optimalLayout.cols <= constraint.maxCols && optimalLayout.rows <= constraint.maxRows) {
        return optimalLayout.totalCards;
      }
      
      // Trouver la meilleure disposition respectant les contraintes
      let bestConstrainedLayout = { cols: 1, rows: 1, totalCards: 1 };
      
      for (let cols = 1; cols <= constraint.maxCols; cols++) {
        for (let rows = 1; rows <= constraint.maxRows; rows++) {
          const totalCards = cols * rows;
          
          const maxCardWidth = (availableWidth - (cols - 1) * gapSize) / cols;
          const maxCardHeight = (availableHeight - (rows - 1) * gapSize) / rows;
          
          let cardWidth, cardHeight;
          
          if (maxCardWidth * CARD_RATIO <= maxCardHeight) {
            cardWidth = maxCardWidth;
            cardHeight = maxCardWidth * CARD_RATIO;
          } else {
            cardHeight = maxCardHeight;
            cardWidth = maxCardHeight / CARD_RATIO;
          }
          
          if (cardWidth >= constraint.minCardWidth) {
            const totalWidth = cols * cardWidth + (cols - 1) * gapSize;
            const totalHeight = rows * cardHeight + (rows - 1) * gapSize;
            
            if (totalWidth <= availableWidth && totalHeight <= availableHeight) {
              if (totalCards > bestConstrainedLayout.totalCards) {
                bestConstrainedLayout = { cols, rows, totalCards };
              }
            }
          }
        }
      }
      
      return bestConstrainedLayout.totalCards;
    };

    const itemsPerPage = getItemsPerPage();
    const pages: Equipment[][] = [];
    
    for (let i = 0; i < equipments.length; i += itemsPerPage) {
      pages.push(equipments.slice(i, i + itemsPerPage));
    }

    const renderEquipmentGrid = (pageEquipments: Equipment[], dimensions: { cardWidth: number, cardHeight: number, cols: number, rows: number, scaleFactor: number }) => {
      if (options.format === 'list') {
        return (
          <div className="space-y-2 w-full min-w-0">
            {pageEquipments.map((equipment) => (
              <div key={equipment.id} className="p-2 border rounded min-w-0">
                <h3 className="font-medium">{equipment.name}</h3>
                <p className="text-sm text-gray-600">{equipment.inventory_number || equipment.serial_number || '\u00A0\u00A0\u00A0'}</p>
              </div>
            ))}
          </div>
        );
      }

      // Utiliser les dimensions calculées au niveau principal
      const { cardWidth, cardHeight, cols, rows, scaleFactor } = dimensions;

      return (
        <div 
          className="w-full min-w-0" 
          style={{ 
            display: options.gridSize === 'single' ? 'flex' : 'grid',
            gap: options.gridSize === 'single' ? '0' : '3mm',
            gridTemplateColumns: options.gridSize === 'single' ? 'none' : `repeat(${cols}, ${cardWidth}mm)`,
            gridTemplateRows: options.gridSize === 'single' ? 'none' : `repeat(${rows}, ${cardHeight}mm)`,
            justifyContent: 'center',
            alignItems: 'center',
            height: options.gridSize === 'single' ? 'auto' : 'auto',
            width: '100%',
            marginTop: 'auto',
            marginBottom: 'auto'
          }}
        >
          {pageEquipments.map((equipment) => (
            <div 
              key={equipment.id} 
              className="min-w-0 flex flex-col"
              style={{
                width: options.gridSize === 'single' ? `${cardWidth}mm` : `${cardWidth}mm`,
                height: options.gridSize === 'single' ? 'auto' : `${cardHeight}mm`,
                maxWidth: options.gridSize === 'single' ? `${cardWidth}mm` : 'none',
                maxHeight: options.gridSize === 'single' ? 'none' : 'none',
                overflow: 'hidden', // Cache le contenu qui dépasse
                margin: options.gridSize === 'single' ? 'auto' : '0' // Centrage automatique pour le mode single
              }}
            >
              <EquipmentCard 
                equipment={equipment}
                groups={groups}
                buildings={buildings}
                services={services}
                locations={locations}
                onClick={() => {}}
                printSize={options.gridSize as 'xlarge' | 'large' | 'medium' | 'small' | 'xsmall'}
                isPrintPreview={true}
                printOptions={options}
                scaleFactor={scaleFactor}
              />
            </div>
          ))}
        </div>
      );
    };

    const { w, h } = getPageDims();
    
    // Calculer les dimensions une seule fois pour toutes les pages
    const getCardDimensions = () => {
      const availableWidth = w - 10; // Largeur page moins padding minimal (5mm de chaque côté)
      // Ajuster la hauteur disponible selon les options d'en-tête et pied de page
      let availableHeight = h - 6; // Hauteur page moins padding minimal
      // Réserver un espace visuel en paysage pour permettre un centrage réel (haut/bas)
      if (options.orientation === 'landscape') {
        availableHeight -= 12; // 12mm de marge verticale dédiée au centrage
      }
      if (options.showHeaders) availableHeight -= 8; // Réserver de l'espace pour l'en-tête
      if (options.showFooters) availableHeight -= 8; // Réserver de l'espace pour le pied de page
      
      const gapSize = 3; // Espacement davantage réduit
      const CARD_RATIO = 2.16; // Ratio fixe hauteur/largeur
      
      // Calculer la disposition optimale pour maximiser le nombre de cartes
      const calculateOptimalLayout = () => {
        let bestLayout = { cols: 1, rows: 1, totalCards: 1, cardWidth: 0, cardHeight: 0 };
        
        // Tester différentes combinaisons de colonnes et lignes
        for (let cols = 1; cols <= 8; cols++) {
          for (let rows = 1; rows <= 6; rows++) {
            const totalCards = cols * rows;
            
            // Calculer les dimensions de carte pour cette disposition
            const maxCardWidth = (availableWidth - (cols - 1) * gapSize) / cols;
            const maxCardHeight = (availableHeight - (rows - 1) * gapSize) / rows;
            
            let cardWidth, cardHeight;
            
            // Respecter le ratio fixe
            if (maxCardWidth * CARD_RATIO <= maxCardHeight) {
              cardWidth = maxCardWidth;
              cardHeight = maxCardWidth * CARD_RATIO;
            } else {
              cardHeight = maxCardHeight;
              cardWidth = maxCardHeight / CARD_RATIO;
            }
            
            // Vérifier que les cartes rentrent dans l'espace disponible
            const totalWidth = cols * cardWidth + (cols - 1) * gapSize;
            const totalHeight = rows * cardHeight + (rows - 1) * gapSize;
            
            if (totalWidth <= availableWidth && totalHeight <= availableHeight) {
              // Si cette disposition permet plus de cartes, ou le même nombre mais avec des cartes plus grandes
              if (totalCards > bestLayout.totalCards || 
                  (totalCards === bestLayout.totalCards && cardWidth > bestLayout.cardWidth)) {
                bestLayout = { cols, rows, totalCards, cardWidth, cardHeight };
              }
            }
          }
        }
        
        return bestLayout;
      };
      
      // Appliquer des contraintes basées sur la taille demandée
      const applySizeConstraints = (optimalLayout: any) => {
        const sizeConstraints = {
          single: { maxCols: 1, maxRows: 1, minCardWidth: 80, useFullHeight: true },
          xlarge: { maxCols: 2, maxRows: 3, minCardWidth: 80, useFullHeight: false },
          large: { maxCols: 3, maxRows: 3, minCardWidth: 60, useFullHeight: false },
          medium: { maxCols: 4, maxRows: 4, minCardWidth: 45, useFullHeight: false },
          small: { maxCols: 5, maxRows: 4, minCardWidth: 35, useFullHeight: false },
          xsmall: { maxCols: 6, maxRows: 5, minCardWidth: 25, useFullHeight: false }
        };
        
        const constraint = sizeConstraints[options.gridSize] || sizeConstraints.medium;
        
        // Gestion spéciale pour le mode "single"
        if (options.gridSize === 'single') {
          // Pour une carte unique, utiliser une largeur réduite (85% de la largeur disponible)
          const cardWidth = availableWidth * 0.85;
          const cardHeight = cardWidth * CARD_RATIO;
          
          // Vérifier que la carte rentre dans la hauteur disponible
          if (cardHeight <= availableHeight) {
            return { cols: 1, rows: 1, totalCards: 1, cardWidth, cardHeight };
          } else {
            // Si la hauteur ne suffit pas, ajuster selon la hauteur disponible
            const adjustedCardHeight = availableHeight * 0.85;
            const adjustedCardWidth = adjustedCardHeight / CARD_RATIO;
            return { cols: 1, rows: 1, totalCards: 1, cardWidth: adjustedCardWidth, cardHeight: adjustedCardHeight };
          }
        }
        
        // Si la disposition optimale respecte les contraintes, l'utiliser
        if (optimalLayout.cols <= constraint.maxCols && 
            optimalLayout.rows <= constraint.maxRows && 
            optimalLayout.cardWidth >= constraint.minCardWidth) {
          return optimalLayout;
        }
        
        // Sinon, trouver la meilleure disposition respectant les contraintes
        let bestConstrainedLayout = { cols: 1, rows: 1, totalCards: 1, cardWidth: 0, cardHeight: 0 };
        
        for (let cols = 1; cols <= constraint.maxCols; cols++) {
          for (let rows = 1; rows <= constraint.maxRows; rows++) {
            const totalCards = cols * rows;
            
            const maxCardWidth = (availableWidth - (cols - 1) * gapSize) / cols;
            const maxCardHeight = (availableHeight - (rows - 1) * gapSize) / rows;
            
            let cardWidth, cardHeight;
            
            if (maxCardWidth * CARD_RATIO <= maxCardHeight) {
              cardWidth = maxCardWidth;
              cardHeight = maxCardWidth * CARD_RATIO;
            } else {
              cardHeight = maxCardHeight;
              cardWidth = maxCardHeight / CARD_RATIO;
            }
            
            if (cardWidth >= constraint.minCardWidth) {
              const totalWidth = cols * cardWidth + (cols - 1) * gapSize;
              const totalHeight = rows * cardHeight + (rows - 1) * gapSize;
              
              if (totalWidth <= availableWidth && totalHeight <= availableHeight) {
                if (totalCards > bestConstrainedLayout.totalCards || 
                    (totalCards === bestConstrainedLayout.totalCards && cardWidth > bestConstrainedLayout.cardWidth)) {
                  bestConstrainedLayout = { cols, rows, totalCards, cardWidth, cardHeight };
                }
              }
            }
          }
        }
        
        return bestConstrainedLayout;
      };
      
      const optimalLayout = calculateOptimalLayout();
      const finalLayout = applySizeConstraints(optimalLayout);
      
      // Facteur de mise à l'échelle basé sur la taille de référence (medium = 3 colonnes)
      const referenceWidth = (w - 10 - (3-1) * 3) / 3;
      const scaleFactor = finalLayout.cardWidth / referenceWidth;
      
      return { 
        width: finalLayout.cardWidth, 
        height: finalLayout.cardHeight, 
        cols: finalLayout.cols, 
        rows: finalLayout.rows, 
        scaleFactor,
        totalCards: finalLayout.totalCards
      };
    };
    
    const { width: cardWidth, height: cardHeight, cols, rows, scaleFactor, totalCards } = getCardDimensions();
    
    const isLandscape = options.orientation === 'landscape';

    // Calcule les hauteurs d'en-tête et de contenu en utilisant EXACTEMENT les mêmes hypothèses
    // que celles employées dans getCardDimensions (basé sur h - 6, header=8mm, footer=8mm, + marge paysage)
    const getLayoutHeightsMm = () => {
      const { h } = getPageDims();
      let availableHeight = h - 6; // même base que getCardDimensions
      if (options.orientation === 'landscape') {
        availableHeight -= 12; // réserve verticale utilisée lors du calcul des cartes
      }
      if (options.showHeaders) availableHeight -= 8;
      if (options.showFooters) availableHeight -= 8;
      const totalUsable = h - 6; // somme headerSpace + contentHeight doit égaler cette valeur
      const headerSpace = Math.max(0, totalUsable - availableHeight);
      return { headerSpace, contentHeight: availableHeight };
    };

    // En portrait, centrer le titre exactement entre le haut de page et le haut des cartes
    const getTopGapMm = () => {
      const { headerSpace, contentHeight } = getLayoutHeightsMm();
      // Gap entre les rangées de cartes, doit correspondre au calcul de getCardDimensions
      const gapSize = 3; // mm
      const gridHeight = rows > 0 ? rows * cardHeight + (rows - 1) * gapSize : 0;
      const verticalFreeSpace = Math.max(0, contentHeight - gridHeight);
      // Espace au-dessus de la grille = headerSpace + moitié de l'espace libre (car la grille est centrée verticalement)
      return headerSpace + verticalFreeSpace / 2;
    };

    return (
      <div ref={ref} className="print-preview bg-muted/30" style={{ padding: '16px' }}>
        {pages.map((pageEquipments, pageIndex) => (
          <div 
            key={pageIndex}
            className="print-page print-content bg-white"
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: `${w}mm`,
              height: `${h}mm`,
              margin: '0 auto 12px',
              padding: '5mm',
              boxSizing: 'border-box',
              overflow: 'hidden',
              fontSize: '12px',
              lineHeight: '1.4',
              boxShadow: '0 0 0 1px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.1)',
              pageBreakAfter: pageIndex < pages.length - 1 ? 'always' : 'auto'
            }}
          >
            {/* Espace supérieur qui centre le titre entre le haut de page et la grille */}
            <div style={{ height: `${isLandscape ? getLayoutHeightsMm().headerSpace : getTopGapMm()}mm`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {options.showHeaders && (() => {
                const isDenseLandscape = isLandscape && ((cols === 3 && rows === 3) || (cols === 4 && rows === 4));
                const sizeMap: Record<'small' | 'medium' | 'large', number> = { small: 16, medium: 20, large: 24 };
                const basePx = sizeMap[(options.titleFontSize || 'medium') as 'small' | 'medium' | 'large'];
                const boostedPx = isDenseLandscape ? basePx + 3 : basePx;
                const titleFontSize = `${boostedPx}px`;
                return (
                  <h1 className="text-lg font-bold text-gray-900" style={{ fontSize: titleFontSize, fontWeight: 'bold', margin: 0 }}>
                    {options.title || 'Liste des équipements'}
                  </h1>
                );
              })()}
            </div>
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 0, height: `${getLayoutHeightsMm().contentHeight}mm` }}>
              <div style={{ width: '100%' }}>
                {renderEquipmentGrid(pageEquipments, { cardWidth, cardHeight, cols, rows, scaleFactor })}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
);

EquipmentPrintPreview.displayName = 'EquipmentPrintPreview';

export default EquipmentPrintPreview;