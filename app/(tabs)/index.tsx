import { Category, fetchCategories, fetchMovies, Movie } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

export default function HomeScreen() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [filtered, setFiltered] = useState<Movie[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  useEffect(() => {
    (async () => {
      try {
        const [m, c] = await Promise.all([fetchMovies(), fetchCategories()]);
        setMovies(m);
        setCategories(c);
        setFiltered(m);
      } catch {
        alert("Không thể tải dữ liệu. Kiểm tra mạng.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const normalize = (t: string) =>
      t
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

    let data = movies;
    if (query)
      data = data.filter((m) => normalize(m.title).includes(normalize(query)));
    if (selectedCat != null)
      data = data.filter((m) => m.categoryIds.includes(selectedCat));
    setFiltered(data);
  }, [query, selectedCat, movies]);

  if (loading)
    return <ActivityIndicator size="large" style={{ marginTop: 40 }} />;

  const accent = isDark ? "#4da6ff" : "#007AFF";
  const textColor = isDark ? "#fff" : "#000";
  const backgroundColor = isDark ? "#121212" : "#fff";

  return (
    <View style={[styles.screen, { backgroundColor }]}>
      <View style={styles.container}>
        <View
          style={[
            styles.searchBox,
            { backgroundColor: isDark ? "#2a2a2a" : "#fafafa" },
          ]}
        >
          <Ionicons name="search" size={20} color="#888" style={{ marginRight: 6 }} />
          <TextInput
            placeholder="Tìm kiếm phim..."
            placeholderTextColor="#888"
            style={[styles.searchInput, { color: textColor }]}
            value={query}
            onChangeText={setQuery}
          />
        </View>
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          stickyHeaderIndices={[0]}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListHeaderComponent={() => (
            <View style={{ backgroundColor }}>
              <FlatList
                data={categories}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryList}
                keyExtractor={(c) => c.id.toString()}
                renderItem={({ item }) => {
                  const isSelected = selectedCat === item.id;
                  return (
                    <TouchableOpacity
                      onPress={() => setSelectedCat(isSelected ? null : item.id)}
                      style={[
                        styles.categoryItem,
                        { backgroundColor: isSelected ? accent : "#e0e0e0" },
                      ]}
                    >
                      <Text
                        style={{
                          color: isSelected ? "white" : "#333",
                          fontWeight: "500",
                        }}
                      >
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/detail/[id]",
                  params: { id: String(item.id) },
                })
              }
            >
              <View
                style={[
                  styles.card,
                  { backgroundColor: isDark ? "#1e1e1e" : "#f8f8f8" },
                ]}
              >
                <Image source={{ uri: item.poster }} style={styles.poster} />
                <View style={styles.cardContent}>
                  <Text style={[styles.title, { color: textColor }]}> 
                    {item.title}
                  </Text>
                  <Text numberOfLines={2} style={styles.description}>
                    {item.description}
                  </Text>
                  <Text style={styles.year}>Ra mắt: {item.year}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { flex: 1, flexGrow: 1, padding: 12 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 12,
    marginTop: 35,
  },
  searchInput: { flex: 1, paddingVertical: 8 },
  categoryList: { marginBottom: 15, height: 35 },
  categoryItem: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 8,
  },
  card: {
    flexDirection: "row",
    marginVertical: 8,
    borderRadius: 10,
    overflow: "hidden",
  },
  poster: { width: 90, height: 130 },
  cardContent: { flex: 1, padding: 10 },
  title: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  description: { color: "#666", marginBottom: 4 },
  year: { color: "#999" },
});
