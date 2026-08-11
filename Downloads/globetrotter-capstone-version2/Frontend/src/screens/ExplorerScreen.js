import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import GabonesePattern from '../components/GabonesePattern';
import { destinations, provinces } from '../data/gabonContent';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../config/theme';

const ExplorerScreen = ({ navigation }) => {
  const [selectedProvince, setSelectedProvince] = useState(provinces[0]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Image source={selectedProvince.image} style={styles.heroImage} resizeMode="cover" />
        <LinearGradient colors={['rgba(6,77,44,0.18)', 'rgba(17,17,17,0.92)']} style={styles.heroGradient} />
        <GabonesePattern variant="header" style={styles.heroPattern} />
        <View style={styles.heroContent}>
          <Text style={styles.kicker}>Les 9 provinces</Text>
          <Text style={styles.title}>Découvrir le Gabon au-delà de Libreville</Text>
          <Text style={styles.subtitle}>Une carte culturelle, patrimoniale et géographique pour parcourir le pays à votre rythme.</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Carte stylisée du Gabon</Text>
        <View style={styles.provinceGrid}>
          {provinces.map((province) => (
            <TouchableOpacity
              key={province.id}
              style={[styles.provinceTile, { borderColor: province.color }, selectedProvince.id === province.id && styles.provinceTileActive]}
              activeOpacity={0.9}
              onPress={() => setSelectedProvince(province)}
            >
              <View style={[styles.provinceDot, { backgroundColor: province.color }]} />
              <Text style={styles.provinceName}>{province.name}</Text>
              <Text style={styles.provinceCity}>{province.city}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.detailCard}>
          <Image source={selectedProvince.image} style={styles.detailImage} />
          <View style={styles.detailBody}>
            <Text style={styles.detailLabel}>Province sélectionnée</Text>
            <Text style={styles.detailName}>{selectedProvince.name}</Text>
            <Text style={styles.detailDescription}>{selectedProvince.description}</Text>
            <View style={styles.highlightRow}>
              {selectedProvince.highlights.map((item) => (
                <View key={item} style={styles.highlightChip}><Text style={styles.highlightText}>{item}</Text></View>
              ))}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Libreville en 20 lieux</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.destinationRow}>
          {destinations.slice(0, 8).map((destination) => (
            <TouchableOpacity key={destination.id} style={styles.destinationCard} onPress={() => navigation.navigate('DestinationDetail', { destination })}>
              <Image source={destination.image} style={styles.destinationImage} />
              <LinearGradient colors={['transparent', 'rgba(17,17,17,0.9)']} style={styles.destinationOverlay} />
              <View style={styles.destinationBody}>
                <Text style={styles.destinationTag}>{destination.category}</Text>
                <Text style={styles.destinationNameText}>{destination.name}</Text>
                <Text style={styles.destinationMeta}>{destination.interest}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Roadmap')}><Text style={styles.actionText}>Créer une roadmap</Text></TouchableOpacity>
          <TouchableOpacity style={styles.actionButtonSecondary} onPress={() => navigation.navigate('Events')}><Text style={styles.actionTextSecondary}>Explorer la culture</Text></TouchableOpacity>
        </View>
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
  hero: { minHeight: 420, position: 'relative' },
  heroImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  heroPattern: { top: 0, height: 90 },
  heroContent: { flex: 1, justifyContent: 'flex-end', padding: SPACING.xl },
  kicker: { ...TYPOGRAPHY.labelSmall, color: COLORS.jauneGabon, marginBottom: SPACING.xs },
  title: { ...TYPOGRAPHY.displayMedium, color: COLORS.ivoire, marginBottom: SPACING.sm },
  subtitle: { ...TYPOGRAPHY.bodyMedium, color: 'rgba(255,248,231,0.9)' },
  section: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.xl },
  sectionTitle: { ...TYPOGRAPHY.displaySmall, color: COLORS.textPrimary, marginBottom: SPACING.md },
  provinceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  provinceTile: { width: '48%', minHeight: 104, borderRadius: 22, backgroundColor: COLORS.surface, borderWidth: 1, padding: SPACING.md, justifyContent: 'center', ...SHADOWS.sm },
  provinceTileActive: { transform: [{ scale: 1.01 }], shadowOpacity: 0.14 },
  provinceDot: { width: 12, height: 12, borderRadius: 6, marginBottom: SPACING.sm },
  provinceName: { ...TYPOGRAPHY.labelLarge, color: COLORS.textPrimary },
  provinceCity: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary },
  detailCard: { borderRadius: 28, overflow: 'hidden', backgroundColor: COLORS.surface, ...SHADOWS.md },
  detailImage: { width: '100%', height: 180 },
  detailBody: { padding: SPACING.lg, gap: SPACING.sm },
  detailLabel: { ...TYPOGRAPHY.labelSmall, color: COLORS.vertGabon },
  detailName: { ...TYPOGRAPHY.displaySmall, color: COLORS.textPrimary },
  detailDescription: { ...TYPOGRAPHY.bodyMedium, color: COLORS.textSecondary },
  highlightRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.xs },
  highlightChip: { backgroundColor: COLORS.brumeVerte, borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs },
  highlightText: { ...TYPOGRAPHY.labelSmall, color: COLORS.vertForet },
  destinationRow: { gap: SPACING.md, paddingRight: SPACING.xl },
  destinationCard: { width: 220, height: 220, borderRadius: 26, overflow: 'hidden', ...SHADOWS.md },
  destinationImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  destinationOverlay: { ...StyleSheet.absoluteFillObject },
  destinationBody: { flex: 1, justifyContent: 'flex-end', padding: SPACING.md },
  destinationTag: { ...TYPOGRAPHY.labelSmall, color: COLORS.jauneGabon },
  destinationNameText: { ...TYPOGRAPHY.labelLarge, color: COLORS.ivoire },
  destinationMeta: { ...TYPOGRAPHY.bodySmall, color: 'rgba(255,248,231,0.86)' },
  actionRow: { flexDirection: 'row', gap: SPACING.sm },
  actionButton: { flex: 1, minHeight: 54, borderRadius: RADIUS.full, backgroundColor: COLORS.vertGabon, alignItems: 'center', justifyContent: 'center' },
  actionButtonSecondary: { flex: 1, minHeight: 54, borderRadius: RADIUS.full, backgroundColor: COLORS.ivoire, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.ligneDouce },
  actionText: { ...TYPOGRAPHY.labelLarge, color: COLORS.ivoire },
  actionTextSecondary: { ...TYPOGRAPHY.labelLarge, color: COLORS.vertForet },
});

export default ExplorerScreen;
