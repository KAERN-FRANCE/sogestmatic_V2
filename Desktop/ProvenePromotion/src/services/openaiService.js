import { OPENAI_API_KEY } from '../config/api';
import * as FileSystem from 'expo-file-system';

export class OpenAIService {
  static async transcribeAudio(audioUri) {
    try {
      // Créer un FormData pour envoyer le fichier audio
      const formData = new FormData();
      formData.append('file', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      });
      formData.append('model', 'whisper-1');
      formData.append('language', 'fr'); // Français
      formData.append('response_format', 'json');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Erreur API OpenAI: ${response.status}`);
      }

      const result = await response.json();
      return result.text;
    } catch (error) {
      console.error('Erreur transcription:', error);
      throw error;
    }
  }

  static async analyzeConversation(transcription) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `Tu es un assistant IA spécialisé dans l'analyse de projets d'entreprise pour Invest in Provence. 
              Extrais UNIQUEMENT les informations suivantes de la transcription (SANS données personnelles) :
              - Nom de l'entreprise
              - Secteur d'activité
              - Nombre d'employés actuels
              - Emplois prévus
              - Localisation souhaitée
              - Engagements RSE
              - Site web de l'entreprise
              - Investissement prévu
              - Délai de mise en œuvre
              - Type de projet
              - Secteur géographique ciblé
              
              IMPORTANT : Ne collecte AUCUNE donnée personnelle (noms, emails, téléphones, contacts individuels).
              Réponds au format JSON structuré.`
            },
            {
              role: 'user',
              content: `Analyse cette conversation et extrais les informations :\n\n${transcription}`
            }
          ],
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur API OpenAI: ${response.status}`);
      }

      const result = await response.json();
      const content = result.choices[0].message.content;
      
      // Essayer de parser le JSON, sinon créer un objet par défaut
      try {
        return JSON.parse(content);
      } catch (parseError) {
        console.warn('Réponse non-JSON reçue, création d\'un objet par défaut:', content);
        return {
          nom_entreprise: "Non spécifié",
          secteur_activite: "Non spécifié", 
          employes_actuels: "Non spécifié",
          emplois_prevus: "Non spécifié",
          localisation_souhaitee: "Non spécifié",
          engagements_rse: "Non spécifié",
          site_web: "Non spécifié",
          investissement_prevu: "Non spécifié",
          delai_mise_en_oeuvre: "Non spécifié",
          type_projet: "Non spécifié",
          secteur_geographique: "Non spécifié",
          transcription_brute: content
        };
      }
    } catch (error) {
      console.error('Erreur analyse:', error);
      throw error;
    }
  }

  static async generateScore(extractedData) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `Tu es un expert en évaluation de projets d'implantation pour la région Provence-Alpes-Côte d'Azur.
              Évalue ce projet sur 3 critères (0-100) :
              1. Économique : Potentiel de création d'emplois, investissement, secteur d'activité
              2. RSE : Engagements environnementaux et sociaux
              3. Territorial : Adéquation avec les objectifs de développement territorial
              
              Calcule un score global et génère un résumé d'évaluation.
              Réponds au format JSON avec : score_economique, score_rse, score_territorial, score_global, resume`
            },
            {
              role: 'user',
              content: `Évalue ce projet :\n\n${JSON.stringify(extractedData, null, 2)}`
            }
          ],
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur API OpenAI: ${response.status}`);
      }

      const result = await response.json();
      const content = result.choices[0].message.content;
      
      // Essayer de parser le JSON, sinon créer un objet par défaut
      try {
        return JSON.parse(content);
      } catch (parseError) {
        console.warn('Réponse non-JSON reçue pour le scoring, création d\'un objet par défaut:', content);
        return {
          score_economique: 50,
          score_rse: 50,
          score_territorial: 50,
          score_global: 50,
          resume: content || "Évaluation non disponible"
        };
      }
    } catch (error) {
      console.error('Erreur scoring:', error);
      throw error;
    }
  }

  // Fonction pour exporter les données en JSON local
  static async exportToJSON(data, filename = null) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const defaultFilename = `provene-export-${timestamp}.json`;
      const finalFilename = filename || defaultFilename;
      
      // Créer le dossier d'export s'il n'existe pas
      const exportDir = `${FileSystem.documentDirectory}exports/`;
      const dirInfo = await FileSystem.getInfoAsync(exportDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(exportDir, { intermediates: true });
      }
      
      // Préparer les données avec métadonnées
      const exportData = {
        metadata: {
          export_date: new Date().toISOString(),
          app_version: "1.0.0",
          export_type: "conversation_analysis"
        },
        data: data
      };
      
      // Écrire le fichier JSON
      const fileUri = `${exportDir}${finalFilename}`;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(exportData, null, 2));
      
      console.log(`Export JSON réussi: ${fileUri}`);
      return {
        success: true,
        fileUri: fileUri,
        filename: finalFilename
      };
    } catch (error) {
      console.error('Erreur export JSON:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Fonction pour lister les exports disponibles
  static async listExports() {
    try {
      const exportDir = `${FileSystem.documentDirectory}exports/`;
      const dirInfo = await FileSystem.getInfoAsync(exportDir);
      
      if (!dirInfo.exists) {
        return [];
      }
      
      const files = await FileSystem.readDirectoryAsync(exportDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      return jsonFiles.map(file => ({
        filename: file,
        uri: `${exportDir}${file}`
      }));
    } catch (error) {
      console.error('Erreur listage exports:', error);
      return [];
    }
  }

  // Fonction pour lire un export JSON
  static async readExport(fileUri) {
    try {
      const content = await FileSystem.readAsStringAsync(fileUri);
      return JSON.parse(content);
    } catch (error) {
      console.error('Erreur lecture export:', error);
      throw error;
    }
  }
}
