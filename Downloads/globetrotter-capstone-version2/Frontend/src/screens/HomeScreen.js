import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import GabonesePattern from '../components/GabonesePattern';
import { culturalEvents, destinations, provinces, quickCategories } from '../data/gabonContent';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../config/theme';

const HomeScreen = ({ navigation }) => {
  const featuredDestination = destinations[0];
  const popularDestinations = destinations.slice(0, 5);
  const featuredEvent = culturalEvents[0];
  const featuredProvinces = provinces.slice(0, 3);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Image source={featuredDestination.image} style={styles.heroImage} resizeMode="cover" />
        <LinearGradient colors={['rgba(6,77,44,0.12)', 'rgba(17,17,17,0.92)']} style={styles.heroGradient} />
        <GabonesePattern variant="header" style={styles.heroPattern} />

        <View style={styles.heroContent}>
          <View style={styles.topRow}>
            <View>
              <Text style={styles.eyebrow}>Bienvenue au Gabon</Text>
              <Text style={styles.heroTitle}>Explorer Libreville</Text>
            </View>
            <View style={styles.avatar}><Icon name="user" size={18} color={COLORS.vertForet} /></View>
          </View>
          <Text style={styles.heroSubtitle}>Nature, culture, océan et traditions</Text>

          <View style={styles.searchBar}>
            <Icon name="search" size={18} color={COLORS.textMuted} />
            <Text style={styles.searchText}>Rechercher un lieu, une plage, un événement…</Text>
            <Icon name="sliders" size={18} color={COLORS.vertGabon} />
          </View>

          <View style={styles.heroPanel}>
            <Text style={styles.panelTitle}>Libreville authentique</Text>
            <Text style={styles.panelText}>20 lieux à découvrir entre front de mer, marchés, culture et nature.</Text>
            <View style={styles.badgeRow}>
              {['Culture', 'Nature', 'Plage', 'Histoire'].map((item) => (
                <View key={item} style={styles.badge}><Text style={styles.badgeText}>{item}</Text></View>
              ))}
            </View>
            <TouchableOpacity style={styles.heroButton} onPress={() => navigation.navigate('Explorer')}>
              <Text style={styles.heroButtonText}>Commencer l’exploration</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Catégories rapides</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Roadmap')}><Text style={styles.link}>Créer mon parcours</Text></TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {quickCategories.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.quickChip}
              onPress={() => {
                if (item.id === 'evenements') {
                  navigation.navigate('Events');
                } else if (item.id === 'roadmap') {
                  navigation.navigate('Roadmap');
                } else {
                  navigation.navigate('Explorer');
                }
              }}
            >
              <Icon name={item.icon} size={16} color={COLORS.vertForet} />
              <Text style={styles.quickChipText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Destinations populaires</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Explorer')}><Text style={styles.link}>Voir la carte</Text></TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.destinationRow}>
          {popularDestinations.map((destination) => (
            <TouchableOpacity key={destination.id} style={styles.destinationCard} onPress={() => navigation.navigate('DestinationDetail', { destination })} activeOpacity={0.9}>
              <Image source={destination.image} style={styles.destinationImage} />
              <LinearGradient colors={['transparent', 'rgba(17,17,17,0.92)']} style={styles.destinationOverlay} />
              <View style={styles.destinationContent}>
                <Text style={styles.destinationTag}>{destination.category}</Text>
                <Text style={styles.destinationName}>{destination.name}</Text>
                <Text style={styles.destinationMeta}>{destination.distance} • {destination.duration}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Événement du moment</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Events')}><Text style={styles.link}>Voir l’événement</Text></TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate('Events')} activeOpacity={0.9}>
          <Image source={featuredEvent.image} style={styles.featureImage} />
          <LinearGradient colors={['transparent', 'rgba(17,17,17,0.92)']} style={styles.featureOverlay} />
          <View style={styles.featureContent}>
            <Text style={styles.featureBadge}>Gabon 9 Provinces</Text>
            <Text style={styles.featureTitle}>{featuredEvent.subtitle}</Text>
            <Text style={styles.featureMeta}>{featuredEvent.date} • {featuredEvent.location}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Les 9 provinces</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Explorer')}><Text style={styles.link}>Explorer la culture</Text></TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.provinceRow}>
          {featuredProvinces.map((province) => (
            <TouchableOpacity key={province.id} style={styles.provinceCard} onPress={() => navigation.navigate('Explorer')}>
              <Image source={province.image} style={styles.provinceImage} />
              <View style={styles.provinceOverlay} />
              <Text style={styles.provinceName}>{province.name}</Text>
              <Text style={styles.provinceCity}>{province.city}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <TouchableOpacity style={styles.floatingButton} onPress={() => navigation.navigate('AddDestination')} activeOpacity={0.85}>
        <Icon name="plus" size={24} color={COLORS.ivoire} />
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: 130 },
  hero: { minHeight: 640, position: 'relative' },
  heroImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  heroPattern: { top: 0, height: 90 },
  heroContent: { flex: 1, justifyContent: 'flex-end', padding: SPACING.xl },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: SPACING.lg },
  eyebrow: { alignSelf: 'flex-start', paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, backgroundColor: 'rgba(252,209,22,0.95)', borderRadius: RADIUS.full, marginBottom: SPACING.sm },
  heroTitle: { ...TYPOGRAPHY.displayLarge, color: COLORS.ivoire, marginBottom: SPACING.xs },
  avatar: { width: 44, height: 44, borderRadius: 16, backgroundColor: COLORS.ivoire, alignItems: 'center', justifyContent: 'center', ...SHADOWS.sm },
  heroSubtitle: { ...TYPOGRAPHY.bodyLarge, color: 'rgba(255,248,231,0.9)', marginBottom: SPACING.lg, maxWidth: 290 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.ivoire, borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, marginBottom: SPACING.lg },
  searchText: { flex: 1, ...TYPOGRAPHY.bodyMedium, color: COLORS.textMuted },
  heroPanel: { backgroundColor: 'rgba(255,248,231,0.96)', borderRadius: 30, padding: SPACING.lg, gap: SPACING.sm },
  panelTitle: { ...TYPOGRAPHY.displaySmall, color: COLORS.vertForet },
  panelText: { ...TYPOGRAPHY.bodyMedium, color: COLORS.textSecondary },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  badge: { backgroundColor: COLORS.brumeVerte, borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs },
  badgeText: { ...TYPOGRAPHY.labelSmall, color: COLORS.vertForet },
  heroButton: { minHeight: 50, borderRadius: RADIUS.full, backgroundColor: COLORS.vertGabon, alignItems: 'center', justifyContent: 'center', marginTop: SPACING.xs },
  heroButtonText: { ...TYPOGRAPHY.labelLarge, color: COLORS.ivoire },
  section: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  sectionTitle: { ...TYPOGRAPHY.displaySmall, color: COLORS.textPrimary },
  link: { ...TYPOGRAPHY.labelMedium, color: COLORS.vertGabon },
  chipsRow: { gap: SPACING.sm, paddingRight: SPACING.xl },
  quickChip: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, backgroundColor: COLORS.surface, borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderWidth: 1, borderColor: COLORS.ligneDouce, ...SHADOWS.sm },
  quickChipText: { ...TYPOGRAPHY.labelMedium, color: COLORS.textPrimary },
  destinationRow: { gap: SPACING.md, paddingRight: SPACING.xl },
  destinationCard: { width: 220, height: 260, borderRadius: 28, overflow: 'hidden', backgroundColor: COLORS.surface, ...SHADOWS.md },
  destinationImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  destinationOverlay: { ...StyleSheet.absoluteFillObject },
  destinationContent: { flex: 1, justifyContent: 'flex-end', padding: SPACING.lg },
  destinationTag: { ...TYPOGRAPHY.labelSmall, color: COLORS.jauneGabon, marginBottom: SPACING.xs },
  destinationName: { ...TYPOGRAPHY.displaySmall, color: COLORS.ivoire },
  destinationMeta: { ...TYPOGRAPHY.bodySmall, color: 'rgba(255,248,231,0.85)' },
  featureCard: { height: 220, borderRadius: 30, overflow: 'hidden', ...SHADOWS.lg },
  featureImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  featureOverlay: { ...StyleSheet.absoluteFillObject },
  featureContent: { flex: 1, justifyContent: 'flex-end', padding: SPACING.lg },
  featureBadge: { ...TYPOGRAPHY.labelSmall, color: COLORS.jauneGabon, marginBottom: SPACING.xs },
  featureTitle: { ...TYPOGRAPHY.displaySmall, color: COLORS.ivoire, marginBottom: SPACING.xs },
  featureMeta: { ...TYPOGRAPHY.bodySmall, color: 'rgba(255,248,231,0.86)' },
  provinceRow: { gap: SPACING.md, paddingRight: SPACING.xl },
  provinceCard: { width: 150, height: 190, borderRadius: 26, overflow: 'hidden', justifyContent: 'flex-end', padding: SPACING.md, backgroundColor: COLORS.surface, ...SHADOWS.md },
  provinceImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  provinceOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(17,17,17,0.22)' },
  provinceName: { ...TYPOGRAPHY.labelLarge, color: COLORS.ivoire },
  provinceCity: { ...TYPOGRAPHY.bodySmall, color: 'rgba(255,248,231,0.84)' },
  floatingButton: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.xxxl,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: COLORS.vertGabon,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.vertForet,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
  },
});

export default HomeScreen;
