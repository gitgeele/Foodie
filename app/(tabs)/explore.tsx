import React from 'react';
import { StyleSheet, View, SafeAreaView } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import CardList from '@/components/CardList';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemedView style={styles.container}>
        <View style={[styles.content, { paddingTop: Math.max(20, insets.top) }]}>
          <ThemedText style={styles.title}>Eats Near You!</ThemedText>
          <View style={styles.cardListContainer}>
            <CardList />
          </View>
        </View>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cardListContainer: {
    flex: 1,
    marginBottom: 50,
  },
});


