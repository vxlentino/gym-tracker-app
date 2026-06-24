import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORES } from "../colores";
import { EJERCICIOS_DB, MUSCULOS_CREACION } from "../ejercicios";

export default function PantallaCatalogo() {
  const router = useRouter();
  const [ejerciciosPersonalizados, setEjerciciosPersonalizados] = useState<
    any[]
  >([]);

  // Estados para el formulario de edición/creación
  const [modalCrearEjercicioVisible, setModalCrearEjercicioVisible] =
    useState(false);
  const [ejercicioEditandoId, setEjercicioEditandoId] = useState<string | null>(
    null,
  );
  const [nuevoNombreEjercicio, setNuevoNombreEjercicio] = useState("");
  const [nuevoMusculoEjercicio, setNuevoMusculoEjercicio] = useState("Piernas");
  const [nuevoMediaUrl, setNuevoMediaUrl] = useState("");
  const [nuevaDescripcion, setNuevaDescripcion] = useState("");
  const [nuevosMusculosSecundarios, setNuevosMusculosSecundarios] = useState<
    string[]
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

  const toggleMusculoSecundario = (musculo: string) => {
    if (nuevosMusculosSecundarios.includes(musculo)) {
      setNuevosMusculosSecundarios(
        nuevosMusculosSecundarios.filter((m) => m !== musculo),
      );
    } else {
      setNuevosMusculosSecundarios([...nuevosMusculosSecundarios, musculo]);
    }
  };

  const seleccionarMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permiso denegado",
        "Se requiere acceso a la galería para subir archivos.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled) setNuevoMediaUrl(result.assets[0].uri);
  };

  const guardarEjercicioPersonalizado = async () => {
    if (nuevoNombreEjercicio.trim() === "") {
      Alert.alert("Error", "El nombre es obligatorio.");
      return;
    }

    const todosLosMusculos = [
      nuevoMusculoEjercicio,
      ...nuevosMusculosSecundarios,
    ];

    const nuevoEj = {
      id: ejercicioEditandoId ? ejercicioEditandoId : `custom_${Date.now()}`,
      nombre: nuevoNombreEjercicio.trim(),
      musculo: nuevoMusculoEjercicio,
      imagenUrl: nuevoMediaUrl,
      gifUrl: "",
      descripcion: nuevaDescripcion.trim(),
      musculosTrabajados: todosLosMusculos,
    };

    const nuevaLista = ejercicioEditandoId
      ? ejerciciosPersonalizados.map((e) =>
          e.id === ejercicioEditandoId ? nuevoEj : e,
        )
      : [...ejerciciosPersonalizados, nuevoEj];

    setEjerciciosPersonalizados(nuevaLista);
    try {
      await AsyncStorage.setItem(
        "@ejercicios_custom",
        JSON.stringify(nuevaLista),
      );
    } catch (error) {
      console.error(error);
    }

    setModalCrearEjercicioVisible(false);
    setEjercicioEditandoId(null);
    setNuevosMusculosSecundarios([]);
  };

  const eliminarEjercicioDeDB = (idCustom: string) => {
    Alert.alert(
      "Eliminar Ejercicio",
      "¿Borrar definitivamente este ejercicio del catálogo?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const nuevaLista = ejerciciosPersonalizados.filter(
              (e) => e.id !== idCustom,
            );
            setEjerciciosPersonalizados(nuevaLista);
            try {
              await AsyncStorage.setItem(
                "@ejercicios_custom",
                JSON.stringify(nuevaLista),
              );
            } catch (error) {
              console.error(error);
            }
          },
        },
      ],
    );
  };

  const abrirEditor = (item: any) => {
    setEjercicioEditandoId(item.id);
    setNuevoNombreEjercicio(item.nombre);
    setNuevoMusculoEjercicio(item.musculo);
    setNuevoMediaUrl(item.imagenUrl || "");
    setNuevaDescripcion(item.descripcion || "");
    const secundariosPrevios = item.musculosTrabajados
      ? item.musculosTrabajados.slice(1)
      : [];
    setNuevosMusculosSecundarios(secundariosPrevios);
    setModalCrearEjercicioVisible(true);
  };

  const TODOS_LOS_EJERCICIOS = [
    ...EJERCICIOS_DB,
    ...ejerciciosPersonalizados,
  ].sort((a, b) => a.nombre.localeCompare(b.nombre));

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
        <Text style={styles.tituloPrincipal}>Ejercicios</Text>
        <TouchableOpacity
          style={styles.botonCrearHeader}
          onPress={() => {
            setEjercicioEditandoId(null);
            setNuevoNombreEjercicio("");
            setNuevoMusculoEjercicio("Piernas");
            setNuevoMediaUrl("");
            setNuevaDescripcion("");
            setNuevosMusculosSecundarios([]);
            setModalCrearEjercicioVisible(true);
          }}
        >
          <Text style={styles.textoCrearHeader}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={TODOS_LOS_EJERCICIOS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 50 }}
        renderItem={({ item }) => {
          const miniatura = item.imagenUrl || item.gifUrl;
          const esCustom = item.id.includes("custom");

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
                  {item.musculo} {esCustom && "★"}
                </Text>
              </View>

              {esCustom && (
                <View style={styles.filaAccionesDB}>
                  <TouchableOpacity
                    style={styles.botonAccionDB}
                    onPress={() => abrirEditor(item)}
                  >
                    <Text style={styles.textoEditarDB}>EDITAR</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.botonAccionDB}
                    onPress={() => eliminarEjercicioDeDB(item.id)}
                  >
                    <Text style={styles.textoEliminarDB}>ELIMINAR</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
      />

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalCrearEjercicioVisible}
        onRequestClose={() => setModalCrearEjercicioVisible(false)}
      >
        <View style={styles.modalOscuro}>
          <View style={styles.cajaCrearEjercicioScroll}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.tituloCajaDescanso}>
                {ejercicioEditandoId
                  ? "Editar Ejercicio"
                  : "Crear Nuevo Ejercicio"}
              </Text>

              <Text style={styles.labelFormulario}>Nombre (Obligatorio)</Text>
              <TextInput
                style={styles.inputFormulario}
                placeholderTextColor="#888"
                value={nuevoNombreEjercicio}
                onChangeText={setNuevoNombreEjercicio}
              />

              <Text style={styles.labelFormulario}>
                Imagen o GIF (Desde galería)
              </Text>
              <TouchableOpacity
                style={[styles.botonSubirFoto, { marginBottom: 15 }]}
                onPress={seleccionarMedia}
              >
                <Text style={styles.textoSubirFoto}>
                  {nuevoMediaUrl ? "Archivo seleccionado" : "Subir Archivo"}
                </Text>
              </TouchableOpacity>

              <Text style={styles.labelFormulario}>
                Descripción / Tips (Opcional)
              </Text>
              <TextInput
                style={[
                  styles.inputFormulario,
                  { height: 80, textAlignVertical: "top" },
                ]}
                multiline={true}
                placeholderTextColor="#888"
                value={nuevaDescripcion}
                onChangeText={setNuevaDescripcion}
              />

              <Text style={styles.labelFormulario}>
                Músculos Secundarios (Múltiple)
              </Text>
              <View style={styles.contenedorFiltrosCreacion}>
                {MUSCULOS_CREACION.map((m) => {
                  if (m === nuevoMusculoEjercicio) return null;
                  const seleccionado = nuevosMusculosSecundarios.includes(m);
                  return (
                    <TouchableOpacity
                      key={`secundario-${m}`}
                      style={[
                        styles.botonFiltroCreacion,
                        seleccionado && styles.botonFiltroActivo,
                      ]}
                      onPress={() => toggleMusculoSecundario(m)}
                    >
                      <Text
                        style={
                          seleccionado
                            ? styles.textoFiltroActivo
                            : styles.textoFiltro
                        }
                      >
                        {m}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text
                style={[
                  styles.labelFormulario,
                  { marginTop: 10, marginBottom: 10 },
                ]}
              >
                Músculo Principal:
              </Text>
              <View style={styles.contenedorFiltrosCreacion}>
                {MUSCULOS_CREACION.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.botonFiltroCreacion,
                      nuevoMusculoEjercicio === m && styles.botonFiltroActivo,
                    ]}
                    onPress={() => setNuevoMusculoEjercicio(m)}
                  >
                    <Text
                      style={
                        nuevoMusculoEjercicio === m
                          ? styles.textoFiltroActivo
                          : styles.textoFiltro
                      }
                    >
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.filaBotonesCrear}>
                <TouchableOpacity
                  style={styles.botonCancelarCrear}
                  onPress={() => {
                    setModalCrearEjercicioVisible(false);
                    setEjercicioEditandoId(null);
                  }}
                >
                  <Text style={styles.textoCancelarCrear}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.botonGuardarCrear}
                  onPress={guardarEjercicioPersonalizado}
                >
                  <Text style={styles.textoGuardar}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
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
    fontSize: 18,
    fontWeight: "900",
    color: COLORES.textoBlanco,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  botonCrearHeader: {
    paddingHorizontal: 10,
  },
  textoCrearHeader: {
    color: COLORES.azulHevy,
    fontSize: 32,
    fontWeight: "400",
    marginTop: -4,
  },
  itemEjercicio: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  imagenMini: {
    width: 50,
    height: 50,
    borderRadius: 12,
    marginRight: 15,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  textoNombre: {
    color: COLORES.textoBlanco,
    fontSize: 14,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  textoMusculo: {
    color: COLORES.grisOscuro,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  filaAccionesDB: {
    flexDirection: "row",
    alignItems: "center",
  },
  botonAccionDB: {
    paddingVertical: 5,
    paddingLeft: 15,
  },
  textoEditarDB: {
    color: COLORES.azulHevy,
    fontWeight: "bold",
    fontSize: 11,
    letterSpacing: 1,
  },
  textoEliminarDB: {
    color: COLORES.rojoPeligro,
    fontWeight: "bold",
    fontSize: 11,
    letterSpacing: 1,
  },

  // Estilos del Modal
  modalOscuro: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.85)",
  },
  cajaCrearEjercicioScroll: {
    backgroundColor: "#1c1c1e",
    width: "100%",
    maxHeight: "85%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 25,
  },
  tituloCajaDescanso: {
    color: COLORES.textoBlanco,
    fontSize: 14,
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 25,
    textAlign: "center",
    letterSpacing: 1.5,
  },
  labelFormulario: {
    color: COLORES.grisClaro,
    fontSize: 11,
    marginBottom: 8,
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
    marginBottom: 20,
  },
  botonSubirFoto: {
    backgroundColor: "transparent",
    padding: 18,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.1)",
  },
  textoSubirFoto: {
    color: COLORES.grisClaro,
    fontWeight: "900",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  contenedorFiltrosCreacion: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 25,
  },
  botonFiltroCreacion: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  botonFiltroActivo: {
    backgroundColor: COLORES.azulHevy,
    borderColor: COLORES.azulHevy,
  },
  textoFiltro: {
    color: COLORES.grisClaro,
    fontWeight: "900",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  textoFiltroActivo: {
    color: COLORES.textoBlanco,
    fontWeight: "900",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  filaBotonesCrear: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  botonCancelarCrear: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    flex: 1,
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: "center",
    marginRight: 10,
  },
  textoCancelarCrear: {
    color: COLORES.grisClaro,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  botonGuardarCrear: {
    backgroundColor: COLORES.azulHevy,
    flex: 1,
    paddingVertical: 15,
    borderRadius: 20,
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
