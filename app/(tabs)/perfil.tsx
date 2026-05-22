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
import { LineChart } from "react-native-gifted-charts";
import { COLORES } from "../../colores";

export default function PantallaPerfil() {
  const [estadisticas, setEstadisticas] = useState({
    entrenos: 0,
    volumenTotal: 0,
    tiempoTotalSegundos: 0,
  });

  // ESTADO PARA EL NOMBRE DE USUARIO
  const [nombreUsuario, setNombreUsuario] = useState("Atleta");

  // NUEVO ESTADO PARA EL FILTRO DEL GRÁFICO
  const [filtroGrafico, setFiltroGrafico] = useState("Volumen");

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

  // MOCK DATA: Últimos 5 entrenamientos
  const datosVolumen = [
    { value: 4500, label: "Lun" },
    { value: 5200, label: "Mié" },
    { value: 4800, label: "Vie" },
    { value: 6100, label: "Sáb" },
    { value: 5900, label: "Dom" },
  ];
  const datosDuracion = [
    { value: 45, label: "Lun" },
    { value: 60, label: "Mié" },
    { value: 55, label: "Vie" },
    { value: 70, label: "Sáb" },
    { value: 65, label: "Dom" },
  ];
  const datosRepeticiones = [
    { value: 120, label: "Lun" },
    { value: 140, label: "Mié" },
    { value: 130, label: "Vie" },
    { value: 160, label: "Sáb" },
    { value: 150, label: "Dom" },
  ];

  const datosGrafico =
    filtroGrafico === "Volumen"
      ? datosVolumen
      : filtroGrafico === "Duración"
        ? datosDuracion
        : datosRepeticiones;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 120 }}
    >
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

      <View style={styles.contenedorGrafico}>
        <LineChart
          data={datosGrafico}
          curved
          areaChart
          color={COLORES.azulHevy}
          thickness={3}
          startFillColor={COLORES.azulHevy}
          startOpacity={0.4}
          endFillColor="transparent"
          endOpacity={0}
          dataPointsColor={COLORES.azulHevy}
          dataPointsRadius={4}
          yAxisThickness={0}
          xAxisThickness={1}
          xAxisColor={COLORES.grisBorde}
          rulesColor="rgba(255,255,255,0.05)" // Líneas extremadamente sutiles
          rulesType="solid"
          hideRules={false}
          yAxisTextStyle={{ color: COLORES.grisOscuro, fontSize: 11 }}
          xAxisLabelTextStyle={{
            color: COLORES.grisOscuro,
            fontSize: 11,
            textAlign: "center",
          }}
          noOfSections={4}
          backgroundColor="transparent"
          initialSpacing={15}
        />
      </View>

      <View style={styles.filaFiltrosGrafico}>
        {["Duración", "Volumen", "Repeticiones"].map((filtro) => (
          <TouchableOpacity
            key={filtro}
            style={[
              styles.pillFiltro,
              filtroGrafico === filtro && styles.pillFiltroActivo,
            ]}
            onPress={() => setFiltroGrafico(filtro)}
          >
            <Text
              style={[
                styles.textoPillFiltro,
                filtroGrafico === filtro && styles.textoPillFiltroActivo,
              ]}
            >
              {filtro}
            </Text>
          </TouchableOpacity>
        ))}
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
          <Text style={styles.textoBotonInfo}>ESTADÍSTICAS</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.botonInfo}
          onPress={() => router.push("/catalogo")}
        >
          <Text style={styles.textoBotonInfo}>EJERCICIOS</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.botonInfo}
          onPress={() => router.push("/medidas")}
        >
          <Text style={styles.textoBotonInfo}>MEDIDAS</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.botonInfo}
          onPress={() => router.push("/calendario")}
        >
          <Text style={styles.textoBotonInfo}>CALENDARIO</Text>
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
    borderBottomWidth: 0, // Quitamos bordes duros
    paddingBottom: 10,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40, // Círculo perfecto estilo Hevy
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: COLORES.azulHevy,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
  },
  avatarTexto: {
    color: COLORES.azulHevy,
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
    fontSize: 11,
    marginBottom: 4,
    textTransform: "uppercase",
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  valorTop: { color: COLORES.textoBlanco, fontSize: 20, fontWeight: "bold" },

  tituloSeccion: {
    color: COLORES.textoBlanco,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 20,
    marginBottom: 20,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },

  contenedorGrafico: {
    paddingVertical: 20,
    marginBottom: 10,
    alignItems: "center",
  },
  filaFiltrosGrafico: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  pillFiltro: {
    flex: 1,
    backgroundColor: "transparent",
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 4,
    alignItems: "center",
  },
  pillFiltroActivo: {
    backgroundColor: COLORES.azulHevy,
  },
  textoPillFiltro: {
    color: COLORES.grisOscuro,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  textoPillFiltroActivo: {
    color: COLORES.textoBlanco,
  },

  filaResumenStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
    gap: 15,
  },
  cajaResumen: {
    flex: 1,
    backgroundColor: "#1c1c1e", // Fondo limpio y oscuro
    padding: 20,
    borderRadius: 16, // Bordes más suaves
    alignItems: "center",
  },
  valorResumenAzul: {
    color: COLORES.azulHevy,
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 5,
  },
  valorResumen: {
    color: COLORES.textoBlanco,
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 5,
  },
  labelResumen: {
    color: COLORES.grisOscuro,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },

  grillaBotones: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 15,
  },
  botonInfo: {
    flexBasis: "47%",
    backgroundColor: "#1c1c1e",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
  },
  textoBotonInfo: {
    color: COLORES.textoBlanco,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
});
