import React, { useState, useEffect } from 'react';
import { createNavigationContainerRef, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { View, Text ,Linking} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from './services/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import screens
import BookingsScreen from './screens/BookingsScreen';
import VehiclesScreen from './screens/VehiclesScreen';
import AddVehicleScreen from './screens/AddVehicleScreen';
import ReportsScreen from './screens/ReportsScreen';
import CalendarScreen from './screens/CalendarScreen';
import CashFlowScreen from './screens/CashFlowScreen';
import DashboardScreen from './screens/DashboardScreen';
import LoginScreen from './screens/LoginScreen';
import { AuthProvider } from './services/AuthContext';
import ResetPasswordScreen from './screens/ResetPasswordScreen';

export const navigationRef = createNavigationContainerRef();

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const linking = {
  prefixes: ["adminside://"],
  config: {
    screens: {
      ResetPassword: "reset-password",
    },
  },
};






function VehiclesStack() {
  return (
    <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#000' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontFamily: 'Roboto' },

          // 🚀 Disable background shadow + animations
          animationEnabled: false,
          cardStyle: { backgroundColor: 'transparent' },
          presentation: 'transparentModal'
        }}
      >

      <Stack.Screen
        name="VehiclesList"
        component={VehiclesScreen}
        options={{ title: 'Vehicle Management' }}
      />
      <Stack.Screen
        name="AddVehicle"
        component={AddVehicleScreen}
        options={{ title: 'Add New Vehicle' }}
      />
    </Stack.Navigator>
  );
}

function ReportsStack() {
  return (
    <Stack.Navigator
  screenOptions={{
    headerStyle: { backgroundColor: '#000' },
    headerTintColor: '#fff',
    headerTitleStyle: { fontFamily: 'Roboto' },

    // 🚀 Disable background shadow + animations
    animationEnabled: false,
    cardStyle: { backgroundColor: 'transparent' },
    presentation: 'transparentModal'
  }}
>

      <Stack.Screen
        name="ReportsList"
        component={ReportsScreen}
        options={{ title: 'Performance Reports' }}
      />
      <Stack.Screen
        name="CashFlow"
        component={CashFlowScreen}
        options={{ title: 'Cash Flow Management' }}
      />
    </Stack.Navigator>
  );
}

function AuthNavigator() {
  return (
    <SafeAreaProvider>
        <StatusBar style="light" backgroundColor="#000" />
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: '#000' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontFamily: 'Roboto' },

          }}
        >

          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        
          <Stack.Screen
        name="ResetPassword" // 👈 add ResetPassword screen here
        component={ResetPasswordScreen}
        options={{ title: 'Reset Password' }}
      />
          
        </Stack.Navigator>

    </SafeAreaProvider>
  );
}

function MainNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaProvider>
      
        {/* ⚠️ StatusBar note: backgroundColor doesn't work on Android edge-to-edge, so we use headerStyle */}
        <StatusBar style="light" backgroundColor="#f59e0b" />
        
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;
              if (route.name === 'Dashboard') iconName = focused ? 'grid' : 'grid-outline';
              else if (route.name === 'Bookings') iconName = focused ? 'calendar' : 'calendar-outline';
              else if (route.name === 'Vehicles') iconName = focused ? 'car' : 'car-outline';
              else if (route.name === 'Reports') iconName = focused ? 'analytics' : 'analytics-outline';
              else if (route.name === 'Calendar') iconName = focused ? 'today' : 'today-outline';
              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#FF6B35',
            tabBarInactiveTintColor: '#666',
            tabBarStyle: {
              backgroundColor: '#fff',
              borderTopColor: '#eee',
              paddingBottom: insets.bottom,
              paddingTop: 8,
              height: 60 + insets.bottom,
              // ✅ Balance icon spacing
              paddingHorizontal: 10,
            },
        
            headerStyle: { 
              backgroundColor: '#000', 
              height: 50
            },
            
            headerTintColor: '#fff',
            headerTitleStyle: { fontFamily: 'Roboto' },
            animationEnabled: false,
          })}
        >
          {/* Removed titles so only the black header bar remains without text */}
          <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: '' }} />
          <Tab.Screen name="Bookings" component={BookingsScreen} options={{ title: '' }} />
          <Tab.Screen name="Vehicles" component={VehiclesStack} options={{ headerShown: false, title: '' }} />
          <Tab.Screen name="Reports" component={ReportsStack} options={{ headerShown: false, title: '' }} />
          <Tab.Screen name="Calendar" component={CalendarScreen} options={{ title: '' }} />
        </Tab.Navigator>
    </SafeAreaProvider>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // 1️⃣ Handle Supabase session & auth state
useEffect(() => {
  const getInitialSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    setLoading(false);
  };

  getInitialSession();

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    }
  );

  return () => {
    subscription?.unsubscribe();
  };
}, []);

// 2️⃣ Handle deep links separately
useEffect(() => {
  const handleDeepLink = ({ url }) => {
    console.log("Opened via deep link:", url);
    if (url.includes("reset-password")) {
      navigationRef.current?.navigate("ResetPassword");
    }
  };

  const subscription = Linking.addEventListener("url", handleDeepLink);
  return () => subscription.remove();
}, []);

  
  
    

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider user = {user}>
        <NavigationContainer linking={linking}>
          {user ? <MainNavigator /> : <AuthNavigator />}
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}