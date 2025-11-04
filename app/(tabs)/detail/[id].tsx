import { useFavorites } from "@/context/FavoritesContext";
import {
  Actor,
  Category,
  fetchActors,
  fetchCategories,
  fetchMovies,
  Movie,
} from "@/services/api";
import Entypo from "@expo/vector-icons/Entypo";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

export default function DetailScreen() {
  const { id } = useLocalSearchParams();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [actors, setActors] = useState<Actor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const router = useRouter();

  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const textColor = isDark ? "#fff" : "#000";
  const backgroundColor = isDark ? "#121212" : "#fff";

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const animateHeart = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.4,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      setMovie(null);
      try {
        const [movies, cats, acts] = await Promise.all([
          fetchMovies(),
          fetchCategories(),
          fetchActors(),
        ]);
        const found = movies.find((m) => String(m.id) === String(id));
        setMovie(found || null);
        setCategories(cats);
        setActors(acts);
      } catch (err) {
        console.error("❌ Lỗi tải dữ liệu:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );

  if (!movie)
    return (
      <View style={styles.center}>
        <Text style={{ color: textColor }}>Không tìm thấy phim</Text>
      </View>
    );

  const fav = isFavorite(movie.id);

  const handleFavorite = async () => {
    if (isToggling || !movie) return;
    setIsToggling(true);
    animateHeart();
    await toggleFavorite(movie);
    setIsToggling(false);
  };

  const movieCategories = movie.categoryIds
    ?.map((cid) => categories.find((c) => c.id === cid)?.name)
    .filter(Boolean)
    .join(", ");

  const movieActors = movie.actorIds
    ?.map((aid) => actors.find((a) => a.id === aid)?.name)
    .filter(Boolean)
    .join(", ");

  return (
    <View style={[styles.screen, { backgroundColor }]}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={[
          styles.closeButton,
          Platform.OS === "android" ? { top: 18 } : {},
        ]}
        accessibilityLabel="Đóng"
      >
        <Entypo name="cross" size={30} color={isDark ? "#fff" : "#000"} />
      </TouchableOpacity>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 68, paddingBottom: 40 }}
      >
        <Image
          source={{ uri: movie.poster }}
          style={[styles.image, { borderRadius: 12 }]}
        />

        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: textColor }]}>{movie.title}</Text>
          <Pressable onPress={handleFavorite} disabled={isToggling}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Entypo
                name={fav ? "heart" : "heart-outlined"}
                size={30}
                color={fav ? "#FF4D4D" : "#999"}
              />
            </Animated.View>
          </Pressable>
        </View>

        <Text style={[styles.year, { color: "#999" }]}>
          Ra mắt: {movie.year}
        </Text>

        {movieCategories ? (
          <Text style={[styles.info, { color: textColor }]}>
            Thể loại: {movieCategories}
          </Text>
        ) : null}
        {movieActors ? (
          <Text style={[styles.info, { color: textColor }]}>
            Diễn viên: {movieActors}
          </Text>
        ) : null}

        <Text style={[styles.desc, { color: textColor }]}>
          {movie.description}
        </Text>
      </ScrollView>
    </View>
  );
}

export const options = { headerShown: false };

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  closeButton: {
    position: "absolute",
    left: 12,
    top: 54,
    zIndex: 20,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 20,
    padding: 6,
    marginTop: 10
  },
  image: {
    width: "90%",
    height: 400,
    alignSelf: "center",
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    flexShrink: 1,
  },
  year: {
    fontSize: 15,
    marginHorizontal: 16,
    marginBottom: 6,
  },
  info: {
    fontSize: 15,
    marginHorizontal: 16,
    marginBottom: 4,
  },
  desc: {
    fontSize: 16,
    lineHeight: 22,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 50,
  },
});
