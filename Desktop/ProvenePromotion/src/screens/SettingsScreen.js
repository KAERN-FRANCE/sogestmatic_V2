import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';

const SettingsScreen = ({ navigation }) => {
  const [language, setLanguage] = useState('FR');
  const [notifications, setNotifications] = useState(true);
  const [autoTranscription, setAutoTranscription] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const SettingItem = ({ icon, title, subtitle, onPress, rightComponent, showArrow = true }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <Ionicons name={icon} size={24} color={colors.primary} />
        </View>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightComponent}
        {showArrow && !rightComponent && (
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Paramètres</Text>
        <TouchableOpacity
          style={styles.languageToggle}
          onPress={() => setLanguage(language === 'FR' ? 'EN' : 'FR')}
        >
          <Text style={styles.languageText}>{language}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profil</Text>
          <SettingItem
            icon="person"
            title="Marie Dubois"
            subtitle="Agent de développement"
            onPress={() => {}}
          />
          <SettingItem
            icon="mail"
            title="marie.dubois@investinprovence.com"
            subtitle="Email professionnel"
            onPress={() => {}}
          />
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Application</Text>
          <SettingItem
            icon="notifications"
            title="Notifications"
            subtitle="Recevoir les notifications"
            rightComponent={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={notifications ? colors.white : colors.textSecondary}
              />
            }
            showArrow={false}
          />
          <SettingItem
            icon="mic"
            title="Transcription automatique"
            subtitle="Transcrire automatiquement les enregistrements"
            rightComponent={
              <Switch
                value={autoTranscription}
                onValueChange={setAutoTranscription}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={autoTranscription ? colors.white : colors.textSecondary}
              />
            }
            showArrow={false}
          />
          <SettingItem
            icon="moon"
            title="Mode sombre"
            subtitle="Interface en mode sombre"
            rightComponent={
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={darkMode ? colors.white : colors.textSecondary}
              />
            }
            showArrow={false}
          />
        </View>

        {/* Language Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Langue</Text>
          <SettingItem
            icon="language"
            title="Langue de l'interface"
            subtitle="Français"
            onPress={() => {}}
          />
          <SettingItem
            icon="translate"
            title="Langue de transcription"
            subtitle="Français"
            onPress={() => {}}
          />
        </View>

        {/* Data & Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Données & Confidentialité</Text>
          <SettingItem
            icon="shield-checkmark"
            title="Politique de confidentialité"
            onPress={() => {}}
          />
          <SettingItem
            icon="document-text"
            title="Conditions d'utilisation"
            onPress={() => {}}
          />
          <SettingItem
            icon="download"
            title="Exporter mes données"
            onPress={() => {}}
          />
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <SettingItem
            icon="help-circle"
            title="Centre d'aide"
            onPress={() => {}}
          />
          <SettingItem
            icon="mail"
            title="Nous contacter"
            onPress={() => {}}
          />
          <SettingItem
            icon="information-circle"
            title="À propos"
            onPress={() => {}}
          />
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
          <Text style={styles.versionSubtext}>Provence AI Assistant</Text>
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
  section: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    marginBottom: spacing.md,
    paddingLeft: spacing.sm,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  settingSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  settingRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginTop: spacing.lg,
  },
  versionText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  versionSubtext: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
});

export default SettingsScreen;
