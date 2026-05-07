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

  // NUEVO ESTADO PARA EL NOMBRE DE USUARIO
  const [nombreUsuario, setNombreUsuario] = useState("Atleta");

  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      cargarHistorial();
      cargarNombre(); // Cargamos el nombre cada vez que entra a la pestaña
    }, []),
  );

  // NUEVA FUNCIÓN PARA LEER EL NOMBRE DE LA MEMORIA
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
      {/* CABECERA ESTILO HEVY */}
      <View style={styles.cabeceraPerfil}>
        <View style={styles.avatarContainer}>
          {/* Agarramos la primera letra del nombre dinámicamente y la ponemos en mayúscula */}
          <Text style={styles.avatarTexto}>
            {nombreUsuario.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.infoUsuario}>
          {/* Mostramos el nombre dinámico */}
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
          Acá irán tus gráficos más adelante 📊
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
          <Text style={styles.textoBotonInfo}>📈 Estadísticas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.botonInfo}
          onPress={() => router.push("/catalogo")}
        >
          <Text style={styles.textoBotonInfo}>🏋️‍♂️ Ejercicios</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.botonInfo}
          onPress={() => router.push("/medidas")}
        >
          <Text style={styles.textoBotonInfo}>📏 Medidas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.botonInfo}
          onPress={() => router.push("/calendario")}
        >
          <Text style={styles.textoBotonInfo}>📅 Calendario</Text>
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
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORES.azulHevy,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
  },
  avatarTexto: { color: COLORES.textoBlanco, fontSize: 40, fontWeight: "bold" },
  infoUsuario: { flex: 1 },
  nombreUsuario: {
    color: COLORES.textoBlanco,
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  filaEstadisticasTop: {
    flexDirection: "row",
    justifyContent: "flex-start", // Alineamos a la izquierda ahora que hay un solo elemento
  },
  cajaTop: { alignItems: "flex-start" },
  labelTop: { color: COLORES.grisOscuro, fontSize: 14, marginBottom: 2 }, // Agrandé un poquito la letra para que quede mejor balanceado
  valorTop: { color: COLORES.textoBlanco, fontSize: 20, fontWeight: "bold" }, // Agrandé el número de entrenos

  tituloSeccion: {
    color: COLORES.textoBlanco,
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 15,
  },

  contenedorGraficoFalso: {
    height: 150,
    backgroundColor: COLORES.fondoTarjeta,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  textoProximamente: {
    color: COLORES.grisOscuro,
    fontSize: 14,
    fontStyle: "italic",
  },

  filaResumenStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  cajaResumen: {
    flex: 1,
    backgroundColor: COLORES.fondoTarjeta,
    padding: 15,
    borderRadius: 10,
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
  labelResumen: { color: COLORES.grisOscuro, fontSize: 12 },

  grillaBotones: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  botonInfo: {
    width: "48%",
    backgroundColor: COLORES.fondoTarjeta,
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: "center",
  },
  textoBotonInfo: {
    color: COLORES.textoBlanco,
    fontSize: 16,
    fontWeight: "bold",
  },
});
