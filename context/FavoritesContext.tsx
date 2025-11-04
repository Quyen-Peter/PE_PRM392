import {
  Movie,
  addFavorite,
  fetchFavorites,
  fetchMovies,
  removeFavorite,
} from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const FAVORITES_KEY = "favorites_db";

type FavoritesContextType = {
  favorites: Movie[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (movie: Movie) => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined
);

export const FavoritesProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [favorites, setFavorites] = useState<Movie[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const isSyncingRef = useRef(false);

  // Theo dõi trạng thái mạng
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = !!state.isConnected && !!state.isInternetReachable;
      setIsOnline(online);

      // chỉ sync 1 lần duy nhất khi có mạng
      if (online && !isSyncingRef.current) {
        isSyncingRef.current = true;
        setTimeout(async () => {
          await syncFavoritesWithServer();
          isSyncingRef.current = false;
        }, 2000);
      }
    });
    return () => unsubscribe();
  }, []);

  // Load favorites (local trước, API sau)
  useEffect(() => {
    (async () => {
      try {
        const local = await AsyncStorage.getItem(FAVORITES_KEY);
        if (local) setFavorites(JSON.parse(local));

        try {
          const [apiFavorites, allMovies] = await Promise.all([
            fetchFavorites(),
            fetchMovies(),
          ]);

          const apiMovies: Movie[] = (
            Array.isArray(apiFavorites) ? apiFavorites : []
          )
            .map((f: any) =>
              allMovies.find((m) => String(m.id) === String(f.movieId))
            )
            .filter(Boolean) as Movie[];

          setFavorites(apiMovies);
          await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(apiMovies));
        } catch {
          console.log("Offline, dùng dữ liệu local.");
        }
      } catch (err) {
        console.error("Lỗi load favorites:", err);
      }
    })();
  }, []);

  // Lưu local mỗi khi thay đổi
  useEffect(() => {
    AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const isFavorite = (id: string) => favorites.some((m) => m.id === id);

  // Toggle offline-first
  const toggleFavorite = async (movie: Movie) => {
    const exists = isFavorite(movie.id);
    const updated = exists
      ? favorites.filter((m) => m.id !== movie.id)
      : [...favorites, movie];
    setFavorites(updated);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));

    //đồng bộ với API nếu có mạng
    if (isOnline) {
      try {
        if (exists) {
          const favs = await fetchFavorites().catch(() => []);
          const toDelete = favs.find(
            (f: any) => String(f.movieId) === String(movie.id)
          );
          if (toDelete) await removeFavorite(toDelete.id);
        } else {
          await addFavorite(movie.id);
        }
      } catch (err) {
        console.warn("Sync API thất bại, sẽ cập nhật lại khi có mạng:", err);
      }
    }
  };

  // Hàm đồng bộ khi mạng có lại
  const syncFavoritesWithServer = async () => {
    try {
      console.log("🌐 Mạng có lại, bắt đầu đồng bộ...");

      const localData = await AsyncStorage.getItem(FAVORITES_KEY);
      const localFavs: Movie[] = localData ? JSON.parse(localData) : [];

      let apiFavs: { id: string; movieId: string }[] = [];
      try {
        apiFavs = await fetchFavorites();
        if (!Array.isArray(apiFavs)) apiFavs = [];
      } catch (err) {
        console.warn("Không thể fetch favorites API:", err);
        return;
      }

      const apiIds = apiFavs.map((f) => String(f.movieId));
      const localIds = localFavs.map((m) => String(m.id));

      // Thêm phim còn thiếu trên API
      for (const m of localFavs) {
        if (m?.id && !apiFavs.some((f) => String(f.movieId) === String(m.id))) {
          try {
            await addFavorite(m.id);
            console.log("Đã thêm lại lên API:", m.title);
          } catch (err) {
            console.warn("Lỗi khi thêm lại:", err);
          }
        }
      }

      // Xóa phim trên API nhưng không còn local
      for (const f of apiFavs) {
        if (!localIds.includes(String(f.movieId))) {
          try {
            await removeFavorite(f.id);
            console.log("🗑️ Đã xóa khỏi API:", f.movieId);
          } catch (err) {
            console.warn("⚠️ Lỗi khi xóa:", err);
          }
        }
      }

      console.log("Đồng bộ favorites hoàn tất!");
    } catch (err) {
      console.error("Lỗi khi sync favorites:", err);
    }
  };

  return (
    <FavoritesContext.Provider
      value={{ favorites, isFavorite, toggleFavorite }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites phải nằm trong <FavoritesProvider>");
  return ctx;
};
