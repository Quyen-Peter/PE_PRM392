import { useFavorites } from "@/context/FavoritesContext";
import { Category, fetchCategories } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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

export default function FavoritesScreen() {
  const { favorites } = useFavorites();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const isDark = useColorScheme() === "dark";

  const backgroundColor = isDark ? "#121212" : "#fff";
  const cardColor = isDark ? "#1e1e1e" : "#f8f8f8";
  const textColor = isDark ? "#fff" : "#000";
  const subTextColor = isDark ? "#aaa" : "#555";
  const accent = isDark ? "#4da6ff" : "#007AFF";

  useEffect(() => {
    (async () => {
      try {
        const cats = await fetchCategories();
        setCategories(cats);
      } catch {
        console.warn("⚠️ Không thể tải thể loại, kiểm tra mạng.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const uniqueFavorites = useMemo(() => {
    const map = new Map();
    favorites.forEach((m) => {
      if (m?.id) map.set(String(m.id), m);
    });
    return Array.from(map.values());
  }, [favorites]);


  const filtered = useMemo(() => {
    const normalize = (t: string) =>
      t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    let data = uniqueFavorites;
    if (query) data = data.filter((m) => normalize(m.title).includes(normalize(query)));
    if (selectedCat != null)
      data = data.filter((m) => m.categoryIds.includes(selectedCat));
    return data;
  }, [uniqueFavorites, query, selectedCat]);

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 40 }} />;

  if (uniqueFavorites.length === 0)
    return (
      <View style={[styles.emptyContainer, { backgroundColor }]}>
        <Text style={{ color: textColor, fontSize: 16 }}>
          Bạn chưa có phim yêu thích nào!
        </Text>
      </View>
    );

  return (
    <View style={[styles.container, { backgroundColor }]}> 
      <View style={[styles.searchBox, { backgroundColor: isDark ? "#2a2a2a" : "#fafafa" }]}>
        <Ionicons name="search" size={20} color="#888" style={{ marginRight: 6 }} />
        <TextInput
          placeholder="Tìm kiếm phim yêu thích..."
          placeholderTextColor="#888"
          style={[styles.searchInput, { color: textColor }]}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
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
                    <Text style={{ color: isSelected ? "white" : "#333", fontWeight: "500" }}>
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
            <View style={[styles.card, { backgroundColor: cardColor }]}>
              <Image source={{ uri: item.poster }} style={styles.poster} />
              <View style={styles.cardContent}>
                <Text style={[styles.title, { color: textColor }]}>{item.title}</Text>
                <Text numberOfLines={2} style={[styles.description, { color: subTextColor }]}>
                  {item.description}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
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
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  poster: { width: 90, height: 130 },
  cardContent: { flex: 1, padding: 10, justifyContent: "center" },
  title: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  description: { fontSize: 14 },
});
