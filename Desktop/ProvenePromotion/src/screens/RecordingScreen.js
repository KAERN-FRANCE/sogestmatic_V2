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
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { OpenAIService } from '../services/openaiService';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';

const { width } = Dimensions.get('window');

const RecordingScreen = ({ navigation }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [language, setLanguage] = useState('FR');
  const [recording, setRecording] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  useEffect(() => {
    if (isRecording) {
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Start pulse animation
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
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

      // Start wave animation
      const waveAnimation = Animated.loop(
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      );
      waveAnimation.start();
    } else {
      // Stop timer and animations
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      pulseAnim.setValue(1);
      waveAnim.setValue(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      // Demander les permissions audio
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'L\'accès au microphone est nécessaire pour l\'enregistrement.');
        return;
      }

      // Configurer l'audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Démarrer l'enregistrement
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
      setRecordingTime(0);
    } catch (error) {
      console.error('Erreur démarrage enregistrement:', error);
      Alert.alert('Erreur', 'Impossible de démarrer l\'enregistrement.');
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      
      if (recording) {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        
        // Démarrer la transcription
        setIsTranscribing(true);
        await transcribeAndNavigate(uri);
      }
    } catch (error) {
      console.error('Erreur arrêt enregistrement:', error);
      Alert.alert('Erreur', 'Impossible d\'arrêter l\'enregistrement.');
    }
  };

  const transcribeAndNavigate = async (audioUri) => {
    try {
      // Transcrir l'audio avec OpenAI
      const transcription = await OpenAIService.transcribeAudio(audioUri);
      
      // Analyser la conversation
      const extractedData = await OpenAIService.analyzeConversation(transcription);
      
      // S'assurer que les données sont valides avant la navigation (SANS données personnelles)
      const safeExtractedData = extractedData || {
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
        secteur_geographique: "Non spécifié"
      };
      
      // Naviguer vers l'écran de transcription avec les données
      navigation.navigate('Transcription', {
        transcription: transcription || "Transcription non disponible",
        extractedData: safeExtractedData,
      });
    } catch (error) {
      console.error('Erreur transcription:', error);
      Alert.alert('Erreur', 'Impossible de transcrire l\'enregistrement. Vérifiez votre connexion internet et votre clé API OpenAI.');
      setIsTranscribing(false);
    }
  };

  const handleRecordPress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const WaveformBar = ({ height, delay = 0 }) => {
    const animatedScaleY = waveAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    });

    return (
      <Animated.View
        style={[
          styles.waveformBar,
          {
            height: height,
            transform: [{ scaleY: animatedScaleY }],
            animationDelay: delay,
          },
        ]}
      />
    );
  };

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
        <Text style={styles.headerTitle}>Enregistrement</Text>
        <TouchableOpacity
          style={styles.languageToggle}
          onPress={() => setLanguage(language === 'FR' ? 'EN' : 'FR')}
        >
          <Text style={styles.languageText}>{language}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Recording Status */}
        <View style={styles.statusContainer}>
          {isRecording ? (
            <>
              <Text style={styles.recordingText}>Enregistrement en cours...</Text>
              <Text style={styles.timerText}>{formatTime(recordingTime)}</Text>
            </>
          ) : (
            <Text style={styles.readyText}>Prêt à enregistrer</Text>
          )}
        </View>

        {/* Waveform Animation */}
        <View style={styles.waveformContainer}>
          {Array.from({ length: 20 }, (_, i) => (
            <WaveformBar
              key={i}
              height={Math.random() * 60 + 20}
              delay={i * 100}
            />
          ))}
        </View>

        {/* Recording Button */}
        <View style={styles.recordButtonContainer}>
          <Animated.View
            style={[
              styles.recordButton,
              {
                transform: [{ scale: pulseAnim }],
                backgroundColor: isRecording ? colors.error : colors.primary,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.recordButtonInner}
              onPress={handleRecordPress}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isRecording ? 'stop' : 'mic'}
                size={40}
                color={colors.white}
              />
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>
            {isRecording ? 'Enregistrement en cours' : 'Instructions'}
          </Text>
          <Text style={styles.instructionsText}>
            {isRecording
              ? 'Parlez clairement et naturellement. L\'IA analysera votre conversation.'
              : 'Appuyez sur le bouton pour commencer l\'enregistrement de votre entretien avec l\'entreprise.'}
          </Text>
        </View>

        {/* Transcription Status */}
        {(isRecording || isTranscribing) && (
          <View style={styles.transcriptionStatus}>
            <Ionicons name="pulse" size={16} color={colors.primary} />
            <Text style={styles.transcriptionText}>
              {isTranscribing ? 'Transcription en cours...' : 'Enregistrement en cours...'}
            </Text>
          </View>
        )}
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  recordingText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  timerText: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  readyText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
    marginBottom: spacing['2xl'],
    gap: 3,
  },
  waveformBar: {
    width: 4,
    backgroundColor: colors.primary,
    borderRadius: 2,
    opacity: 0.7,
  },
  recordButtonContainer: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  recordButtonInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionsContainer: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  instructionsTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  instructionsText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.sm,
  },
  transcriptionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  transcriptionText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginLeft: spacing.sm,
  },
});

export default RecordingScreen;