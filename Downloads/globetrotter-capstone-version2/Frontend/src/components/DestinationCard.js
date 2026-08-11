import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../config/theme';

const DestinationCard = ({ destination, isFavorite, onPress, onToggleFavorite }) => {
  let imageSource = require('../assets/placeholder.jpg');
  if (destination.image) {
    if (typeof destination.image === 'string' && (destination.image.startsWith('http://') || destination.image.startsWith('https://'))) {
      imageSource = { uri: destination.image };
    } else {
      imageSource = { uri: `http://10.0.2.2:5000/assets/${destination.image}` };
    }
  }

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => onPress(destination)}
      activeOpacity={0.9}
    >
      {/* Image */}
      <Image source={imageSource} style={styles.image} resizeMode="cover" />
      
      {/* Favorite Button */}
      <TouchableOpacity
        style={styles.favoriteButton}
        onPress={() => onToggleFavorite(destination.name)}
        activeOpacity={0.7}
      >
        <Icon 
          name="heart" 
          size={20} 
          color={isFavorite ? COLORS.rosePoudre : COLORS.textSecondary}
          fill={isFavorite ? COLORS.rosePoudre : 'transparent'}
        />
      </TouchableOpacity>

      {/* Content */}
      <View style={styles.content}>
        {/* Meta */}
        <View style={styles.meta}>
          <Text style={styles.metaText}>{destination.country}</Text>
          <Text style={styles.metaText}>
            {new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: 'XAF',
              maximumFractionDigits: 0,
            }).format(destination.avg_cost_per_day)}/jour
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={1}>
          {destination.name}
        </Text>

        {/* Description */}
        <Text style={styles.description} numberOfLines={2}>
          {destination.description}
        </Text>

        {/* Tags */}
        <View style={styles.tags}>
          {(destination.tags || []).slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  image: {
    width: '100%',
    height: 200,
  },
  favoriteButton: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  content: {
    padding: SPACING.lg,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  metaText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  title: {
    ...TYPOGRAPHY.labelLarge,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  description: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  tag: {
    paddingVertical: 6,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.bleuClair,
    borderRadius: RADIUS.full,
  },
  tagText: {
    ...TYPOGRAPHY.labelSmall,
    color: COLORS.primary,
    fontSize: 11,
  },
});

export default DestinationCard;
