import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { COLORES } from "../colores";
import { EJERCICIOS_DB } from "../ejercicios";

export default function PantallaCatalogo() {
  const router = useRouter();
  const [ejerciciosPersonalizados, setEjerciciosPersonalizados] = useState<
    any[]
  >([]);

  useEffect(() => {
    cargarEjerciciosPersonalizados();
  }, []);

  const cargarEjerciciosPersonalizados = async () => {
    try {
      const datos = await AsyncStorage.getItem("@ejercicios_custom");
      if (datos !== null) setEjerciciosPersonalizados(JSON.parse(datos));
    } catch (error) {
      console.error(error);
    }
  };

  const TODOS_LOS_EJERCICIOS = [
    ...EJERCICIOS_DB,
    ...ejerciciosPersonalizados,
  ].sort((a, b) => a.nombre.localeCompare(b.nombre));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.botonAtrasCabecera}
        >
          <Text style={styles.iconoAtras}>˅</Text>
        </TouchableOpacity>
        <Text style={styles.tituloPrincipal}>Ejercicios</Text>
        <View style={{ width: 30 }} />
      </View>

      <FlatList
        data={TODOS_LOS_EJERCICIOS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 50 }}
        renderItem={({ item }) => {
          const miniatura = item.imagenUrl || item.gifUrl;
          return (
            <View style={styles.itemEjercicio}>
              {miniatura ? (
                <Image source={{ uri: miniatura }} style={styles.imagenMini} />
              ) : (
                <View
                  style={[
                    styles.imagenMini,
                    { backgroundColor: COLORES.fondoInput },
                  ]}
                />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.textoNombre}>{item.nombre}</Text>
                <Text style={styles.textoMusculo}>
                  {item.musculo} {item.id.includes("custom") && "★"}
                </Text>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORES.fondoApp, paddingTop: 40 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.grisBorde,
    marginBottom: 10,
  },
  botonAtrasCabecera: { padding: 10, marginLeft: -10 },
  iconoAtras: {
    color: COLORES.textoBlanco,
    fontSize: 24,
    fontWeight: "bold",
    transform: [{ rotate: "90deg" }],
  },
  tituloPrincipal: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORES.textoBlanco,
  },

  itemEjercicio: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.fondoTarjeta,
  },
  imagenMini: { width: 50, height: 50, borderRadius: 8, marginRight: 15 },
  textoNombre: { color: COLORES.textoBlanco, fontSize: 16, fontWeight: "bold" },
  textoMusculo: { color: COLORES.grisOscuro, fontSize: 14, marginTop: 4 },
});
