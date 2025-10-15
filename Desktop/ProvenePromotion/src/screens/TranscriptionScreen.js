import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { OpenAIService } from '../services/openaiService';

const TranscriptionScreen = ({ navigation, route }) => {
  const [language, setLanguage] = useState('FR');
  
  // Récupérer les données de la navigation
  const transcription = route?.params?.transcription || 
    "Bonjour, je suis Marie Dubois de l'agence de développement économique de la région Provence-Alpes-Côte d'Azur. Nous sommes ravis de vous rencontrer aujourd'hui pour discuter de votre projet d'implantation dans notre région.\n\nNotre entreprise TechCorp France développe des solutions innovantes dans le domaine de l'intelligence artificielle. Nous employons actuellement 150 personnes et nous cherchons à nous développer dans le sud de la France.\n\nNous sommes particulièrement intéressés par les secteurs de l'innovation technologique et nous avons des projets concrets en matière de responsabilité sociale d'entreprise. Nous envisageons de créer 50 nouveaux emplois dans les deux prochaines années.\n\nNotre localisation idéale serait dans la zone d'activité de Sophia Antipolis, près de Nice, pour bénéficier de l'écosystème technologique local.";

  const extractedData = route?.params?.extractedData || {
    nom_entreprise: 'Non spécifié',
    secteur_activite: 'Non spécifié',
    employes_actuels: 'Non spécifié',
    emplois_prevus: 'Non spécifié',
    localisation_souhaitee: 'Non spécifié',
    engagements_rse: 'Non spécifié',
    site_web: 'Non spécifié',
    investissement_prevu: 'Non spécifié',
    delai_mise_en_oeuvre: 'Non spécifié',
    type_projet: 'Non spécifié',
    secteur_geographique: 'Non spécifié'
  };

  const highlightText = (text, keywords) => {
    let highlightedText = text;
    keywords.forEach(keyword => {
      const regex = new RegExp(`(${keyword})`, 'gi');
      highlightedText = highlightedText.replace(regex, '**$1**');
    });
    return highlightedText;
  };

  const renderHighlightedText = (text) => {
    const parts = text.split(/(\*\*.*?\*\*)/);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const content = part.slice(2, -2);
        return (
          <Text key={index} style={styles.highlightedText}>
            {content}
          </Text>
        );
      }
      return <Text key={index}>{part}</Text>;
    });
  };

  const handleExportJSON = async () => {
    try {
      const exportData = {
        transcription: transcription,
        extractedData: extractedData,
        timestamp: new Date().toISOString(),
        language: language
      };

      const result = await OpenAIService.exportToJSON(exportData);
      
      if (result.success) {
        Alert.alert(
          'Export réussi',
          `Les données ont été exportées vers : ${result.filename}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Erreur d\'export',
          `Impossible d'exporter les données : ${result.error}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Erreur export:', error);
      Alert.alert(
        'Erreur',
        'Une erreur est survenue lors de l\'export',
        [{ text: 'OK' }]
      );
    }
  };

  const highlightedTranscription = highlightText(transcription, [
    'TechCorp France',
    'intelligence artificielle',
    '150 personnes',
    '50 nouveaux emplois',
    'responsabilité sociale',
    'Sophia Antipolis',
    'Nice',
  ]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transcription</Text>
        <TouchableOpacity
          style={styles.languageToggle}
          onPress={() => setLanguage(language === 'FR' ? 'EN' : 'FR')}
        >
          <Text style={styles.languageText}>{language}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Extracted Data Cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.dataCardsContainer}
        >
          <View style={[styles.dataCard, { backgroundColor: colors.primary }]}>
            <Ionicons name="business" size={20} color={colors.white} />
            <Text style={styles.dataCardTitle}>Entreprise</Text>
            <Text style={styles.dataCardValue}>{extractedData.nom_entreprise}</Text>
          </View>
          
          <View style={[styles.dataCard, { backgroundColor: colors.success }]}>
            <Ionicons name="briefcase" size={20} color={colors.white} />
            <Text style={styles.dataCardTitle}>Secteur</Text>
            <Text style={styles.dataCardValue}>{extractedData.secteur_activite}</Text>
          </View>
          
          <View style={[styles.dataCard, { backgroundColor: colors.warning }]}>
            <Ionicons name="people" size={20} color={colors.white} />
            <Text style={styles.dataCardTitle}>Emplois</Text>
            <Text style={styles.dataCardValue}>{extractedData.employes_actuels}</Text>
          </View>
          
          <View style={[styles.dataCard, { backgroundColor: colors.info }]}>
            <Ionicons name="leaf" size={20} color={colors.white} />
            <Text style={styles.dataCardTitle}>RSE</Text>
            <Text style={styles.dataCardValue}>{extractedData.engagements_rse}</Text>
          </View>
          
          <View style={[styles.dataCard, { backgroundColor: colors.accent }]}>
            <Ionicons name="location" size={20} color={colors.white} />
            <Text style={styles.dataCardTitle}>Localisation</Text>
            <Text style={styles.dataCardValue}>{extractedData.localisation_souhaitee}</Text>
          </View>
        </ScrollView>

        {/* Transcription Text */}
        <View style={styles.transcriptionContainer}>
          <View style={styles.transcriptionHeader}>
            <Text style={styles.transcriptionTitle}>Transcription de l'entretien</Text>
            <TouchableOpacity style={styles.editButton}>
              <Ionicons name="create-outline" size={16} color={colors.primary} />
              <Text style={styles.editButtonText}>Modifier</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.transcriptionTextContainer}>
            <Text style={styles.transcriptionText}>
              {renderHighlightedText(highlightedTranscription)}
            </Text>
          </ScrollView>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.exportButton]}
            onPress={handleExportJSON}
          >
            <Ionicons name="download-outline" size={20} color={colors.white} />
            <Text style={styles.actionButtonText}>Exporter JSON</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.analyzeButton]}
            onPress={() => navigation.navigate('Review', { 
              transcription,
              extractedData 
            })}
          >
            <Ionicons name="analytics" size={20} color={colors.white} />
            <Text style={styles.actionButtonText}>Analyser</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
  },
  languageToggle: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  languageText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  dataCardsContainer: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  dataCard: {
    width: 120,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginRight: spacing.sm,
    alignItems: 'center',
    ...shadows.sm,
  },
  dataCardTitle: {
    color: colors.white,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  dataCardValue: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    marginTop: spacing.xs,
    textAlign: 'center',
    lineHeight: typography.lineHeight.tight * typography.fontSize.sm,
  },
  transcriptionContainer: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  transcriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  transcriptionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
  },
  editButtonText: {
    color: colors.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginLeft: spacing.xs,
  },
  transcriptionTextContainer: {
    flex: 1,
  },
  transcriptionText: {
    fontSize: typography.fontSize.base,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.base,
    color: colors.text,
  },
  highlightedText: {
    backgroundColor: colors.accent,
    color: colors.primary,
    fontWeight: typography.fontWeight.semiBold,
    paddingHorizontal: 2,
    borderRadius: 2,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  exportButton: {
    backgroundColor: colors.success,
  },
  analyzeButton: {
    backgroundColor: colors.primary,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    marginLeft: spacing.sm,
  },
});

export default TranscriptionScreen;