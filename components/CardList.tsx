import type React from "react"
import { useState, useCallback, useEffect, useRef } from "react"
import { StyleSheet, Dimensions, Alert, View, Text, ScrollView, RefreshControl } from "react-native"
import Animated, { FadeIn, FadeOut, Layout } from "react-native-reanimated"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import SwipeableCard from "./SwipeableCard"
import * as Location from "expo-location"
import { initDatabase, saveRestaurant, getSavedRestaurants } from "../database/database"

const API_KEY = process.env.EXPO_PUBLIC_API_KEY;
const { width: SCREEN_WIDTH } = Dimensions.get("window")


interface CardData {
  id: string
  image: string
  title: string
  details: string
}

const CardList: React.FC = () => {
  const [cards, setCards] = useState<CardData[]>([])
  const [savedCards, setSavedCards] = useState<CardData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const currentIndexRef = useRef(0)
  const isMountedRef = useRef(false)

  const fetchLocation = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Please allow location access to use this feature.")
      return null
    }

    const location = await Location.getCurrentPositionAsync({})
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    }
  }, [])
  //Setting the latitude and longitute for the API call

  const fetchRestaurants = useCallback(
    async (latitude: number, longitude: number) => {
      try {
        const apiKey = API_KEY
        const radius = 5000
        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=restaurant&keyword=takeaway&key=${apiKey}`

        const response = await fetch(url)
        const data = await response.json()

        if (data.results && data.results.length > 0) {
          const fetchedCards = data.results.map((place: any) => ({
            id: place.place_id,
            image: place.photos
              ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${apiKey}`
              : "https://via.placeholder.com/400x250?text=No+Image",
            title: place.name,
            details: place.vicinity || "No details available",
          }))

          return fetchedCards.filter((card: CardData) => !savedCards.some((savedCard) => savedCard.id === card.id))
          //Filter out already saved cards in the DB
        } else {
          Alert.alert("No Results", "No restaurants found in your area.")
          return []
        }
      } catch (error) {
        Alert.alert("Error", "Failed to fetch restaurants. Please try again later.")
        return []
      }
    },
    [savedCards],
  )

  const loadSavedCards = useCallback(async () => {
    try {
      const loadedCards = await getSavedRestaurants()
      console.log(`Saved cards loaded: ${loadedCards.length} cards`)
      setSavedCards(loadedCards)
      return loadedCards
    } catch (error) {
      console.error("Error loading saved cards:", error)
      return []
    }
  }, [])

  const loadCards = useCallback(async () => {
    setIsLoading(true)
    await initDatabase()
    await loadSavedCards()

    const location = await fetchLocation()
    if (location) {
      const newCards = await fetchRestaurants(location.latitude, location.longitude)
      setCards(newCards)
    }
    setIsLoading(false)
  }, [fetchLocation, fetchRestaurants, loadSavedCards])

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true
      loadCards()
    }
  }, [loadCards])
  //Use effect to ensure that cards are only loaded in once unless users decide to refresh

  const handleSwipe = useCallback(() => {
    setCards((prevCards) => {
      const newCards = prevCards.slice(1)
      currentIndexRef.current += 1
      return newCards
    })
  }, [])

  const handleSave = useCallback(async () => {
    if (cards.length > 0) {
      const cardToSave = cards[0]
      try {
        await saveRestaurant(cardToSave)
        setSavedCards((prev) => [...prev, cardToSave])
        console.log("Saved restaurant:", cardToSave.title)
        Alert.alert("Saved", `${cardToSave.title} has been saved to your favorites!`)
      } catch (error) {
        console.error("Error saving card:", error)
        Alert.alert("Error", "Failed to save the restaurant. Please try again.")
      }
      handleSwipe()
    }
  }, [cards, handleSwipe])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadCards()
    setRefreshing(false)
  }, [loadCards])

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    )
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.cardsContainer}>
        {cards.map((card, index) => (
          <Animated.View
            key={`${card.id}-${currentIndexRef.current + index}`}
            entering={FadeIn.delay(index * 100).duration(300)}
            exiting={FadeOut.duration(300)}
            layout={Layout.springify()}
            style={[styles.cardContainer, { zIndex: cards.length - index }]}
          >
            <SwipeableCard
              image={card.image}
              title={card.title}
              details={card.details}
              onSwipe={handleSwipe}
              onSave={handleSave}
            />
          </Animated.View>
          
        ))}
        </View>
      </ScrollView>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  loadingContainer: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollViewContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cardsContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContainer: {
    position: "absolute",
    width: SCREEN_WIDTH - 40,
    alignItems: "center",
  },
})

export default CardList