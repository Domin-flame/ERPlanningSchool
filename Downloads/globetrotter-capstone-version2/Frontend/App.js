/**
 * GLOBETROTTER MOBILE APP
 * Application React Native Premium
 * Architecture modulaire avec Design System complet
 */

import React from 'react';
import { StatusBar, SafeAreaView, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import { COLORS } from './src/config/theme';

function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container}>
        <StatusBar
           barStyle="light-content"
           backgroundColor={COLORS.vertForet}
        />
        <AppNavigator />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});

export default App;
