// GLOBETROTTER GABON DESIGN SYSTEM
// Mobile UI palette inspired by the Gabonese flag and the country's landscapes.

export const COLORS = {
  vertGabon: '#009639',
  jauneGabon: '#FCD116',
  bleuGabon: '#3A75C4',
  ivoire: '#FFF8E7',
  noirProfond: '#111111',
  terreCuite: '#B65A2A',
  vertForet: '#064D2C',
  oceanBrume: '#DCECF7',
  sableChaud: '#F4E6C1',
  brumeVerte: '#D9F0E1',
  nuitProfonde: '#071A14',
  carteClaire: '#FFFDF8',
  ligneDouce: '#E8E2D4',
  texteSecondaire: '#5C5C5C',
  texteMuted: '#8A8A8A',

  primary: '#009639',
  accent: '#FCD116',
  accentSecondary: '#3A75C4',
  surface: '#FFFFFF',
  background: '#FFF8E7',
  textPrimary: '#111111',
  textSecondary: '#5C5C5C',
  textMuted: '#8A8A8A',
  success: '#009639',
  error: '#B65A2A',
  warning: '#FCD116',

  foretVert: '#064D2C',
  océanBleu: '#3A75C4',
  terreCuiteLegacy: '#B65A2A',
  sableDoré: '#FCD116',
  cielCoucher: '#F4E6C1',
  mousseÉmeraude: '#009639',
  laguneTurquoise: '#3A75C4',
  nuitTropicale: '#071A14',
  soleilLevant: '#FCD116',
  rosePoudre: '#FCD116',
  blancCasse: '#FFF8E7',
  bleuClair: '#FFFDF8',
  bleuGlacier: '#DCECF7',
  vertSauge: '#009639',
  patternPrimary: '#FCD116',
  patternSecondary: '#3A75C4',
  patternAccent: '#B65A2A',
  patternBorder: '#009639',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const RADIUS = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32,
  full: 999,
};

export const TYPOGRAPHY = {
  displayLarge: {
    fontFamily: 'Poppins',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  displayMedium: {
    fontFamily: 'Poppins',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  displaySmall: {
    fontFamily: 'Poppins',
    fontSize: 22,
    fontWeight: '700',
  },
  bodyLarge: {
    fontFamily: 'Inter',
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 25,
  },
  bodyMedium: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
  },
  bodySmall: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  labelLarge: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '700',
  },
  labelMedium: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '700',
  },
  labelSmall: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
};

export const SHADOWS = {
  sm: {
    shadowColor: COLORS.vertForet,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  md: {
    shadowColor: COLORS.vertForet,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 5,
  },
  lg: {
    shadowColor: COLORS.vertForet,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 10,
  },
};

export const PATTERNS = {
  opacity: {
    header: 0.18,
    border: 0.22,
    subtle: 0.1,
  },
  colors: {
    primary: COLORS.vertGabon,
    secondary: COLORS.bleuGabon,
    accent: COLORS.jauneGabon,
  },
};
