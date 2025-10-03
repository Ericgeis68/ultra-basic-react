export interface PrintOptions {
  title?: string;
  orientation?: 'portrait' | 'landscape';
  includeImages?: boolean;
  includeDetails?: boolean;
  includeHealth?: boolean;
  includeGroups?: boolean;
  includeLocation?: boolean;
  format?: 'list' | 'grid' | 'cards';
  pageSize?: 'a4' | 'letter';
  fontSize?: 'small' | 'medium' | 'large';
  showHeaders?: boolean;
  showFooters?: boolean;
  customStyles?: string;
}

export class SmartPrintService {
  static isMobile(): boolean {
    return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  static isDesktop(): boolean {
    return !this.isMobile();
  }

  // Impression desktop optimisée
  static printDesktop(element: HTMLElement, options: PrintOptions = {}) {
    const printContent = element.innerHTML;
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      throw new Error('Impossible d\'ouvrir la fenêtre d\'impression');
    }

    const styles = this.generatePrintStyles(options);
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${options.title || 'Liste des équipements'}</title>
          <style>${styles}</style>
        </head>
        <body>
          ${options.showHeaders ? this.generateHeader(options) : ''}
          <div class="print-content">
            ${printContent}
          </div>
          ${options.showFooters ? this.generateFooter() : ''}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    };
  }

  // Génération PDF basique pour mobile
  static async generateBasicPDF(element: HTMLElement, options: PrintOptions = {}) {
    try {
      // Utiliser l'API Canvas native du navigateur
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Canvas non supporté');
      }

      // Fallback vers impression normale
      this.printDesktop(element, options);
      
    } catch (error) {
      console.warn('PDF generation failed, falling back to print:', error);
      this.printDesktop(element, options);
    }
  }

  // Méthode principale intelligente
  static async smartPrint(element: HTMLElement, options: PrintOptions = {}) {
    if (this.isDesktop()) {
      this.printDesktop(element, options);
    } else {
      await this.generateBasicPDF(element, options);
    }
  }

  private static generatePrintStyles(options: PrintOptions): string {
    const fontSize = options.fontSize === 'small' ? '9pt' : 
                    options.fontSize === 'large' ? '13pt' : '11pt';
    const titleSize = options.fontSize === 'small' ? '14pt' : 
                     options.fontSize === 'large' ? '18pt' : '16pt';
    
    return `
      @media print {
        * { 
          -webkit-print-color-adjust: exact !important; 
          color-adjust: exact !important;
          box-sizing: border-box !important;
        }
        
        body { 
          margin: 0; 
          padding: 15px; 
          font-family: 'Arial', 'Helvetica', sans-serif; 
          font-size: ${fontSize};
          line-height: 1.3;
          color: #000 !important;
          background: #fff !important;
        }
        
        /* Cacher tous les éléments d'interface */
        .no-print, 
        button, 
        .btn,
        nav,
        .navbar,
        .sidebar,
        .filter,
        .search,
        .pagination,
        .dropdown,
        .modal,
        .dialog,
        .toast,
        input:not([type="hidden"]),
        select,
        textarea,
        .scroll-area,
        [role="dialog"],
        [data-radix-dialog-overlay],
        [data-radix-dialog-content] { 
          display: none !important; 
        }
        
        /* Container principal */
        .print-content {
          width: 100% !important;
          max-width: none !important;
          margin: 0 !important;
          padding: 0 !important;
          display: block !important;
        }
        
        /* En-tête et pied de page - éviter les coupures */
        .print-header, .print-footer {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        .print-header {
          margin-bottom: 20px !important;
          border-bottom: 2px solid #333 !important;
          padding-bottom: 15px !important;
        }
        
        .print-footer {
          margin-top: 20px !important;
          border-top: 1px solid #666 !important;
          padding-top: 10px !important;
        }
        
        /* === STYLES POUR FORMAT LISTE === */
        .equipment-list {
          width: 100% !important;
          margin: 0 !important;
        }
        
        .print-table {
          width: 100% !important;
          border-collapse: collapse !important;
          margin: 0 !important;
          font-size: ${fontSize} !important;
        }
        
        .print-table-header th {
          background: #f0f0f0 !important;
          border: 1px solid #333 !important;
          padding: 6px !important;
          text-align: left !important;
          font-weight: bold !important;
          font-size: ${fontSize} !important;
          color: #000 !important;
          page-break-inside: avoid !important;
        }
        
        .print-table-row {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        .print-table-row td {
          border: 1px solid #666 !important;
          padding: 4px 6px !important;
          text-align: left !important;
          font-size: ${fontSize} !important;
          color: #000 !important;
          vertical-align: top !important;
        }
        
        /* === STYLES POUR FORMAT GRILLE/CARTES === */
        .print-grid {
          display: grid !important;
          grid-template-columns: ${options.orientation === 'landscape' ? 
            'repeat(4, 1fr)' : 'repeat(3, 1fr)'} !important;
          gap: 12px !important;
          width: 100% !important;
        }
        
        .print-card {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
          border: 1px solid #333 !important;
          padding: 8px !important;
          background: #fff !important;
          box-shadow: none !important;
          margin: 0 !important;
          min-height: auto !important;
          max-height: none !important;
        }
        
        .print-title {
          font-size: ${titleSize} !important;
          font-weight: bold !important;
          margin-bottom: 8px !important;
          color: #000 !important;
          text-align: center !important;
          page-break-after: avoid !important;
        }
        
        .print-details {
          font-size: ${fontSize} !important;
          margin-bottom: 6px !important;
          line-height: 1.2 !important;
        }
        
        .print-details p {
          margin: 2px 0 !important;
          color: #000 !important;
        }
        
        .print-status, .print-location, .print-groups {
          font-size: ${fontSize} !important;
          margin-bottom: 4px !important;
          color: #000 !important;
        }
        
        /* Images dans les cartes */
        .print-image {
          max-width: 100% !important;
          max-height: 80px !important;
          height: auto !important;
          object-fit: contain !important;
          border: 1px solid #ccc !important;
          margin: 0 auto 8px auto !important;
          display: block !important;
        }
        
        /* Badges et statuts */
        .badge, .status-badge, 
        .inline-block {
          display: inline-block !important;
          padding: 2px 4px !important;
          border: 1px solid #333 !important;
          border-radius: 2px !important;
          font-size: ${options.fontSize === 'small' ? '8pt' : options.fontSize === 'large' ? '10pt' : '9pt'} !important;
          background: #f5f5f5 !important;
          color: #000 !important;
          margin: 1px !important;
        }
        
        /* Titres généraux */
        h1, h2, h3 {
          color: #000 !important;
          margin: 10px 0 8px 0 !important;
          page-break-after: avoid !important;
          font-weight: bold !important;
        }
        
        h1 { 
          font-size: ${options.fontSize === 'small' ? '16pt' : options.fontSize === 'large' ? '20pt' : '18pt'} !important; 
        }
        h2 { 
          font-size: ${titleSize} !important; 
        }
        h3 { 
          font-size: ${titleSize} !important; 
        }
        
        /* Éviter les coupures de page */
        .page-break-inside-avoid,
        .print-prevent-break,
        .equipment-card,
        .equipment-item,
        .print-card {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        /* Masquer les éléments de scroll */
        ::-webkit-scrollbar {
          display: none !important;
        }
        
        /* Forcer l'affichage des éléments cachés nécessaires à l'impression */
        .print-content,
        .print-content * {
          visibility: visible !important;
          display: block !important;
        }
        
        .print-grid,
        .equipment-list,
        .print-table {
          display: grid !important;
        }
        
        .print-grid {
          display: grid !important;
        }
        
        .equipment-list {
          display: block !important;
        }
        
        .print-table {
          display: table !important;
        }
        
        .print-table-row {
          display: table-row !important;
        }
        
        .print-table-header th {
          display: table-cell !important;
        }
        
        .print-table-row td {
          display: table-cell !important;
        }
        
        /* Styles spécifiques pour l'orientation */
        ${options.orientation === 'landscape' ? `
          @page { 
            size: A4 landscape; 
            margin: 1.5cm;
          }
          .print-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
        ` : `
          @page { 
            size: A4 portrait; 
            margin: 2cm;
          }
          .print-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        `}
        
        /* Styles personnalisés utilisateur */
        ${options.customStyles || ''}
      }
    `;
  }

  private static generateHeader(options: PrintOptions): string {
    return `
      <div class="print-header" style="border-bottom: 2px solid #ddd; margin-bottom: 20px; padding-bottom: 10px;">
        <h1>${options.title || 'Liste des équipements'}</h1>
        <p>Généré le ${(() => { const d = new Date(); const dd = String(d.getDate()).padStart(2,'0'); const mm = String(d.getMonth()+1).padStart(2,'0'); const yyyy = d.getFullYear(); return `${dd}/${mm}/${yyyy}`; })()} à ${new Date().toLocaleTimeString('fr-FR')}</p>
      </div>
    `;
  }

  private static generateFooter(): string {
    return `
      <div class="print-footer" style="border-top: 1px solid #ddd; margin-top: 20px; padding-top: 10px; text-align: center; font-size: 10pt; color: #666;">
        <p>Document généré automatiquement - GMAO Application</p>
      </div>
    `;
  }
}
