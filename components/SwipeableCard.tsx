import React, { useEffect, useCallback } from 'react';
import { StyleSheet, Dimensions, Pressable, View, Image, Text } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  runOnJS, 
  useAnimatedReaction,
  cancelAnimation
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = -SCREEN_WIDTH * 0.3;

interface SwipeableCardProps {
  image: string;
  title: string;
  details: string;
  onSwipe: () => void;
  onSave: () => void;
}

export default function SwipeableCard({ image, title, details, onSwipe, onSave }: SwipeableCardProps) {
  const router = useRouter();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const cardOpacity = useSharedValue(1);

  const handleComplete = useCallback(() => {
    'worklet';
    runOnJS(onSwipe)();
  }, [onSwipe]);

  const handleSave = useCallback(() => {
    scale.value = withTiming(0.8, { duration: 100 }, () => {
      translateY.value = withTiming(-SCREEN_HEIGHT, { duration: 300 }, () => {
        runOnJS(onSave)();
      });
    });
  }, [onSave]);

  useAnimatedReaction(
    () => translateX.value,
    (value) => {
      if (value <= SWIPE_THRESHOLD) {
        cardOpacity.value = withSpring(0);
      } else {
        cardOpacity.value = withSpring(1);
      }
    }
  );

  useEffect(() => {
    return () => {
      cancelAnimation(translateX);
      cancelAnimation(translateY);
      cancelAnimation(scale);
      cancelAnimation(cardOpacity);
    };
  }, []);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd(() => {
      if (translateX.value <= SWIPE_THRESHOLD) {
        translateX.value = withSpring(-SCREEN_WIDTH, {}, handleComplete);
      } else {
        translateX.value = withSpring(0);
      }
    });

  const rStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: cardOpacity.value,
  }));

  return (
    <GestureDetector gesture={panGesture}>
    <Animated.View style={[styles.card, rStyle]}>
      <View style={styles.cardContent}>
        <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.details}>{details}</Text>
        </View>
        <View style={styles.bottomContainer}>
          <Pressable onPress={handleSave} style={styles.iconButton}>
            <MaterialCommunityIcons name="star" size={24} color="#FFD700" />
          </Pressable>
          <Pressable style={styles.iconButton}>
            <MaterialCommunityIcons name="food-variant" size={24} color="#4CAF50" />
          </Pressable>
        </View>
      </View>
    </Animated.View>
  </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    width: SCREEN_WIDTH - 40,
    marginVertical: 20,
    borderRadius: 20,
    backgroundColor: 'white',
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.3)',
  },
  cardContent: {
    overflow: 'hidden',
    borderRadius: 20,
    flexDirection: 'column',
    
  },
  image: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  textContainer: {
    padding: 15,
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  details: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  iconButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
});