import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORES } from "../colores";

export default function PantallaCalendario() {
  const router = useRouter();
  const [historial, setHistorial] = useState<any[]>([]);

  useEffect(() => {
    cargarHistorial();
  }, []);

  const cargarHistorial = async () => {
    try {
      const datos = await AsyncStorage.getItem("@historial_entrenamientos");
      if (datos !== null) {
        // Los ordenamos para que el más nuevo salga arriba
        const historialOrdenado = JSON.parse(datos).reverse();
        setHistorial(historialOrdenado);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const formatearFecha = (fechaISO: string) => {
    const opciones: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(fechaISO).toLocaleDateString("es-AR", opciones);
  };

  const formatearTiempo = (s: number) => {
    const horas = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    if (horas > 0) return `${horas}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.botonAtrasCabecera}
        >
          <Text style={styles.iconoAtras}>˅</Text>
        </TouchableOpacity>
        <Text style={styles.tituloPrincipal}>Historial</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {historial.length === 0 ? (
          <Text style={styles.textoVacio}>
            Todavía no completaste ningún entrenamiento.
          </Text>
        ) : (
          historial.map((sesion) => (
            <View key={sesion.id} style={styles.tarjetaHistorial}>
              <Text style={styles.fechaTexto}>
                {formatearFecha(sesion.fecha)}
              </Text>
              <Text style={styles.nombreRutina}>{sesion.rutinaNombre}</Text>

              <View style={styles.filaStats}>
                <View style={styles.cajaStat}>
                  <Text style={styles.labelStat}>Tiempo</Text>
                  <Text style={styles.valorStat}>
                    {formatearTiempo(sesion.tiempo)}
                  </Text>
                </View>
                <View style={styles.cajaStat}>
                  <Text style={styles.labelStat}>Volumen</Text>
                  <Text style={styles.valorStat}>{sesion.volumen} kg</Text>
                </View>
                <View style={styles.cajaStat}>
                  <Text style={styles.labelStat}>Ejercicios</Text>
                  <Text style={styles.valorStat}>
                    {sesion.ejercicios.length}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
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
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  botonAtrasCabecera: { padding: 10, marginLeft: -10 },
  iconoAtras: {
    color: COLORES.textoBlanco,
    fontSize: 24,
    fontWeight: "bold",
    transform: [{ rotate: "90deg" }],
  },
  tituloPrincipal: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORES.textoBlanco,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  scrollContainer: { padding: 20, paddingBottom: 100 },
  textoVacio: {
    color: COLORES.grisClaro,
    textAlign: "center",
    marginTop: 50,
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  tarjetaHistorial: {
    backgroundColor: "#1c1c1e",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  fechaTexto: {
    color: COLORES.azulHevy,
    fontSize: 12,
    textTransform: "uppercase",
    marginBottom: 5,
    fontWeight: "900",
    letterSpacing: 1,
  },
  nombreRutina: {
    color: COLORES.textoBlanco,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 20,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  filaStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
    paddingTop: 20,
  },
  cajaStat: { alignItems: "center" },
  labelStat: {
    color: COLORES.grisOscuro,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 5,
  },
  valorStat: { color: COLORES.textoBlanco, fontSize: 18, fontWeight: "bold" },
});
