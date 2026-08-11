import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { destinations, roadmapStops } from '../data/gabonContent';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../config/theme';

const RoadmapScreen = ({ navigation }) => {
  const summary = [
    { value: '5 lieux', label: 'dans la journée' },
    { value: '6h30', label: 'durée totale' },
    { value: '≈ 7 500 FCFA', label: 'budget transport' },
    { value: '18 km', label: 'distance totale' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <LinearGradient colors={[COLORS.vertForet, COLORS.vertGabon, COLORS.bleuGabon]} style={styles.heroGradient} />
        <Text style={styles.kicker}>Ma roadmap</Text>
        <Text style={styles.title}>Composer une journée de découverte à Libreville</Text>
        <Text style={styles.subtitle}>Organisez votre parcours par étape, puis lancez la navigation quand tout est prêt.</Text>
      </View>

      <View style={styles.summaryGrid}>
        {summary.map((item) => (
          <View key={item.label} style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{item.value}</Text>
            <Text style={styles.summaryLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Timeline verticale</Text>
          <TouchableOpacity style={styles.optimizeButton}><Text style={styles.optimizeText}>Optimiser mon parcours</Text></TouchableOpacity>
        </View>

        {roadmapStops.map((stop, index) => (
          <View key={stop.time} style={styles.timelineItem}>
            <View style={styles.timeColumn}>
              <Text style={styles.timeText}>{stop.time}</Text>
              <View style={styles.line} />
            </View>
            <View style={styles.stopCard}>
              <Image source={stop.image} style={styles.stopImage} />
              <View style={styles.stopBody}>
                <View style={styles.stopTopRow}>
                  <Text style={styles.stopIndex}>{String(index + 1).padStart(2, '0')}</Text>
                  <Icon name="move" size={16} color={COLORS.textMuted} />
                </View>
                <Text style={styles.stopName}>{stop.name}</Text>
                <Text style={styles.stopCategory}>{stop.category}</Text>
                <View style={styles.stopActions}>
                  <TouchableOpacity style={styles.stopButton}><Text style={styles.stopButtonText}>Détails</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.removeButton}><Text style={styles.removeButtonText}>Supprimer</Text></TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Optimisation intelligente</Text>
        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>Temps économisé: 42 min</Text>
          <Text style={styles.tipText}>Placer Baie des Rois en fin d’après-midi pour la lumière. Regrouper Musée National et Institut Français.</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.primaryAction} onPress={() => navigation.navigate('Navigation', { destination: destinations[0] })}><Text style={styles.primaryActionText}>Démarrer la roadmap</Text></TouchableOpacity>
          <TouchableOpacity style={styles.secondaryAction}><Text style={styles.secondaryActionText}>Ajouter un événement</Text></TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: 130 },
  heroCard: {
    margin: SPACING.xl,
    marginBottom: SPACING.md,
    borderRadius: 32,
    padding: SPACING.xl,
    minHeight: 240,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  kicker: { ...TYPOGRAPHY.labelSmall, color: COLORS.jauneGabon, marginBottom: SPACING.xs },
  title: { ...TYPOGRAPHY.displayMedium, color: COLORS.ivoire, marginBottom: SPACING.sm },
  subtitle: { ...TYPOGRAPHY.bodyMedium, color: 'rgba(255,248,231,0.9)' },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, paddingHorizontal: SPACING.xl },
  summaryCard: { width: '48%', backgroundColor: COLORS.surface, borderRadius: 24, padding: SPACING.md, ...SHADOWS.sm },
  summaryValue: { ...TYPOGRAPHY.displaySmall, color: COLORS.vertForet },
  summaryLabel: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary },
  section: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  sectionTitle: { ...TYPOGRAPHY.displaySmall, color: COLORS.textPrimary },
  optimizeButton: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, backgroundColor: COLORS.brumeVerte },
  optimizeText: { ...TYPOGRAPHY.labelMedium, color: COLORS.vertForet },
  timelineItem: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md },
  timeColumn: { width: 56, alignItems: 'center' },
  timeText: { ...TYPOGRAPHY.labelMedium, color: COLORS.vertForet },
  line: { width: 2, flex: 1, backgroundColor: COLORS.ligneDouce, marginTop: SPACING.sm },
  stopCard: { flex: 1, borderRadius: 28, backgroundColor: COLORS.surface, overflow: 'hidden', ...SHADOWS.md },
  stopImage: { width: '100%', height: 120 },
  stopBody: { padding: SPACING.md, gap: SPACING.xs },
  stopTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stopIndex: { ...TYPOGRAPHY.labelSmall, color: COLORS.textMuted },
  stopName: { ...TYPOGRAPHY.labelLarge, color: COLORS.textPrimary },
  stopCategory: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary },
  stopActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xs },
  stopButton: { flex: 1, minHeight: 42, borderRadius: RADIUS.full, backgroundColor: COLORS.vertGabon, alignItems: 'center', justifyContent: 'center' },
  stopButtonText: { ...TYPOGRAPHY.labelMedium, color: COLORS.ivoire },
  removeButton: { flex: 1, minHeight: 42, borderRadius: RADIUS.full, backgroundColor: COLORS.ivoire, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.ligneDouce },
  removeButtonText: { ...TYPOGRAPHY.labelMedium, color: COLORS.textPrimary },
  tipCard: { backgroundColor: COLORS.surface, borderRadius: 28, padding: SPACING.lg, ...SHADOWS.md },
  tipTitle: { ...TYPOGRAPHY.labelLarge, color: COLORS.vertForet, marginBottom: SPACING.xs },
  tipText: { ...TYPOGRAPHY.bodyMedium, color: COLORS.textSecondary },
  actionRow: { flexDirection: 'row', gap: SPACING.sm },
  primaryAction: { flex: 1, minHeight: 54, borderRadius: RADIUS.full, backgroundColor: COLORS.vertGabon, alignItems: 'center', justifyContent: 'center' },
  primaryActionText: { ...TYPOGRAPHY.labelLarge, color: COLORS.ivoire },
  secondaryAction: { flex: 1, minHeight: 54, borderRadius: RADIUS.full, backgroundColor: COLORS.ivoire, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.ligneDouce },
  secondaryActionText: { ...TYPOGRAPHY.labelLarge, color: COLORS.vertForet },
});

export default RoadmapScreen;
