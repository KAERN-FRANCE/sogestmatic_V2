import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OpenAIService } from '../services/openaiService';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';

const { width } = Dimensions.get('window');

const ScoringScreen = ({ navigation, route }) => {
  const [language, setLanguage] = useState('FR');
  const [overallScore, setOverallScore] = useState(78);
  const [scores, setScores] = useState({
    economique: 82,
    rse: 75,
    territorial: 77,
  });
  const [isGeneratingScore, setIsGeneratingScore] = useState(false);
  const [summary, setSummary] = useState('');
  
  // Récupérer les données extraites
  const extractedData = route?.params?.extractedData || {};
  
  const animatedScore = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Générer le score automatiquement si on a des données extraites
    if (Object.keys(extractedData).length > 0) {
      generateScore();
    } else {
      // Animate score on mount
      Animated.timing(animatedScore, {
        toValue: overallScore,
        duration: 2000,
        useNativeDriver: false,
      }).start();

      // Start pulse animation
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
    }
  }, []);

  const generateScore = async () => {
    try {
      setIsGeneratingScore(true);
      const scoreData = await OpenAIService.generateScore(extractedData);
      
      setOverallScore(scoreData.score_global);
      setScores({
        economique: scoreData.score_economique,
        rse: scoreData.score_rse,
        territorial: scoreData.score_territorial,
      });
      setSummary(scoreData.resume);
      
      // Animate new score
      Animated.timing(animatedScore, {
        toValue: scoreData.score_global,
        duration: 2000,
        useNativeDriver: false,
      }).start();
      
    } catch (error) {
      console.error('Erreur génération score:', error);
      Alert.alert('Erreur', 'Impossible de générer le score. Vérifiez votre connexion internet et votre clé API OpenAI.');
    } finally {
      setIsGeneratingScore(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.warning;
    return colors.error;
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Bon';
    if (score >= 40) return 'Moyen';
    return 'Faible';
  };

  const CircularProgress = ({ score, size = 120, strokeWidth = 8, color = colors.primary }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(animatedValue, {
        toValue: score,
        duration: 2000,
        useNativeDriver: false,
      }).start();
    }, [score]);

    const strokeDashoffset = animatedValue.interpolate({
      inputRange: [0, 100],
      outputRange: [circumference, 0],
    });

    return (
      <View style={[styles.circularProgress, { width: size, height: size }]}>
        <Animated.View
          style={[
            styles.circularProgressTrack,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: colors.border,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.circularProgressFill,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: color,
              transform: [{ rotate: '-90deg' }],
            },
          ]}
        />
        <View style={styles.circularProgressContent}>
          <Animated.Text style={[styles.circularProgressText, { color }]}>
            {animatedValue.interpolate({
              inputRange: [0, 100],
              outputRange: ['0', '100'],
              extrapolate: 'clamp',
            })}
          </Animated.Text>
          <Text style={styles.circularProgressLabel}>Score</Text>
        </View>
      </View>
    );
  };

  const ScoreCard = ({ title, score, icon, color }) => (
    <View style={styles.scoreCard}>
      <View style={styles.scoreCardHeader}>
        <Ionicons name={icon} size={24} color={color} />
        <Text style={styles.scoreCardTitle}>{title}</Text>
      </View>
      <View style={styles.scoreCardContent}>
        <Text style={[styles.scoreCardValue, { color }]}>{score}%</Text>
        <View style={[styles.scoreBar, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.scoreBarFill,
              { width: `${score}%`, backgroundColor: color },
            ]}
          />
        </View>
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
        <Text style={styles.headerTitle}>Résultat du Scoring</Text>
        <TouchableOpacity
          style={styles.languageToggle}
          onPress={() => setLanguage(language === 'FR' ? 'EN' : 'FR')}
        >
          <Text style={styles.languageText}>{language}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Overall Score */}
        <View style={styles.overallScoreContainer}>
          <Animated.View
            style={[
              styles.overallScoreCard,
              {
                transform: [{ scale: pulseAnim }],
                borderColor: getScoreColor(overallScore),
              },
            ]}
          >
            <CircularProgress
              score={overallScore}
              size={160}
              strokeWidth={12}
              color={getScoreColor(overallScore)}
            />
            <Text style={styles.overallScoreLabel}>
              {getScoreLabel(overallScore)}
            </Text>
            <Text style={styles.overallScoreDescription}>
              Score global de compatibilité
            </Text>
          </Animated.View>
        </View>

        {/* Detailed Scores */}
        <View style={styles.detailedScores}>
          <Text style={styles.sectionTitle}>Analyse détaillée</Text>
          <ScoreCard
            title="Économique"
            score={scores.economique}
            icon="trending-up"
            color={colors.success}
          />
          <ScoreCard
            title="RSE"
            score={scores.rse}
            icon="leaf"
            color={colors.info}
          />
          <ScoreCard
            title="Territorial"
            score={scores.territorial}
            icon="location"
            color={colors.warning}
          />
        </View>

        {/* Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.sectionTitle}>Résumé automatique</Text>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryText}>
              {summary || 'TechCorp France présente un excellent potentiel d\'implantation en Provence-Alpes-Côte d\'Azur. Le projet s\'articule autour de l\'intelligence artificielle, secteur en forte croissance dans la région. L\'entreprise prévoit de créer 50 nouveaux emplois qualifiés, ce qui correspond parfaitement aux objectifs de développement économique territorial. Les engagements RSE sont concrets et l\'implantation à Sophia Antipolis permettra de bénéficier de l\'écosystème technologique local.'}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={generateScore}
            disabled={isGeneratingScore}
          >
            <Ionicons name="refresh" size={20} color={colors.primary} />
            <Text style={styles.retryButtonText}>Relancer le scoring</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.finishButton}
            onPress={() => navigation.navigate('Report', {
              transcription: route?.params?.transcription || '',
              extractedData: route?.params?.extractedData || {},
              scores: {
                score_global: overallScore,
                score_economique: scores.economique,
                score_rse: scores.rse,
                score_territorial: scores.territorial,
              },
              sentiment: route?.params?.sentiment || 'positive',
              notes: route?.params?.notes || '',
            })}
          >
            <Ionicons name="checkmark-circle" size={20} color={colors.white} />
            <Text style={styles.finishButtonText}>Terminer</Text>
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
  overallScoreContainer: {
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  overallScoreCard: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    borderRadius: borderRadius['2xl'],
    alignItems: 'center',
    borderWidth: 3,
    ...shadows.lg,
  },
  circularProgress: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  circularProgressTrack: {
    position: 'absolute',
  },
  circularProgressFill: {
    position: 'absolute',
  },
  circularProgressContent: {
    alignItems: 'center',
  },
  circularProgressText: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
  },
  circularProgressLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  overallScoreLabel: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    marginTop: spacing.md,
  },
  overallScoreDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  detailedScores: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  scoreCard: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  scoreCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  scoreCardTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  scoreCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreCardValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  scoreBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginLeft: spacing.md,
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  summaryContainer: {
    marginBottom: spacing.lg,
  },
  summaryCard: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  summaryText: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.sm,
    color: colors.text,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  retryButton: {
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
  retryButtonText: {
    color: colors.primary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    marginLeft: spacing.xs,
  },
  finishButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    ...shadows.md,
  },
  finishButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    marginLeft: spacing.xs,
  },
});

export default ScoringScreen;