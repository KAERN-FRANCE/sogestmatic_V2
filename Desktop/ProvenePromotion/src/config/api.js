// Configuration des clés API
// ⚠️ IMPORTANT : Remplacez par votre vraie clé API OpenAI
// Utilisez une variable d'environnement ou remplacez directement ici
export const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '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';

// Configuration de l'application
export const APP_CONFIG = {
  RECORDING_QUALITY: 'high',
  MAX_RECORDING_DURATION: 3600000, // 1 heure en millisecondes
  TRANSCRIPTION_LANGUAGE: 'fr',
  ANALYSIS_MODEL: 'GPT-4o mini Transcribe',
};
