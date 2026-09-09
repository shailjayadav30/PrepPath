import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { Color, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import HomeHeader from "@/components/header/homeHeader";

export default function TabseLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#16A673",
        tabBarInactiveTintColor: "#9CA3AF",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          header: () => <HomeHeader />,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={18}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="createroadmap"
        options={{
          title: "Roadmap",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "map" : "map-outline"}
              size={18}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Analytics",
          headerShown: false,
          tabBarIcon: ({ color,focused }) => (
            <Ionicons name={focused?"stats-chart":"stats-chart-outline"} size={18} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          headerShown: false,
          tabBarIcon: ({ color,focused }) => (
            <Ionicons name={focused?"settings":"settings-outline"} size={18} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
