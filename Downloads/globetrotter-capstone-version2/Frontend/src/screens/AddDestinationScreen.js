import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../config/theme';
import { proposalsAPI } from '../services/api';

const AddDestinationScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [city, setCity] = useState('Libreville');
  const [country, setCountry] = useState('Gabon');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [cost, setCost] = useState('');
  const [image, setImage] = useState('g1.jpg');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !description.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir le nom et la description du lieu.');
      return;
    }

    setLoading(true);
    try {
      await proposalsAPI.submit({
        name: name.trim(),
        country: country.trim(),
        continent: 'Afrique',
        city: city.trim(),
        description: description.trim(),
        tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        avg_cost_per_day: parseFloat(cost) || 0,
        image,
      });
      Alert.alert('Succès', 'Votre proposition a été envoyée pour validation admin.', [
        { text: 'Retour', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de soumettre le lieu. Réessayez plus tard.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <LinearGradient colors={[COLORS.vertForet, COLORS.vertGabon, COLORS.bleuGabon]} style={styles.hero} />
      <View style={styles.card}>
        <Text style={styles.title}>Ajouter un nouveau lieu</Text>
        <Text style={styles.subtitle}>Proposez un lieu pour Libreville et partagez-le avec la communauté.</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Nom du lieu</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ex: Jardin botanique" placeholderTextColor={COLORS.textMuted} />
        </View>

        <View style={styles.row}>
          <View style={styles.fieldHalf}>
            <Text style={styles.label}>Ville</Text>
            <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="Libreville" placeholderTextColor={COLORS.textMuted} />
          </View>
          <View style={styles.fieldHalf}>
            <Text style={styles.label}>Pays</Text>
            <TextInput style={styles.input} value={country} onChangeText={setCountry} placeholder="Gabon" placeholderTextColor={COLORS.textMuted} />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="Décrivez le lieu" placeholderTextColor={COLORS.textMuted} multiline />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Catégories / tags</Text>
          <TextInput style={styles.input} value={tags} onChangeText={setTags} placeholder="nature, culture, plage" placeholderTextColor={COLORS.textMuted} />
        </View>

        <View style={styles.row}>
          <View style={styles.fieldHalf}>
            <Text style={styles.label}>Coût moyen</Text>
            <TextInput style={styles.input} value={cost} onChangeText={setCost} placeholder="FCFA" placeholderTextColor={COLORS.textMuted} keyboardType="numeric" />
          </View>
          <View style={styles.fieldHalf}>
            <Text style={styles.label}>Image</Text>
            <View style={styles.placeholderImage}><Text style={styles.placeholderText}>g1.jpg</Text></View>
          </View>
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
          <Text style={styles.submitButtonText}>{loading ? 'Envoi...' : 'Envoyer pour validation'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: 80 },
  hero: { height: 180, width: '100%', position: 'absolute', top: 0, left: 0, right: 0 },
  card: { marginTop: 130, marginHorizontal: SPACING.lg, backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.xl, ...SHADOWS.lg },
  title: { ...TYPOGRAPHY.displayMedium, color: COLORS.textPrimary, marginBottom: SPACING.sm },
  subtitle: { ...TYPOGRAPHY.bodyMedium, color: COLORS.textSecondary, marginBottom: SPACING.lg },
  field: { marginBottom: SPACING.lg },
  fieldHalf: { flex: 1, marginRight: SPACING.sm },
  row: { flexDirection: 'row', gap: SPACING.sm },
  label: { ...TYPOGRAPHY.labelMedium, color: COLORS.textPrimary, marginBottom: SPACING.xs },
  input: { backgroundColor: COLORS.brumeVerte, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.ligneDouce },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  placeholderImage: { backgroundColor: COLORS.bleuGlacier, borderRadius: RADIUS.md, minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: COLORS.ivoire },
  submitButton: { marginTop: SPACING.lg, minHeight: 54, borderRadius: RADIUS.full, backgroundColor: COLORS.vertGabon, alignItems: 'center', justifyContent: 'center' },
  submitButtonText: { ...TYPOGRAPHY.labelLarge, color: COLORS.ivoire },
  cancelButton: { marginTop: SPACING.sm, minHeight: 54, borderRadius: RADIUS.full, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.ligneDouce },
  cancelButtonText: { ...TYPOGRAPHY.labelLarge, color: COLORS.textPrimary },
});

export default AddDestinationScreen;
