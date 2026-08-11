import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../config/theme';

const GabonesePattern = ({ style, variant = 'header' }) => {
  const renderHeaderPattern = () => (
    <View style={[styles.patternContainer, styles.headerPattern, style]}>
      <View style={styles.patternRow}>
        <View style={[styles.diamond, styles.diamond1]} />
        <View style={[styles.diamond, styles.diamond2]} />
        <View style={[styles.diamond, styles.diamond3]} />
      </View>
      <View style={styles.patternRow}>
        <View style={[styles.diamond, styles.diamond2]} />
        <View style={[styles.diamond, styles.diamond3]} />
        <View style={[styles.diamond, styles.diamond1]} />
      </View>
      <View style={styles.patternRow}>
        <View style={[styles.diamond, styles.diamond3]} />
        <View style={[styles.diamond, styles.diamond1]} />
        <View style={[styles.diamond, styles.diamond2]} />
      </View>
    </View>
  );

  const renderBorderPattern = () => (
    <View style={[styles.patternContainer, styles.borderPattern, style]}>
      <View style={[styles.zigzag, styles.zigzagTop]} />
      <View style={[styles.zigzag, styles.zigzagBottom]} />
      <View style={[styles.triangleLeft]} />
      <View style={[styles.triangleRight]} />
    </View>
  );

  const renderSubtlePattern = () => (
    <View style={[styles.patternContainer, styles.subtlePattern, style]}>
      <View style={styles.subtleRow}>
        <View style={[styles.smallDiamond, styles.smallDiamond1]} />
        <View style={[styles.smallDiamond, styles.smallDiamond2]} />
        <View style={[styles.smallDiamond, styles.smallDiamond3]} />
        <View style={[styles.smallDiamond, styles.smallDiamond1]} />
        <View style={[styles.smallDiamond, styles.smallDiamond2]} />
      </View>
      <View style={styles.subtleRow}>
        <View style={[styles.smallDiamond, styles.smallDiamond3]} />
        <View style={[styles.smallDiamond, styles.smallDiamond1]} />
        <View style={[styles.smallDiamond, styles.smallDiamond2]} />
        <View style={[styles.smallDiamond, styles.smallDiamond3]} />
        <View style={[styles.smallDiamond, styles.smallDiamond1]} />
      </View>
    </View>
  );

  if (variant === 'border') return renderBorderPattern();
  if (variant === 'subtle') return renderSubtlePattern();
  return renderHeaderPattern();
};

const styles = StyleSheet.create({
  patternContainer: {
    position: 'absolute',
    pointerEvents: 'none',
  },
  headerPattern: {
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    flexDirection: 'column',
    justifyContent: 'center',
    opacity: 0.15,
  },
  patternRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 2,
  },
  diamond: {
    width: 14,
    height: 14,
    transform: [{ rotate: '45deg' }],
    borderRadius: 3,
  },
  diamond1: {
    backgroundColor: COLORS.rosePoudre,
  },
  diamond2: {
    backgroundColor: COLORS.laguneTurquoise,
  },
  diamond3: {
    backgroundColor: COLORS.sableDoré,
  },
  borderPattern: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  zigzag: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 16,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.rosePoudre,
  },
  zigzagTop: {
    top: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  zigzagBottom: {
    bottom: 0,
    borderTopWidth: 3,
    borderTopColor: COLORS.rosePoudre,
    borderBottomWidth: 0,
  },
  triangleLeft: {
    position: 'absolute',
    top: 40,
    bottom: 40,
    left: 0,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderLeftWidth: 10,
    borderLeftColor: COLORS.rosePoudre,
    borderTopWidth: 10,
    borderTopColor: 'transparent',
    borderBottomWidth: 10,
    borderBottomColor: 'transparent',
  },
  triangleRight: {
    position: 'absolute',
    top: 40,
    bottom: 40,
    right: 0,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderRightWidth: 10,
    borderRightColor: COLORS.rosePoudre,
    borderTopWidth: 10,
    borderTopColor: 'transparent',
    borderBottomWidth: 10,
    borderBottomColor: 'transparent',
  },
  subtlePattern: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.08,
  },
  subtleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginVertical: 4,
  },
  smallDiamond: {
    width: 6,
    height: 6,
    transform: [{ rotate: '45deg' }],
    borderRadius: 1,
  },
  smallDiamond1: {
    backgroundColor: COLORS.vertGabon,
  },
  smallDiamond2: {
    backgroundColor: COLORS.bleuGabon,
  },
  smallDiamond3: {
    backgroundColor: COLORS.jauneGabon,
  },
});

export default GabonesePattern;
