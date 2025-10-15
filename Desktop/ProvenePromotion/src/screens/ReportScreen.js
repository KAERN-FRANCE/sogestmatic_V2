import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Share,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';

const ReportScreen = ({ navigation, route }) => {
  const [language, setLanguage] = useState('FR');
  
  // Récupérer les données de l'entretien
  const transcription = route?.params?.transcription || '';
  const extractedData = route?.params?.extractedData || {};
  const scores = route?.params?.scores || {};
  const sentiment = route?.params?.sentiment || 'positive';
  const notes = route?.params?.notes || '';
  
  // Données de l'entretien
  const interviewData = {
    date: new Date().toLocaleDateString('fr-FR'),
    duration: '45 minutes', // À calculer depuis l'enregistrement
    agent: 'Marie Dubois',
    company: extractedData.entreprise || 'TechCorp France',
    sector: extractedData.secteur || 'Intelligence Artificielle',
  };

  const getSentimentEmoji = (sentiment) => {
    switch (sentiment) {
      case 'positive': return '😀';
      case 'neutral': return '😐';
      case 'negative': return '🤔';
      default: return '😐';
    }
  };

  const getSentimentLabel = (sentiment) => {
    switch (sentiment) {
      case 'positive': return 'Positif';
      case 'neutral': return 'Neutre';
      case 'negative': return 'Réservé';
      default: return 'Non défini';
    }
  };

  const generateReportText = () => {
    return `
RAPPORT D'ENTRETIEN - ${interviewData.company}
Date: ${interviewData.date}
Agent: ${interviewData.agent}
Durée: ${interviewData.duration}

=== INFORMATIONS ENTREPRISE ===
Nom: ${extractedData.entreprise || 'Non spécifié'}
Secteur: ${extractedData.secteur || 'Non spécifié'}
Employés actuels: ${extractedData.employes_actuels || 'Non spécifié'}
Emplois prévus: ${extractedData.emplois_prevus || 'Non spécifié'}
Localisation souhaitée: ${extractedData.localisation || 'Non spécifié'}

=== CONTACT ===
Personne de contact: ${extractedData.contact_personne || 'Non spécifié'}
Email: ${extractedData.email || 'Non spécifié'}
Téléphone: ${extractedData.telephone || 'Non spécifié'}
Site web: ${extractedData.site_web || 'Non spécifié'}

=== PROJET ===
Investissement: ${extractedData.investissement || 'Non spécifié'}
Délai: ${extractedData.delai || 'Non spécifié'}
Engagements RSE: ${extractedData.rse || 'Non spécifié'}

=== ÉVALUATION ===
Score global: ${scores.score_global || 0}/100
- Économique: ${scores.score_economique || 0}/100
- RSE: ${scores.score_rse || 0}/100
- Territorial: ${scores.score_territorial || 0}/100

Sentiment: ${getSentimentLabel(sentiment)} ${getSentimentEmoji(sentiment)}

=== TRANSCRIPTION ===
${transcription}

=== NOTES COMPLÉMENTAIRES ===
${notes}

---
Rapport généré automatiquement par Provence AI Assistant
    `.trim();
  };

  const handleShare = async () => {
    try {
      const reportText = generateReportText();
      await Share.share({
        message: reportText,
        title: `Rapport d'entretien - ${interviewData.company}`,
      });
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de partager le rapport.');
    }
  };

  const InfoSection = ({ title, children, icon }) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={20} color={colors.primary} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );

  const InfoRow = ({ label, value, color = colors.text }) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, { color }]}>{value}</Text>
    </View>
  );

  const ScoreCard = ({ title, score, color }) => (
    <View style={styles.scoreCard}>
      <Text style={styles.scoreTitle}>{title}</Text>
      <View style={styles.scoreContainer}>
        <Text style={[styles.scoreValue, { color }]}>{score}</Text>
        <Text style={styles.scoreUnit}>/100</Text>
      </View>
    </View>
  );

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
        <Text style={styles.headerTitle}>Rapport d'Entretien</Text>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
        >
          <Ionicons name="share" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* En-tête du rapport */}
        <View style={styles.reportHeader}>
          <Text style={styles.companyName}>{interviewData.company}</Text>
          <Text style={styles.reportDate}>{interviewData.date}</Text>
          <View style={styles.reportMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="person" size={16} color={colors.textSecondary} />
              <Text style={styles.metaText}>{interviewData.agent}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time" size={16} color={colors.textSecondary} />
              <Text style={styles.metaText}>{interviewData.duration}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="briefcase" size={16} color={colors.textSecondary} />
              <Text style={styles.metaText}>{interviewData.sector}</Text>
            </View>
          </View>
        </View>

        {/* Informations entreprise */}
        <InfoSection title="Informations Entreprise" icon="business">
          <InfoRow label="Nom de l'entreprise" value={extractedData.entreprise || 'Non spécifié'} />
          <InfoRow label="Secteur d'activité" value={extractedData.secteur || 'Non spécifié'} />
          <InfoRow label="Employés actuels" value={extractedData.employes_actuels || 'Non spécifié'} />
          <InfoRow label="Emplois prévus" value={extractedData.emplois_prevus || 'Non spécifié'} />
          <InfoRow label="Localisation souhaitée" value={extractedData.localisation || 'Non spécifié'} />
        </InfoSection>

        {/* Contact */}
        <InfoSection title="Contact" icon="person">
          <InfoRow label="Personne de contact" value={extractedData.contact_personne || 'Non spécifié'} />
          <InfoRow label="Email" value={extractedData.email || 'Non spécifié'} />
          <InfoRow label="Téléphone" value={extractedData.telephone || 'Non spécifié'} />
          <InfoRow label="Site web" value={extractedData.site_web || 'Non spécifié'} />
        </InfoSection>

        {/* Projet */}
        <InfoSection title="Projet" icon="rocket">
          <InfoRow label="Investissement prévu" value={extractedData.investissement || 'Non spécifié'} />
          <InfoRow label="Délai de mise en œuvre" value={extractedData.delai || 'Non spécifié'} />
          <InfoRow label="Engagements RSE" value={extractedData.rse || 'Non spécifié'} />
        </InfoSection>

        {/* Évaluation */}
        <InfoSection title="Évaluation" icon="analytics">
          <View style={styles.scoresContainer}>
            <ScoreCard 
              title="Économique" 
              score={scores.score_economique || 0} 
              color={colors.success} 
            />
            <ScoreCard 
              title="RSE" 
              score={scores.score_rse || 0} 
              color={colors.info} 
            />
            <ScoreCard 
              title="Territorial" 
              score={scores.score_territorial || 0} 
              color={colors.warning} 
            />
          </View>
          
          <View style={styles.overallScoreContainer}>
            <Text style={styles.overallScoreLabel}>Score Global</Text>
            <Text style={[styles.overallScoreValue, { color: colors.primary }]}>
              {scores.score_global || 0}/100
            </Text>
          </View>

          <View style={styles.sentimentContainer}>
            <Text style={styles.sentimentLabel}>Sentiment de l'entretien</Text>
            <View style={styles.sentimentValue}>
              <Text style={styles.sentimentEmoji}>{getSentimentEmoji(sentiment)}</Text>
              <Text style={styles.sentimentText}>{getSentimentLabel(sentiment)}</Text>
            </View>
          </View>
        </InfoSection>

        {/* Transcription */}
        <InfoSection title="Transcription" icon="document-text">
          <View style={styles.transcriptionContainer}>
            <Text style={styles.transcriptionText}>{transcription}</Text>
          </View>
        </InfoSection>

        {/* Notes complémentaires */}
        {notes && (
          <InfoSection title="Notes Complémentaires" icon="create">
            <View style={styles.notesContainer}>
              <Text style={styles.notesText}>{notes}</Text>
            </View>
          </InfoSection>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleShare}
          >
            <Ionicons name="share" size={20} color={colors.white} />
            <Text style={styles.actionButtonText}>Partager le rapport</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => navigation.navigate('Home')}
          >
            <Ionicons name="home" size={20} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.primary }]}>
              Retour à l'accueil
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  shareButton: {
    padding: spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  reportHeader: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  companyName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  reportDate: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  reportMeta: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  section: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    flex: 1,
    textAlign: 'right',
  },
  scoresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  scoreCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.xs,
  },
  scoreTitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  scoreUnit: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  overallScoreContainer: {
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  overallScoreLabel: {
    fontSize: typography.fontSize.base,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  overallScoreValue: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  sentimentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
  },
  sentimentLabel: {
    fontSize: typography.fontSize.base,
    color: colors.text,
  },
  sentimentValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sentimentEmoji: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  sentimentText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  transcriptionContainer: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  transcriptionText: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.sm,
    color: colors.text,
  },
  notesContainer: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  notesText: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.sm,
    color: colors.text,
  },
  actionsContainer: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    marginBottom: spacing.sm,
    ...shadows.md,
  },
  secondaryButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    marginLeft: spacing.sm,
  },
});

export default ReportScreen;
