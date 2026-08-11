import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { destinations, transportModes } from '../data/gabonContent';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../config/theme';

const DestinationDetailScreen = ({ route, navigation }) => {
  const routeDestination = route.params?.destination;
  const destination = destinations.find((item) => item.id === routeDestination?.id) || routeDestination || destinations[0];
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTransport, setActiveTransport] = useState('taxi');

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroContainer}>
          <Image source={destination.image} style={styles.heroImage} resizeMode="cover" />
          <LinearGradient colors={['transparent', 'rgba(17,17,17,0.88)']} style={styles.heroGradient} />
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><Icon name="arrow-left" size={24} color={COLORS.ivoire} /></TouchableOpacity>
          <TouchableOpacity style={styles.favoriteButton} onPress={() => setIsFavorite(!isFavorite)}>
            <Icon name="heart" size={22} color={isFavorite ? COLORS.jauneGabon : COLORS.ivoire} fill={isFavorite ? COLORS.jauneGabon : 'transparent'} />
          </TouchableOpacity>

          <View style={styles.heroContent}>
            <Text style={styles.badge}>{destination.badge || 'Libreville'}</Text>
            <Text style={styles.title}>{destination.name}</Text>
            <Text style={styles.location}>{destination.city}, {destination.province}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.metaCard}>
            <View style={styles.metaItem}><Text style={styles.metaValue}>{destination.rating || '4.8'}</Text><Text style={styles.metaLabel}>note</Text></View>
            <View style={styles.metaItem}><Text style={styles.metaValue}>{destination.duration}</Text><Text style={styles.metaLabel}>durée</Text></View>
            <View style={styles.metaItem}><Text style={styles.metaValue}>{destination.cost}</Text><Text style={styles.metaLabel}>prix</Text></View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>À ressentir sur place</Text>
            <Text style={styles.sectionText}>{destination.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choisir son transport</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.transportRow}>
              {transportModes.map((item) => (
                <TouchableOpacity key={item.id} style={[styles.transportCard, activeTransport === item.id && styles.transportCardActive]} onPress={() => setActiveTransport(item.id)}>
                  <Text style={[styles.transportLabel, activeTransport === item.id && styles.transportLabelActive]}>{item.label}</Text>
                  <Text style={[styles.transportPrice, activeTransport === item.id && styles.transportPriceActive]}>{item.price}</Text>
                  <Text style={[styles.transportTime, activeTransport === item.id && styles.transportTimeActive]}>{item.time}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Parcours recommandé</Text>
            <View style={styles.routeCard}>
              <Text style={styles.routeLineText}>Départ depuis le centre-ville</Text>
              <Text style={styles.routeLineText}>Rejoindre le Boulevard de l’Indépendance</Text>
              <Text style={styles.routeLineText}>Longer le front de mer</Text>
              <Text style={styles.routeLineText}>Arrivée à la destination</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.primaryAction} onPress={() => navigation.navigate('Navigation', { destination })}>
              <Text style={styles.primaryActionText}>Démarrer la navigation</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryAction} onPress={() => navigation.navigate('Roadmap')}>
              <Text style={styles.secondaryActionText}>Ajouter à ma roadmap</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 130 },
  heroContainer: { height: 420, position: 'relative' },
  heroImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  backButton: { position: 'absolute', top: SPACING.lg, left: SPACING.lg, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  favoriteButton: { position: 'absolute', top: SPACING.lg, right: SPACING.lg, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  heroContent: { position: 'absolute', bottom: SPACING.xl, left: SPACING.xl, right: SPACING.xl },
  badge: { alignSelf: 'flex-start', paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, backgroundColor: COLORS.jauneGabon, borderRadius: RADIUS.full, marginBottom: SPACING.sm, ...SHADOWS.sm },
  title: { ...TYPOGRAPHY.displayMedium, color: COLORS.ivoire, marginBottom: SPACING.xs },
  location: { ...TYPOGRAPHY.bodyMedium, color: 'rgba(255,248,231,0.9)' },
  content: { backgroundColor: COLORS.background, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, marginTop: -24, padding: SPACING.xl, gap: SPACING.xl },
  metaCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.surface, borderRadius: 28, padding: SPACING.lg, ...SHADOWS.md },
  metaItem: { flex: 1, alignItems: 'center' },
  metaValue: { ...TYPOGRAPHY.labelLarge, color: COLORS.vertForet },
  metaLabel: { ...TYPOGRAPHY.bodySmall, color: COLORS.textMuted },
  section: { gap: SPACING.sm },
  sectionTitle: { ...TYPOGRAPHY.displaySmall, color: COLORS.textPrimary },
  sectionText: { ...TYPOGRAPHY.bodyMedium, color: COLORS.textSecondary },
  transportRow: { gap: SPACING.sm, paddingRight: SPACING.xl },
  transportCard: { width: 132, backgroundColor: COLORS.surface, borderRadius: 24, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.ligneDouce, gap: SPACING.xs, ...SHADOWS.sm },
  transportCardActive: { backgroundColor: COLORS.vertGabon, borderColor: COLORS.vertGabon },
  transportLabel: { ...TYPOGRAPHY.labelLarge, color: COLORS.textPrimary },
  transportLabelActive: { color: COLORS.ivoire },
  transportPrice: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary },
  transportPriceActive: { color: 'rgba(255,248,231,0.88)' },
  transportTime: { ...TYPOGRAPHY.bodySmall, color: COLORS.textMuted },
  transportTimeActive: { color: 'rgba(255,248,231,0.72)' },
  routeCard: { backgroundColor: COLORS.surface, borderRadius: 28, padding: SPACING.lg, ...SHADOWS.md, gap: SPACING.sm },
  routeLineText: { ...TYPOGRAPHY.bodyMedium, color: COLORS.textSecondary },
  actionRow: { flexDirection: 'row', gap: SPACING.sm },
  primaryAction: { flex: 1, minHeight: 54, borderRadius: RADIUS.full, backgroundColor: COLORS.vertGabon, alignItems: 'center', justifyContent: 'center' },
  primaryActionText: { ...TYPOGRAPHY.labelLarge, color: COLORS.ivoire },
  secondaryAction: { flex: 1, minHeight: 54, borderRadius: RADIUS.full, backgroundColor: COLORS.ivoire, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.ligneDouce },
  secondaryActionText: { ...TYPOGRAPHY.labelLarge, color: COLORS.vertForet },
});

export default DestinationDetailScreen;
