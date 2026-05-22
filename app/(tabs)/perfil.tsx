import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORES } from "../../colores";

export default function PantallaPerfil() {
  const [estadisticas, setEstadisticas] = useState({
    entrenos: 0,
    volumenTotal: 0,
    tiempoTotalSegundos: 0,
  });

  // ESTADO PARA EL NOMBRE DE USUARIO
  const [nombreUsuario, setNombreUsuario] = useState("Atleta");

  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      cargarHistorial();
      cargarNombre(); // Cargamos el nombre cada vez que entra a la pestaña
    }, []),
  );

  // FUNCIÓN PARA LEER EL NOMBRE DE LA MEMORIA
  const cargarNombre = async () => {
    try {
      const nombreGuardado = await AsyncStorage.getItem("@nombre_usuario");
      if (nombreGuardado) setNombreUsuario(nombreGuardado);
    } catch (error) {
      console.error("Error al cargar nombre de usuario:", error);
    }
  };

  const cargarHistorial = async () => {
    try {
      const datos = await AsyncStorage.getItem("@historial_entrenamientos");
      if (datos !== null) {
        const historial = JSON.parse(datos);

        let volTotal = 0;
        let tiempoTotal = 0;

        historial.forEach((sesion: any) => {
          volTotal += sesion.volumen || 0;
          tiempoTotal += sesion.tiempo || 0;
        });

        setEstadisticas({
          entrenos: historial.length,
          volumenTotal: volTotal,
          tiempoTotalSegundos: tiempoTotal,
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const formatearTiempo = (segundos: number) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    if (horas > 0) return `${horas}h ${minutos}m`;
    return `${minutos}m`;
  };

  return (
    <ScrollView style={styles.container}>
      {/* CABECERA ESTILO TÉCNICO */}
      <View style={styles.cabeceraPerfil}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarTexto}>
            {nombreUsuario.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.infoUsuario}>
          <Text style={styles.nombreUsuario}>{nombreUsuario}</Text>
          <View style={styles.filaEstadisticasTop}>
            <View style={styles.cajaTop}>
              <Text style={styles.labelTop}>Entrenos Registrados</Text>
              <Text style={styles.valorTop}>{estadisticas.entrenos}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* SECCIÓN RESUMEN */}
      <Text style={styles.tituloSeccion}>Resumen Histórico</Text>

      <View style={styles.contenedorGraficoFalso}>
        <Text style={styles.textoProximamente}>
          Acá irán tus gráficos más adelante
        </Text>
      </View>

      <View style={styles.filaResumenStats}>
        <View style={styles.cajaResumen}>
          <Text style={styles.valorResumenAzul}>
            {formatearTiempo(estadisticas.tiempoTotalSegundos)}
          </Text>
          <Text style={styles.labelResumen}>Duración Total</Text>
        </View>
        <View style={styles.cajaResumen}>
          <Text style={styles.valorResumen}>
            {estadisticas.volumenTotal.toLocaleString()} kg
          </Text>
          <Text style={styles.labelResumen}>Volumen Total</Text>
        </View>
      </View>

      {/* BOTONERA INFORMACIÓN */}
      <Text style={styles.tituloSeccion}>Información</Text>
      <View style={styles.grillaBotones}>
        <TouchableOpacity
          style={styles.botonInfo}
          onPress={() => router.push("/estadisticas")}
        >
          <Text style={styles.textoBotonInfo}>Estadísticas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.botonInfo}
          onPress={() => router.push("/catalogo")}
        >
          <Text style={styles.textoBotonInfo}>Ejercicios</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.botonInfo}
          onPress={() => router.push("/medidas")}
        >
          <Text style={styles.textoBotonInfo}>Medidas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.botonInfo}
          onPress={() => router.push("/calendario")}
        >
          <Text style={styles.textoBotonInfo}>Calendario</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORES.fondoApp,
    padding: 20,
    paddingTop: 60,
  },

  cabeceraPerfil: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
    borderBottomWidth: 1, // Le agregamos una línea divisoria
    borderBottomColor: COLORES.grisBorde,
    paddingBottom: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 6, // Ya no es un círculo perfecto, es un cuadrado sutil
    backgroundColor: "transparent", // Fondo hueco
    borderWidth: 1,
    borderColor: COLORES.azulHevy, // Borde neón
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
  },
  avatarTexto: {
    color: COLORES.azulHevy, // Letra del mismo color que el borde
    fontSize: 40,
    fontWeight: "bold",
  },
  infoUsuario: { flex: 1 },
  nombreUsuario: {
    color: COLORES.textoBlanco,
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 10,
    textTransform: "uppercase", // Nombre siempre en mayúsculas
    letterSpacing: 1,
  },
  filaEstadisticasTop: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  cajaTop: { alignItems: "flex-start" },
  labelTop: {
    color: COLORES.grisOscuro,
    fontSize: 12,
    marginBottom: 4,
    textTransform: "uppercase",
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  valorTop: { color: COLORES.textoBlanco, fontSize: 20, fontWeight: "bold" },

  tituloSeccion: {
    color: COLORES.textoBlanco,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 10,
    marginBottom: 15,
    textTransform: "uppercase", // Títulos en mayúsculas
    letterSpacing: 1,
  },

  contenedorGraficoFalso: {
    height: 150,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORES.grisBorde,
    borderStyle: "dashed", // Línea punteada técnica
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  textoProximamente: {
    color: COLORES.grisOscuro,
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  filaResumenStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  cajaResumen: {
    flex: 1,
    backgroundColor: "transparent", // Cajas transparentes con bordes
    borderWidth: 1,
    borderColor: COLORES.grisBorde,
    padding: 15,
    borderRadius: 6,
    marginHorizontal: 5,
    alignItems: "center",
  },
  valorResumenAzul: {
    color: COLORES.azulHevy,
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
  },
  valorResumen: {
    color: COLORES.textoBlanco,
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
  },
  labelResumen: {
    color: COLORES.grisOscuro,
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  grillaBotones: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  botonInfo: {
    width: "48%",
    backgroundColor: "transparent", // Botones Ghost
    borderWidth: 1,
    borderColor: COLORES.grisBorde,
    padding: 20,
    borderRadius: 6,
    marginBottom: 15,
    alignItems: "center",
  },
  textoBotonInfo: {
    color: COLORES.textoBlanco,
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
