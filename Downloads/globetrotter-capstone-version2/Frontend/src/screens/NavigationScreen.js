import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { destinations, transportModes } from '../data/gabonContent';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../config/theme';

const NavigationScreen = ({ route, navigation }) => {
  const destination = route.params?.destination || destinations[0];
  const [selectedTransport, setSelectedTransport] = useState('taxi');
  const transport = transportModes.find((item) => item.id === selectedTransport) || transportModes[0];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.mapCard}>
        <LinearGradient colors={[COLORS.vertForet, COLORS.vertGabon, COLORS.bleuGabon]} style={styles.mapGradient} />
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.circleButton} onPress={() => navigation.goBack()}><Icon name="arrow-left" size={20} color={COLORS.ivoire} /></TouchableOpacity>
          <Text style={styles.destinationLabel}>{destination.name}</Text>
          <TouchableOpacity style={styles.circleButton}><Icon name="compass" size={20} color={COLORS.ivoire} /></TouchableOpacity>
        </View>

        <View style={styles.routeSummary}>
          <Text style={styles.routeText}>18 min</Text>
          <Text style={styles.routeSubtext}>4,2 km • {transport.label} • {transport.price}</Text>
        </View>

        <View style={styles.routeDiagram}>
          <View style={styles.startDot} />
          <View style={styles.routeLine} />
          <View style={styles.endDot} />
        </View>

        <View style={styles.liveBadge}><Text style={styles.liveText}>Navigation </Text></View>
      </View>

      <View style={styles.section}>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Destination</Text>
          <Text style={styles.infoTitle}>{destination.name}</Text>
          <Text style={styles.infoText}>Continuer sur le Boulevard de l’Indépendance, puis rejoindre le front de mer.</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}><Text style={styles.statValue}>18 min</Text><Text style={styles.statLabel}>temps restant</Text></View>
            <View style={styles.stat}><Text style={styles.statValue}>4,2 km</Text><Text style={styles.statLabel}>distance</Text></View>
            <View style={styles.stat}><Text style={styles.statValue}>≈ 2 000 FCFA</Text><Text style={styles.statLabel}>prix</Text></View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Changer de transport</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.transportRow}>
          {transportModes.map((item) => (
            <TouchableOpacity key={item.id} style={[styles.transportCard, selectedTransport === item.id && styles.transportCardActive]} onPress={() => setSelectedTransport(item.id)}>
              <Icon name={item.icon} size={18} color={selectedTransport === item.id ? COLORS.ivoire : COLORS.textPrimary} />
              <Text style={[styles.transportLabel, selectedTransport === item.id && styles.transportLabelActive]}>{item.label}</Text>
              <Text style={[styles.transportPrice, selectedTransport === item.id && styles.transportPriceActive]}>{item.price}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instructions étape par étape</Text>
        <View style={styles.stepCard}>
          <Text style={styles.stepMain}>Continuer sur le Boulevard de l’Indépendance</Text>
          <Text style={styles.stepSub}>Dans 600 m</Text>
          <Text style={styles.stepNext}>Tourner vers le front de mer</Text>
          <View style={styles.contextRow}>
            <View style={styles.contextChip}><Text style={styles.contextText}>À proximité: Marché artisanal</Text></View>
            <View style={styles.contextChip}><Text style={styles.contextText}>Point photo: océan</Text></View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.primaryAction}><Text style={styles.primaryActionText}>Pause</Text></TouchableOpacity>
          <TouchableOpacity style={styles.secondaryAction}><Text style={styles.secondaryActionText}>Terminer</Text></TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: 130 },
  mapCard: { margin: SPACING.xl, borderRadius: 32, minHeight: 420, overflow: 'hidden', ...SHADOWS.lg },
  mapGradient: { ...StyleSheet.absoluteFillObject },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md },
  circleButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,248,231,0.14)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,248,231,0.18)' },
  destinationLabel: { ...TYPOGRAPHY.labelLarge, color: COLORS.ivoire },
  routeSummary: { paddingHorizontal: SPACING.lg, marginTop: SPACING.xl },
  routeText: { ...TYPOGRAPHY.displayMedium, color: COLORS.ivoire },
  routeSubtext: { ...TYPOGRAPHY.bodyMedium, color: 'rgba(255,248,231,0.88)' },
  routeDiagram: { position: 'absolute', right: 34, top: 150, width: 120, height: 180, alignItems: 'center' },
  startDot: { width: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.jauneGabon, borderWidth: 4, borderColor: COLORS.ivoire },
  routeLine: { width: 4, flex: 1, backgroundColor: 'rgba(255,248,231,0.78)', marginVertical: 6, borderRadius: 2 },
  endDot: { width: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.ivoire, borderWidth: 4, borderColor: COLORS.jauneGabon },
  liveBadge: { alignSelf: 'flex-start', marginHorizontal: SPACING.lg, marginTop: SPACING.lg, backgroundColor: 'rgba(255,248,231,0.18)', borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs },
  liveText: { ...TYPOGRAPHY.labelSmall, color: COLORS.ivoire },
  section: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.xl },
  sectionTitle: { ...TYPOGRAPHY.displaySmall, color: COLORS.textPrimary, marginBottom: SPACING.md },
  infoCard: { backgroundColor: COLORS.surface, borderRadius: 28, padding: SPACING.lg, ...SHADOWS.md },
  infoLabel: { ...TYPOGRAPHY.labelSmall, color: COLORS.vertGabon },
  infoTitle: { ...TYPOGRAPHY.displaySmall, color: COLORS.textPrimary, marginBottom: SPACING.xs },
  infoText: { ...TYPOGRAPHY.bodyMedium, color: COLORS.textSecondary },
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.lg, flexWrap: 'wrap' },
  stat: { flex: 1, minWidth: 96, borderRadius: 20, backgroundColor: COLORS.ivoire, padding: SPACING.md },
  statValue: { ...TYPOGRAPHY.labelLarge, color: COLORS.vertForet },
  statLabel: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary },
  transportRow: { gap: SPACING.sm, paddingRight: SPACING.xl },
  transportCard: { width: 146, borderRadius: 24, backgroundColor: COLORS.surface, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.ligneDouce, gap: SPACING.xs, ...SHADOWS.sm },
  transportCardActive: { backgroundColor: COLORS.vertGabon, borderColor: COLORS.vertGabon },
  transportLabel: { ...TYPOGRAPHY.labelLarge, color: COLORS.textPrimary },
  transportLabelActive: { color: COLORS.ivoire },
  transportPrice: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary },
  transportPriceActive: { color: 'rgba(255,248,231,0.88)' },
  stepCard: { backgroundColor: COLORS.surface, borderRadius: 28, padding: SPACING.lg, gap: SPACING.xs, ...SHADOWS.md },
  stepMain: { ...TYPOGRAPHY.labelLarge, color: COLORS.textPrimary },
  stepSub: { ...TYPOGRAPHY.bodySmall, color: COLORS.vertGabon },
  stepNext: { ...TYPOGRAPHY.bodyMedium, color: COLORS.textSecondary, marginTop: SPACING.xs },
  contextRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.sm },
  contextChip: { backgroundColor: COLORS.brumeVerte, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.full },
  contextText: { ...TYPOGRAPHY.labelSmall, color: COLORS.vertForet },
  actionRow: { flexDirection: 'row', gap: SPACING.sm },
  primaryAction: { flex: 1, minHeight: 54, borderRadius: RADIUS.full, backgroundColor: COLORS.vertGabon, alignItems: 'center', justifyContent: 'center' },
  primaryActionText: { ...TYPOGRAPHY.labelLarge, color: COLORS.ivoire },
  secondaryAction: { flex: 1, minHeight: 54, borderRadius: RADIUS.full, backgroundColor: COLORS.ivoire, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.ligneDouce },
  secondaryActionText: { ...TYPOGRAPHY.labelLarge, color: COLORS.vertForet },
});

export default NavigationScreen;
