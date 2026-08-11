import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { proposalsAPI } from '../services/api';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../config/theme';

const AdminPanelScreen = () => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadProposals = async () => {
    setLoading(true);
    try {
      const data = await proposalsAPI.getAllProposals('pending');
      setProposals(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProposals();
  }, []);

  const handleDecision = async (id, approve) => {
    try {
      if (approve) {
        await proposalsAPI.approve(id, 'Approuvé via l’interface admin.');
      } else {
        await proposalsAPI.reject(id, 'Rejeté via l’interface admin.');
      }
      loadProposals();
      Alert.alert('Succès', approve ? 'Proposition approuvée.' : 'Proposition rejetée.');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour cette proposition.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Espace administrateur</Text>
      <Text style={styles.subtitle}>Approuvez les nouveaux lieux proposés pour Libreville.</Text>

      {proposals.length === 0 && !loading ? (
        <View style={styles.emptyState}>
          <Icon name="check-circle" size={56} color={COLORS.vertGabon} />
          <Text style={styles.emptyTitle}>Aucune proposition en attente</Text>
          <Text style={styles.emptyText}>Les lieux proposés sont traités dès qu’ils sont validés.</Text>
        </View>
      ) : (
        proposals.map((proposal) => (
          <View key={proposal.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{proposal.name}</Text>
              <Text style={styles.cardStatus}>{proposal.status}</Text>
            </View>
            <Text style={styles.cardMeta}>{proposal.city}, {proposal.country}</Text>
            <Text style={styles.cardDescription}>{proposal.description}</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.approveButton} onPress={() => handleDecision(proposal.id, true)}>
                <Text style={styles.approveText}>Approuver</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectButton} onPress={() => handleDecision(proposal.id, false)}>
                <Text style={styles.rejectText}>Rejeter</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.xl, paddingBottom: SPACING.xxxl },
  title: { ...TYPOGRAPHY.displayMedium, color: COLORS.textPrimary, marginBottom: SPACING.sm },
  subtitle: { ...TYPOGRAPHY.bodyMedium, color: COLORS.textSecondary, marginBottom: SPACING.lg },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.xxxl },
  emptyTitle: { ...TYPOGRAPHY.labelLarge, color: COLORS.vertForet, marginTop: SPACING.md },
  emptyText: { ...TYPOGRAPHY.bodyMedium, color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.sm, maxWidth: 320 },
  card: { marginBottom: SPACING.lg, backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.lg, ...SHADOWS.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  cardTitle: { ...TYPOGRAPHY.labelLarge, color: COLORS.textPrimary },
  cardStatus: { ...TYPOGRAPHY.labelSmall, color: COLORS.jauneGabon, textTransform: 'uppercase' },
  cardMeta: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  cardDescription: { ...TYPOGRAPHY.bodyMedium, color: COLORS.textPrimary, marginBottom: SPACING.lg },
  buttonRow: { flexDirection: 'row', gap: SPACING.sm },
  approveButton: { flex: 1, minHeight: 48, borderRadius: RADIUS.full, backgroundColor: COLORS.vertGabon, alignItems: 'center', justifyContent: 'center' },
  approveText: { ...TYPOGRAPHY.labelMedium, color: COLORS.ivoire },
  rejectButton: { flex: 1, minHeight: 48, borderRadius: RADIUS.full, backgroundColor: COLORS.terreCuite, alignItems: 'center', justifyContent: 'center' },
  rejectText: { ...TYPOGRAPHY.labelMedium, color: COLORS.ivoire },
});

export default AdminPanelScreen;
