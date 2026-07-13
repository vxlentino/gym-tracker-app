import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
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
import { EJERCICIOS_DB, EQUIPAMIENTO, GRUPOS_MUSCULARES } from "../ejercicios";

export default function PantallaCatalogo() {
  const router = useRouter();
  const [ejerciciosPersonalizados, setEjerciciosPersonalizados] = useState<
    any[]
  >([]);

  // --- ESTADOS PARA BÚSQUEDA Y FILTROS ---
  const [busquedaCatalog, setBusquedaCatalog] = useState("");
  const [filtroEquipamientoCat, setFiltroEquipamientoCat] =
    useState("Todo Equipamiento");
  const [filtroMusculoCat, setFiltroMusculoCat] = useState("Todos Músculos");
  const [verMisEjercicios, setVerMisEjercicios] = useState(false);

  // --- ESTADOS PARA EL FORMULARIO DE CREAR/EDITAR ---
  const [modalCrearEjercicioVisible, setModalCrearEjercicioVisible] =
    useState(false);
  const [ejercicioEditandoId, setEjercicioEditandoId] = useState<string | null>(
    null,
  );

  const [nuevoNombreEjercicio, setNuevoNombreEjercicio] = useState("");
  const [nuevoEquipamiento, setNuevoEquipamiento] = useState("Ninguno");
  const [nuevoMusculoEjercicio, setNuevoMusculoEjercicio] = useState("Pecho");
  const [nuevoMediaUrl, setNuevoMediaUrl] = useState("");
  const [nuevaDescripcion, setNuevaDescripcion] = useState("");
  const [nuevosMusculosSecundarios, setNuevosMusculosSecundarios] = useState<
    string[]
  >([]);

  // --- ESTADOS PARA LOS SUB-MODALES DESLIZABLES ---
  const [tipoSelectorAbierto, setTipoSelectorAbierto] = useState<
    | "equipamiento"
    | "primario"
    | "secundario"
    | "filtroEquipoCat"
    | "filtroMusculoCat"
    | null
  >(null);
  const [busquedaSubModal, setBusquedaSubModal] = useState("");

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
      equipamiento: nuevoEquipamiento,
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
    setNuevoEquipamiento(item.equipamiento || "Ninguno");
    setNuevoMediaUrl(item.imagenUrl || "");
    setNuevaDescripcion(item.descripcion || "");
    const secundariosPrevios = item.musculosTrabajados
      ? item.musculosTrabajados.slice(1)
      : [];
    setNuevosMusculosSecundarios(secundariosPrevios);
    setModalCrearEjercicioVisible(true);
  };

  // --- LÓGICA DE FILTRADO EN TIEMPO REAL ---
  const TODOS_LOS_EJERCICIOS = [
    ...EJERCICIOS_DB,
    ...ejerciciosPersonalizados,
  ].sort((a, b) => a.nombre.localeCompare(b.nombre));

  const ejerciciosFiltrados = TODOS_LOS_EJERCICIOS.filter((e) => {
    const coincideBusqueda = e.nombre
      .toLowerCase()
      .includes(busquedaCatalog.toLowerCase());
    const coincideMusculo =
      filtroMusculoCat === "Todos Músculos" ||
      e.musculo === filtroMusculoCat ||
      (e.musculosTrabajados && e.musculosTrabajados.includes(filtroMusculoCat));
    const coincideEquipo =
      filtroEquipamientoCat === "Todo Equipamiento" ||
      e.equipamiento === filtroEquipamientoCat;

    // Si el botón de "Mis Ejercicios" está activo, solo muestra los que tienen "custom" en el ID
    const coincideCustom = verMisEjercicios ? e.id.includes("custom") : true;

    return (
      coincideBusqueda && coincideMusculo && coincideEquipo && coincideCustom
    );
  });

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
            setNuevoEquipamiento("Ninguno");
            setNuevoMusculoEjercicio("Pecho");
            setNuevoMediaUrl("");
            setNuevaDescripcion("");
            setNuevosMusculosSecundarios([]);
            setModalCrearEjercicioVisible(true);
          }}
        >
          <MaterialCommunityIcons
            name="plus"
            size={28}
            color={COLORES.azulHevy}
          />
        </TouchableOpacity>
      </View>

      {/* --- BARRA DE BÚSQUEDA --- */}
      <View style={{ paddingHorizontal: 20, marginBottom: 15 }}>
        <View
          style={{
            backgroundColor: "#1c1c1e",
            borderRadius: 10,
            paddingHorizontal: 15,
            paddingVertical: 12,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color="#666"
            style={{ marginRight: 10 }}
          />
          <TextInput
            placeholder="Buscar ejercicio"
            placeholderTextColor="#666"
            style={{ color: "#fff", fontSize: 16, flex: 1 }}
            value={busquedaCatalog}
            onChangeText={setBusquedaCatalog}
          />
        </View>
      </View>

      {/* --- FILTROS HORIZONTALES (Mis Ejercicios / Equipamiento / Músculo) --- */}
      <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10 }}
        >
          <TouchableOpacity
            style={{
              backgroundColor: verMisEjercicios ? COLORES.azulHevy : "#1c1c1e",
              paddingVertical: 10,
              paddingHorizontal: 15,
              borderRadius: 10,
            }}
            onPress={() => setVerMisEjercicios(!verMisEjercicios)}
          >
            <Text
              style={{
                color: verMisEjercicios ? "#fff" : COLORES.azulHevy,
                fontSize: 14,
              }}
            >
              Mis Ejercicios
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: "#1c1c1e",
              paddingVertical: 10,
              paddingHorizontal: 15,
              borderRadius: 10,
            }}
            onPress={() => {
              setBusquedaSubModal("");
              setTipoSelectorAbierto("filtroEquipoCat");
            }}
          >
            <Text
              style={{
                color:
                  filtroEquipamientoCat === "Todo Equipamiento"
                    ? "#fff"
                    : COLORES.azulHevy,
                fontSize: 14,
              }}
            >
              {filtroEquipamientoCat}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: "#1c1c1e",
              paddingVertical: 10,
              paddingHorizontal: 15,
              borderRadius: 10,
            }}
            onPress={() => {
              setBusquedaSubModal("");
              setTipoSelectorAbierto("filtroMusculoCat");
            }}
          >
            <Text
              style={{
                color:
                  filtroMusculoCat === "Todos Músculos"
                    ? "#fff"
                    : COLORES.azulHevy,
                fontSize: 14,
              }}
            >
              {filtroMusculoCat}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* --- LISTA DE EJERCICIOS FILTRADOS --- */}
      <FlatList
        data={ejerciciosFiltrados}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 50 }}
        ListEmptyComponent={
          <Text style={{ color: "#666", textAlign: "center", marginTop: 20 }}>
            No se encontraron ejercicios
          </Text>
        }
        renderItem={({ item }) => {
          const miniatura = item.imagenUrl || item.gifUrl;
          const esCustom = item.id.includes("custom");

          return (
            <View style={styles.itemEjercicio}>
              <View
                style={[
                  styles.imagenMini,
                  {
                    overflow: "hidden",
                    justifyContent: "center",
                    alignItems: "center",
                  },
                ]}
              >
                {miniatura ? (
                  <Image
                    source={{ uri: miniatura }}
                    style={{ width: "100%", height: "100%" }}
                  />
                ) : (
                  <MaterialCommunityIcons
                    name="dumbbell"
                    size={24}
                    color={COLORES.grisOscuro}
                  />
                )}
              </View>

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

      {/* --- MODAL DE CREACIÓN ESTILO HEVY --- */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalCrearEjercicioVisible}
        onRequestClose={() => setModalCrearEjercicioVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 20,
              paddingTop: 50,
              paddingBottom: 15,
              borderBottomWidth: 1,
              borderBottomColor: "#111",
            }}
          >
            <TouchableOpacity
              onPress={() => setModalCrearEjercicioVisible(false)}
              style={{ padding: 10, marginLeft: -10 }}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={24}
                color="#fff"
              />
            </TouchableOpacity>
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>
              {ejercicioEditandoId ? "Editar Ejercicio" : "Crear Ejercicio"}
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: COLORES.azulHevy,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
              }}
              onPress={guardarEjercicioPersonalizado}
            >
              <Text style={{ color: "#fff", fontWeight: "bold" }}>Guardar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <TouchableOpacity
              style={{ alignItems: "center", marginTop: 30, marginBottom: 30 }}
              onPress={seleccionarMedia}
            >
              <View
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  backgroundColor: "#1c1c1e",
                  justifyContent: "center",
                  alignItems: "center",
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: "#333",
                }}
              >
                {nuevoMediaUrl ? (
                  <Image
                    source={{ uri: nuevoMediaUrl }}
                    style={{ width: "100%", height: "100%" }}
                  />
                ) : (
                  <MaterialCommunityIcons
                    name="camera-plus"
                    size={30}
                    color="#fff"
                  />
                )}
              </View>
              <Text
                style={{ color: COLORES.azulHevy, fontSize: 14, marginTop: 15 }}
              >
                Añadir recurso
              </Text>
            </TouchableOpacity>

            <View style={{ paddingHorizontal: 20, marginBottom: 30 }}>
              <TextInput
                style={{
                  color: "#fff",
                  fontSize: 20,
                  fontWeight: "bold",
                  borderBottomWidth: 1,
                  borderBottomColor: "#333",
                  paddingBottom: 10,
                }}
                placeholder="Nombre de Ejercicio"
                placeholderTextColor="#666"
                value={nuevoNombreEjercicio}
                onChangeText={setNuevoNombreEjercicio}
              />
            </View>

            <View style={{ paddingHorizontal: 20 }}>
              <TouchableOpacity
                style={{
                  borderBottomWidth: 1,
                  borderBottomColor: "#111",
                  paddingVertical: 15,
                }}
                onPress={() => setTipoSelectorAbierto("equipamiento")}
              >
                <Text style={{ color: "#fff", fontSize: 16, marginBottom: 5 }}>
                  Equipamiento
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{
                      color:
                        nuevoEquipamiento === "Ninguno"
                          ? COLORES.azulHevy
                          : "#fff",
                      fontSize: 14,
                    }}
                  >
                    {nuevoEquipamiento === "Ninguno"
                      ? "Seleccionar"
                      : nuevoEquipamiento}
                  </Text>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={20}
                    color="#666"
                  />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  borderBottomWidth: 1,
                  borderBottomColor: "#111",
                  paddingVertical: 15,
                }}
                onPress={() => setTipoSelectorAbierto("primario")}
              >
                <Text style={{ color: "#fff", fontSize: 16, marginBottom: 5 }}>
                  Grupo Muscular Primario
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 14 }}>
                    {nuevoMusculoEjercicio}
                  </Text>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={20}
                    color="#666"
                  />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  borderBottomWidth: 1,
                  borderBottomColor: "#111",
                  paddingVertical: 15,
                }}
                onPress={() => setTipoSelectorAbierto("secundario")}
              >
                <Text style={{ color: "#fff", fontSize: 16, marginBottom: 5 }}>
                  Otros músculos
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{
                      color:
                        nuevosMusculosSecundarios.length === 0
                          ? COLORES.azulHevy
                          : "#fff",
                      fontSize: 14,
                    }}
                  >
                    {nuevosMusculosSecundarios.length === 0
                      ? "Seleccionar (opcional)"
                      : nuevosMusculosSecundarios.join(", ")}
                  </Text>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={20}
                    color="#666"
                  />
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* --- SUB-MODAL DESLIZABLE (EQUIPO / MÚSCULOS / FILTROS) --- */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={!!tipoSelectorAbierto}
        onRequestClose={() => setTipoSelectorAbierto(null)}
      >
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 20,
              paddingTop: 50,
              paddingBottom: 15,
              borderBottomWidth: 1,
              borderBottomColor: "#111",
            }}
          >
            <TouchableOpacity onPress={() => setTipoSelectorAbierto(null)}>
              <Text style={{ color: COLORES.azulHevy, fontSize: 16 }}>
                Cancelar
              </Text>
            </TouchableOpacity>
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>
              {tipoSelectorAbierto === "equipamiento" ||
              tipoSelectorAbierto === "filtroEquipoCat"
                ? "Equipamiento"
                : tipoSelectorAbierto === "primario" ||
                    tipoSelectorAbierto === "filtroMusculoCat"
                  ? "Grupo Muscular"
                  : "Músculos Secundarios"}
            </Text>
            <TouchableOpacity onPress={() => setTipoSelectorAbierto(null)}>
              <Text
                style={{
                  color: COLORES.azulHevy,
                  fontSize: 16,
                  fontWeight: "bold",
                }}
              >
                Listo
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={{ paddingHorizontal: 20, marginTop: 15, marginBottom: 15 }}
          >
            <View
              style={{
                backgroundColor: "#1c1c1e",
                borderRadius: 10,
                paddingHorizontal: 15,
                paddingVertical: 10,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <MaterialCommunityIcons
                name="magnify"
                size={20}
                color="#666"
                style={{ marginRight: 10 }}
              />
              <TextInput
                placeholder="Buscar"
                placeholderTextColor="#666"
                style={{ color: "#fff", flex: 1 }}
                value={busquedaSubModal}
                onChangeText={setBusquedaSubModal}
              />
            </View>
          </View>

          <FlatList
            data={(tipoSelectorAbierto === "equipamiento" ||
            tipoSelectorAbierto === "filtroEquipoCat"
              ? EQUIPAMIENTO
              : GRUPOS_MUSCULARES
            ).filter((item) =>
              item.toLowerCase().includes(busquedaSubModal.toLowerCase()),
            )}
            keyExtractor={(item) => item}
            contentContainerStyle={{ paddingBottom: 50 }}
            renderItem={({ item }) => {
              let estaSeleccionado = false;
              if (tipoSelectorAbierto === "equipamiento")
                estaSeleccionado = item === nuevoEquipamiento;
              if (tipoSelectorAbierto === "primario")
                estaSeleccionado = item === nuevoMusculoEjercicio;
              if (tipoSelectorAbierto === "secundario")
                estaSeleccionado = nuevosMusculosSecundarios.includes(item);
              if (tipoSelectorAbierto === "filtroEquipoCat")
                estaSeleccionado = item === filtroEquipamientoCat;
              if (tipoSelectorAbierto === "filtroMusculoCat")
                estaSeleccionado = item === filtroMusculoCat;

              return (
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingVertical: 18,
                    paddingHorizontal: 20,
                    borderBottomWidth: 1,
                    borderBottomColor: "#111",
                  }}
                  onPress={() => {
                    if (tipoSelectorAbierto === "equipamiento") {
                      setNuevoEquipamiento(item);
                      setTipoSelectorAbierto(null);
                    } else if (tipoSelectorAbierto === "primario") {
                      setNuevoMusculoEjercicio(item);
                      setTipoSelectorAbierto(null);
                    } else if (tipoSelectorAbierto === "secundario") {
                      toggleMusculoSecundario(item);
                    } else if (tipoSelectorAbierto === "filtroEquipoCat") {
                      setFiltroEquipamientoCat(item);
                      setTipoSelectorAbierto(null);
                    } else if (tipoSelectorAbierto === "filtroMusculoCat") {
                      setFiltroMusculoCat(item);
                      setTipoSelectorAbierto(null);
                    }
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 16 }}>{item}</Text>
                  {estaSeleccionado && (
                    <MaterialCommunityIcons
                      name="check"
                      size={24}
                      color={COLORES.azulHevy}
                    />
                  )}
                </TouchableOpacity>
              );
            }}
          />
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
  itemEjercicio: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  imagenMini: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  textoNombre: {
    color: COLORES.textoBlanco,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  textoMusculo: {
    color: COLORES.grisOscuro,
    fontSize: 13,
    fontWeight: "500",
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
});
