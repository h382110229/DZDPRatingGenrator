import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';

import HomeScreen from './screens/HomeScreen';
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
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border,
              elevation: 0, // Remove shadow for a flatter, modern look with border
              shadowOpacity: 0,
            },
            headerTintColor: theme.colors.primary,
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 17,
            },
            headerBackTitleVisible: false, // Prevent title truncation on iOS
            cardStyle: { backgroundColor: theme.colors.background }
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ title: 'HAWK 点评生成器' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
