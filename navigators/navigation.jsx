import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { enableScreens } from 'react-native-screens';

// Enable screens for better performance
enableScreens();

// Import your screens
import AuthScreen from '../app/(tabs)';
import LoginScreen from '../app/(tabs)/Login';
import RegisterScreen from '../app/(tabs)/Register';
import UserInfoScreen from '../screens/UserInfoScreen';
import WorkshopScreen from '../app/(tabs)/workshop';
import WorkshopDetailsScreen from '../app/(tabs)/workshopDetails';
import WorkshopFilterScreen from '../app/(tabs)/workshop_filter';
import TicketConfirmationScreen from '../app/(tabs)/ticket_confirmation';
import TicketDetailsScreen from '../app/(tabs)/ticketDetails';
import YourOrderScreen from '../app/(tabs)/your_order';
import CoursesScreen from '../app/(tabs)/courses';

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
          name="Login" 
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="UserInfo" 
          component={UserInfoScreen}
          options={{ 
            headerShown: false,
            presentation: 'modal'
          }}
        />
        <Stack.Screen 
          name="workshop" 
          component={WorkshopScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="workshopDetails" 
          component={WorkshopDetailsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="ticket_confirmation" 
          component={TicketConfirmationScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="ticketDetails" 
          component={TicketDetailsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="workshop_filter" 
          component={WorkshopFilterScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="your_order" 
          component={YourOrderScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="courses" 
          component={CoursesScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
