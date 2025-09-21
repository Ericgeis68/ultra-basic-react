import { Client, Databases } from 'node-appwrite';

// Initialiser le client Appwrite
const client = new Client();

client
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('gmao')
  .setKey('standard_7d2c4823f7ef3cd9a0e03f0225ecf63500074be972243d2c6662cf8372eb9c9798fb302725c5cfa6559f0148ddae473d7512da2bdd6a89526679590ecfca0ea1338cc117045fc414a00c6da0c07da90019fecdbd6e79e1175bfbaae0b0a4653f254a9e7f7d57a21c2aa60dd3c359b9f85e41ae3a17de9e8e61e3634eb3570276');

const databases = new Databases(client);

// ID de la base de données et de la collection
const DATABASE_ID = 'equipment_management';
const COLLECTION_ID = 'equipments';

// Définition des attributs à créer
const attributes = [
  { key: 'name', type: 'string', size: 255, required: true },
  { key: 'model', type: 'string', size: 255, required: false },
  { key: 'serialNumber', type: 'string', size: 100, required: false },
  { key: 'description', type: 'string', size: 1000, required: false },
  // Utilisation de equipmentStatus au lieu de status pour éviter les conflits
  { key: 'equipmentStatus', type: 'string', size: 50, required: true, defaultValue: 'operational' },
  { key: 'groupId', type: 'string', size: 100, required: false },
  { key: 'purchaseDate', type: 'string', size: 50, required: false },
  { key: 'lastMaintenanceDate', type: 'string', size: 50, required: false },
  { key: 'nextMaintenanceDate', type: 'string', size: 50, required: false },
  // Nouveaux attributs
  { key: 'manufacturer', type: 'string', size: 255, required: false },
  { key: 'department', type: 'string', size: 255, required: false },
  { key: 'location', type: 'string', size: 255, required: false },
  { key: 'installDate', type: 'string', size: 50, required: false },
  { key: 'equipmentHealth', type: 'string', size: 10, required: false, defaultValue: '100' },
  { key: 'equipmentImage', type: 'string', size: 1000, required: false },
  { key: 'lastMaintenance', type: 'string', size: 50, required: false },
  { key: 'nextMaintenance', type: 'string', size: 50, required: false },
  { key: 'relationships', type: 'string', size: 10000, required: false, array: true },
  { key: 'equipmentGroupIds', type: 'string', size: 100, required: false, array: true },
  { key: 'partsReferenceId', type: 'string', size: 100, required: false },
  { key: 'docsReferenceId', type: 'string', size: 100, required: false }
];

// Fonction pour créer les attributs
async function createAttributes() {
  try {
    console.log('Création des attributs...');
    
    for (const attr of attributes) {
      try {
        if (attr.type === 'string') {
          await databases.createStringAttribute(
            DATABASE_ID,
            COLLECTION_ID,
            attr.key,
            attr.size,
            attr.required,
            attr.defaultValue || null,
            attr.array || false
          );
          console.log(`✅ Attribut "${attr.key}" créé avec succès`);
        }
        // Ajoutez d'autres types si nécessaire (integer, boolean, etc.)
      } catch (error) {
        if (error.code === 409) {
          console.log(`⚠️ L'attribut "${attr.key}" existe déjà`);
        } else {
          console.error(`❌ Erreur lors de la création de l'attribut "${attr.key}":`, error);
        }
      }
    }
    
    console.log('Terminé!');
  } catch (error) {
    console.error('Erreur générale:', error);
  }
}

// Exécuter la fonction
createAttributes();
