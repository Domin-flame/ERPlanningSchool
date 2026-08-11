import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../config/theme';

const ReviewCard = ({ review, currentUser, onDelete }) => {
  const isOwner = review.username === currentUser;
  const date = new Date(review.created_at);
  const formattedDate = date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Icon
        key={i}
        name="star"
        size={16}
        color="#FFB800"
        fill={i < rating ? '#FFB800' : 'transparent'}
      />
    ));
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Icon name="user" size={16} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.username}>{review.username}</Text>
            <Text style={styles.date}>{formattedDate}</Text>
          </View>
        </View>
        {isOwner && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => onDelete(review.id)}
          >
            <Icon name="trash-2" size={18} color={COLORS.error} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.rating}>{renderStars(review.rating)}</View>

      <Text style={styles.comment}>{review.comment}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.bleuGlacier,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bleuClair,
    alignItems: 'center',
    justifyContent: 'center',
  },
  username: {
    ...TYPOGRAPHY.labelMedium,
    color: COLORS.textPrimary,
  },
  date: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textMuted,
    fontSize: 12,
  },
  deleteButton: {
    padding: SPACING.xs,
  },
  rating: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: SPACING.sm,
  },
  comment: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
});

export default ReviewCard;
