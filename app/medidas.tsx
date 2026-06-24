import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORES } from "../colores";

export default function PantallaMedidas() {
  const router = useRouter();

  const [historialMedidas, setHistorialMedidas] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  // --- NUEVOS ESTADOS PARA EL GÉNERO ---
  const [genero, setGenero] = useState<string | null>(null);
  const [modalGeneroVisible, setModalGeneroVisible] = useState(false);

  // Estados para el formulario
  const [peso, setPeso] = useState("");
  const [pecho, setPecho] = useState("");
  const [brazos, setBrazos] = useState("");
  const [cintura, setCintura] = useState("");
  const [piernas, setPiernas] = useState("");
  const [gluteos, setGluteos] = useState(""); // Nuevo estado

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = async () => {
    try {
      // 1. Cargamos el historial de medidas
      const datos = await AsyncStorage.getItem("@historial_medidas");
      if (datos !== null) {
        setHistorialMedidas(JSON.parse(datos));
      }

      // 2. Revisamos si ya eligió género alguna vez
      const generoGuardado = await AsyncStorage.getItem("@genero_usuario");
      if (generoGuardado) {
        setGenero(generoGuardado);
      } else {
        // Si no hay género guardado, abrimos la pregunta
        setModalGeneroVisible(true);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const guardarGeneroElegido = async (seleccion: string) => {
    try {
      await AsyncStorage.setItem("@genero_usuario", seleccion);
      setGenero(seleccion);
      setModalGeneroVisible(false);
    } catch (error) {
      console.error("Error guardando género:", error);
    }
  };

  const guardarNuevaMedida = async () => {
    if (!peso && !pecho && !brazos && !cintura && !piernas && !gluteos) {
      Alert.alert("Error", "Completá al menos una medida para guardar.");
      return;
    }

    const nuevaMedida = {
      id: Date.now().toString(),
      fecha: new Date().toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      datos: {
        peso: peso ? `${peso} kg` : "-",
        pecho: pecho ? `${pecho} cm` : "-",
        brazos: brazos ? `${brazos} cm` : "-",
        cintura: cintura ? `${cintura} cm` : "-",
        piernas: piernas ? `${piernas} cm` : "-",
        gluteos: gluteos ? `${gluteos} cm` : "-", // Siempre lo guardamos, pero lo mostramos condicionado
      },
    };

    // Agregamos la nueva medida al principio de la lista
    const nuevoHistorial = [nuevaMedida, ...historialMedidas];
    setHistorialMedidas(nuevoHistorial);

    try {
      await AsyncStorage.setItem(
        "@historial_medidas",
        JSON.stringify(nuevoHistorial),
      );
    } catch (error) {
      console.error(error);
    }

    // Limpiamos los campos y cerramos el modal
    setPeso("");
    setPecho("");
    setBrazos("");
    setCintura("");
    setPiernas("");
    setGluteos("");
    setModalVisible(false);
  };

  const eliminarMedida = (id: string) => {
    Alert.alert(
      "Eliminar registro",
      "¿Querés borrar estas medidas de tu historial?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const nuevoHistorial = historialMedidas.filter((m) => m.id !== id);
            setHistorialMedidas(nuevoHistorial);
            try {
              await AsyncStorage.setItem(
                "@historial_medidas",
                JSON.stringify(nuevoHistorial),
              );
            } catch (error) {
              console.error(error);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.botonAtrasCabecera}
        >
          <Text style={styles.iconoAtras}>˅</Text>
        </TouchableOpacity>
        <Text style={styles.tituloPrincipal}>Medidas</Text>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={styles.botonAgregarHeader}
        >
          <Text style={styles.textoAgregarHeader}>+</Text>
        </TouchableOpacity>
      </View>

      {/* LISTA HISTÓRICA */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {historialMedidas.length === 0 ? (
          <View style={styles.estadoVacio}>
            <Text style={styles.textoVacio}>
              No tenés medidas guardadas todavía.
            </Text>
            <Text style={styles.textoVacioSecundario}>
              Tocá el "+" arriba a la derecha para empezar a registrar tu
              progreso.
            </Text>
          </View>
        ) : (
          historialMedidas.map((registro) => (
            <View key={registro.id} style={styles.tarjetaMedida}>
              <View style={styles.cabeceraTarjeta}>
                <Text style={styles.fechaTexto}>📅 {registro.fecha}</Text>
                <TouchableOpacity onPress={() => eliminarMedida(registro.id)}>
                  <Text style={styles.textoEliminar}>ELIMINAR</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.filaDatos}>
                <View style={styles.cajaDato}>
                  <Text style={styles.labelDato}>Peso</Text>
                  <Text style={styles.valorDato}>{registro.datos.peso}</Text>
                </View>
                <View style={styles.cajaDato}>
                  <Text style={styles.labelDato}>Pecho</Text>
                  <Text style={styles.valorDato}>{registro.datos.pecho}</Text>
                </View>
                <View style={styles.cajaDato}>
                  <Text style={styles.labelDato}>Brazos</Text>
                  <Text style={styles.valorDato}>{registro.datos.brazos}</Text>
                </View>
              </View>

              <View style={styles.filaDatos}>
                <View style={styles.cajaDato}>
                  <Text style={styles.labelDato}>Cintura</Text>
                  <Text style={styles.valorDato}>{registro.datos.cintura}</Text>
                </View>
                <View style={styles.cajaDato}>
                  <Text style={styles.labelDato}>Piernas</Text>
                  <Text style={styles.valorDato}>{registro.datos.piernas}</Text>
                </View>

                {/* MAGIA ACÁ: Si es Mujer, mostramos glúteos. Si no, dejamos el hueco para que no se rompa el diseño */}
                {genero === "Mujer" ? (
                  <View style={styles.cajaDato}>
                    <Text style={styles.labelDato}>Glúteos</Text>
                    <Text style={styles.valorDato}>
                      {registro.datos.gluteos}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.cajaDato}></View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* MODAL PARA PREGUNTAR EL GÉNERO (PRIMERA VEZ) */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalGeneroVisible}
        onRequestClose={() => {}} // No dejamos que lo cierre sin elegir
      >
        <View style={styles.modalOscuroCentro}>
          <View style={styles.cajaModalCentro}>
            <Text style={styles.tituloModal}>Perfil Físico</Text>
            <Text style={styles.textoSubtituloBienvenida}>
              Seleccioná un género para personalizar los músculos a medir.
              Podrás cambiarlo después desde la configuración.
            </Text>

            <View style={styles.filaBotonesGenero}>
              <TouchableOpacity
                style={styles.botonSeleccionGenero}
                onPress={() => guardarGeneroElegido("Hombre")}
              >
                <Text style={styles.iconoGenero}>👨🏻</Text>
                <Text style={styles.textoGuardar}>HOMBRE</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.botonSeleccionGenero}
                onPress={() => guardarGeneroElegido("Mujer")}
              >
                <Text style={styles.iconoGenero}>👩🏻</Text>
                <Text style={styles.textoGuardar}>MUJER</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL PARA AGREGAR NUEVAS MEDIDAS */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOscuro}>
          <View style={styles.cajaModal}>
            <Text style={styles.tituloModal}>Registrar Medidas</Text>

            <View style={styles.filaInput}>
              <Text style={styles.labelInput}>Peso (kg)</Text>
              <TextInput
                style={styles.inputFormulario}
                placeholder="Ej: 80"
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={peso}
                onChangeText={setPeso}
              />
            </View>

            <View style={styles.filaInput}>
              <Text style={styles.labelInput}>Pecho (cm)</Text>
              <TextInput
                style={styles.inputFormulario}
                placeholder="Ej: 105"
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={pecho}
                onChangeText={setPecho}
              />
            </View>

            <View style={styles.filaInput}>
              <Text style={styles.labelInput}>Brazos (cm)</Text>
              <TextInput
                style={styles.inputFormulario}
                placeholder="Ej: 40"
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={brazos}
                onChangeText={setBrazos}
              />
            </View>

            <View style={styles.filaInput}>
              <Text style={styles.labelInput}>Cintura (cm)</Text>
              <TextInput
                style={styles.inputFormulario}
                placeholder="Ej: 85"
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={cintura}
                onChangeText={setCintura}
              />
            </View>

            <View style={styles.filaInput}>
              <Text style={styles.labelInput}>Piernas (cm)</Text>
              <TextInput
                style={styles.inputFormulario}
                placeholder="Ej: 60"
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={piernas}
                onChangeText={setPiernas}
              />
            </View>

            {/* APARECE SÓLO SI ELIGIÓ MUJER */}
            {genero === "Mujer" && (
              <View style={styles.filaInput}>
                <Text style={styles.labelInput}>Glúteos (cm)</Text>
                <TextInput
                  style={styles.inputFormulario}
                  placeholder="Ej: 100"
                  placeholderTextColor="#888"
                  keyboardType="numeric"
                  value={gluteos}
                  onChangeText={setGluteos}
                />
              </View>
            )}

            <View style={styles.filaBotones}>
              <TouchableOpacity
                style={styles.botonCancelar}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.textoCancelar}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.botonGuardar}
                onPress={guardarNuevaMedida}
              >
                <Text style={styles.textoGuardar}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  botonAgregarHeader: { paddingHorizontal: 10 },
  textoAgregarHeader: {
    color: COLORES.azulHevy,
    fontSize: 32,
    fontWeight: "400",
    marginTop: -4,
  },

  scrollContainer: { padding: 20, paddingBottom: 100 },

  estadoVacio: { alignItems: "center", marginTop: 50, paddingHorizontal: 20 },
  textoVacio: {
    color: COLORES.textoBlanco,
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  textoVacioSecundario: {
    color: COLORES.grisOscuro,
    fontSize: 13,
    textAlign: "center",
    fontWeight: "600",
  },

  tarjetaMedida: {
    backgroundColor: "#1c1c1e",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  cabeceraTarjeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    paddingBottom: 15,
  },
  fechaTexto: {
    color: COLORES.azulHevy,
    fontSize: 14,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  textoEliminar: {
    color: COLORES.rojoPeligro,
    fontWeight: "bold",
    fontSize: 11,
    letterSpacing: 1,
  },

  filaDatos: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  cajaDato: { flex: 1, alignItems: "center" },
  labelDato: {
    color: COLORES.grisOscuro,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  valorDato: { color: COLORES.textoBlanco, fontSize: 18, fontWeight: "bold" },

  modalOscuro: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.85)",
  },
  modalOscuroCentro: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.85)",
  },
  cajaModal: {
    backgroundColor: "#1c1c1e",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 25,
    paddingBottom: 50,
  },
  cajaModalCentro: {
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
    marginBottom: 15,
    textAlign: "center",
  },
  textoSubtituloBienvenida: {
    color: COLORES.grisClaro,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 30,
    textAlign: "center",
    lineHeight: 18,
  },

  filaBotonesGenero: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
  },
  botonSeleccionGenero: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORES.azulHevy,
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: "center",
  },
  iconoGenero: {
    fontSize: 32,
    marginBottom: 10,
  },

  filaInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  labelInput: {
    color: COLORES.grisClaro,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
    width: "35%",
  },
  inputFormulario: {
    backgroundColor: "#121212",
    color: COLORES.textoBlanco,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    fontSize: 14,
    width: "60%",
    textAlign: "center",
  },

  filaBotones: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
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
