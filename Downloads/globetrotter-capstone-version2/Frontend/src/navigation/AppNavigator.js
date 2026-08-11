import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Feather';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import ExplorerScreen from '../screens/ExplorerScreen';
import RoadmapScreen from '../screens/RoadmapScreen';
import ProfileScreen from '../screens/ProfileScreen';
import DestinationDetailScreen from '../screens/DestinationDetailScreen';
import NavigationScreen from '../screens/NavigationScreen';
import AddDestinationScreen from '../screens/AddDestinationScreen';
import AdminPanelScreen from '../screens/AdminPanelScreen';
import EventsScreen from '../screens/EventsScreen';
import { COLORS } from '../config/theme';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => (
  <Tab.Navigator
    initialRouteName="Accueil"
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: COLORS.vertGabon,
      tabBarInactiveTintColor: COLORS.textMuted,
      tabBarStyle: {
        backgroundColor: COLORS.surface,
        borderTopColor: COLORS.ligneDouce,
        height: 72,
        paddingBottom: 8,
        paddingTop: 8,
      },
      tabBarLabelStyle: {
        fontFamily: 'Poppins',
        fontSize: 12,
      },
      tabBarIcon: ({ focused, color, size }) => {
        let iconName = 'home';
        if (route.name === 'Explorer') iconName = 'search';
        if (route.name === 'Roadmap') iconName = 'map';
        if (route.name === 'Profil') iconName = 'user';
        return <Icon name={iconName} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen name="Accueil" component={HomeScreen} options={{ title: 'Accueil' }} />
    <Tab.Screen name="Explorer" component={ExplorerScreen} options={{ title: 'Explorer' }} />
    <Tab.Screen name="Roadmap" component={RoadmapScreen} options={{ title: 'Itinéraire' }} />
    <Tab.Screen name="Profil" component={ProfileScreen} options={{ title: 'Profil' }} />
  </Tab.Navigator>
);

const AppNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="DestinationDetail" component={DestinationDetailScreen} />
      <Stack.Screen name="Navigation" component={NavigationScreen} />
      <Stack.Screen name="AddDestination" component={AddDestinationScreen} />
      <Stack.Screen name="AdminPanel" component={AdminPanelScreen} />
      <Stack.Screen name="Events" component={EventsScreen} />
    </Stack.Navigator>
  </NavigationContainer>
);

export default AppNavigator;
