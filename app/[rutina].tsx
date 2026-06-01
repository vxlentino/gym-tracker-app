import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as Notifications from "expo-notifications";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import DraggableFlatList, {
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Alert,
  AppState,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import {
  GestureHandlerRootView,
  Swipeable,
} from "react-native-gesture-handler";
import { COLORES } from "../colores";
import { EJERCICIOS_DB, MUSCULOS_CREACION } from "../ejercicios";

// FORZAMOS A QUE LA NOTIFICACIÓN SE VEA SIEMPRE PARA PODER TESTEAR
Notifications.setNotificationHandler({
  handleNotification: async () =>
    ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }) as any,
});

const PESTAÑAS_FILTRO = ["Todos", "Mis Ejercicios", ...MUSCULOS_CREACION];

export default function PantallaRutina() {
  // Esto lee cuántos píxeles mide la barra de abajo del celular que la esté usando
  const insets = useSafeAreaInsets();

  const { rutina } = useLocalSearchParams();
  const router = useRouter();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalCrearEjercicioVisible, setModalCrearEjercicioVisible] =
    useState(false);
  const [ejercicioDetalle, setEjercicioDetalle] = useState<any | null>(null);

  const [opcionesEjercicioId, setOpcionesEjercicioId] = useState<string | null>(
    null,
  );
  const [ejercicioAReemplazar, setEjercicioAReemplazar] = useState<
    string | null
  >(null);
  const [ejercicioEditandoId, setEjercicioEditandoId] = useState<string | null>(
    null,
  );
  const [modalReordenarVisible, setModalReordenarVisible] = useState(false);
  // --- ESTADOS PARA EL MODAL DE FINALIZAR ---
  const [modalTerminarVisible, setModalTerminarVisible] = useState(false);
  const [mensajeRecords, setMensajeRecords] = useState(""); // Aquí guardaremos el texto de los récords
  const [recordsLogrados, setRecordsLogrados] = useState(0);

  const [filtroActivo, setFiltroActivo] = useState("Todos");
  const [ejerciciosSeleccionados, setEjerciciosSeleccionados] = useState<any[]>(
    [],
  );
  const [ejerciciosPersonalizados, setEjerciciosPersonalizados] = useState<
    any[]
  >([]);
  const [historial, setHistorial] = useState<any[]>([]);

  const [nuevoNombreEjercicio, setNuevoNombreEjercicio] = useState("");
  const [nuevoMusculoEjercicio, setNuevoMusculoEjercicio] = useState("Piernas");
  const [nuevoMediaUrl, setNuevoMediaUrl] = useState("");
  const [nuevaDescripcion, setNuevaDescripcion] = useState("");
  const [nuevosMusculosSecundarios, setNuevosMusculosSecundarios] = useState<
    string[]
  >([]);
  const toggleMusculoSecundario = (musculo: string) => {
    if (nuevosMusculosSecundarios.includes(musculo)) {
      setNuevosMusculosSecundarios(
        nuevosMusculosSecundarios.filter((m) => m !== musculo),
      );
    } else {
      setNuevosMusculosSecundarios([...nuevosMusculosSecundarios, musculo]);
    }
  };

  const [rutinaActiva, setRutinaActiva] = useState(false);
  const [tiempoGlobal, setTiempoGlobal] = useState(0);

  const [ejercicioEditandoDescanso, setEjercicioEditandoDescanso] = useState<
    string | null
  >(null);
  const [tempMinutos, setTempMinutos] = useState(2);
  const [tempSegundos, setTempSegundos] = useState(0);

  const [segundos, setSegundos] = useState(0);
  const [activo, setActivo] = useState(false);

  // NUEVO ESTADO PARA EL NOMBRE
  const [nombreUsuario, setNombreUsuario] = useState("Atleta");

  const appState = useRef(AppState.currentState);
  const tiempoFondo = useRef(Date.now());

  useEffect(() => {
    // 1. Definimos la función de las notificaciones
    const configurarNotificaciones = async () => {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      if (existingStatus !== "granted") {
        await Notifications.requestPermissionsAsync();
      }

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Alertas de Descanso",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 500, 250, 500],
          lightColor: COLORES.azulHevy,
        });
      }
    };

    // 2. Definimos la función que busca tu nombre en la memoria
    const cargarNombre = async () => {
      const nombreGuardado = await AsyncStorage.getItem("@nombre_usuario");
      if (nombreGuardado) setNombreUsuario(nombreGuardado);
    };

    // 3. Ejecutamos TODAS las funciones juntas al arrancar la pantalla
    configurarNotificaciones();
    cargarRutina();
    cargarEjerciciosPersonalizados();
    cargarHistorial();
    cargarEstadoGlobal();
    cargarNombre();
  }, []);

  const cargarEstadoGlobal = async () => {
    const act = await AsyncStorage.getItem("@rutina_activa");
    if (act) {
      const pAct = JSON.parse(act);
      if (pAct.nombre === rutina) {
        setRutinaActiva(true);
        setTiempoGlobal(Math.floor((Date.now() - pAct.timestamp) / 1000));

        const desc = await AsyncStorage.getItem("@descanso_activo");
        if (desc) {
          const pDesc = JSON.parse(desc);
          const rem = Math.floor((pDesc.endTime - Date.now()) / 1000);
          if (rem > 0) {
            setActivo(true);
            setSegundos(rem);
          } else {
            AsyncStorage.removeItem("@descanso_activo");
          }
        }
      }
    }
  };

  const programarNotificacionFin = async (tiempoEnSegundos: number) => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.log("Ignorando error de limpieza");
    }

    if (tiempoEnSegundos > 0) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "¡Descanso terminado! 🏋️‍♂️",
          body: `Es hora de la siguiente serie, ${nombreUsuario}.`,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: tiempoEnSegundos,
          channelId: "default",
        } as any, // EL SALVAVIDAS
      });
    }
  };

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        const segundosPasados = Math.floor(
          (Date.now() - tiempoFondo.current) / 1000,
        );
        setTiempoGlobal((prev) =>
          rutinaActiva ? prev + segundosPasados : prev,
        );

        setSegundos((prev) => {
          if (prev > 0 && activo) {
            const nuevoTiempo = prev - segundosPasados;
            if (nuevoTiempo <= 0) {
              setActivo(false);
              return 0;
            }
            return nuevoTiempo;
          }
          return prev;
        });
      }

      if (nextAppState === "background" || nextAppState === "inactive") {
        tiempoFondo.current = Date.now();
      }
      appState.current = nextAppState;
    });
    return () => {
      subscription.remove();
    };
  }, [rutinaActiva, activo]);

  useEffect(() => {
    let intervaloGlobal: any = null;
    if (rutinaActiva)
      intervaloGlobal = setInterval(() => setTiempoGlobal((t) => t + 1), 1000);
    return () => clearInterval(intervaloGlobal);
  }, [rutinaActiva]);

  useEffect(() => {
    let intervalo: any = null;
    if (activo && segundos > 0) {
      intervalo = setInterval(() => {
        setSegundos((seg) => {
          if (seg <= 1) {
            setActivo(false);
            Vibration.vibrate([500, 500, 500]);
            return 0;
          }
          return seg - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalo);
  }, [activo, segundos]);

  const iniciarDescanso = (tiempoEnSegundos: number, nombreEj: string = "") => {
    setSegundos(tiempoEnSegundos);
    setActivo(true);
    AsyncStorage.setItem(
      "@descanso_activo",
      JSON.stringify({
        endTime: Date.now() + tiempoEnSegundos * 1000,
        ejercicio: nombreEj,
      }),
    );
    programarNotificacionFin(tiempoEnSegundos);
  };

  const cargarRutina = async () => {
    try {
      const datos = await AsyncStorage.getItem(`@rutina_${rutina}`);
      if (datos !== null) setEjerciciosSeleccionados(JSON.parse(datos));
    } catch (error) {
      console.error(error);
    }
  };

  const cargarEjerciciosPersonalizados = async () => {
    try {
      const datos = await AsyncStorage.getItem("@ejercicios_custom");
      if (datos !== null) setEjerciciosPersonalizados(JSON.parse(datos));
    } catch (error) {
      console.error(error);
    }
  };

  const cargarHistorial = async () => {
    try {
      const datos = await AsyncStorage.getItem("@historial_entrenamientos");
      if (datos !== null) setHistorial(JSON.parse(datos));
    } catch (error) {
      console.error(error);
    }
  };

  const guardarRutina = async (nuevosDatos: any[]) => {
    try {
      await AsyncStorage.setItem(
        `@rutina_${rutina}`,
        JSON.stringify(nuevosDatos),
      );
    } catch (error) {
      console.error(error);
    }
  };

  const seleccionarMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permiso denegado",
        "Necesitamos acceso a tu galería para poder subir la foto o GIF.",
      );
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled) setNuevoMediaUrl(result.assets[0].uri);
  };

  const crearEjercicioPersonalizado = async () => {
    if (nuevoNombreEjercicio.trim() === "") {
      Alert.alert("Error", "El ejercicio debe tener un nombre obligatorio.");
      return;
    }

    // COMO YA ES UNA LISTA, DIRECTAMENTE LA JUNTAMOS CON EL MÚSCULO PRINCIPAL
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

    let nuevaLista = ejercicioEditandoId
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
    setNuevosMusculosSecundarios([]); // Limpiamos las pastillas para el próximo ejercicio
  };

  const eliminarEjercicioDeDB = (idCustom: string) => {
    Alert.alert(
      "Borrar del Catálogo",
      "¿Seguro que querés borrar este ejercicio creado por vos?",
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

  const TODOS_LOS_EJERCICIOS = [...EJERCICIOS_DB, ...ejerciciosPersonalizados];
  const ejerciciosFiltrados = TODOS_LOS_EJERCICIOS.filter((e) => {
    if (filtroActivo === "Todos") return true;
    if (filtroActivo === "Mis Ejercicios") return e.id.includes("custom_");
    return e.musculo === filtroActivo;
  });

  const agregarEjercicio = (ejData: any) => {
    const nuevo = {
      id: Date.now().toString(),
      nombre: ejData.nombre,
      descanso: 180,
      originalId: ejData.id,
      series: [
        {
          id: Date.now().toString() + "s",
          kg: "",
          reps: "",
          completada: false,
        },
      ],
    };

    if (ejercicioAReemplazar) {
      const index = ejerciciosSeleccionados.findIndex(
        (e) => e.id === ejercicioAReemplazar,
      );
      if (index !== -1) {
        const nuevosDatos = [...ejerciciosSeleccionados];
        nuevosDatos[index] = nuevo;
        setEjerciciosSeleccionados(nuevosDatos);
        guardarRutina(nuevosDatos);
      }
      setEjercicioAReemplazar(null);
    } else {
      const datos = [...ejerciciosSeleccionados, nuevo];
      setEjerciciosSeleccionados(datos);
      guardarRutina(datos);
    }
    setModalVisible(false);
  };

  const prepararReemplazo = (id: string) => {
    setEjercicioAReemplazar(id);
    setOpcionesEjercicioId(null);
    setModalVisible(true);
  };

  const eliminarEjercicio = (id: string) => {
    const datos = ejerciciosSeleccionados.filter((e) => e.id !== id);
    setEjerciciosSeleccionados(datos);
    guardarRutina(datos);
    setOpcionesEjercicioId(null);
  };

  const toggleSerie = (idEjercicio: string, idSerie: string) => {
    let descansoParaActivar = 0;
    let nombreEj = "";
    const datos = ejerciciosSeleccionados.map((ej) => {
      if (ej.id === idEjercicio) {
        nombreEj = ej.nombre;
        return {
          ...ej,
          series: ej.series.map((serie: any) => {
            if (serie.id === idSerie) {
              const nuevoEstado = !serie.completada;
              if (nuevoEstado === true)
                descansoParaActivar =
                  ej.descanso !== undefined ? ej.descanso : 120;
              return { ...serie, completada: nuevoEstado };
            }
            return serie;
          }),
        };
      }
      return ej;
    });
    setEjerciciosSeleccionados(datos);
    guardarRutina(datos);
    if (descansoParaActivar > 0) iniciarDescanso(descansoParaActivar, nombreEj);
  };

  const eliminarSerie = (idEj: string, idS: string) => {
    const datos = ejerciciosSeleccionados.map((e) =>
      e.id === idEj
        ? { ...e, series: e.series.filter((s: any) => s.id !== idS) }
        : e,
    );
    setEjerciciosSeleccionados(datos);
    guardarRutina(datos);
  };

  const actualizarSerie = (
    idEj: string,
    idS: string,
    campo: string,
    valor: string,
  ) => {
    const datos = ejerciciosSeleccionados.map((e) =>
      e.id === idEj
        ? {
            ...e,
            series: e.series.map((s: any) =>
              s.id === idS ? { ...s, [campo]: valor } : s,
            ),
          }
        : e,
    );
    setEjerciciosSeleccionados(datos);
    guardarRutina(datos);
  };

  const actualizarNotaEjercicio = (idEj: string, nota: string) => {
    const datos = ejerciciosSeleccionados.map((e) =>
      e.id === idEj ? { ...e, notas: nota } : e,
    );
    setEjerciciosSeleccionados(datos);
    guardarRutina(datos);
  };

  const guardarDescansoPersonalizado = () => {
    const totalSegundos = tempMinutos * 60 + tempSegundos;
    const datos = ejerciciosSeleccionados.map((e) =>
      e.id === ejercicioEditandoDescanso
        ? { ...e, descanso: totalSegundos }
        : e,
    );
    setEjerciciosSeleccionados(datos);
    guardarRutina(datos);
    setEjercicioEditandoDescanso(null);
  };

  const obtenerSerieAnterior = (
    nombreEjercicio: string,
    indiceSerie: number,
  ) => {
    for (let i = historial.length - 1; i >= 0; i--) {
      const sesion = historial[i];
      const ejEncontrado = sesion.ejercicios.find(
        (e: any) => e.nombre === nombreEjercicio,
      );
      if (ejEncontrado && ejEncontrado.series[indiceSerie]?.completada)
        return ejEncontrado.series[indiceSerie];
    }
    return null;
  };

  const esRecord = (kgActual: string, repsActual: string, anterior: any) => {
    if (!anterior) return false;
    const kg = parseFloat(kgActual) || 0;
    const reps = parseInt(repsActual) || 0;
    const kgAnt = parseFloat(anterior.kg) || 0;
    const repsAnt = parseInt(anterior.reps) || 0;
    if (kg > kgAnt) return true;
    if (kg === kgAnt && reps > repsAnt) return true;
    return false;
  };

  const calcularVolumen = () => {
    let vol = 0;
    ejerciciosSeleccionados.forEach((ej) => {
      ej.series.forEach((s: any) => {
        if (s.completada)
          vol += (parseFloat(s.kg) || 0) * (parseInt(s.reps) || 0);
      });
    });
    return vol;
  };

  const calcularSeries = () => {
    let count = 0;
    ejerciciosSeleccionados.forEach((ej) => {
      ej.series.forEach((s: any) => {
        if (s.completada) count++;
      });
    });
    return count;
  };

  const terminarEntrenamiento = () => {
    let records = 0;
    ejerciciosSeleccionados.forEach((ej) => {
      ej.series.forEach((s: any, idx: number) => {
        if (
          s.completada &&
          esRecord(s.kg, s.reps, obtenerSerieAnterior(ej.nombre, idx))
        ) {
          records++;
        }
      });
    });

    setRecordsLogrados(records); // Guardamos el número de récords
    setModalTerminarVisible(true); // Abrimos el modal
  };

  const ejecutarFinalizacion = async () => {
    const nuevaSesion = {
      id: Date.now().toString(),
      fecha: new Date().toISOString(),
      rutinaNombre: rutina,
      volumen: calcularVolumen(),
      ejercicios: ejerciciosSeleccionados,
      tiempo: tiempoGlobal,
    };
    const nuevoHistorial = [...historial, nuevaSesion];
    setHistorial(nuevoHistorial);

    await AsyncStorage.setItem(
      "@historial_entrenamientos",
      JSON.stringify(nuevoHistorial),
    );
    await AsyncStorage.removeItem("@rutina_activa");
    await AsyncStorage.removeItem("@descanso_activo");

    Notifications.cancelAllScheduledNotificationsAsync();

    const resetDatos = ejerciciosSeleccionados.map((ej) => ({
      ...ej,
      series: ej.series.map((s: any) => ({ ...s, completada: false })),
    }));
    guardarRutina(resetDatos);

    setRutinaActiva(false);
    setTiempoGlobal(0);
    setActivo(false);
    setSegundos(0);
    setModalTerminarVisible(false);
    router.back();
  };

  const renderBotonEliminarOculto = (idEjercicio: string, idSerie: string) => (
    <TouchableOpacity
      style={styles.botonEliminarSwipe}
      onPress={() => eliminarSerie(idEjercicio, idSerie)}
    >
      <Text style={styles.textoEliminarSwipe}>Eliminar</Text>
    </TouchableOpacity>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.botonAtrasCabecera}
            >
              <Text style={styles.iconoAtras}>˅</Text>
            </TouchableOpacity>

            <Text style={styles.tituloPrincipal}>
              {rutinaActiva ? "Entreno" : rutina}
            </Text>

            {rutinaActiva ? (
              <TouchableOpacity
                style={styles.botonTerminarCabecera}
                onPress={terminarEntrenamiento}
              >
                <Text style={styles.textoTerminarCabecera}>Terminar</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 80 }} />
            )}
          </View>

          {rutinaActiva && (
            <View style={styles.filaEstadisticas}>
              <View style={styles.cajaEstadistica}>
                <Text style={styles.labelEstadistica}>Duración</Text>
                <Text style={styles.valorEstadisticaAzul}>
                  {formatearTiempoGlobal(tiempoGlobal)}
                </Text>
              </View>
              <View style={styles.cajaEstadistica}>
                <Text style={styles.labelEstadistica}>Volumen</Text>
                <Text style={styles.valorEstadistica}>
                  {calcularVolumen()} kg
                </Text>
              </View>
              <View style={styles.cajaEstadistica}>
                <Text style={styles.labelEstadistica}>Series</Text>
                <Text style={styles.valorEstadistica}>{calcularSeries()}</Text>
              </View>
            </View>
          )}

          {!rutinaActiva && (
            <TouchableOpacity
              style={styles.botonEmpezarGrande}
              onPress={() => {
                setRutinaActiva(true);
                setTiempoGlobal(0);
                AsyncStorage.setItem(
                  "@rutina_activa",
                  JSON.stringify({ nombre: rutina, timestamp: Date.now() }),
                );
              }}
            >
              <Text style={styles.textoBotonEmpezar}>
                ▶ Empezar Entrenamiento
              </Text>
            </TouchableOpacity>
          )}

          <FlatList
            data={ejerciciosSeleccionados}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 150 }}
            ListFooterComponent={
              <TouchableOpacity
                style={styles.botonAgregarEjercicioFlotante}
                onPress={() => setModalVisible(true)}
              >
                <Text style={styles.textoBotonEjercicio}>
                  + Añadir Ejercicio
                </Text>
              </TouchableOpacity>
            }
            renderItem={({ item, index }) => {
              const descansoActual =
                item.descanso !== undefined ? item.descanso : 120;
              const datosCompletos = TODOS_LOS_EJERCICIOS.find(
                (dbEj) => dbEj.nombre === item.nombre,
              );
              const urlMiniatura =
                datosCompletos?.imagenUrl || datosCompletos?.gifUrl;

              return (
                <View style={styles.tarjetaEjercicio}>
                  <View style={styles.cabeceraTarjeta}>
                    <TouchableOpacity
                      style={styles.contenedorNombreImagen}
                      onPress={() => setEjercicioDetalle(datosCompletos)}
                    >
                      {/* Si hay miniatura dibuja la imagen, sino no hace nada */}
                      {urlMiniatura && (
                        <Image
                          source={{ uri: urlMiniatura }}
                          style={styles.imagenMini}
                        />
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.textoTarjeta} numberOfLines={2}>
                          {item.nombre}
                        </Text>
                        <TextInput
                          style={styles.inputNotas}
                          placeholder="Agregar notas aquí..."
                          placeholderTextColor={COLORES.grisOscuro}
                          value={item.notas || ""}
                          onChangeText={(texto) =>
                            actualizarNotaEjercicio(item.id, texto)
                          }
                          multiline={true}
                        />
                        <TouchableOpacity
                          onPress={() => {
                            setTempMinutos(Math.floor(descansoActual / 60));
                            setTempSegundos(descansoActual % 60);
                            setEjercicioEditandoDescanso(item.id);
                          }}
                          style={styles.botonEditarDescanso}
                        >
                          <Text style={styles.textoEditarDescanso}>
                            ⏱ Descanso: {formatearDescanso(descansoActual)}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.botonOpcionesMenu}
                      onPress={() => setOpcionesEjercicioId(item.id)}
                    >
                      <Text style={styles.textoOpcionesMenu}>⋮</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.filaCabeceraSeries}>
                    <Text style={styles.textoCabeceraSerie}>SERIE</Text>
                    <Text style={styles.textoCabeceraSerieAnterior}>
                      ANTERIOR
                    </Text>
                    <Text style={styles.textoCabeceraSerie}>KG</Text>
                    <Text style={styles.textoCabeceraSerie}>REPS</Text>
                    <Text style={styles.textoCabeceraSerieCheck}>✓</Text>
                  </View>

                  {item.series.map((serie: any, idx: number) => {
                    const anterior = obtenerSerieAnterior(item.nombre, idx);
                    const recordLogrado = esRecord(
                      serie.kg,
                      serie.reps,
                      anterior,
                    );

                    return (
                      <Swipeable
                        key={serie.id}
                        renderRightActions={() =>
                          renderBotonEliminarOculto(item.id, serie.id)
                        }
                      >
                        <View
                          style={[
                            styles.filaSerie,
                            serie.completada && styles.filaSerieCompletada,
                          ]}
                        >
                          <View style={styles.contenedorIndiceSerie}>
                            <Text style={styles.numeroSerie}>{idx + 1}</Text>
                          </View>
                          <Text style={styles.textoAnterior}>
                            {anterior
                              ? `${anterior.kg}kg x ${anterior.reps}`
                              : "-"}
                          </Text>
                          <TextInput
                            style={[
                              styles.inputSerie,
                              serie.completada && styles.inputSerieCompletada,
                            ]}
                            placeholder="0"
                            keyboardType="numeric"
                            value={serie.kg}
                            onChangeText={(t) =>
                              actualizarSerie(item.id, serie.id, "kg", t)
                            }
                            editable={true}
                          />
                          <TextInput
                            style={[
                              styles.inputSerie,
                              serie.completada && styles.inputSerieCompletada,
                            ]}
                            placeholder="0"
                            keyboardType="numeric"
                            value={serie.reps}
                            onChangeText={(t) =>
                              actualizarSerie(item.id, serie.id, "reps", t)
                            }
                            editable={!serie.completada}
                          />
                          {rutinaActiva ? (
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                width: "20%",
                                justifyContent: "flex-end",
                              }}
                            >
                              {serie.completada && recordLogrado && (
                                <Text style={{ fontSize: 16, marginRight: 5 }}>
                                  <MaterialCommunityIcons
                                    name="trophy-award"
                                    size={24}
                                    color="yellow"
                                  />
                                </Text>
                              )}
                              <TouchableOpacity
                                style={[
                                  styles.botonCheck,
                                  serie.completada && styles.botonCheckActivo,
                                  { marginLeft: 0 },
                                ]}
                                onPress={() => toggleSerie(item.id, serie.id)}
                              >
                                <Text style={styles.textoCheck}>✓</Text>
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <View style={styles.botonCheckPlaceHolder} />
                          )}
                        </View>
                      </Swipeable>
                    );
                  })}
                  <TouchableOpacity
                    style={styles.botonAgregarSerie}
                    onPress={() => {
                      const d = ejerciciosSeleccionados.map((e) =>
                        e.id === item.id
                          ? {
                              ...e,
                              series: [
                                ...e.series,
                                {
                                  id: Date.now().toString(),
                                  kg: "",
                                  reps: "",
                                  completada: false,
                                },
                              ],
                            }
                          : e,
                      );
                      setEjerciciosSeleccionados(d);
                      guardarRutina(d);
                    }}
                  >
                    <Text style={styles.textoAgregarSerie}>
                      + Agregar Serie
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            }}
          />

          {(activo || segundos > 0) && rutinaActiva && (
            <View
              style={[
                styles.barraTimerInferior,
                { paddingBottom: insets.bottom > 0 ? insets.bottom + 10 : 15 },
              ]}
            >
              <TouchableOpacity
                style={styles.btnRestarSumar}
                onPress={() =>
                  setSegundos((s) => {
                    const n = Math.max(0, s - 15);
                    AsyncStorage.setItem(
                      "@descanso_activo",
                      JSON.stringify({ endTime: Date.now() + n * 1000 }),
                    );
                    if (n > 0) programarNotificacionFin(n);
                    else Notifications.cancelAllScheduledNotificationsAsync();
                    return n;
                  })
                }
              >
                <Text style={styles.textoBtnTimer}>-15</Text>
              </TouchableOpacity>
              <Text style={styles.textoTimerGigante}>
                {formatearDescanso(segundos)}
              </Text>
              <TouchableOpacity
                style={styles.btnRestarSumar}
                onPress={() =>
                  setSegundos((s) => {
                    const n = s + 15;
                    AsyncStorage.setItem(
                      "@descanso_activo",
                      JSON.stringify({ endTime: Date.now() + n * 1000 }),
                    );
                    programarNotificacionFin(n);
                    return n;
                  })
                }
              >
                <Text style={styles.textoBtnTimer}>+15</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnOmitir}
                onPress={() => {
                  setSegundos(0);
                  setActivo(false);
                  Vibration.vibrate([100]);
                  AsyncStorage.removeItem("@descanso_activo");
                  Notifications.cancelAllScheduledNotificationsAsync();
                }}
              >
                <Text style={styles.textoBtnOmitir}>Omitir</Text>
              </TouchableOpacity>
            </View>
          )}

          <Modal
            animationType="fade"
            transparent={true}
            visible={!!opcionesEjercicioId}
            onRequestClose={() => setOpcionesEjercicioId(null)}
          >
            <View style={styles.modalOscuro}>
              <View style={styles.cajaOpcionesMenu}>
                <View style={styles.indicadorDrag} />
                <Text style={styles.tituloOpciones}>
                  Opciones del Ejercicio
                </Text>

                <TouchableOpacity
                  style={styles.botonMenuOpcion}
                  onPress={() => {
                    setOpcionesEjercicioId(null);
                    setModalReordenarVisible(true);
                  }}
                >
                  <Text style={styles.textoMenuIcono}>↕️</Text>
                  <Text style={styles.textoMenuOpcion}>
                    Reordenar Ejercicios
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.botonMenuOpcion}
                  onPress={() => prepararReemplazo(opcionesEjercicioId!)}
                >
                  <Text style={styles.textoMenuIcono}>🔄</Text>
                  <Text style={styles.textoMenuOpcion}>
                    Reemplazar Ejercicio
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.botonMenuOpcion, { borderBottomWidth: 0 }]}
                  onPress={() => eliminarEjercicio(opcionesEjercicioId!)}
                >
                  <Text
                    style={[
                      styles.textoMenuOpcion,
                      { color: COLORES.rojoPeligro },
                    ]}
                  >
                    Eliminar Ejercicio
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.botonCancelarOpciones}
                  onPress={() => setOpcionesEjercicioId(null)}
                >
                  <Text style={styles.textoCancelarOpciones}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Modal
            animationType="slide"
            transparent={true}
            visible={modalReordenarVisible}
            onRequestClose={() => setModalReordenarVisible(false)}
          >
            <GestureHandlerRootView style={{ flex: 1 }}>
              <View style={styles.modalContainer}>
                <View
                  style={[
                    styles.modalContenido,
                    {
                      paddingBottom:
                        insets.bottom > 0 ? insets.bottom + 20 : 20,
                    },
                  ]}
                >
                  <View style={styles.modalCabecera}>
                    <Text style={styles.modalTitulo}>Reordenar</Text>
                    <TouchableOpacity
                      onPress={() => setModalReordenarVisible(false)}
                    >
                      <Text style={styles.textoCerrar}>Listo</Text>
                    </TouchableOpacity>
                  </View>

                  <DraggableFlatList
                    data={ejerciciosSeleccionados}
                    onDragEnd={({ data }) => {
                      setEjerciciosSeleccionados(data);
                      guardarRutina(data);
                    }}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingBottom: 80 }}
                    renderItem={({ item, drag, isActive }) => {
                      const dbEj = TODOS_LOS_EJERCICIOS.find(
                        (e) => e.nombre === item.nombre,
                      );
                      const thumb = dbEj?.imagenUrl || dbEj?.gifUrl;
                      return (
                        <ScaleDecorator>
                          <TouchableOpacity
                            activeOpacity={1}
                            onLongPress={drag}
                            disabled={isActive}
                            style={[
                              styles.itemReordenar,
                              {
                                backgroundColor: isActive
                                  ? COLORES.fondoInputSeries
                                  : "transparent",
                              },
                            ]}
                          >
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                flex: 1,
                              }}
                            >
                              <TouchableOpacity
                                style={styles.circuloRojoRemover}
                                onPress={() => eliminarEjercicio(item.id)}
                              >
                                <Text style={styles.textoMenos}>-</Text>
                              </TouchableOpacity>
                              {thumb ? (
                                <Image
                                  source={{ uri: thumb }}
                                  style={styles.imagenMiniCatalogo}
                                />
                              ) : (
                                <View
                                  style={[
                                    styles.imagenMiniCatalogo,
                                    { backgroundColor: COLORES.fondoInput },
                                  ]}
                                />
                              )}
                              <Text
                                style={[styles.textoEjercicioDB, { flex: 1 }]}
                                numberOfLines={2}
                              >
                                {item.nombre}
                              </Text>
                            </View>
                            <TouchableOpacity onPressIn={drag}>
                              <Text style={styles.iconoDrag}>≡</Text>
                            </TouchableOpacity>
                          </TouchableOpacity>
                        </ScaleDecorator>
                      );
                    }}
                  />
                </View>
              </View>
            </GestureHandlerRootView>
          </Modal>

          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => {
              setModalVisible(false);
              setEjercicioAReemplazar(null);
            }}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContenido}>
                <View style={styles.modalCabecera}>
                  <Text style={styles.modalTitulo}>
                    {ejercicioAReemplazar ? "Reemplazar por..." : "Catálogo"}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setModalVisible(false);
                      setEjercicioAReemplazar(null);
                    }}
                  >
                    <Text style={styles.textoCerrar}>Cerrar</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.contenedorFiltros}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {PESTAÑAS_FILTRO.map((m) => (
                      <TouchableOpacity
                        key={m}
                        style={[
                          styles.botonFiltro,
                          filtroActivo === m && styles.botonFiltroActivo,
                        ]}
                        onPress={() => setFiltroActivo(m)}
                      >
                        <Text
                          style={
                            filtroActivo === m
                              ? styles.textoFiltroActivo
                              : styles.textoFiltro
                          }
                        >
                          {m}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <TouchableOpacity
                  style={styles.botonLlamarCrear}
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
                  <Text style={styles.textoLlamarCrear}>
                    + Crear Ejercicio Nuevo
                  </Text>
                </TouchableOpacity>
                <FlatList
                  data={ejerciciosFiltrados}
                  keyExtractor={(e) => e.id}
                  renderItem={({ item }) => {
                    const miniaturaCatalogo = item.imagenUrl || item.gifUrl;
                    return (
                      <View style={styles.itemEjercicioDB}>
                        <TouchableOpacity
                          style={{
                            flex: 1,
                            flexDirection: "row",
                            alignItems: "center",
                          }}
                          onPress={() => agregarEjercicio(item)}
                        >
                          {miniaturaCatalogo && (
                            <Image
                              source={{ uri: miniaturaCatalogo }}
                              style={styles.imagenMiniCatalogo}
                            />
                          )}
                          <View>
                            <Text style={styles.textoEjercicioDB}>
                              {item.nombre}
                            </Text>
                            <Text style={styles.textoMusculoDB}>
                              {item.musculo} {item.id.includes("custom") && "★"}
                            </Text>
                          </View>
                        </TouchableOpacity>
                        {item.id.includes("custom") && (
                          <View style={{ flexDirection: "row" }}>
                            <TouchableOpacity
                              style={styles.botonTachoDB}
                              onPress={() => {
                                setEjercicioEditandoId(item.id);
                                setNuevoNombreEjercicio(item.nombre);
                                setNuevoMusculoEjercicio(item.musculo);
                                setNuevoMediaUrl(item.imagenUrl || "");
                                setNuevaDescripcion(item.descripcion || "");

                                // CARGAMOS LOS SECUNDARIOS (sacamos el primero que es el principal)
                                const secundariosPrevios =
                                  item.musculosTrabajados
                                    ? item.musculosTrabajados.slice(1)
                                    : [];
                                setNuevosMusculosSecundarios(
                                  secundariosPrevios,
                                );

                                setModalCrearEjercicioVisible(true);
                              }}
                            >
                              <Text
                                style={{
                                  color: COLORES.azulHevy,
                                  fontWeight: "bold",
                                  fontSize: 12,
                                }}
                              >
                                EDITAR
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.botonTachoDB}
                              onPress={() => eliminarEjercicioDeDB(item.id)}
                            >
                              <Text
                                style={{
                                  color: COLORES.rojoPeligro,
                                  fontWeight: "bold",
                                  fontSize: 12,
                                }}
                              >
                                ELIMINAR
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    );
                  }}
                />
              </View>
            </View>
          </Modal>

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
                  <Text style={styles.labelFormulario}>
                    Nombre (Obligatorio)
                  </Text>
                  <TextInput
                    style={styles.inputFormulario}
                    placeholder="Ej: Hip Thrust"
                    placeholderTextColor="#888"
                    value={nuevoNombreEjercicio}
                    onChangeText={setNuevoNombreEjercicio}
                  />
                  <Text style={styles.labelFormulario}>
                    Imagen o GIF (Desde tu galería)
                  </Text>
                  <TouchableOpacity
                    style={[styles.botonSubirFoto, { marginBottom: 15 }]}
                    onPress={seleccionarMedia}
                  >
                    <Text style={styles.textoSubirFoto}>
                      {nuevoMediaUrl
                        ? "✅ Archivo seleccionado"
                        : "📷/🎬 Subir Archivo"}
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
                    placeholder="Ej: Mantener la mirada al frente..."
                    placeholderTextColor="#888"
                    value={nuevaDescripcion}
                    onChangeText={setNuevaDescripcion}
                  />
                  <Text style={styles.labelFormulario}>
                    Músculos Secundarios (Seleccioná varios)
                  </Text>
                  <View style={styles.contenedorFiltrosCreacion}>
                    {MUSCULOS_CREACION.map((m) => {
                      // No mostramos el músculo que ya eligió como principal
                      if (m === nuevoMusculoEjercicio) return null;

                      const seleccionado =
                        nuevosMusculosSecundarios.includes(m);

                      return (
                        <TouchableOpacity
                          key={`secundario-${m}`}
                          style={[
                            styles.botonFiltroCreacion,
                            seleccionado && styles.botonFiltroActivo, // Se pinta si está seleccionado
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
                    Músculo Principal (Categoría):
                  </Text>
                  <View style={styles.contenedorFiltrosCreacion}>
                    {MUSCULOS_CREACION.map((m) => (
                      <TouchableOpacity
                        key={m}
                        style={[
                          styles.botonFiltroCreacion,
                          nuevoMusculoEjercicio === m &&
                            styles.botonFiltroActivo,
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
                      onPress={crearEjercicioPersonalizado}
                    >
                      <Text style={styles.textoOkDescanso}>Guardar</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </View>
          </Modal>

          <Modal
            animationType="fade"
            transparent={true}
            visible={!!ejercicioDetalle}
            onRequestClose={() => setEjercicioDetalle(null)}
          >
            <View style={styles.modalOscuro}>
              <View style={styles.cajaDetalle}>
                <Text style={styles.tituloModalDetalle}>
                  {ejercicioDetalle?.nombre}
                </Text>
                {(() => {
                  const urlMediaDetalle =
                    ejercicioDetalle?.gifUrl || ejercicioDetalle?.imagenUrl;
                  if (urlMediaDetalle)
                    return (
                      <Image
                        source={{ uri: urlMediaDetalle }}
                        style={styles.gifEstilo}
                      />
                    );
                  return null;
                })()}
                {ejercicioDetalle?.descripcion ? (
                  <>
                    <Text style={styles.subtituloDetalle}>Instrucciones:</Text>
                    <ScrollView style={{ maxHeight: 120, marginBottom: 15 }}>
                      <Text style={styles.textoDescripcion}>
                        {ejercicioDetalle.descripcion}
                      </Text>
                    </ScrollView>
                  </>
                ) : null}
                {ejercicioDetalle?.musculosTrabajados &&
                ejercicioDetalle.musculosTrabajados.length > 0 ? (
                  <>
                    <Text style={styles.subtituloDetalle}>
                      Músculos trabajados:
                    </Text>
                    <View style={styles.filaMusculos}>
                      {ejercicioDetalle.musculosTrabajados.map((m: string) => (
                        <View key={m} style={styles.tagMusculo}>
                          <Text style={styles.textoTag}>{m}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                ) : null}
                <TouchableOpacity
                  style={styles.botonCerrarDetalle}
                  onPress={() => setEjercicioDetalle(null)}
                >
                  <Text style={styles.textoCerrarDetalle}>Cerrar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Modal
            animationType="fade"
            transparent={true}
            visible={!!ejercicioEditandoDescanso}
            onRequestClose={() => setEjercicioEditandoDescanso(null)}
          >
            <View style={styles.modalOscuro}>
              <View style={styles.cajaDescanso}>
                <Text style={styles.tituloCajaDescanso}>
                  Descanso del Ejercicio
                </Text>
                <View style={styles.selectorPropio}>
                  <View style={styles.columnaSelector}>
                    <Text style={styles.labelSelector}>Minutos</Text>
                    <View style={styles.controlesSelector}>
                      <TouchableOpacity
                        style={styles.botonSelector}
                        onPress={() =>
                          setTempMinutos(Math.max(0, tempMinutos - 1))
                        }
                      >
                        <Text style={styles.textoBtnSelector}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.numeroSelector}>{tempMinutos}</Text>
                      <TouchableOpacity
                        style={styles.botonSelector}
                        onPress={() => setTempMinutos(tempMinutos + 1)}
                      >
                        <Text style={styles.textoBtnSelector}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.columnaSelector}>
                    <Text style={styles.labelSelector}>Segundos</Text>
                    <View style={styles.controlesSelector}>
                      <TouchableOpacity
                        style={styles.botonSelector}
                        onPress={() =>
                          setTempSegundos(
                            tempSegundos === 0 ? 45 : tempSegundos - 15,
                          )
                        }
                      >
                        <Text style={styles.textoBtnSelector}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.numeroSelector}>{tempSegundos}</Text>
                      <TouchableOpacity
                        style={styles.botonSelector}
                        onPress={() =>
                          setTempSegundos(
                            tempSegundos === 45 ? 0 : tempSegundos + 15,
                          )
                        }
                      >
                        <Text style={styles.textoBtnSelector}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.botonOkDescanso}
                  onPress={guardarDescansoPersonalizado}
                >
                  <Text style={styles.textoOkDescanso}>Guardar Tiempo</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          {/* --- MODAL ENTRENAMIENTO FINALIZADO ESTILO HEVY --- */}
          <Modal
            animationType="fade"
            transparent={true}
            visible={modalTerminarVisible}
            onRequestClose={() => setModalTerminarVisible(false)}
          >
            <View style={styles.modalOscuro}>
              <View style={styles.cajaModal}>
                <Text style={styles.tituloModalExito}>
                  ¡ENTRENAMIENTO FINALIZADO!
                </Text>

                {/* Texto del mensaje */}
                <Text style={styles.textoDescripcionExito}>
                  {recordsLogrados > 0
                    ? `¡Felicidades, ${nombreUsuario}!\n¡Rompiste ${recordsLogrados} récords personales hoy!`
                    : `¡Gran trabajo, ${nombreUsuario}!`}
                </Text>

                {/* Ícono de trofeo (aparece solo si hubo récords) */}
                {recordsLogrados > 0 && (
                  <View style={{ alignItems: "center", marginBottom: 20 }}>
                    <MaterialCommunityIcons
                      name="trophy-award"
                      size={48}
                      color="#FFD700" // Un color dorado tipo trofeo
                    />
                  </View>
                )}

                {/* Tarjetitas de estadísticas */}
                <View style={styles.filaResumenModal}>
                  <View style={styles.cajaDatoModal}>
                    <Text style={styles.labelDatoModal}>VOLUMEN</Text>
                    <Text style={styles.valorDatoModal}>
                      {calcularVolumen()} kg
                    </Text>
                  </View>
                  <View style={styles.cajaDatoModal}>
                    <Text style={styles.labelDatoModal}>SERIES</Text>
                    <Text style={styles.valorDatoModal}>
                      {calcularSeries()}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.botonFinalizarEntreno}
                  onPress={ejecutarFinalizacion}
                >
                  <Text style={styles.textoBotonFinalizar}>FINALIZAR</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      </KeyboardAvoidingView>
    </GestureHandlerRootView>
  );
}

const formatearDescanso = (s: number) => {
  const mins = Math.floor(s / 60);
  const segs = s % 60;
  return `${mins}:${segs < 10 ? "0" : ""}${segs}`;
};
const formatearTiempoGlobal = (s: number) => {
  const horas = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const segs = s % 60;
  if (horas > 0) return `${horas}h ${mins}m`;
  return `${mins}m ${segs}s`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORES.fondoApp,
    paddingTop: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  botonAtrasCabecera: {
    padding: 10,
    marginLeft: -10,
  },
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
  botonTerminarCabecera: {
    backgroundColor: COLORES.azulHevy,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  textoTerminarCabecera: {
    color: COLORES.textoBlanco,
    fontWeight: "900",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  filaEstadisticas: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 20,
    marginHorizontal: 15,
    marginBottom: 15,
    backgroundColor: "#1c1c1e",
    borderRadius: 16,
  },
  cajaEstadistica: {
    alignItems: "flex-start",
  },
  labelEstadistica: {
    color: COLORES.grisOscuro,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 6,
    letterSpacing: 1.5,
  },
  valorEstadistica: {
    color: COLORES.textoBlanco,
    fontSize: 20,
    fontWeight: "bold",
  },
  valorEstadisticaAzul: {
    color: COLORES.azulHevy,
    fontSize: 20,
    fontWeight: "bold",
  },
  botonEmpezarGrande: {
    backgroundColor: COLORES.verdeExito,
    marginHorizontal: 20,
    marginVertical: 15,
    paddingVertical: 18,
    borderRadius: 24,
    alignItems: "center",
  },
  textoBotonEmpezar: {
    color: COLORES.textoBlanco,
    fontSize: 14,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  tarjetaEjercicio: {
    backgroundColor: "#1c1c1e",
    borderRadius: 16,
    marginHorizontal: 15,
    marginBottom: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  cabeceraTarjeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  contenedorNombreImagen: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 10,
  },
  imagenMini: {
    width: 45,
    height: 45,
    borderRadius: 12,
    marginRight: 15,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  textoTarjeta: {
    color: COLORES.azulHevy,
    fontSize: 16,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  textoSubInfo: {
    color: COLORES.grisOscuro,
    fontSize: 12,
    marginVertical: 4,
    fontWeight: "600",
  },
  inputNotas: {
    color: COLORES.grisClaro,
    fontSize: 12,
    marginVertical: 4,
    fontWeight: "600",
    padding: 0, // Saca el padding que Android le pone por defecto a los inputs
    minHeight: 20,
  },
  botonEditarDescanso: {
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  textoEditarDescanso: {
    color: COLORES.grisClaro,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  botonOpcionesMenu: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  textoOpcionesMenu: {
    color: COLORES.grisOscuro,
    fontSize: 20,
    fontWeight: "bold",
  },
  filaCabeceraSeries: {
    flexDirection: "row",
    paddingHorizontal: 15,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    paddingBottom: 10,
  },
  textoCabeceraSerie: {
    color: COLORES.grisOscuro,
    fontSize: 10,
    fontWeight: "900",
    width: "15%",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  textoCabeceraSerieAnterior: {
    color: COLORES.grisOscuro,
    fontSize: 10,
    fontWeight: "900",
    width: "35%",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  textoCabeceraSerieCheck: {
    color: COLORES.grisOscuro,
    fontSize: 10,
    fontWeight: "900",
    width: "20%",
    textAlign: "center",
    paddingRight: 15,
    letterSpacing: 1,
  },
  filaSerie: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: "transparent",
  },
  filaSerieCompletada: {
    backgroundColor: "rgba(46, 204, 113, 0.05)",
  },
  contenedorIndiceSerie: {
    width: "15%",
    alignItems: "center",
  },
  numeroSerie: {
    color: COLORES.grisClaro,
    fontSize: 14,
    fontWeight: "900",
  },
  textoAnterior: {
    color: COLORES.grisOscuro,
    fontSize: 12,
    fontWeight: "600",
    width: "35%",
    textAlign: "center",
  },
  inputSerie: {
    backgroundColor: "rgba(255,255,255,0.05)",
    color: COLORES.textoBlanco,
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    textAlignVertical: "center",
    borderRadius: 8,
    width: "15%",
    height: 40,
    padding: 0,
    marginHorizontal: "2.5%",
  },
  inputSerieCompletada: {
    backgroundColor: "transparent",
  },
  botonEliminarSwipe: {
    backgroundColor: COLORES.rojoPeligro,
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: "100%",
    borderRadius: 8,
    marginVertical: 2,
  },
  textoEliminarSwipe: {
    color: COLORES.textoBlanco,
    fontWeight: "900",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  botonCheckPlaceHolder: {
    width: "20%",
    alignItems: "center",
  },
  botonCheck: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: COLORES.grisOscuro,
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
    marginRight: 20,
  },
  botonCheckActivo: {
    backgroundColor: COLORES.verdeExito,
    borderColor: COLORES.verdeExito,
  },
  textoCheck: {
    color: COLORES.textoBlanco,
    fontSize: 16,
    fontWeight: "bold",
  },
  botonAgregarSerie: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "rgba(255,255,255,0.05)",
    marginHorizontal: 15,
    marginTop: 15,
    padding: 12,
    borderRadius: 20,
    alignItems: "center",
  },
  textoAgregarSerie: {
    color: COLORES.grisClaro,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  botonAgregarEjercicioFlotante: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORES.azulHevy,
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 16,
    borderRadius: 24,
    alignItems: "center",
  },
  textoBotonEjercicio: {
    color: COLORES.azulHevy,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  barraTimerInferior: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1c1c1e",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  btnRestarSumar: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 20,
  },
  textoBtnTimer: {
    color: COLORES.textoBlanco,
    fontSize: 13,
    fontWeight: "900",
  },
  textoTimerGigante: {
    color: COLORES.textoBlanco,
    fontSize: 32,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: 1,
  },
  btnOmitir: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORES.rojoPeligro,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 20,
  },
  textoBtnOmitir: {
    color: COLORES.rojoPeligro,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  // --- MODALES ---
  modalOscuro: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.85)",
  },
  cajaOpcionesMenu: {
    backgroundColor: "#1c1c1e",
    width: "100%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 25,
    paddingBottom: 40,
  },
  indicadorDrag: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 25,
  },
  tituloOpciones: {
    color: COLORES.textoBlanco,
    fontSize: 13,
    fontWeight: "900",
    textAlign: "center",
    textTransform: "uppercase",
    marginBottom: 25,
    letterSpacing: 1.5,
  },
  botonMenuOpcion: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  textoMenuIcono: { fontSize: 18, marginRight: 15 },
  textoMenuOpcion: {
    color: COLORES.textoBlanco,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  botonCancelarOpciones: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 15,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 25,
  },
  textoCancelarOpciones: {
    color: COLORES.grisClaro,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.85)",
  },
  modalContenido: {
    backgroundColor: "#1c1c1e",
    height: "85%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 25,
  },
  modalCabecera: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    paddingBottom: 15,
  },
  modalTitulo: {
    color: COLORES.textoBlanco,
    fontSize: 16,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  textoCerrar: {
    color: COLORES.azulHevy,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  contenedorFiltros: { marginBottom: 20 },
  botonFiltro: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
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
  itemEjercicioDB: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  imagenMiniCatalogo: {
    width: 45,
    height: 45,
    borderRadius: 12,
    marginRight: 15,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  textoEjercicioDB: {
    color: COLORES.textoBlanco,
    fontSize: 14,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  textoMusculoDB: {
    color: COLORES.grisOscuro,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 4,
  },
  botonTachoDB: { padding: 10 },
  cajaDescanso: {
    backgroundColor: "#1c1c1e",
    width: "100%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 25,
    alignItems: "center",
    paddingBottom: 40,
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
  selectorPropio: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-around",
    marginBottom: 25,
  },
  columnaSelector: { alignItems: "center" },
  labelSelector: {
    color: COLORES.grisOscuro,
    marginBottom: 12,
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  controlesSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 5,
  },
  botonSelector: {
    backgroundColor: COLORES.azulHevy,
    width: 38,
    height: 38,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  textoBtnSelector: {
    color: COLORES.textoBlanco,
    fontSize: 20,
    fontWeight: "bold",
    marginTop: -2,
  },
  numeroSelector: {
    color: COLORES.textoBlanco,
    fontSize: 20,
    fontWeight: "900",
    width: 50,
    textAlign: "center",
  },
  botonOkDescanso: {
    backgroundColor: COLORES.azulHevy,
    width: "100%",
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 15,
  },
  textoOkDescanso: {
    color: COLORES.textoBlanco,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  cajaCrearEjercicioScroll: {
    backgroundColor: "#1c1c1e",
    width: "100%",
    maxHeight: "85%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 25,
  },
  labelFormulario: {
    color: COLORES.grisClaro,
    fontSize: 11,
    marginBottom: 8,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  botonSubirFoto: {
    backgroundColor: "transparent",
    padding: 18,
    borderRadius: 20,
    flex: 1,
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
  botonLlamarCrear: {
    backgroundColor: "transparent",
    padding: 15,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORES.azulHevy,
  },
  textoLlamarCrear: {
    color: COLORES.azulHevy,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.5,
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
  cajaDetalle: {
    backgroundColor: "#1c1c1e",
    width: "90%",
    borderRadius: 24,
    padding: 25,
    maxHeight: "80%",
    alignSelf: "center",
    marginTop: "auto",
    marginBottom: "auto",
  },
  tituloModalDetalle: {
    color: COLORES.textoBlanco,
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
    textTransform: "uppercase",
    marginBottom: 20,
    letterSpacing: 1.5,
  },
  gifEstilo: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    marginBottom: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  subtituloDetalle: {
    color: COLORES.grisOscuro,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginTop: 5,
    marginBottom: 10,
  },
  textoDescripcion: {
    color: COLORES.textoBlanco,
    fontSize: 14,
    lineHeight: 22,
  },
  filaMusculos: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 5,
    marginBottom: 15,
  },
  tagMusculo: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORES.azulHevy,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  textoTag: {
    color: COLORES.azulHevy,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  botonCerrarDetalle: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 15,
    borderRadius: 20,
    marginTop: 20,
    alignItems: "center",
  },
  textoCerrarDetalle: {
    color: COLORES.grisClaro,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontSize: 12,
  },
  itemReordenar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  circuloRojoRemover: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORES.rojoPeligro,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  textoMenos: {
    color: COLORES.rojoPeligro,
    fontWeight: "900",
    fontSize: 18,
    marginTop: -2,
  },
  iconoDrag: {
    color: COLORES.grisClaro,
    fontSize: 24,
    paddingHorizontal: 10,
  },
  cajaModal: {
    backgroundColor: "#1c1c1e",
    width: "85%",
    borderRadius: 24,
    padding: 25,
    alignSelf: "center",
    marginTop: "auto",
    marginBottom: "auto",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  tituloModalExito: {
    color: COLORES.textoBlanco,
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 15,
    textTransform: "uppercase",
    textAlign: "center",
    letterSpacing: 1.5,
  },
  textoDescripcionExito: {
    color: COLORES.grisClaro,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 25,
  },
  filaResumenModal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
    gap: 10,
  },
  cajaDatoModal: {
    flex: 1,
    backgroundColor: "#121212",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  labelDatoModal: {
    color: COLORES.grisOscuro,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 5,
  },
  valorDatoModal: {
    color: COLORES.azulHevy,
    fontSize: 16,
    fontWeight: "bold",
  },
  botonFinalizarEntreno: {
    backgroundColor: COLORES.azulHevy,
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: "center",
  },
  textoBotonFinalizar: {
    color: COLORES.textoBlanco,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
