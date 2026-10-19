import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import { COLORS } from '@/constants/colors';
import { useAuth } from '@/lib/auth';
import { useEffect, useState } from 'react';

export default function TabLayout() {
    const { user } = useAuth();
const [isTeacher, setIsTeacher] = useState(false);

useEffect(() => {
  let active = true;

  async function checkTeacherRole() {
    if (!user) {
      if (active) setIsTeacher(false);
      return;
    }

    const { getProfile } = await import('@/lib/profiles');
    const profile = await getProfile(user.id);

    if (active) {
      console.log('Current profile role:', profile?.role);
setIsTeacher(profile?.role === 'teacher');
console.log('USER ROLE:', profile?.role);
    }
  }

  checkTeacherRole();

  return () => {
    active = false;
  };
}, [user]);

  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,

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
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home-sharp' : 'home-outline'}
              color={color}
              size={24}
            />
          )}
        }
      />

      

  <Tabs.Screen
    name="scan"
    options={{
  href: isTeacher ? null : '/scan',
  title: 'Scan',
      tabBarIcon: ({ color, focused }) => (
        <Ionicons
          name={focused ? 'qr-code' : 'qr-code-outline'}
          color={color}
          size={24}
        />
      ),
    }}
  />


      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'time' : 'time-outline'}
              color={color}
              size={24}
            />
          )}
        }
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={
                focused
                  ? 'person-circle'
                  : 'person-circle-outline'
              }
              color={color}
              size={24}
            />
          )}
        }
      />

      <Tabs.Screen
  name="teacher"
  options={{
    title: 'Teacher',
href: isTeacher ? '/teacher' : null,
    tabBarIcon: ({ color, focused }) => (
      <Ionicons
        name={focused ? 'school' : 'school-outline'}
        color={color}
        size={24}
      />
    ),
  }}
/>
    </Tabs>
  );
}