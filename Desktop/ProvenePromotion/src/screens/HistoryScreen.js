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

const HistoryScreen = ({ navigation }) => {
  const [language, setLanguage] = useState('FR');
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Mock data
  const interviews = [
    {
      id: 1,
      company: 'TechCorp France',
      date: '2024-01-15',
      score: 85,
      status: 'completed',
      duration: '45 min',
      sector: 'IA',
    },
    {
      id: 2,
      company: 'GreenEnergy Solutions',
      date: '2024-01-14',
      score: 72,
      status: 'completed',
      duration: '38 min',
      sector: 'Énergie',
    },
    {
      id: 3,
      company: 'MediTech Innovations',
      date: '2024-01-13',
      score: 91,
      status: 'completed',
      duration: '52 min',
      sector: 'Santé',
    },
    {
      id: 4,
      company: 'AgriTech Provence',
      date: '2024-01-12',
      score: 45,
      status: 'pending',
      duration: '30 min',
      sector: 'Agriculture',
    },
  ];

  const filters = [
    { key: 'all', label: 'Tous' },
    { key: 'completed', label: 'Terminés' },
    { key: 'pending', label: 'En cours' },
  ];

  const getScoreColor = (score) => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.warning;
    return colors.error;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'pending':
        return colors.warning;
      default:
        return colors.textSecondary;
    }
  };

  const InterviewCard = ({ interview }) => (
    <TouchableOpacity style={styles.interviewCard}>
      <View style={styles.interviewHeader}>
        <View style={styles.interviewInfo}>
          <Text style={styles.interviewCompany}>{interview.company}</Text>
          <Text style={styles.interviewSector}>{interview.sector}</Text>
        </View>
        <View style={styles.interviewScore}>
          <Text style={[styles.scoreText, { color: getScoreColor(interview.score) }]}>
            {interview.score}%
          </Text>
        </View>
      </View>
      
      <View style={styles.interviewDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="calendar" size={16} color={colors.textSecondary} />
          <Text style={styles.detailText}>{interview.date}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="time" size={16} color={colors.textSecondary} />
          <Text style={styles.detailText}>{interview.duration}</Text>
        </View>
        <View style={styles.detailItem}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(interview.status) }]}>
            <Text style={styles.statusText}>
              {interview.status === 'completed' ? 'Terminé' : 'En cours'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Historique</Text>
        <TouchableOpacity
          style={styles.languageToggle}
          onPress={() => setLanguage(language === 'FR' ? 'EN' : 'FR')}
        >
          <Text style={styles.languageText}>{language}</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              selectedFilter === filter.key && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter(filter.key)}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedFilter === filter.key && styles.filterButtonTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {interviews.map((interview) => (
          <InterviewCard key={interview.id} interview={interview} />
        ))}
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
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
    backgroundColor: colors.background,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  filterButtonTextActive: {
    color: colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  interviewCard: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  interviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  interviewInfo: {
    flex: 1,
  },
  interviewCompany: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  interviewSector: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  interviewScore: {
    alignItems: 'flex-end',
  },
  scoreText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  interviewDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
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
});

export default HistoryScreen;
