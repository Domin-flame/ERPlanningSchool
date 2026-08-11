import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {
  destinationsAPI,
  favoritesAPI,
  visitedAPI,
  favoriteNotesAPI,
} from '../services/api';
import DestinationCard from '../components/DestinationCard';
import Button from '../components/Button';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../config/theme';

const FavoritesVisitedScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('favorites'); // 'favorites' or 'visited'
  const [destinations, setDestinations] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [visited, setVisited] = useState([]);
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(false);
  
  // Modal state
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [noteForm, setNoteForm] = useState({
    note: '',
    visit_date: '',
    companions: '',
    budget: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [allDestinations, favoriteNames, visitedNames, favoriteNotes] = await Promise.all([
        destinationsAPI.getAll(),
        favoritesAPI.getAll(),
        visitedAPI.getAll(),
        favoriteNotesAPI.getAll(),
      ]);
      
      setFavorites(favoriteNames);
      setVisited(visitedNames);
      setNotes(favoriteNotes);
      
      // Filter destinations based on active tab
      const displayNames = activeTab === 'favorites' ? favoriteNames : visitedNames;
      const filtered = allDestinations.filter(dest =>
        displayNames.includes(dest.name)
      );
      
      setDestinations(filtered);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation, loadData]);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleToggleFavorite = async (destinationName) => {
    try {
      const newFavorites = await favoritesAPI.remove(destinationName);
      setFavorites(newFavorites);
      
      if (activeTab === 'favorites') {
        setDestinations(prev => prev.filter(dest => dest.name !== destinationName));
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const handleOpenNote = async (destination) => {
    setSelectedDestination(destination);
    
    // Load existing note if any
    try {
      const existingNote = await favoriteNotesAPI.get(destination.name);
      if (existingNote && Object.keys(existingNote).length > 0) {
        setNoteForm({
          note: existingNote.note || '',
          visit_date: existingNote.visit_date || '',
          companions: existingNote.companions || '',
          budget: existingNote.budget ? String(existingNote.budget) : '',
        });
      } else {
        setNoteForm({ note: '', visit_date: '', companions: '', budget: '' });
      }
    } catch (error) {
      console.error('Error loading note:', error);
    }
    
    setShowNoteModal(true);
  };

  const handleSaveNote = async () => {
    if (!selectedDestination) return;

    try {
      const noteData = {
        note: noteForm.note.trim(),
        visit_date: noteForm.visit_date.trim(),
        companions: noteForm.companions.trim(),
        budget: noteForm.budget ? parseFloat(noteForm.budget) : null,
      };

      await favoriteNotesAPI.save(selectedDestination.name, noteData);
      
      // Update local notes
      setNotes(prev => ({
        ...prev,
        [selectedDestination.name]: noteData,
      }));

      setShowNoteModal(false);
      Alert.alert('Succès', 'Note sauvegardée');
    } catch (error) {
      console.error('Error saving note:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder la note');
    }
  };

  const renderDestinationWithNote = ({ item }) => {
    const hasNote = notes[item.name] && notes[item.name].note;
    
    return (
      <View style={styles.destinationContainer}>
        <DestinationCard
          destination={item}
          isFavorite={favorites.includes(item.name)}
          onPress={(dest) =>
            navigation.navigate('DestinationDetail', { destination: dest })
          }
          onToggleFavorite={handleToggleFavorite}
        />
        
        {activeTab === 'favorites' && (
          <TouchableOpacity
            style={styles.noteButton}
            onPress={() => handleOpenNote(item)}
          >
            <Icon
              name={hasNote ? 'edit-2' : 'plus-circle'}
              size={20}
              color={COLORS.primary}
            />
            <Text style={styles.noteButtonText}>
              {hasNote ? 'Modifier la note' : 'Ajouter une note'}
            </Text>
          </TouchableOpacity>
        )}

        {hasNote && (
          <View style={styles.notePreview}>
            <Icon name="file-text" size={16} color={COLORS.textSecondary} />
            <Text style={styles.notePreviewText} numberOfLines={2}>
              {notes[item.name].note}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'favorites' && styles.tabActive]}
          onPress={() => setActiveTab('favorites')}
        >
          <Icon
            name="heart"
            size={20}
            color={activeTab === 'favorites' ? COLORS.surface : COLORS.textPrimary}
          />
          <Text
            style={[styles.tabText, activeTab === 'favorites' && styles.tabTextActive]}
          >
            Favoris
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'visited' && styles.tabActive]}
          onPress={() => setActiveTab('visited')}
        >
          <Icon
            name="check-circle"
            size={20}
            color={activeTab === 'visited' ? COLORS.surface : COLORS.textPrimary}
          />
          <Text
            style={[styles.tabText, activeTab === 'visited' && styles.tabTextActive]}
          >
            Visités
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.eyebrow}>
        <Text style={styles.eyebrowText}>
          {activeTab === 'favorites' ? 'FAVORIS' : 'DESTINATIONS VISITÉES'}
        </Text>
      </View>
      
      <Text style={styles.title}>
        {activeTab === 'favorites'
          ? 'Votre collection d\'envies'
          : 'Vos voyages accomplis'}
      </Text>
      
      <Text style={styles.description}>
        {activeTab === 'favorites'
          ? 'Les lieux gardés de côté deviennent la base de vos prochains itinéraires'
          : 'Revivez vos aventures et partagez vos expériences'}
      </Text>
      
      <Text style={styles.count}>
        {destinations.length} destination{destinations.length > 1 ? 's' : ''}
      </Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon
        name={activeTab === 'favorites' ? 'heart' : 'map-pin'}
        size={64}
        color={COLORS.textMuted}
      />
      <Text style={styles.emptyTitle}>
        {activeTab === 'favorites'
          ? 'Aucun favori pour le moment'
          : 'Aucune destination visitée'}
      </Text>
      <Text style={styles.emptyText}>
        {activeTab === 'favorites'
          ? 'Ajoutez des destinations depuis l\'accueil ou l\'explorer'
          : 'Marquez les destinations que vous avez visitées'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={destinations}
        renderItem={renderDestinationWithNote}
        keyExtractor={(item) => item.name}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!loading && renderEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} />
        }
      />

      {/* Note Modal */}
      <Modal
        visible={showNoteModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNoteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Note personnelle</Text>
              <TouchableOpacity onPress={() => setShowNoteModal(false)}>
                <Icon name="x" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>{selectedDestination?.name}</Text>

            <Text style={styles.inputLabel}>Vos notes</Text>
            <TextInput
              style={styles.textArea}
              value={noteForm.note}
              onChangeText={(text) => setNoteForm({ ...noteForm, note: text })}
              placeholder="Ex: Je veux absolument voir le coucher de soleil..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <Text style={styles.inputLabel}>Date de visite souhaitée</Text>
            <TextInput
              style={styles.input}
              value={noteForm.visit_date}
              onChangeText={(text) => setNoteForm({ ...noteForm, visit_date: text })}
              placeholder="Ex: Été 2025"
            />

            <Text style={styles.inputLabel}>Avec qui ?</Text>
            <TextInput
              style={styles.input}
              value={noteForm.companions}
              onChangeText={(text) => setNoteForm({ ...noteForm, companions: text })}
              placeholder="Ex: En famille, entre amis..."
            />

            <Text style={styles.inputLabel}>Budget prévu (€)</Text>
            <TextInput
              style={styles.input}
              value={noteForm.budget}
              onChangeText={(text) => setNoteForm({ ...noteForm, budget: text })}
              placeholder="Ex: 2000"
              keyboardType="numeric"
            />

            <Button title="Sauvegarder" onPress={handleSaveNote} />
          </View>
        </View>
      </Modal>
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
    paddingBottom: SPACING.xxxl + 80,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  tabs: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
    padding: 6,
    backgroundColor: COLORS.bleuClair,
    borderRadius: RADIUS.lg,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    ...TYPOGRAPHY.labelMedium,
    color: COLORS.textPrimary,
  },
  tabTextActive: {
    color: COLORS.surface,
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
  destinationContainer: {
    marginBottom: SPACING.md,
  },
  noteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginTop: -SPACING.md,
    marginBottom: SPACING.sm,
  },
  noteButtonText: {
    ...TYPOGRAPHY.labelMedium,
    color: COLORS.primary,
  },
  notePreview: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.bleuClair,
    borderRadius: RADIUS.md,
    marginTop: -SPACING.sm,
    marginBottom: SPACING.md,
  },
  notePreviewText: {
    flex: 1,
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.xl,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  modalTitle: {
    ...TYPOGRAPHY.displaySmall,
    fontSize: 24,
    color: COLORS.textPrimary,
  },
  modalSubtitle: {
    ...TYPOGRAPHY.bodyLarge,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  inputLabel: {
    ...TYPOGRAPHY.labelMedium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    marginTop: SPACING.md,
  },
  input: {
    height: 48,
    borderWidth: 2,
    borderColor: COLORS.bleuGlacier,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textPrimary,
  },
  textArea: {
    height: 100,
    borderWidth: 2,
    borderColor: COLORS.bleuGlacier,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textPrimary,
  },
});

export default FavoritesVisitedScreen;
