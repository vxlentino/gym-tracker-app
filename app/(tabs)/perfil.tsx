import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Feather from "@expo/vector-icons/Feather";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

  // ESTADOS DEL PERFIL
  const [nombreUsuario, setNombreUsuario] = useState("Atleta");
  const [generoUsuario, setGeneroUsuario] = useState<string | null>(null);

  // ESTADOS DE LA CONFIGURACIÓN (MODAL)
  const [modalConfigVisible, setModalConfigVisible] = useState(false);
  const [inputNombre, setInputNombre] = useState("");
  const [inputGenero, setInputGenero] = useState<string | null>(null);

  const [filtroGrafico, setFiltroGrafico] = useState("Volumen");

  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      cargarHistorial();
      cargarDatosPerfil();
    }, []),
  );

  // CARGAMOS NOMBRE Y GÉNERO
  const cargarDatosPerfil = async () => {
    try {
      const nombreGuardado = await AsyncStorage.getItem("@nombre_usuario");
      if (nombreGuardado) setNombreUsuario(nombreGuardado);

      const generoGuardado = await AsyncStorage.getItem("@genero_usuario");
      if (generoGuardado) setGeneroUsuario(generoGuardado);
    } catch (error) {
      console.error("Error al cargar datos del perfil:", error);
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

  // ABRIR CONFIGURACIÓN (Carga los datos actuales en el formulario)
  const abrirConfiguracion = () => {
    setInputNombre(nombreUsuario);
    setInputGenero(generoUsuario);
    setModalConfigVisible(true);
  };

  // GUARDAR CONFIGURACIÓN EN MEMORIA
  const guardarConfiguracion = async () => {
    try {
      if (inputNombre.trim() !== "") {
        await AsyncStorage.setItem("@nombre_usuario", inputNombre.trim());
        setNombreUsuario(inputNombre.trim());
      }
      if (inputGenero) {
        await AsyncStorage.setItem("@genero_usuario", inputGenero);
        setGeneroUsuario(inputGenero);
      }
      setModalConfigVisible(false);
    } catch (error) {
      console.error("Error al guardar configuración:", error);
    }
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
      {/* CABECERA ESTILO TÉCNICO CON ENGRANAJE */}
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
        <TouchableOpacity
          style={styles.botonEngranaje}
          onPress={abrirConfiguracion}
        >
          <Feather name="settings" size={24} color="white" />
        </TouchableOpacity>
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
          rulesColor="rgba(255,255,255,0.05)"
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

      {/* BOTONERA INFORMACIÓN CON ÍCONOS VECTORIALES */}
      <Text style={styles.tituloSeccion}>Información</Text>
      <View style={styles.grillaBotones}>
        <TouchableOpacity
          style={styles.botonInfo}
          onPress={() => router.push("/estadisticas")}
        >
          <Ionicons name="stats-chart" size={24} color={COLORES.textoBlanco} />
          <Text style={styles.textoBotonInfo}>ESTADÍSTICAS</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botonInfo}
          onPress={() => router.push("/catalogo")}
        >
          <MaterialCommunityIcons
            name="dumbbell"
            size={24}
            color={COLORES.textoBlanco}
          />
          <Text style={styles.textoBotonInfo}>EJERCICIOS</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botonInfo}
          onPress={() => router.push("/medidas")}
        >
          <Ionicons name="body-outline" size={24} color={COLORES.textoBlanco} />
          <Text style={styles.textoBotonInfo}>MEDIDAS</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botonInfo}
          onPress={() => router.push("/calendario")}
        >
          <Ionicons
            name="calendar-outline"
            size={24}
            color={COLORES.textoBlanco}
          />
          <Text style={styles.textoBotonInfo}>CALENDARIO</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL DE CONFIGURACIÓN */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalConfigVisible}
        onRequestClose={() => setModalConfigVisible(false)}
      >
        <View style={styles.modalOscuro}>
          <View style={styles.cajaModal}>
            <Text style={styles.tituloModal}>Configuración</Text>

            <Text style={styles.labelFormulario}>Nombre de Atleta</Text>
            <TextInput
              style={styles.inputFormulario}
              value={inputNombre}
              onChangeText={setInputNombre}
              placeholderTextColor="#888"
            />

            <Text style={styles.labelFormulario}>Perfil Físico (Medidas)</Text>
            <View style={styles.filaBotonesGenero}>
              <TouchableOpacity
                style={[
                  styles.botonSeleccionGenero,
                  inputGenero === "Hombre" && styles.botonSeleccionGeneroActivo,
                ]}
                onPress={() => setInputGenero("Hombre")}
              >
                <Text
                  style={[
                    styles.textoGenero,
                    inputGenero === "Hombre" && styles.textoGeneroActivo,
                  ]}
                >
                  HOMBRE
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.botonSeleccionGenero,
                  inputGenero === "Mujer" && styles.botonSeleccionGeneroActivo,
                ]}
                onPress={() => setInputGenero("Mujer")}
              >
                <Text
                  style={[
                    styles.textoGenero,
                    inputGenero === "Mujer" && styles.textoGeneroActivo,
                  ]}
                >
                  MUJER
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.filaBotonesAccion}>
              <TouchableOpacity
                style={styles.botonCancelar}
                onPress={() => setModalConfigVisible(false)}
              >
                <Text style={styles.textoCancelar}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.botonGuardar}
                onPress={guardarConfiguracion}
              >
                <Text style={styles.textoGuardar}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    borderBottomWidth: 0,
    paddingBottom: 10,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
    textTransform: "uppercase",
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
  botonEngranaje: {
    padding: 10,
  },
  iconoEngranaje: {
    fontSize: 24,
  },

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
    backgroundColor: "#1c1c1e",
    padding: 20,
    borderRadius: 16,
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
    paddingVertical: 18,
    paddingHorizontal: 15,
    borderRadius: 16,
    flexDirection: "row", // Esto pone el ícono y el texto en la misma línea
    alignItems: "center", // Los centra verticalmente
    justifyContent: "flex-start", // Los tira un poquito para la izquierda
    gap: 12, // El espacio entre el ícono y el texto
  },
  textoBotonInfo: {
    color: COLORES.textoBlanco,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  // ESTILOS DEL MODAL DE CONFIGURACIÓN
  modalOscuro: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.85)",
  },
  cajaModal: {
    backgroundColor: "#1c1c1e",
    width: "85%",
    borderRadius: 24,
    padding: 30,
    borderWidth: 1,
    borderColor: COLORES.grisBorde,
  },
  tituloModal: {
    color: COLORES.textoBlanco,
    fontSize: 16,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 25,
    textAlign: "center",
  },
  labelFormulario: {
    color: COLORES.grisClaro,
    fontSize: 11,
    marginBottom: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  inputFormulario: {
    backgroundColor: "#121212",
    color: COLORES.textoBlanco,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    fontSize: 14,
    marginBottom: 25,
    textAlign: "center",
  },
  filaBotonesGenero: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 30,
  },
  botonSeleccionGenero: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
  },
  botonSeleccionGeneroActivo: {
    borderColor: COLORES.azulHevy,
    backgroundColor: "rgba(41, 128, 255, 0.1)", // Azul muy translúcido
  },
  textoGenero: {
    color: COLORES.grisClaro,
    fontWeight: "900",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  textoGeneroActivo: {
    color: COLORES.azulHevy,
  },
  filaBotonesAccion: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  botonCancelar: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingVertical: 15,
    borderRadius: 20,
    marginRight: 10,
    alignItems: "center",
  },
  textoCancelar: {
    color: COLORES.grisClaro,
    fontWeight: "900",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  botonGuardar: {
    flex: 1,
    backgroundColor: COLORES.azulHevy,
    paddingVertical: 15,
    borderRadius: 20,
    marginLeft: 10,
    alignItems: "center",
  },
  textoGuardar: {
    color: COLORES.textoBlanco,
    fontWeight: "900",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
