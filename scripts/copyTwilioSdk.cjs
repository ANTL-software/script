/**
 * Script postinstall pour copier twilio.min.js depuis node_modules vers public/
 * Ce script est exécuté automatiquement après npm install
 */

const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '../node_modules/@twilio/voice-sdk/dist/twilio.min.js');
const dest = path.join(__dirname, '../public/twilio.min.js');

try {
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log('✅ twilio.min.js copié depuis node_modules vers public/');
  } else {
    console.warn('⚠️  Fichier source non trouvé:', src);
    console.warn('Assurez-vous que @twilio/voice-sdk est installé (npm install)');
  }
} catch (err) {
  console.error('❌ Erreur lors de la copie de twilio.min.js:', err.message);
  process.exit(1);
}
