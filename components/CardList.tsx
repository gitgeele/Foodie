import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, Platform, Dimensions} from 'react-native';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import SwipeableCard from './SwipeableCard';
import * as Location from 'expo-location';

interface CardData {
  id: string;
  image: string;
  title: string;
  details: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = -SCREEN_WIDTH * 0.3;

const CardList: React.FC = () => {
  const [cards, setCards] = useState<CardData[]>([]);
  const currentIndexRef = useRef(0);

  const fetchLocation = async () => {
    if (Platform.OS === 'web') {
      return new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
            },
            (error) => {
              Alert.alert('Error', 'Unable to fetch location. Please check location permissions.');
              reject(error);
            }
          );
        } else {
          Alert.alert('Error', 'Geolocation is not supported by this browser.');
          reject(new Error('Geolocation not supported'));
        }
      });
    } else {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow location access to use this feature.');
        return null;
      }

      let location = await Location.getCurrentPositionAsync({});
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    }
  };

  const fetchRestaurants = async (latitude: number, longitude: number) => {
    try {
      const apiKey = 'AIzaSyCpooxLw1oq-joPRlXMQlE4dgDcmwu5eiA';
      const radius = 5000;
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=restaurant&keyword=takeaway&key=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        console.log(data.results);
        const fetchedCards = data.results.map((place: any) => ({
          id: place.place_id,
          image: place.photos ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${apiKey}` : 'https://via.placeholder.com/400x250?text=No+Image',
          title: place.name,
          details: place.vicinity || 'No details available',
        }));
        setCards(fetchedCards);
      } else {
        Alert.alert('No Results', 'No restaurants found in your area.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch restaurants. Please try again later.');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const location = await fetchLocation();
        if (location) {
          await fetchRestaurants(location.latitude, location.longitude);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleSwipe = useCallback(() => {
    setCards((prevCards) => {
      const newCards = prevCards.slice(1);
      currentIndexRef.current += 1;
      return newCards;
    });
  }, []);

  const handleSave = useCallback(() => {
    if (cards.length > 0) {
      console.log('Saved restaurant:', cards[0].title);
      handleSwipe();
    }
  }, [cards, handleSwipe]);

  return (
    <View style={styles.container}>
      {cards.map((card, index) => (
        <Animated.View
          key={`${card.id}-${currentIndexRef.current + index}`}
          entering={FadeIn.delay(index * 100).duration(300)}
          exiting={FadeOut.duration(300)}
          layout={Layout.springify()}
          style={[
            styles.cardContainer,
            { zIndex: cards.length - index },
          ]}
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  cardContainer: {
    position: 'absolute',
    width: SCREEN_WIDTH - 32, // Adjust for padding
    alignItems: 'center',
  },
});

export default CardList;