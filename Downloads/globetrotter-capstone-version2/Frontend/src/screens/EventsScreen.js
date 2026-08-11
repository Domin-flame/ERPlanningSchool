import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import GabonesePattern from '../components/GabonesePattern';
import { culturalEvents } from '../data/gabonContent';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../config/theme';

const EVENT_FILTERS = [
  { id: 'all', label: 'Tous', icon: 'grid' },
  { id: 'concert', label: 'Concert', icon: 'music' },
  { id: 'culture', label: 'Culture', icon: 'book' },
  { id: 'danse', label: 'Danse', icon: 'activity' },
  { id: 'exposition', label: 'Exposition', icon: 'image' },
  { id: 'market', label: 'Marché', icon: 'shopping-bag' },
  { id: 'food', label: 'Gastronomie', icon: 'coffee' },
  { id: 'festival', label: 'Festival', icon: 'calendar' },
];

const EventsScreen = ({ navigation }) => {
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filtered = selectedFilter === 'all'
    ? culturalEvents
    : culturalEvents.filter((item) => item.tag.toLowerCase().includes(selectedFilter.toLowerCase()) || item.title.toLowerCase().includes(selectedFilter.toLowerCase()));

  const mainEvent = culturalEvents[0];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <GabonesePattern variant="header" style={styles.pattern} />
        <LinearGradient colors={[COLORS.vertForet, COLORS.vertGabon, COLORS.bleuGabon]} style={styles.heroGradient} />
        <Text style={styles.kicker}>Événements culturels</Text>
        <Text style={styles.title}>Vivre le Gabon à travers ses sons, ses danses et ses traditions</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {EVENT_FILTERS.map((item) => (
          <TouchableOpacity key={item.id} style={[styles.filterChip, selectedFilter === item.id && styles.filterChipActive]} onPress={() => setSelectedFilter(item.id)}>
            <Icon name={item.icon} size={16} color={selectedFilter === item.id ? COLORS.ivoire : COLORS.textPrimary} />
            <Text style={[styles.filterText, selectedFilter === item.id && styles.filterTextActive]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.section}>
        <TouchableOpacity style={styles.mainEventCard} onPress={() => navigation.navigate('Roadmap')}>
          <Image source={mainEvent.image} style={styles.mainImage} />
          <LinearGradient colors={['transparent', 'rgba(17,17,17,0.94)']} style={styles.mainOverlay} />
          <View style={styles.mainBody}>
            <Text style={styles.mainTag}>Gratuit</Text>
            <Text style={styles.mainTitle}>{mainEvent.title}</Text>
            <Text style={styles.mainSubtitle}>{mainEvent.subtitle}</Text>
            <Text style={styles.mainMeta}>{mainEvent.date} • {mainEvent.location}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Programmes à ne pas manquer</Text>
        {filtered.map((event) => (
          <TouchableOpacity key={event.id} style={styles.eventCard} onPress={() => navigation.navigate('Roadmap')}>
            <Image source={event.image} style={styles.eventImage} />
            <View style={styles.eventBody}>
              <View style={styles.eventHeaderRow}>
                <Text style={styles.eventTag}>{event.tag}</Text>
                <Text style={styles.eventPrice}>{event.price}</Text>
              </View>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventSubtitle}>{event.subtitle}</Text>
              <Text style={styles.eventMeta}>{event.date} • {event.location}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Pourquoi y aller</Text>
          <Text style={styles.noteText}>Musique, danse, artisanat et gastronomie se croisent pour raconter la ville autrement.</Text>
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Roadmap')}>
          <Text style={styles.actionButtonText}>Ajouter à ma roadmap</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: 130 },
  heroCard: { margin: SPACING.xl, minHeight: 280, borderRadius: 32, overflow: 'hidden', padding: SPACING.xl, justifyContent: 'flex-end', ...SHADOWS.lg },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  pattern: { ...StyleSheet.absoluteFillObject, opacity: 0.16 },
  kicker: { ...TYPOGRAPHY.labelSmall, color: COLORS.jauneGabon, marginBottom: SPACING.xs },
  title: { ...TYPOGRAPHY.displayMedium, color: COLORS.ivoire },
  filterRow: { gap: SPACING.sm, paddingHorizontal: SPACING.xl },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.ligneDouce },
  filterChipActive: { backgroundColor: COLORS.vertGabon, borderColor: COLORS.vertGabon },
  filterText: { ...TYPOGRAPHY.labelMedium, color: COLORS.textPrimary },
  filterTextActive: { color: COLORS.ivoire },
  section: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.xl },
  sectionTitle: { ...TYPOGRAPHY.displaySmall, color: COLORS.textPrimary, marginBottom: SPACING.md },
  mainEventCard: { borderRadius: 30, overflow: 'hidden', minHeight: 280, ...SHADOWS.lg },
  mainImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  mainOverlay: { ...StyleSheet.absoluteFillObject },
  mainBody: { flex: 1, justifyContent: 'flex-end', padding: SPACING.lg },
  mainTag: { ...TYPOGRAPHY.labelSmall, color: COLORS.jauneGabon, marginBottom: SPACING.xs },
  mainTitle: { ...TYPOGRAPHY.displaySmall, color: COLORS.ivoire, marginBottom: SPACING.xs },
  mainSubtitle: { ...TYPOGRAPHY.bodyMedium, color: 'rgba(255,248,231,0.9)' },
  mainMeta: { ...TYPOGRAPHY.bodySmall, color: 'rgba(255,248,231,0.82)' },
  eventCard: { flexDirection: 'row', borderRadius: 26, overflow: 'hidden', backgroundColor: COLORS.surface, marginBottom: SPACING.md, ...SHADOWS.md },
  eventImage: { width: 92, height: 118 },
  eventBody: { flex: 1, padding: SPACING.md, gap: SPACING.xs },
  eventHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eventTag: { ...TYPOGRAPHY.labelSmall, color: COLORS.vertGabon },
  eventPrice: { ...TYPOGRAPHY.labelSmall, color: COLORS.terreCuite },
  eventTitle: { ...TYPOGRAPHY.labelLarge, color: COLORS.textPrimary },
  eventSubtitle: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary },
  eventMeta: { ...TYPOGRAPHY.bodySmall, color: COLORS.textMuted },
  noteCard: { borderRadius: 28, backgroundColor: COLORS.surface, padding: SPACING.lg, ...SHADOWS.md },
  noteTitle: { ...TYPOGRAPHY.labelLarge, color: COLORS.vertForet, marginBottom: SPACING.xs },
  noteText: { ...TYPOGRAPHY.bodyMedium, color: COLORS.textSecondary },
  actionButton: { minHeight: 54, borderRadius: RADIUS.full, backgroundColor: COLORS.vertGabon, alignItems: 'center', justifyContent: 'center' },
  actionButtonText: { ...TYPOGRAPHY.labelLarge, color: COLORS.ivoire },
});

export default EventsScreen;
