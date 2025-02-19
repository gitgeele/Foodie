import { useState, useCallback } from "react"
import { Image, StyleSheet, View, TouchableOpacity, FlatList, Alert, Platform } from "react-native"
import { ThemedView } from "@/components/ThemedView"
import { ThemedText } from "@/components/ThemedText"
import ParallaxScrollView from "@/components/ParallaxScrollView"
import { initDatabase, getSavedRestaurants, deleteSavedRestaurant } from "@/database/database"
import { useRouter, useFocusEffect } from "expo-router"
import { Feather } from "@expo/vector-icons"

interface Restaurant {
  id: string
  title: string
  details: string
  image: string
}

export default function UserScreen() {
  const [savedRestaurants, setSavedRestaurants] = useState<Restaurant[]>([])
  const router = useRouter()

  const loadSavedRestaurants = useCallback(async () => {
    try {
      await initDatabase()
      const restaurants = await getSavedRestaurants()
      setSavedRestaurants(restaurants)
    } catch (error) {
      console.error("Error loading saved restaurants:", error)
      Alert.alert("Error", "Failed to load saved restaurants. Please try again.")
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadSavedRestaurants()
    }, [loadSavedRestaurants]),
  )

  const handleDeleteRestaurant = async (id: string) => {
    try {
      await deleteSavedRestaurant(id)
      await loadSavedRestaurants() // Reload the list after deletion
    } catch (error) {
      console.error("Error removing restaurant:", error)
      Alert.alert("Error", "Failed to remove the restaurant. Please try again.")
    }
  }

  const renderRestaurantItem = ({ item }: { item: Restaurant }) => (
    <ThemedView style={styles.restaurantItem}>
      <Image source={{ uri: item.image }} style={styles.restaurantImage} />
      <View style={styles.restaurantInfo}>
        <ThemedText type="subtitle">{item.title}</ThemedText>
        <ThemedText>{item.details}</ThemedText>
      </View>
      <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteRestaurant(item.id)}>
        <Feather name="x" size={16} color="#999" />
      </TouchableOpacity>
    </ThemedView>
  )

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={<Image source={require("@/assets/images/food.png")} style={styles.reactLogo} />}
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="subtitle">Your Saved Restaurants</ThemedText>
      </ThemedView>
      <FlatList
        data={savedRestaurants}
        renderItem={renderRestaurantItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </ParallaxScrollView>
  )
}


const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  restaurantItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  restaurantImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  restaurantInfo: {
    flex: 1,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 20,
  },
})