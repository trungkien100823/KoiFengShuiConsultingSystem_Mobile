import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { enableScreens } from 'react-native-screens';

// Enable screens for better performance
enableScreens();

// Import your screens
import AuthScreen from '../app/(tabs)';
import SignInScreen from '../app/(tabs)/SignIn';
import SignUpScreen from '../app/(tabs)/SignUp';

const Stack = createStackNavigator();

export default function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Auth"
        screenOptions={{
          headerShown: false,
          presentation: 'card',
          gestureEnabled: true,
        }}
      >
        <Stack.Screen 
          name="Auth" 
          component={AuthScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="SignIn" 
          component={SignInScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="SignUp" 
          component={SignUpScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
