import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { destinationsAPI, favoritesAPI } from '../services/api';
import DestinationCard from '../components/DestinationCard';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../config/theme';

const FavoritesScreen = ({ navigation }) => {
  const [destinations, setDestinations] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [allDestinations, favoriteNames] = await Promise.all([
        destinationsAPI.getAll(),
        favoritesAPI.getAll(),
      ]);
      
      // Filter only favorite destinations
      const favoriteDestinations = allDestinations.filter(dest =>
        favoriteNames.includes(dest.name)
      );
      
      setDestinations(favoriteDestinations);
      setFavorites(favoriteNames);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation, loadData]);

  const handleToggleFavorite = async (destinationName) => {
    try {
      const newFavorites = await favoritesAPI.remove(destinationName);
      setFavorites(newFavorites);
      
      // Remove from displayed destinations
      setDestinations(prev => prev.filter(dest => dest.name !== destinationName));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.eyebrow}>
        <Text style={styles.eyebrowText}>FAVORIS</Text>
      </View>
      <Text style={styles.title}>Votre collection d'envies</Text>
      <Text style={styles.description}>
        Les lieux gardés de côté deviennent la base de vos prochains
        itinéraires
      </Text>
      <Text style={styles.count}>
        {destinations.length} destination{destinations.length > 1 ? 's' : ''}
      </Text>
    </View>
  );

  const renderDestination = ({ item }) => (
    <DestinationCard
      destination={item}
      isFavorite={true}
      onPress={(dest) =>
        navigation.navigate('DestinationDetail', { destination: dest })
      }
      onToggleFavorite={handleToggleFavorite}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="heart" size={64} color={COLORS.textMuted} />
      <Text style={styles.emptyTitle}>Aucun favori pour le moment</Text>
      <Text style={styles.emptyText}>
        Ajoutez des destinations depuis l'accueil ou l'explorer
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={destinations}
        renderItem={renderDestination}
        keyExtractor={(item) => item.name}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!loading && renderEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: SPACING.xl,
    paddingBottom: SPACING.xxxl,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  eyebrow: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.rosePoudre,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.sm,
  },
  eyebrowText: {
    ...TYPOGRAPHY.labelSmall,
    color: COLORS.primary,
  },
  title: {
    ...TYPOGRAPHY.displaySmall,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  description: {
    ...TYPOGRAPHY.bodyLarge,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  count: {
    ...TYPOGRAPHY.labelMedium,
    color: COLORS.textMuted,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
  },
  emptyTitle: {
    ...TYPOGRAPHY.labelLarge,
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textMuted,
    textAlign: 'center',
    maxWidth: 300,
  },
});

export default FavoritesScreen;
