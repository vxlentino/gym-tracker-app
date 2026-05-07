import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
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

  // Estados para el formulario
  const [peso, setPeso] = useState("");
  const [pecho, setPecho] = useState("");
  const [brazos, setBrazos] = useState("");
  const [cintura, setCintura] = useState("");
  const [piernas, setPiernas] = useState("");

  useEffect(() => {
    cargarMedidas();
  }, []);

  const cargarMedidas = async () => {
    try {
      const datos = await AsyncStorage.getItem("@historial_medidas");
      if (datos !== null) {
        setHistorialMedidas(JSON.parse(datos));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const guardarNuevaMedida = async () => {
    if (!peso && !pecho && !brazos && !cintura && !piernas) {
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
      {/* HEADER */}
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
                  <Text style={styles.textoEliminar}>🗑️</Text>
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
                <View style={styles.cajaDato}></View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

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
  botonAgregarHeader: { paddingHorizontal: 10 },
  textoAgregarHeader: {
    color: COLORES.azulHevy,
    fontSize: 32,
    fontWeight: "bold",
    marginTop: -5,
  },

  scrollContainer: { padding: 20, paddingBottom: 100 },

  estadoVacio: { alignItems: "center", marginTop: 50, paddingHorizontal: 20 },
  textoVacio: {
    color: COLORES.textoBlanco,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  textoVacioSecundario: {
    color: COLORES.grisOscuro,
    fontSize: 14,
    textAlign: "center",
  },

  tarjetaMedida: {
    backgroundColor: COLORES.fondoTarjeta,
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  cabeceraTarjeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.grisBorde,
    paddingBottom: 10,
  },
  fechaTexto: { color: COLORES.azulHevy, fontSize: 16, fontWeight: "bold" },
  textoEliminar: { fontSize: 18 },

  filaDatos: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  cajaDato: { flex: 1, alignItems: "center" },
  labelDato: { color: COLORES.grisOscuro, fontSize: 12, marginBottom: 5 },
  valorDato: { color: COLORES.textoBlanco, fontSize: 16, fontWeight: "bold" },

  modalOscuro: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: COLORES.modalSemiOscuro,
  },
  cajaModal: {
    backgroundColor: COLORES.fondoTarjeta,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  tituloModal: {
    color: COLORES.textoBlanco,
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },

  filaInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  labelInput: { color: COLORES.textoBlanco, fontSize: 16, width: "30%" },
  inputFormulario: {
    backgroundColor: COLORES.fondoInput,
    color: COLORES.textoBlanco,
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    width: "65%",
    textAlign: "center",
  },

  filaBotones: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  botonCancelar: {
    flex: 1,
    backgroundColor: COLORES.fondoInput,
    paddingVertical: 15,
    borderRadius: 8,
    marginRight: 10,
    alignItems: "center",
  },
  textoCancelar: { color: COLORES.grisClaro, fontWeight: "bold", fontSize: 16 },
  botonGuardar: {
    flex: 1,
    backgroundColor: COLORES.verdeExito,
    paddingVertical: 15,
    borderRadius: 8,
    marginLeft: 10,
    alignItems: "center",
  },
  textoGuardar: {
    color: COLORES.textoBlanco,
    fontWeight: "bold",
    fontSize: 16,
  },
});
