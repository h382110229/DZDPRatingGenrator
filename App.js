import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';

import HomeScreen from './screens/HomeScreen';
import SettingsScreen from './screens/SettingsScreen';
import ProviderDetailScreen from './screens/ProviderDetailScreen';
import { theme } from './constants/theme';

const Stack = createStackNavigator();

export default function App() {
  return (
    <>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.colors.background,
              shadowColor: 'transparent', // iOS
              elevation: 0, // Android
            },
            headerTintColor: theme.colors.primary,
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            cardStyle: { backgroundColor: theme.colors.background }
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ title: 'Hawkの大众点评评价生成器' }}
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen} 
            options={{ title: '模型服务商' }}
          />
          <Stack.Screen 
            name="ProviderDetail" 
            component={ProviderDetailScreen} 
            options={{ title: '配置详情' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
