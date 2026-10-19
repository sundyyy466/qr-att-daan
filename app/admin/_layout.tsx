import { Tabs, router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Alert } from 'react-native';

import { COLORS } from '@/constants/colors';
import { supabase } from '@/lib/supabase';

export default function AdminTabLayout() {
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        Alert.alert('Logout failed', error.message);
        return;
      }

      router.replace('/login');
    } catch (error) {
      Alert.alert('Logout failed', 'Please try again.');
    }
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6D43C3',
        headerStyle: {
          backgroundColor: COLORS.background,
        },
        headerShadowVisible: false,
        headerTintColor: COLORS.textPrimary,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
        },
        headerRight: () => (
          <Ionicons.Button
            name="log-out-outline"
            backgroundColor="transparent"
            color="#6D43C3"
            size={22}
            onPress={handleLogout}
            underlayColor="transparent"
          >
            Logout
          </Ionicons.Button>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'grid' : 'grid-outline'}
              color={color}
              size={22}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="users"
        options={{
          title: 'Users',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'people' : 'people-outline'}
              color={color}
              size={22}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'calendar' : 'calendar-outline'}
              color={color}
              size={22}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="attendance"
        options={{
          title: 'Attendance',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'clipboard' : 'clipboard-outline'}
              color={color}
              size={22}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'bar-chart' : 'bar-chart-outline'}
              color={color}
              size={22}
            />
          ),
        }}
      />
      
<Tabs.Screen
  name="profile"
  options={{
    title: 'Profile',
    tabBarLabel: 'Profile',
    tabBarIcon: ({ color, focused }) => (
      <Ionicons
        name={focused ? 'person-circle' : 'person-circle-outline'}
        color={color}
        size={22}
      />
    ),
  }}
/>

    </Tabs>
    
  );
}
