import 'react-native-gesture-handler';  // This must be at the very top
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import Navigation from './navigators/navigation';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <Navigation />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 
// In Program.cs or Startup.cs
builder.Services.AddCors(options =>
  {
      options.AddPolicy("AllowAll",
          builder =>
          {
              builder
                  .AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
          });
  });
  
  // ... and in the middleware section:
  app.UseCors("AllowAll");