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

export default function PantallaEstadisticas() {
  const router = useRouter();
  const [estadisticas, setEstadisticas] = useState({
    totalEntrenos: 0,
    volumenTotal: 0,
    tiempoTotal: 0,
    mejorVolumen: 0,
    promedioVolumen: 0,
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const datos = await AsyncStorage.getItem("@historial_entrenamientos");
      if (datos !== null) {
        const historial = JSON.parse(datos);

        let volTotal = 0;
        let tiempoTotal = 0;
        let maxVolumen = 0;

        historial.forEach((sesion: any) => {
          const volSesion = sesion.volumen || 0;
          volTotal += volSesion;
          tiempoTotal += sesion.tiempo || 0;
          if (volSesion > maxVolumen) maxVolumen = volSesion;
        });

        const promedio =
          historial.length > 0 ? Math.round(volTotal / historial.length) : 0;

        setEstadisticas({
          totalEntrenos: historial.length,
          volumenTotal: volTotal,
          tiempoTotal: tiempoTotal,
          mejorVolumen: maxVolumen,
          promedioVolumen: promedio,
        });
      }
    } catch (error) {
      console.error(error);
    }
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
        <Text style={styles.tituloPrincipal}>Estadísticas</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.tarjetaDestaque}>
          <Text style={styles.iconoDestaque}>🏆</Text>
          <Text style={styles.tituloDestaque}>Mejor Entrenamiento</Text>
          <Text style={styles.valorDestaque}>
            {estadisticas.mejorVolumen.toLocaleString()} kg
          </Text>
          <Text style={styles.subtituloDestaque}>
            Volumen máximo movido en una sesión
          </Text>
        </View>

        <Text style={styles.tituloSeccion}>Resumen Global</Text>

        <View style={styles.grillaStats}>
          <View style={styles.cajaStat}>
            <Text style={styles.valorStatAzul}>
              {estadisticas.totalEntrenos}
            </Text>
            <Text style={styles.labelStat}>Sesiones</Text>
          </View>
          <View style={styles.cajaStat}>
            <Text style={styles.valorStat}>
              {formatearTiempo(estadisticas.tiempoTotal)}
            </Text>
            <Text style={styles.labelStat}>Tiempo Invertido</Text>
          </View>
          <View style={styles.cajaStat}>
            <Text style={styles.valorStat}>
              {estadisticas.volumenTotal.toLocaleString()} kg
            </Text>
            <Text style={styles.labelStat}>Volumen Total</Text>
          </View>
          <View style={styles.cajaStat}>
            <Text style={styles.valorStat}>
              {estadisticas.promedioVolumen.toLocaleString()} kg
            </Text>
            <Text style={styles.labelStat}>Promedio / Sesión</Text>
          </View>
        </View>
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
    borderBottomColor: COLORES.grisBorde,
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

  scrollContainer: { padding: 20, paddingBottom: 50 },

  tarjetaDestaque: {
    backgroundColor: COLORES.fondoTarjeta,
    padding: 25,
    borderRadius: 15,
    alignItems: "center",
    marginBottom: 30,
    borderWidth: 1,
    borderColor: COLORES.azulHevy,
  },
  iconoDestaque: { fontSize: 40, marginBottom: 10 },
  tituloDestaque: { color: COLORES.grisClaro, fontSize: 16, marginBottom: 5 },
  valorDestaque: {
    color: COLORES.textoBlanco,
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 5,
  },
  subtituloDestaque: {
    color: COLORES.grisOscuro,
    fontSize: 12,
    textAlign: "center",
  },

  tituloSeccion: {
    color: COLORES.textoBlanco,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },

  grillaStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  cajaStat: {
    width: "48%",
    backgroundColor: COLORES.fondoInput,
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 15,
  },
  valorStatAzul: {
    color: COLORES.azulHevy,
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  valorStat: {
    color: COLORES.textoBlanco,
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 5,
  },
  labelStat: { color: COLORES.grisOscuro, fontSize: 12 },
});
