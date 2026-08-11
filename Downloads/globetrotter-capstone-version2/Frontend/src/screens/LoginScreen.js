import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import GabonesePattern from '../components/GabonesePattern';
import { loginHighlights } from '../data/gabonContent';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../config/theme';

const LoginScreen = ({ navigation }) => {
  const [mode, setMode] = useState('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+241 ');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [language, setLanguage] = useState('Français');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const isLogin = mode === 'login';

    if (isLogin) {
      if (!identifier.trim() || !password) {
        Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
        return;
      }
    } else if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim() || !password || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      const displayName = isLogin ? identifier.trim() : `${firstName.trim()} ${lastName.trim()}`;
      await AsyncStorage.setItem('token', 'gabon-demo-token');
      await AsyncStorage.setItem('username', displayName);
      await AsyncStorage.setItem('language', language);

      if (isLogin) {
        navigation.replace('Main');
      } else {
        Alert.alert('Bienvenue', 'Connection réussi à votre compte.', [
          { text: 'Explorer', onPress: () => navigation.replace('Main') },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#064D2C', '#009639', '#FCD116']}
        style={styles.background}
      />
      <GabonesePattern variant="header" style={styles.pattern} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <Icon name="compass" size={20} color={COLORS.vertGabon} />
            <Icon name="feather" size={14} color={COLORS.bleuGabon} style={styles.brandAccent} />
          </View>
          <View>
            <Text style={styles.appName}>Globetrotter Libreville</Text>
            <Text style={styles.appSlogan}>Découvrir Libreville autrement</Text>
          </View>
        </View>

        <View style={styles.highlightRow}>
          {loginHighlights.map((item) => (
            <View key={item} style={styles.highlightPill}>
              <Text style={styles.highlightText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <View style={styles.modeRow}>
            <TouchableOpacity style={[styles.modeChip, mode === 'login' && styles.modeChipActive]} onPress={() => setMode('login')}>
              <Text style={[styles.modeText, mode === 'login' && styles.modeTextActive]}>Connexion</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modeChip, mode === 'register' && styles.modeChipActive]} onPress={() => setMode('register')}>
              <Text style={[styles.modeText, mode === 'register' && styles.modeTextActive]}>Inscription</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>{mode === 'login' ? 'Visiter, comprendre, ressentir' : 'Créer mon compte'}</Text>
          <Text style={styles.subtitle}>
            {mode === 'login'
              ? 'Entrez dans une expérience locale, chaleureuse et immersive au cœur de Libreville.'
              : 'Rejoignez un voyage mobile pensé pour Libreville et découvrez peu après les 9 provinces.'}
          </Text>

          <View style={styles.languageRow}>
            {['Français', 'English'].map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.languageChip, language === item && styles.languageChipActiveAlt]}
                onPress={() => setLanguage(item)}
              >
                <Text style={[styles.languageText, language === item && styles.languageTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.form}>
            {mode === 'register' && (
              <>
                <View style={styles.row}>
                  <View style={[styles.inputGroup, styles.halfWidth]}>
                    <Text style={styles.label}>Prénom</Text>
                    <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="Nom" placeholderTextColor={COLORS.textMuted} />
                  </View>
                  <View style={[styles.inputGroup, styles.halfWidth]}>
                    <Text style={styles.label}>Nom</Text>
                    <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Prénom" placeholderTextColor={COLORS.textMuted} />
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="email@exemple.com" placeholderTextColor={COLORS.textMuted} autoCapitalize="none" keyboardType="email-address" />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Téléphone</Text>
                  <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+241 06 00 00 00" placeholderTextColor={COLORS.textMuted} keyboardType="phone-pad" />
                  <Text style={styles.helperText}>Indicatif local +241</Text>
                </View>
              </>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{mode === 'login' ? 'Email ou téléphone' : 'Email de connexion'}</Text>
              <TextInput
                style={styles.input}
                value={mode === 'login' ? identifier : email}
                onChangeText={mode === 'login' ? setIdentifier : setEmail}
                placeholder={mode === 'login' ? 'Votre identifiant' : 'email@exemple.com'}
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mot de passe</Text>
              <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="••••••••" placeholderTextColor={COLORS.textMuted} secureTextEntry />
            </View>

            {mode === 'register' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirmer le mot de passe</Text>
                <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="••••••••" placeholderTextColor={COLORS.textMuted} secureTextEntry />
              </View>
            )}

            <View style={styles.optionsRow}>
              <TouchableOpacity style={styles.checkboxRow}>
                <View style={styles.checkbox} />
                <Text style={styles.optionText}>Se souvenir de moi</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Alert.alert('Mot de passe oublié', 'Fonctionnalité à brancher plus tard.')}>
                <Text style={styles.forgotText}>Mot de passe oublié</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
              <LinearGradient colors={[COLORS.vertGabon, COLORS.vertForet]} style={styles.primaryButtonGradient}>
                <Text style={styles.primaryButtonText}>{loading ? 'Chargement...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={() => setMode(mode === 'login' ? 'register' : 'login')} activeOpacity={0.85}>
              <Text style={styles.secondaryButtonText}>{mode === 'login' ? 'Créer un compte' : 'Retour à la connexion'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerCard}>
            <Text style={styles.footerTitle}>Une expérience locale, sans réseaux sociaux</Text>
            <Text style={styles.footerText}>Connecter vous pour mieux profiter de l'application.</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.vertForet },
  background: { ...StyleSheet.absoluteFillObject },
  pattern: { ...StyleSheet.absoluteFillObject, opacity: 0.18 },
  content: { padding: SPACING.xl, paddingTop: SPACING.xxl, paddingBottom: SPACING.xxxl },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.lg },
  brandMark: { width: 54, height: 54, borderRadius: 18, backgroundColor: 'rgba(255,248,231,0.9)', alignItems: 'center', justifyContent: 'center', ...SHADOWS.md },
  brandAccent: { position: 'absolute', right: 9, bottom: 9 },
  appName: { ...TYPOGRAPHY.displaySmall, color: COLORS.ivoire },
  appSlogan: { ...TYPOGRAPHY.bodyMedium, color: 'rgba(255, 248, 231, 0.88)' },
  highlightRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg },
  highlightPill: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, backgroundColor: 'rgba(255,248,231,0.12)', borderWidth: 1, borderColor: 'rgba(255,248,231,0.16)' },
  highlightText: { color: COLORS.ivoire, fontSize: 12, fontFamily: 'Inter', fontWeight: '600' },
  card: { backgroundColor: 'rgba(255,248,231,0.98)', borderRadius: 32, padding: SPACING.xl, ...SHADOWS.lg, borderWidth: 1, borderColor: 'rgba(17,17,17,0.05)' },
  modeRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  modeChip: { flex: 1, borderRadius: RADIUS.full, backgroundColor: COLORS.ivoire, paddingVertical: SPACING.sm, alignItems: 'center', borderWidth: 1, borderColor: COLORS.ligneDouce },
  modeChipActive: { backgroundColor: COLORS.vertGabon, borderColor: COLORS.vertGabon },
  modeText: { ...TYPOGRAPHY.labelMedium, color: COLORS.textPrimary },
  modeTextActive: { color: COLORS.ivoire },
  title: { ...TYPOGRAPHY.displayMedium, color: COLORS.textPrimary, marginBottom: SPACING.sm },
  subtitle: { ...TYPOGRAPHY.bodyMedium, color: COLORS.textSecondary, marginBottom: SPACING.lg },
  languageRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  languageChip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, backgroundColor: COLORS.ivoire, borderWidth: 1, borderColor: COLORS.ligneDouce },
  languageChipActiveAlt: { backgroundColor: COLORS.jauneGabon, borderColor: COLORS.jauneGabon },
  languageText: { ...TYPOGRAPHY.labelMedium, color: COLORS.textSecondary },
  languageTextActive: { color: COLORS.noirProfond },
  form: { gap: SPACING.md },
  row: { flexDirection: 'row', gap: SPACING.sm },
  halfWidth: { flex: 1 },
  inputGroup: { gap: SPACING.xs },
  label: { ...TYPOGRAPHY.labelMedium, color: COLORS.textPrimary },
  input: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, borderWidth: 1, borderColor: COLORS.ligneDouce, ...TYPOGRAPHY.bodyMedium, color: COLORS.textPrimary },
  helperText: { ...TYPOGRAPHY.bodySmall, color: COLORS.textMuted },
  optionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.md, marginTop: SPACING.xs },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  checkbox: { width: 18, height: 18, borderRadius: 6, borderWidth: 1.5, borderColor: COLORS.vertGabon, backgroundColor: COLORS.brumeVerte },
  optionText: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary },
  forgotText: { ...TYPOGRAPHY.labelMedium, color: COLORS.vertGabon },
  primaryButton: { borderRadius: RADIUS.full, overflow: 'hidden', marginTop: SPACING.xs },
  primaryButtonGradient: { minHeight: 54, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { ...TYPOGRAPHY.labelLarge, color: COLORS.ivoire },
  secondaryButton: { alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.full, minHeight: 50, borderWidth: 1, borderColor: COLORS.ligneDouce, backgroundColor: COLORS.ivoire },
  secondaryButtonText: { ...TYPOGRAPHY.labelLarge, color: COLORS.vertForet },
  footerCard: { marginTop: SPACING.lg, borderRadius: RADIUS.lg, backgroundColor: COLORS.surface, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.ligneDouce },
  footerTitle: { ...TYPOGRAPHY.labelLarge, color: COLORS.noirProfond, marginBottom: SPACING.xs },
  footerText: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary },
});

export default LoginScreen;
