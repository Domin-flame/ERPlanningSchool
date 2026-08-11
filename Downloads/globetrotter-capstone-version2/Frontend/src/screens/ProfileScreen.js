import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import Button from '../components/Button';
import { profileBadges } from '../data/gabonContent';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../config/theme';

const ProfileScreen = ({ navigation }) => {
  const [username, setUsername] = useState('Voyageur');
  const [favoritesCount, setFavoritesCount] = useState(0);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const storedUsername = await AsyncStorage.getItem('username');
      setUsername(storedUsername || 'Voyageur');
      setFavoritesCount(4);
    } catch (error) {
      setUsername('Voyageur');
      setFavoritesCount(4);
    }
  };

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove(['token', 'username', 'language']);
          navigation.replace('Login');
        },
      },
    ]);
  };

  const menuItems = [
    { icon: 'settings', label: 'Paramètres', onPress: () => Alert.alert('Info', 'Fonctionnalité à venir') },
    { icon: 'bell', label: 'Notifications', onPress: () => Alert.alert('Info', 'Fonctionnalité à venir') },
    { icon: 'shield', label: 'Espace admin', onPress: () => navigation.navigate('AdminPanel') },
    { icon: 'help-circle', label: 'Aide & Support', onPress: () => Alert.alert('Info', 'Fonctionnalité à venir') },
    { icon: 'info', label: 'À propos', onPress: () => Alert.alert('Globetrotter Libreville', 'Prototype immersif de découverte touristique et culturelle.') },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Image source={require('../assets/g11.jpg')} style={styles.heroImage} resizeMode="cover" />
        <LinearGradient colors={['rgba(6,77,44,0.68)', 'rgba(17,17,17,0.78)']} style={styles.heroGradient} />
        <View style={styles.profileCard}>
          <View style={styles.avatar}><Icon name="user" size={26} color={COLORS.vertForet} /></View>
          <View style={styles.eyebrow}><Text style={styles.eyebrowText}>PROFIL VOYAGEUR</Text></View>
          <Text style={styles.username}>{username}</Text>
          <View style={styles.stats}>
            <View style={styles.statItem}><Text style={styles.statValue}>{favoritesCount}</Text><Text style={styles.statLabel}>favoris</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}><Text style={styles.statValue}>9</Text><Text style={styles.statLabel}>badges</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}><Text style={styles.statValue}>Libreville</Text><Text style={styles.statLabel}>base</Text></View>
          </View>
          <Button title="Modifier le profil" variant="secondary" onPress={() => Alert.alert('Info', 'Fonctionnalité à venir')} icon={<Icon name="edit-2" size={18} color={COLORS.textPrimary} />} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vos préférences</Text>
        <View style={styles.preferencesGrid}>
          {profileBadges.map((pref) => (
            <View key={pref} style={styles.preferenceChip}><Text style={styles.preferenceText}>{pref}</Text></View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Compte</Text>
        <View style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity style={styles.menuItem} onPress={item.onPress} activeOpacity={0.7}>
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuIconContainer}><Icon name={item.icon} size={20} color={COLORS.textPrimary} /></View>
                  <Text style={styles.menuItemText}>{item.label}</Text>
                </View>
                <Icon name="chevron-right" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
              {index < menuItems.length - 1 && <View style={styles.menuDivider} />}
            </React.Fragment>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Button title="Se déconnecter" variant="ghost" onPress={handleLogout} icon={<Icon name="log-out" size={18} color={COLORS.textPrimary} />} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Globetrotter Gabon - Prototype immersif</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: SPACING.xxxl },
  hero: { height: 420, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  heroImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  profileCard: { width: '90%', maxWidth: 400, backgroundColor: 'rgba(255,248,231,0.96)', borderRadius: RADIUS.xl, padding: SPACING.xl, alignItems: 'center', ...SHADOWS.lg },
  avatar: { width: 96, height: 96, borderRadius: 32, marginBottom: SPACING.md, borderWidth: 4, borderColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.ivoire },
  eyebrow: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, backgroundColor: COLORS.jauneGabon, borderRadius: RADIUS.full, marginBottom: SPACING.sm },
  eyebrowText: { ...TYPOGRAPHY.labelSmall, color: COLORS.noirProfond },
  username: { ...TYPOGRAPHY.displaySmall, color: COLORS.textPrimary, marginBottom: SPACING.lg },
  stats: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.lg, marginBottom: SPACING.lg, borderTopWidth: 1, borderBottomWidth: 1, borderColor: COLORS.ligneDouce, width: '100%' },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 36, backgroundColor: COLORS.ligneDouce },
  statValue: { ...TYPOGRAPHY.labelLarge, color: COLORS.textPrimary },
  statLabel: { ...TYPOGRAPHY.bodySmall, color: COLORS.textMuted },
  section: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.xl },
  sectionTitle: { ...TYPOGRAPHY.displaySmall, color: COLORS.textPrimary, marginBottom: SPACING.md },
  preferencesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  preferenceChip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, backgroundColor: COLORS.brumeVerte, borderRadius: RADIUS.full },
  preferenceText: { ...TYPOGRAPHY.labelMedium, color: COLORS.vertForet },
  menuCard: { backgroundColor: COLORS.surface, borderRadius: 28, overflow: 'hidden', ...SHADOWS.md },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  menuIconContainer: { width: 40, height: 40, borderRadius: 14, backgroundColor: COLORS.ivoire, alignItems: 'center', justifyContent: 'center' },
  menuItemText: { ...TYPOGRAPHY.labelLarge, color: COLORS.textPrimary },
  menuDivider: { height: 1, backgroundColor: COLORS.ligneDouce, marginHorizontal: SPACING.lg },
  footer: { alignItems: 'center', paddingTop: SPACING.xl },
  footerText: { ...TYPOGRAPHY.bodySmall, color: COLORS.textMuted },
});

export default ProfileScreen;
