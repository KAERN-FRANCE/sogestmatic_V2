import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';

const HomeScreen = ({ navigation }) => {
  const [language, setLanguage] = useState('FR');

  // Mock data
  const stats = {
    interviews: 12,
    scored: 8,
    averageScore: 78,
  };

  const recentLeads = [
    {
      id: 1,
      company: 'TechCorp France',
      sector: 'Technologie',
      status: 'chaud',
      lastContact: 'Il y a 2h',
      score: 85,
    },
    {
      id: 2,
      company: 'GreenEnergy Solutions',
      sector: 'Énergie',
      status: 'à relancer',
      lastContact: 'Hier',
      score: 72,
    },
    {
      id: 3,
      company: 'MediTech Innovations',
      sector: 'Santé',
      status: 'chaud',
      lastContact: 'Il y a 1 jour',
      score: 91,
    },
    {
      id: 4,
      company: 'AgriTech Provence',
      sector: 'Agriculture',
      status: 'froid',
      lastContact: 'Il y a 3 jours',
      score: 45,
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'chaud':
        return colors.hot;
      case 'à relancer':
        return colors.warning;
      case 'froid':
        return colors.cold;
      default:
        return colors.textSecondary;
    }
  };

  const StatCard = ({ title, value, icon, color = colors.primary }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Ionicons name={icon} size={24} color={color} />
        <Text style={styles.statValue}>{value}</Text>
      </View>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  const LeadCard = ({ lead }) => (
    <TouchableOpacity style={styles.leadCard}>
      <View style={styles.leadHeader}>
        <Text style={styles.leadCompany}>{lead.company}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(lead.status) }]}>
          <Text style={styles.statusText}>{lead.status}</Text>
        </View>
      </View>
      <Text style={styles.leadSector}>{lead.sector}</Text>
      <View style={styles.leadFooter}>
        <Text style={styles.leadContact}>{lead.lastContact}</Text>
        <Text style={styles.leadScore}>Score: {lead.score}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Bonjour, Marie Dubois 👋
          </Text>
          <Text style={styles.subtitle}>Assistant IA Provence</Text>
        </View>
        <TouchableOpacity
          style={styles.languageToggle}
          onPress={() => setLanguage(language === 'FR' ? 'EN' : 'FR')}
        >
          <Text style={styles.languageText}>{language}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <StatCard
            title="Entretiens réalisés"
            value={stats.interviews}
            icon="people"
            color={colors.primary}
          />
          <StatCard
            title="Projets scorés"
            value={stats.scored}
            icon="trending-up"
            color={colors.success}
          />
          <StatCard
            title="Moyenne des scores"
            value={`${stats.averageScore}%`}
            icon="star"
            color={colors.warning}
          />
        </View>

        {/* GDPR Notice */}
        <View style={styles.gdprNotice}>
          <Ionicons name="shield-checkmark" size={20} color={colors.success} />
          <Text style={styles.gdprText}>
            Conforme RGPD : Aucune donnée personnelle n'est collectée ou stockée
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.newInterviewButton}
            onPress={() => navigation.navigate('Recording')}
          >
            <Ionicons name="add" size={24} color={colors.white} />
            <Text style={styles.newInterviewText}>+ Nouvel Entretien</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.reportButton}
            onPress={() => navigation.navigate('Report', {
              transcription: "Exemple de transcription d'entretien avec TechCorp France...",
              extractedData: {
                entreprise: 'TechCorp France',
                secteur: 'Intelligence Artificielle',
                employes_actuels: '150',
                emplois_prevus: '50',
                localisation: 'Sophia Antipolis, Nice',
                contact_personne: 'Jean Dupont',
                email: 'j.dupont@techcorp.fr',
                telephone: '+33 4 93 12 34 56',
                site_web: 'www.techcorp.fr',
                investissement: '2.5M€',
                delai: '6 mois',
                rse: 'Projets concrets en RSE',
              },
              scores: {
                score_global: 78,
                score_economique: 82,
                score_rse: 75,
                score_territorial: 77,
              },
              sentiment: 'positive',
              notes: 'Entretien très positif, entreprise motivée pour s\'implanter en Provence.',
            })}
          >
            <Ionicons name="document-text" size={20} color={colors.primary} />
            <Text style={styles.reportButtonText}>Voir un rapport</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Leads */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Derniers prospects</Text>
          {recentLeads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
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
  greeting: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.xs,
    borderLeftWidth: 4,
    ...shadows.sm,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  statTitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: typography.lineHeight.normal * typography.fontSize.sm,
  },
  gdprNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '20',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  gdprText: {
    color: colors.success,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginLeft: spacing.sm,
    flex: 1,
  },
  actionButtonsContainer: {
    marginBottom: spacing.lg,
  },
  newInterviewButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    ...shadows.md,
  },
  newInterviewText: {
    color: colors.white,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semiBold,
    marginLeft: spacing.sm,
  },
  reportButton: {
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    ...shadows.sm,
  },
  reportButtonText: {
    color: colors.primary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    marginLeft: spacing.sm,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  leadCard: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  leadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  leadCompany: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusText: {
    color: colors.white,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  leadSector: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  leadFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leadContact: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  leadScore: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
});

export default HomeScreen;