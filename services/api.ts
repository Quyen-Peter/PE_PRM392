import AsyncStorage from "@react-native-async-storage/async-storage";

export type Movie = {
  id: string;
  title: string;
  poster: string;
  description: string;
  year: number;
  rating: number;
  categoryIds: number[];
  actorIds: number[];
};

export type Category = { id: number; name: string };
export type Actor = { id: number; name: string };

const BASE_URL = "https://6909fb5a1a446bb9cc20d966.mockapi.io/api/v1";

const KEY_MOVIES = "cache_movies_v1";
const KEY_CATEGORIES = "cache_categories_v1";
const KEY_ACTORS = "cache_actors_v1";

async function fetchWithCache<T>(url: string, key: string): Promise<T> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Network error");
    const data = await res.json();
    await AsyncStorage.setItem(key, JSON.stringify(data));
    return data;
  } catch {
    const cached = await AsyncStorage.getItem(key);
    if (cached) return JSON.parse(cached);
    throw new Error("Không thể tải dữ liệu (offline + chưa có cache).");
  }
}

export const fetchMovies = () =>
  fetchWithCache<Movie[]>(`${BASE_URL}/movie`, KEY_MOVIES);
export const fetchCategories = () =>
  fetchWithCache<Category[]>(`${BASE_URL}/categories`, KEY_CATEGORIES);
export const fetchActors = () =>
  fetchWithCache<Actor[]>(`${BASE_URL}/actors`, KEY_ACTORS);

export const fetchFavorites = async () => {
  const res = await fetch(`${BASE_URL}/favorites`);
  if (!res.ok) throw new Error("Không thể tải favorites");
  return res.json();
};

export const addFavorite = async (movieId: string) => {
  const res = await fetch(`${BASE_URL}/favorites`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ movieId }),
  });
  if (!res.ok) throw new Error("Không thể thêm favorites");
  return res.json();
};

export const removeFavorite = async (id: string) => {
  const res = await fetch(`${BASE_URL}/favorites/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Không thể xóa favorites");
  return true;
};
