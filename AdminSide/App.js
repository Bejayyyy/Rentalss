// App.js (replace your existing file contents with this)
import React, { useState, useEffect } from 'react';
import { NavigationContainer, CommonActions, createNavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { View, Text, Linking } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from './services/supabase';
import { AuthProvider } from './services/AuthContext';

// Import screens (ensure imports paths are correct)
import BookingsScreen from './screens/BookingsScreen';
import VehiclesScreen from './screens/VehiclesScreen';
import AddVehicleScreen from './screens/AddVehicleScreen';
import CarOwnersScreen from './screens/CarOwnersScreen';
import OwnerProfileScreen from './screens/OwnerProfileScreen';
import ReportsScreen from './screens/ReportsScreen';
import CalendarScreen from './screens/CalendarScreen';
import CashFlowScreen from './screens/CashFlowScreen';
import DashboardScreen from './screens/DashboardScreen';
import LoginScreen from './screens/LoginScreen';
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

function BookingsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#000' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontFamily: 'Roboto' },
        animationEnabled: false,
        cardStyle: { backgroundColor: 'transparent' },
        presentation: 'transparentModal'
      }}
    >
      <Stack.Screen 
        name="BookingsList" 
        component={BookingsScreen} 
        options={{ title: 'Bookings Management' }} 
      />
    </Stack.Navigator>
  );
}

function VehiclesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#000' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontFamily: 'Roboto' },
        animationEnabled: false,
        cardStyle: { backgroundColor: 'transparent' },
        presentation: 'transparentModal'
      }}
    >
      <Stack.Screen name="VehiclesList" component={VehiclesScreen} options={{ title: 'Vehicle Management' }} />
      <Stack.Screen name="AddVehicle" component={AddVehicleScreen} options={{ title: 'Add New Vehicle' }} />
    </Stack.Navigator>
  );
}

function CarOwnersStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#000' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontFamily: 'Roboto' },
        animationEnabled: false,
        cardStyle: { backgroundColor: 'transparent' },
        presentation: 'transparentModal'
      }}
    >
      <Stack.Screen 
        name="CarOwnersList" 
        component={CarOwnersScreen} 
        options={{ title: 'Car Owners Management' }} 
      />
      <Stack.Screen 
        name="OwnerProfile" 
        component={OwnerProfileScreen} 
        options={{ title: 'Owner Profile' }} 
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
        animationEnabled: false,
        cardStyle: { backgroundColor: 'transparent' },
        presentation: 'transparentModal'
      }}
    >
      <Stack.Screen name="ReportsList" component={ReportsScreen} options={{ title: 'Performance Reports' }} />
      <Stack.Screen name="CashFlow" component={CashFlowScreen} options={{ title: 'Cash Flow Management' }} />
    </Stack.Navigator>
  );
}

function DashboardStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#000' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontFamily: 'Roboto' },
        animationEnabled: false,
        cardStyle: { backgroundColor: 'transparent' },
        presentation: 'transparentModal'
      }}
    >
      <Stack.Screen 
        name="DashboardView" 
        component={DashboardScreen} 
        options={{ title: 'Dashboard Overview' }} 
      />
    </Stack.Navigator>
  );
}

function CalendarStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#000' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontFamily: 'Roboto' },
        animationEnabled: false,
        cardStyle: { backgroundColor: 'transparent' },
        presentation: 'transparentModal'
      }}
    >
      <Stack.Screen 
        name="CalendarView" 
        component={CalendarScreen} 
        options={{ title: 'Rental Calendar' }} 
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
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ title: 'Reset Password' }} />
      </Stack.Navigator>
    </SafeAreaProvider>
  );
}

function MainNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#222" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'Dashboard') iconName = focused ? 'grid' : 'grid-outline';
            else if (route.name === 'Bookings') iconName = focused ? 'calendar' : 'calendar-outline';
            else if (route.name === 'Vehicles') iconName = focused ? 'car' : 'car-outline';
            else if (route.name === 'Reports') iconName = focused ? 'analytics' : 'analytics-outline';
            else if (route.name === 'Calendar') iconName = focused ? 'today' : 'today-outline';
            else if (route.name === 'CarOwners') iconName = focused ? 'people' : 'people-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#222',
          tabBarInactiveTintColor: '#666',
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopColor: '#eee',
            paddingBottom: insets.bottom,
            paddingTop: 8,
            height: 60 + insets.bottom,
            paddingHorizontal: 10,
          },
          headerStyle: { backgroundColor: '#000', height: 50 },
          headerTintColor: '#fff',
          headerTitleStyle: { fontFamily: 'Roboto' },
          animationEnabled: false,
        })}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardStack}
          options={{
            headerShown: false,
            title: '',
            unmountOnBlur: true,
            listeners: ({ navigation, route }) => ({
              blur: () => {
                try {
                  const tabState = navigation.getState();
                  const tabRoute = tabState.routes.find(r => r.name === route.name);
                  const nestedKey = tabRoute?.state?.key;
                  if (nestedKey) {
                    navigation.dispatch({
                      ...CommonActions.reset({
                        index: 0,
                        routes: [{ name: 'DashboardView' }],
                      }),
                      target: nestedKey,
                    });
                  }
                } catch (err) {
                  console.warn('Dashboard blur reset failed', err);
                }
              },
            }),
          }}
        />

        <Tab.Screen
          name="Bookings"
          component={BookingsStack}
          options={{
            headerShown: false,
            title: '',
            unmountOnBlur: true,
            listeners: ({ navigation, route }) => ({
              blur: () => {
                try {
                  const tabState = navigation.getState();
                  const tabRoute = tabState.routes.find(r => r.name === route.name);
                  const nestedKey = tabRoute?.state?.key;
                  if (nestedKey) {
                    navigation.dispatch({
                      ...CommonActions.reset({
                        index: 0,
                        routes: [{ name: 'BookingsList' }],
                      }),
                      target: nestedKey,
                    });
                  }
                } catch (err) {
                  console.warn('Bookings blur reset failed', err);
                }
              },
            }),
          }}
        />

        <Tab.Screen
          name="Vehicles"
          component={VehiclesStack}
          options={{
            headerShown: false,
            title: '',
            unmountOnBlur: true,
            listeners: ({ navigation, route }) => ({
              blur: () => {
                try {
                  const tabState = navigation.getState();
                  const tabRoute = tabState.routes.find(r => r.name === route.name);
                  const nestedKey = tabRoute?.state?.key;
                  if (nestedKey) {
                    navigation.dispatch({
                      ...CommonActions.reset({
                        index: 0,
                        routes: [{ name: 'VehiclesList' }],
                      }),
                      target: nestedKey,
                    });
                  }
                } catch (err) {
                  console.warn('Vehicles blur reset failed', err);
                }
              },
            }),
          }}
        />

        <Tab.Screen
          name="CarOwners"
          component={CarOwnersStack}
          options={{
            headerShown: false,
            title: '',
            unmountOnBlur: true,
            listeners: ({ navigation, route }) => ({
              blur: () => {
                try {
                  const tabState = navigation.getState();
                  const tabRoute = tabState.routes.find(r => r.name === route.name);
                  const nestedKey = tabRoute?.state?.key;
                  if (nestedKey) {
                    navigation.dispatch({
                      ...CommonActions.reset({
                        index: 0,
                        routes: [{ name: 'CarOwnersList' }],
                      }),
                      target: nestedKey,
                    });
                  }
                } catch (err) {
                  console.warn('CarOwners blur reset failed', err);
                }
              },
            }),
          }}
        />

        <Tab.Screen
          name="Reports"
          component={ReportsStack}
          options={{
            headerShown: false,
            title: '',
            unmountOnBlur: true,
            listeners: ({ navigation, route }) => ({
              blur: () => {
                try {
                  const tabState = navigation.getState();
                  const tabRoute = tabState.routes.find(r => r.name === route.name);
                  const nestedKey = tabRoute?.state?.key;
                  if (nestedKey) {
                    navigation.dispatch({
                      ...CommonActions.reset({
                        index: 0,
                        routes: [{ name: 'ReportsList' }],
                      }),
                      target: nestedKey,
                    });
                  }
                } catch (err) {
                  console.warn('Reports blur reset failed', err);
                }
              },
            }),
          }}
        />

        <Tab.Screen
          name="Calendar"
          component={CalendarStack}
          options={{
            headerShown: false,
            title: '',
            unmountOnBlur: true,
            listeners: ({ navigation, route }) => ({
              blur: () => {
                try {
                  const tabState = navigation.getState();
                  const tabRoute = tabState.routes.find(r => r.name === route.name);
                  const nestedKey = tabRoute?.state?.key;
                  if (nestedKey) {
                    navigation.dispatch({
                      ...CommonActions.reset({
                        index: 0,
                        routes: [{ name: 'CalendarView' }],
                      }),
                      target: nestedKey,
                    });
                  }
                } catch (err) {
                  console.warn('Calendar blur reset failed', err);
                }
              },
            }),
          }}
        />
      </Tab.Navigator>
    </SafeAreaProvider>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1) Supabase session handling
  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, []);

  // 2) Deep link handling
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
      <AuthProvider user={user}>
        <NavigationContainer ref={navigationRef} linking={linking}>
          {user ? <MainNavigator /> : <AuthNavigator />}
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}