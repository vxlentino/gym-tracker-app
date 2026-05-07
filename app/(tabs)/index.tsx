import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  GestureHandlerRootView,
  Swipeable,
} from "react-native-gesture-handler";
import { COLORES } from "../../colores";

export default function HomeScreen() {
  const [carpetas, setCarpetas] = useState<any[]>([]);

  const [modalCarpetaVisible, setModalCarpetaVisible] = useState(false);
  const [nombreNuevaCarpeta, setNombreNuevaCarpeta] = useState("");

  const [modalRutinaVisible, setModalRutinaVisible] = useState(false);
  const [nombreNuevaRutina, setNombreNuevaRutina] = useState("");
  const [carpetaDestinoId, setCarpetaDestinoId] = useState<string | null>(null);

  const [opcionesCarpetaId, setOpcionesCarpetaId] = useState<string | null>(
    null,
  );
  const [opcionesRutinaSeleccionada, setOpcionesRutinaSeleccionada] = useState<{
    idCarpeta: string;
    nombreRutina: string;
  } | null>(null);

  const [modalEditarCarpetaVisible, setModalEditarCarpetaVisible] =
    useState(false);
  const [nuevoNombreEdicionCarpeta, setNuevoNombreEdicionCarpeta] =
    useState("");

  const [modalEditarRutinaVisible, setModalEditarRutinaVisible] =
    useState(false);
  const [nuevoNombreEdicionRutina, setNuevoNombreEdicionRutina] = useState("");

  // --- NUEVOS ESTADOS PARA EL NOMBRE DE USUARIO ---
  const [modalNombreVisible, setModalNombreVisible] = useState(false);
  const [inputNombre, setInputNombre] = useState("");

  const router = useRouter();

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      // 1. Verificamos si ya guardó su nombre antes
      const nombreGuardado = await AsyncStorage.getItem("@nombre_usuario");
      if (!nombreGuardado) {
        setModalNombreVisible(true); // Si no hay nombre, mostramos el modal
      }

      // 2. Cargamos las rutinas normalmente
      const datosV2 = await AsyncStorage.getItem("@gym_carpetas_v2");
      if (datosV2 !== null) {
        setCarpetas(JSON.parse(datosV2));
      } else {
        const datosV1 = await AsyncStorage.getItem("@mis_carpetas");
        if (datosV1 !== null) {
          const rutinasV1 = JSON.parse(datosV1);
          const carpetaMigrada = {
            id: "carpeta_migrada",
            nombre: "Mis Rutinas Antiguas",
            rutinas: rutinasV1,
            expandida: true,
          };
          setCarpetas([carpetaMigrada]);
          await AsyncStorage.setItem(
            "@gym_carpetas_v2",
            JSON.stringify([carpetaMigrada]),
          );
        }
      }
    } catch (error) {
      console.error("Error cargando datos", error);
    }
  };

  // --- NUEVA FUNCIÓN PARA GUARDAR EL NOMBRE ---
  const guardarNombre = async () => {
    if (inputNombre.trim() !== "") {
      await AsyncStorage.setItem("@nombre_usuario", inputNombre.trim());
      setModalNombreVisible(false);
    } else {
      Alert.alert("Ey", "Por favor, ingresá un nombre para continuar.");
    }
  };

  const guardarCarpetas = async (nuevasCarpetas: any[]) => {
    try {
      await AsyncStorage.setItem(
        "@gym_carpetas_v2",
        JSON.stringify(nuevasCarpetas),
      );
    } catch (error) {
      console.error("Error guardando carpetas", error);
    }
  };

  // --- FUNCIONES DE CARPETAS ---
  const crearCarpeta = () => {
    if (nombreNuevaCarpeta.trim() === "") return;
    const nuevaCarpeta = {
      id: Date.now().toString(),
      nombre: nombreNuevaCarpeta,
      rutinas: [],
      expandida: true,
    };
    const nuevasCarpetas = [...carpetas, nuevaCarpeta];
    setCarpetas(nuevasCarpetas);
    guardarCarpetas(nuevasCarpetas);
    setNombreNuevaCarpeta("");
    setModalCarpetaVisible(false);
  };

  const editarCarpeta = () => {
    if (nuevoNombreEdicionCarpeta.trim() === "" || !opcionesCarpetaId) return;
    const nuevasCarpetas = carpetas.map((c) => {
      if (c.id === opcionesCarpetaId) {
        return { ...c, nombre: nuevoNombreEdicionCarpeta };
      }
      return c;
    });
    setCarpetas(nuevasCarpetas);
    guardarCarpetas(nuevasCarpetas);
    setModalEditarCarpetaVisible(false);
    setOpcionesCarpetaId(null);
  };

  const eliminarCarpeta = (idCarpeta: string) => {
    Alert.alert(
      "Eliminar Carpeta",
      "Si borrás la carpeta, también se borran las rutinas de la lista. ¿Estás seguro?",
      [
        {
          text: "Cancelar",
          style: "cancel",
          onPress: () => setOpcionesCarpetaId(null),
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            const nuevasCarpetas = carpetas.filter((c) => c.id !== idCarpeta);
            setCarpetas(nuevasCarpetas);
            guardarCarpetas(nuevasCarpetas);
            setOpcionesCarpetaId(null);
          },
        },
      ],
    );
  };

  const toggleExpandirCarpeta = (idCarpeta: string) => {
    const nuevasCarpetas = carpetas.map((c) => {
      if (c.id === idCarpeta) return { ...c, expandida: !c.expandida };
      return c;
    });
    setCarpetas(nuevasCarpetas);
    guardarCarpetas(nuevasCarpetas);
  };

  // --- FUNCIONES DE RUTINAS ---
  const abrirModalCrearRutina = (idCarpeta: string) => {
    setCarpetaDestinoId(idCarpeta);
    setModalRutinaVisible(true);
  };

  const crearRutina = () => {
    if (nombreNuevaRutina.trim() === "" || !carpetaDestinoId) return;
    const nuevasCarpetas = carpetas.map((c) => {
      if (c.id === carpetaDestinoId) {
        return { ...c, rutinas: [...c.rutinas, nombreNuevaRutina] };
      }
      return c;
    });
    setCarpetas(nuevasCarpetas);
    guardarCarpetas(nuevasCarpetas);
    setNombreNuevaRutina("");
    setModalRutinaVisible(false);
  };

  const editarRutina = async () => {
    if (nuevoNombreEdicionRutina.trim() === "" || !opcionesRutinaSeleccionada)
      return;

    const { idCarpeta, nombreRutina } = opcionesRutinaSeleccionada;
    const nuevoNombre = nuevoNombreEdicionRutina.trim();

    const nuevasCarpetas = carpetas.map((c) => {
      if (c.id === idCarpeta) {
        const nuevasRutinas = c.rutinas.map((r: string) =>
          r === nombreRutina ? nuevoNombre : r,
        );
        return { ...c, rutinas: nuevasRutinas };
      }
      return c;
    });

    setCarpetas(nuevasCarpetas);
    guardarCarpetas(nuevasCarpetas);

    try {
      const datosViejos = await AsyncStorage.getItem(`@rutina_${nombreRutina}`);
      if (datosViejos !== null) {
        await AsyncStorage.setItem(`@rutina_${nuevoNombre}`, datosViejos);
        await AsyncStorage.removeItem(`@rutina_${nombreRutina}`);
      }
    } catch (e) {
      console.error(e);
    }

    setModalEditarRutinaVisible(false);
    setOpcionesRutinaSeleccionada(null);
  };

  const eliminarRutina = (idCarpeta: string, nombreRutina: string) => {
    Alert.alert(
      "Eliminar Rutina",
      `¿Seguro que querés borrar "${nombreRutina}"?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
          onPress: () => setOpcionesRutinaSeleccionada(null),
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const nuevasCarpetas = carpetas.map((c) => {
              if (c.id === idCarpeta) {
                return {
                  ...c,
                  rutinas: c.rutinas.filter((r: string) => r !== nombreRutina),
                };
              }
              return c;
            });
            setCarpetas(nuevasCarpetas);
            guardarCarpetas(nuevasCarpetas);
            await AsyncStorage.removeItem(`@rutina_${nombreRutina}`);
            setOpcionesRutinaSeleccionada(null);
          },
        },
      ],
    );
  };

  const renderBotonEliminarCarpeta = (idCarpeta: string) => (
    <TouchableOpacity
      style={styles.botonEliminarSwipeCarpeta}
      onPress={() => eliminarCarpeta(idCarpeta)}
    >
      <Text style={styles.textoEliminarSwipe}>Borrar</Text>
    </TouchableOpacity>
  );

  const renderBotonEliminarRutina = (
    idCarpeta: string,
    nombreRutina: string,
  ) => (
    <TouchableOpacity
      style={styles.botonEliminarSwipeRutina}
      onPress={() => eliminarRutina(idCarpeta, nombreRutina)}
    >
      <Text style={styles.textoEliminarSwipe}>Borrar</Text>
    </TouchableOpacity>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.tituloPrincipal}>Mis Entrenamientos</Text>
          <TouchableOpacity
            style={styles.botonNuevaCarpetaCabecera}
            onPress={() => setModalCarpetaVisible(true)}
          >
            <Text style={styles.textoNuevaCarpetaCabecera}>+ Carpeta</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={carpetas}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text style={styles.textoVacio}>
              No tenés carpetas todavía. ¡Creá una!
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.bloqueCarpeta}>
              <Swipeable
                renderRightActions={() => renderBotonEliminarCarpeta(item.id)}
              >
                <View style={styles.cabeceraCarpetaContainer}>
                  <TouchableOpacity
                    style={styles.cabeceraCarpetaTexto}
                    onPress={() => toggleExpandirCarpeta(item.id)}
                  >
                    <Text style={styles.textoCarpeta}>{item.nombre}</Text>
                    <Text style={styles.iconoExpandir}>
                      {item.expandida ? "▼" : "▶"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.botonOpcionesCarpeta}
                    onPress={() => setOpcionesCarpetaId(item.id)}
                  >
                    <Text style={styles.iconoOpcionesVertical}>⋮</Text>
                  </TouchableOpacity>
                </View>
              </Swipeable>

              {item.expandida && (
                <View style={styles.contenedorRutinas}>
                  {item.rutinas.map((rutina: string) => (
                    <Swipeable
                      key={rutina}
                      renderRightActions={() =>
                        renderBotonEliminarRutina(item.id, rutina)
                      }
                    >
                      <View style={styles.itemRutinaContainer}>
                        <TouchableOpacity
                          style={styles.itemRutinaBotonCentral}
                          onPress={() => router.push(`/${rutina}`)}
                        >
                          <Text style={styles.textoRutina}>{rutina}</Text>
                          <Text style={styles.iconoEntrar}>→</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.botonOpcionesRutina}
                          onPress={() =>
                            setOpcionesRutinaSeleccionada({
                              idCarpeta: item.id,
                              nombreRutina: rutina,
                            })
                          }
                        >
                          <Text style={styles.iconoOpcionesVerticalRutina}>
                            ⋮
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </Swipeable>
                  ))}

                  <TouchableOpacity
                    style={styles.botonNuevaRutina}
                    onPress={() => abrirModalCrearRutina(item.id)}
                  >
                    <Text style={styles.textoNuevaRutina}>
                      + Añadir Rutina a esta carpeta
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        />

        {/* MODAL BIENVENIDA / PEDIR NOMBRE */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalNombreVisible}
          // El onRequestClose vacío fuerza a que el usuario TENGA que poner el nombre
          onRequestClose={() => {}}
        >
          <View style={styles.modalOscuro}>
            <View style={styles.cajaModal}>
              <Text style={styles.tituloModalBienvenida}>
                ¡Bienvenido a tu App!
              </Text>
              <Text style={styles.textoSubtituloBienvenida}>
                ¿Cómo querés que te llame en los entrenamientos?
              </Text>
              <TextInput
                style={styles.inputModal}
                placeholder="Ingresá tu nombre o apodo..."
                placeholderTextColor="#888"
                value={inputNombre}
                onChangeText={setInputNombre}
                autoFocus={true}
              />
              <TouchableOpacity
                style={styles.botonGuardarBienvenida}
                onPress={guardarNombre}
              >
                <Text style={styles.textoGuardar}>Empezar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* MODAL CREAR CARPETA */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalCarpetaVisible}
          onRequestClose={() => setModalCarpetaVisible(false)}
        >
          <View style={styles.modalOscuro}>
            <View style={styles.cajaModal}>
              <Text style={styles.tituloModal}>Nueva Carpeta</Text>
              <TextInput
                style={styles.inputModal}
                placeholder="Ej. Bloque Hipertrofia..."
                placeholderTextColor="#888"
                value={nombreNuevaCarpeta}
                onChangeText={setNombreNuevaCarpeta}
                autoFocus={true}
              />
              <View style={styles.filaBotones}>
                <TouchableOpacity
                  style={styles.botonCancelar}
                  onPress={() => setModalCarpetaVisible(false)}
                >
                  <Text style={styles.textoCancelar}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.botonGuardar}
                  onPress={crearCarpeta}
                >
                  <Text style={styles.textoGuardar}>Crear</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* MODAL CREAR RUTINA */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalRutinaVisible}
          onRequestClose={() => setModalRutinaVisible(false)}
        >
          <View style={styles.modalOscuro}>
            <View style={styles.cajaModal}>
              <Text style={styles.tituloModal}>Nueva Rutina</Text>
              <TextInput
                style={styles.inputModal}
                placeholder="Ej. Día de Empuje..."
                placeholderTextColor="#888"
                value={nombreNuevaRutina}
                onChangeText={setNombreNuevaRutina}
                autoFocus={true}
              />
              <View style={styles.filaBotones}>
                <TouchableOpacity
                  style={styles.botonCancelar}
                  onPress={() => setModalRutinaVisible(false)}
                >
                  <Text style={styles.textoCancelar}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.botonGuardar}
                  onPress={crearRutina}
                >
                  <Text style={styles.textoGuardar}>Crear</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* MODAL OPCIONES CARPETA */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={!!opcionesCarpetaId}
          onRequestClose={() => setOpcionesCarpetaId(null)}
        >
          <View style={styles.modalOscuroMenu}>
            <View style={styles.cajaOpcionesMenu}>
              <View style={styles.indicadorDrag} />
              <Text style={styles.tituloOpciones}>Opciones de Carpeta</Text>

              <TouchableOpacity
                style={styles.botonMenuOpcion}
                onPress={() => {
                  const carpeta = carpetas.find(
                    (c) => c.id === opcionesCarpetaId,
                  );
                  setNuevoNombreEdicionCarpeta(carpeta?.nombre || "");
                  setOpcionesCarpetaId(null);
                  setModalEditarCarpetaVisible(true);
                }}
              >
                <Text style={styles.textoMenuIcono}>✏️</Text>
                <Text style={styles.textoMenuOpcion}>Renombrar Carpeta</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.botonMenuOpcion, { borderBottomWidth: 0 }]}
                onPress={() => eliminarCarpeta(opcionesCarpetaId!)}
              >
                <Text style={styles.textoMenuIcono}>❌</Text>
                <Text
                  style={[
                    styles.textoMenuOpcion,
                    { color: COLORES.rojoPeligro },
                  ]}
                >
                  Eliminar Carpeta
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.botonCancelarOpciones}
                onPress={() => setOpcionesCarpetaId(null)}
              >
                <Text style={styles.textoCancelarOpciones}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* MODAL EDITAR CARPETA */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalEditarCarpetaVisible}
          onRequestClose={() => setModalEditarCarpetaVisible(false)}
        >
          <View style={styles.modalOscuro}>
            <View style={styles.cajaModal}>
              <Text style={styles.tituloModal}>Renombrar Carpeta</Text>
              <TextInput
                style={styles.inputModal}
                placeholderTextColor="#888"
                value={nuevoNombreEdicionCarpeta}
                onChangeText={setNuevoNombreEdicionCarpeta}
                autoFocus={true}
              />
              <View style={styles.filaBotones}>
                <TouchableOpacity
                  style={styles.botonCancelar}
                  onPress={() => setModalEditarCarpetaVisible(false)}
                >
                  <Text style={styles.textoCancelar}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.botonGuardar}
                  onPress={editarCarpeta}
                >
                  <Text style={styles.textoGuardar}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* MODAL OPCIONES RUTINA */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={!!opcionesRutinaSeleccionada}
          onRequestClose={() => setOpcionesRutinaSeleccionada(null)}
        >
          <View style={styles.modalOscuroMenu}>
            <View style={styles.cajaOpcionesMenu}>
              <View style={styles.indicadorDrag} />
              <Text style={styles.tituloOpciones}>Opciones de Rutina</Text>

              <TouchableOpacity
                style={styles.botonMenuOpcion}
                onPress={() => {
                  setNuevoNombreEdicionRutina(
                    opcionesRutinaSeleccionada!.nombreRutina,
                  );
                  setOpcionesRutinaSeleccionada(null);
                  setModalEditarRutinaVisible(true);
                }}
              >
                <Text style={styles.textoMenuIcono}>✏️</Text>
                <Text style={styles.textoMenuOpcion}>Renombrar Rutina</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.botonMenuOpcion, { borderBottomWidth: 0 }]}
                onPress={() =>
                  eliminarRutina(
                    opcionesRutinaSeleccionada!.idCarpeta,
                    opcionesRutinaSeleccionada!.nombreRutina,
                  )
                }
              >
                <Text style={styles.textoMenuIcono}>❌</Text>
                <Text
                  style={[
                    styles.textoMenuOpcion,
                    { color: COLORES.rojoPeligro },
                  ]}
                >
                  Eliminar Rutina
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.botonCancelarOpciones}
                onPress={() => setOpcionesRutinaSeleccionada(null)}
              >
                <Text style={styles.textoCancelarOpciones}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* MODAL EDITAR RUTINA */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalEditarRutinaVisible}
          onRequestClose={() => setModalEditarRutinaVisible(false)}
        >
          <View style={styles.modalOscuro}>
            <View style={styles.cajaModal}>
              <Text style={styles.tituloModal}>Renombrar Rutina</Text>
              <TextInput
                style={styles.inputModal}
                placeholderTextColor="#888"
                value={nuevoNombreEdicionRutina}
                onChangeText={setNuevoNombreEdicionRutina}
                autoFocus={true}
              />
              <View style={styles.filaBotones}>
                <TouchableOpacity
                  style={styles.botonCancelar}
                  onPress={() => setModalEditarRutinaVisible(false)}
                >
                  <Text style={styles.textoCancelar}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.botonGuardar}
                  onPress={editarRutina}
                >
                  <Text style={styles.textoGuardar}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORES.fondoApp,
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  tituloPrincipal: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORES.textoBlanco,
  },
  botonNuevaCarpetaCabecera: {
    backgroundColor: COLORES.azulHevy,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  textoNuevaCarpetaCabecera: {
    color: COLORES.textoBlanco,
    fontWeight: "bold",
    fontSize: 14,
  },
  textoVacio: {
    color: COLORES.grisOscuro,
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
  },

  bloqueCarpeta: { marginBottom: 20 },
  cabeceraCarpetaContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORES.fondoTarjeta,
    borderRadius: 10,
  },
  cabeceraCarpetaTexto: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
  },
  botonOpcionesCarpeta: { padding: 18, paddingLeft: 5 },
  textoCarpeta: {
    color: COLORES.textoBlanco,
    fontSize: 20,
    fontWeight: "bold",
  },
  iconoExpandir: { color: COLORES.grisOscuro, fontSize: 16 },
  iconoOpcionesVertical: {
    color: COLORES.grisClaro,
    fontSize: 20,
    fontWeight: "bold",
  },

  contenedorRutinas: {
    marginTop: 10,
    paddingLeft: 15,
    borderLeftWidth: 2,
    borderLeftColor: COLORES.azulHevy,
    marginLeft: 10,
  },

  itemRutinaContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORES.fondoInput,
    borderRadius: 8,
    marginBottom: 10,
  },
  itemRutinaBotonCentral: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
  },
  botonOpcionesRutina: { padding: 15, paddingLeft: 5 },
  textoRutina: { color: COLORES.textoBlanco, fontSize: 16, fontWeight: "600" },
  iconoEntrar: { color: COLORES.azulHevy, fontSize: 20, fontWeight: "bold" },
  iconoOpcionesVerticalRutina: {
    color: COLORES.grisClaro,
    fontSize: 18,
    fontWeight: "bold",
  },

  botonNuevaRutina: {
    padding: 15,
    borderRadius: 8,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: COLORES.grisOscuro,
    alignItems: "center",
    marginTop: 5,
  },
  textoNuevaRutina: {
    color: COLORES.grisOscuro,
    fontSize: 14,
    fontWeight: "bold",
  },

  botonEliminarSwipeCarpeta: {
    backgroundColor: COLORES.rojoPeligro,
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    borderRadius: 10,
    marginLeft: 10,
  },
  botonEliminarSwipeRutina: {
    backgroundColor: COLORES.rojoPeligro,
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    borderRadius: 8,
    marginBottom: 10,
    marginLeft: 10,
  },
  textoEliminarSwipe: {
    color: COLORES.textoBlanco,
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
  },

  modalOscuro: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.8)", // Más oscuro para el modal de bienvenida
  },
  cajaModal: {
    backgroundColor: COLORES.fondoTarjeta,
    width: "85%",
    borderRadius: 15,
    padding: 25,
  },
  tituloModal: {
    color: COLORES.textoBlanco,
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  tituloModalBienvenida: {
    color: COLORES.textoBlanco,
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  textoSubtituloBienvenida: {
    color: COLORES.grisClaro,
    fontSize: 14,
    marginBottom: 20,
    textAlign: "center",
  },
  inputModal: {
    backgroundColor: COLORES.fondoInput,
    color: COLORES.textoBlanco,
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  filaBotones: { flexDirection: "row", justifyContent: "space-between" },
  botonCancelar: {
    backgroundColor: COLORES.grisBorde,
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginRight: 10,
  },
  textoCancelar: { color: COLORES.grisClaro, fontSize: 16, fontWeight: "bold" },
  botonGuardar: {
    backgroundColor: COLORES.verdeExito,
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  botonGuardarBienvenida: {
    backgroundColor: COLORES.azulHevy,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  textoGuardar: {
    color: COLORES.textoBlanco,
    fontSize: 16,
    fontWeight: "bold",
  },

  // ESTILOS MODAL OPCIONES INFERIOR
  modalOscuroMenu: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: COLORES.modalOscuro,
  },
  cajaOpcionesMenu: {
    backgroundColor: "#1c1c1e",
    width: "100%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  indicadorDrag: {
    width: 40,
    height: 5,
    backgroundColor: COLORES.grisOscuro,
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 20,
  },
  tituloOpciones: {
    color: COLORES.textoBlanco,
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  botonMenuOpcion: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.fondoInput,
  },
  textoMenuIcono: { fontSize: 20, marginRight: 15 },
  textoMenuOpcion: {
    color: COLORES.textoBlanco,
    fontSize: 16,
    fontWeight: "bold",
  },
  botonCancelarOpciones: {
    backgroundColor: COLORES.fondoInput,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  textoCancelarOpciones: {
    color: COLORES.textoBlanco,
    fontSize: 16,
    fontWeight: "bold",
  },
});
