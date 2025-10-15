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
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';

const ReviewScreen = ({ navigation, route }) => {
  const [language, setLanguage] = useState('FR');
  
  // Récupérer les données extraites ou utiliser les valeurs par défaut
  const extractedData = route?.params?.extractedData || {};
  
  const [formData, setFormData] = useState({
    companyName: extractedData.entreprise || 'TechCorp France',
    sector: extractedData.secteur || 'Intelligence Artificielle',
    currentEmployees: extractedData.employes_actuels || '150',
    plannedEmployees: extractedData.emplois_prevus || '50',
    rse: extractedData.rse || 'Projets concrets en RSE',
    location: extractedData.localisation || 'Sophia Antipolis, Nice',
    contactPerson: extractedData.contact_personne || 'Jean Dupont',
    email: extractedData.email || 'j.dupont@techcorp.fr',
    phone: extractedData.telephone || '+33 4 93 12 34 56',
    website: extractedData.site_web || 'www.techcorp.fr',
    investment: extractedData.investissement || '2.5M€',
    timeline: extractedData.delai || '6 mois',
  });
  const [sentiment, setSentiment] = useState('positive'); // positive, neutral, negative
  const [notes, setNotes] = useState('');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const getSentimentEmoji = (sentiment) => {
    switch (sentiment) {
      case 'positive':
        return '😀';
      case 'neutral':
        return '😐';
      case 'negative':
        return '🤔';
      default:
        return '😐';
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive':
        return colors.success;
      case 'neutral':
        return colors.warning;
      case 'negative':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const FormField = ({ label, value, onChange, placeholder, multiline = false }) => (
    <View style={styles.formField}>
      <Text style={styles.formLabel}>{label}</Text>
      <TextInput
        style={[styles.formInput, multiline && styles.formInputMultiline]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
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
        <Text style={styles.headerTitle}>Révision & Édition</Text>
        <TouchableOpacity
          style={styles.languageToggle}
          onPress={() => setLanguage(language === 'FR' ? 'EN' : 'FR')}
        >
          <Text style={styles.languageText}>{language}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Sentiment Selection */}
        <View style={styles.sentimentContainer}>
          <Text style={styles.sectionTitle}>Sentiment de l'entretien</Text>
          <View style={styles.sentimentOptions}>
            {[
              { key: 'positive', emoji: '😀', label: 'Positif' },
              { key: 'neutral', emoji: '😐', label: 'Neutre' },
              { key: 'negative', emoji: '🤔', label: 'Réservé' },
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.sentimentOption,
                  sentiment === option.key && styles.sentimentOptionSelected,
                  { borderColor: getSentimentColor(option.key) },
                ]}
                onPress={() => setSentiment(option.key)}
              >
                <Text style={styles.sentimentEmoji}>{option.emoji}</Text>
                <Text style={styles.sentimentLabel}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Company Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations Entreprise</Text>
          <FormField
            label="Nom de l'entreprise"
            value={formData.companyName}
            onChange={(value) => handleInputChange('companyName', value)}
            placeholder="Nom de l'entreprise"
          />
          <FormField
            label="Secteur d'activité"
            value={formData.sector}
            onChange={(value) => handleInputChange('sector', value)}
            placeholder="Secteur d'activité"
          />
          <FormField
            label="Localisation souhaitée"
            value={formData.location}
            onChange={(value) => handleInputChange('location', value)}
            placeholder="Localisation souhaitée"
          />
        </View>

        {/* Employment Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emplois</Text>
          <View style={styles.rowContainer}>
            <View style={styles.halfField}>
              <FormField
                label="Employés actuels"
                value={formData.currentEmployees}
                onChange={(value) => handleInputChange('currentEmployees', value)}
                placeholder="Nombre"
              />
            </View>
            <View style={styles.halfField}>
              <FormField
                label="Emplois prévus"
                value={formData.plannedEmployees}
                onChange={(value) => handleInputChange('plannedEmployees', value)}
                placeholder="Nombre"
              />
            </View>
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <FormField
            label="Personne de contact"
            value={formData.contactPerson}
            onChange={(value) => handleInputChange('contactPerson', value)}
            placeholder="Nom du contact"
          />
          <FormField
            label="Email"
            value={formData.email}
            onChange={(value) => handleInputChange('email', value)}
            placeholder="email@entreprise.com"
          />
          <FormField
            label="Téléphone"
            value={formData.phone}
            onChange={(value) => handleInputChange('phone', value)}
            placeholder="+33 X XX XX XX XX"
          />
          <FormField
            label="Site web"
            value={formData.website}
            onChange={(value) => handleInputChange('website', value)}
            placeholder="www.entreprise.com"
          />
        </View>

        {/* Project Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Projet</Text>
          <FormField
            label="Investissement prévu"
            value={formData.investment}
            onChange={(value) => handleInputChange('investment', value)}
            placeholder="Montant de l'investissement"
          />
          <FormField
            label="Délai de mise en œuvre"
            value={formData.timeline}
            onChange={(value) => handleInputChange('timeline', value)}
            placeholder="Délai prévu"
          />
          <FormField
            label="RSE / Développement durable"
            value={formData.rse}
            onChange={(value) => handleInputChange('rse', value)}
            placeholder="Engagements RSE"
            multiline
          />
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes complémentaires</Text>
          <FormField
            label=""
            value={notes}
            onChange={setNotes}
            placeholder="Ajoutez des notes ou observations..."
            multiline
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="save-outline" size={20} color={colors.primary} />
            <Text style={styles.saveButtonText}>Sauvegarder</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.submitButton}
            onPress={() => navigation.navigate('Scoring', {
              transcription: route?.params?.transcription || '',
              extractedData: formData,
              sentiment,
              notes,
            })}
          >
            <Ionicons name="checkmark" size={20} color={colors.white} />
            <Text style={styles.submitButtonText}>Valider et envoyer au CRM</Text>
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
  sentimentContainer: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  sentimentOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  sentimentOption: {
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    minWidth: 80,
  },
  sentimentOptionSelected: {
    backgroundColor: colors.background,
  },
  sentimentEmoji: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  sentimentLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  section: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  formField: {
    marginBottom: spacing.md,
  },
  formLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  formInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.text,
    backgroundColor: colors.background,
  },
  formInputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfField: {
    flex: 1,
    marginRight: spacing.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.white,
    marginRight: spacing.sm,
  },
  saveButtonText: {
    color: colors.primary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    marginLeft: spacing.xs,
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    ...shadows.md,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    marginLeft: spacing.xs,
  },
});

export default ReviewScreen;
