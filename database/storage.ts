// database/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Movie } from '../services/api';

const FAVORITES_KEY = 'favorites';

export async function getFavorites(): Promise<Movie[]> {
  const data = await AsyncStorage.getItem(FAVORITES_KEY);
  return data ? JSON.parse(data) : [];
}

export async function addFavorite(movie: Movie) {
  const current = await getFavorites();
  const updated = [...current, movie];
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
}

export async function removeFavorite(id: string) {
  const current = await getFavorites();
  const updated = current.filter(m => m.id !== id);
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
}

export async function isFavorite(id: string): Promise<boolean> {
  const current = await getFavorites();
  return current.some(m => m.id === id);
}
