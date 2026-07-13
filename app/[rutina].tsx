import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import * as Notifications from "expo-notifications";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import DraggableFlatList, {
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ViewShot from "react-native-view-shot";

import {
  Alert,
  Animated,
  AppState,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
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
import { EJERCICIOS_DB, EQUIPAMIENTO, GRUPOS_MUSCULARES } from "../ejercicios";

Notifications.setNotificationHandler({
  handleNotification: async () =>
    ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }) as any,
});

const PESTAÑAS_FILTRO = [
  "Todos",
  "Mis Ejercicios",
  ...GRUPOS_MUSCULARES,
  ...EQUIPAMIENTO,
];

export default function PantallaRutina() {
  const viewShotRef = useRef<any>(null);
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

  const [modalTerminarVisible, setModalTerminarVisible] = useState(false);
  const [modalCompartirVisible, setModalCompartirVisible] = useState(false);

  const [recordsLogrados, setRecordsLogrados] = useState(0);
  const [notasEntreno, setNotasEntreno] = useState("");
  const [fondoFacha, setFondoFacha] = useState<string | null>(null);

  const anchoPantalla = Dimensions.get("window").width;
  const altoHistoria = anchoPantalla * (16 / 9);
  const escalaVisual = 0.85;
  const compensacionMargen = -(altoHistoria * ((1 - escalaVisual) / 2));

  const [escalaStats, setEscalaStats] = useState(1);
  const [scrollHabilitado, setScrollEnabled] = useState(true);
  const pan = useRef(new Animated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setScrollEnabled(false);
        pan.setOffset({ x: (pan.x as any)._value, y: (pan.y as any)._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => {
        setScrollEnabled(true);
        pan.flattenOffset();
      },
      onPanResponderTerminate: () => {
        setScrollEnabled(true);
        pan.flattenOffset();
      },
    }),
  ).current;

  const [busquedaCatalog, setBusquedaCatalog] = useState("");
  const [filtroEquipamientoCat, setFiltroEquipamientoCat] =
    useState("Todo Equipamiento");
  const [filtroMusculoCat, setFiltroMusculoCat] = useState("Todos Músculos");
  const [busquedaSubModal, setBusquedaSubModal] = useState("");

  const [verMisEjercicios, setVerMisEjercicios] = useState(false);

  const [ejerciciosSeleccionados, setEjerciciosSeleccionados] = useState<any[]>(
    [],
  );
  const [ejerciciosPersonalizados, setEjerciciosPersonalizados] = useState<
    any[]
  >([]);
  const [historial, setHistorial] = useState<any[]>([]);

  const [nuevoNombreEjercicio, setNuevoNombreEjercicio] = useState("");
  const [nuevoEquipamiento, setNuevoEquipamiento] = useState("Ninguno");
  const [nuevoMusculoEjercicio, setNuevoMusculoEjercicio] = useState("Pecho");
  const [nuevoMediaUrl, setNuevoMediaUrl] = useState("");
  const [nuevaDescripcion, setNuevaDescripcion] = useState("");
  const [nuevosMusculosSecundarios, setNuevosMusculosSecundarios] = useState<
    string[]
  >([]);

  const [tipoSelectorAbierto, setTipoSelectorAbierto] = useState<
    | "equipamiento"
    | "primario"
    | "secundario"
    | "filtroEquipoCat"
    | "filtroMusculoCat"
    | null
  >(null);

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

  const [nombreUsuario, setNombreUsuario] = useState("Atleta");
  const appState = useRef(AppState.currentState);
  const tiempoFondo = useRef(Date.now());

  useEffect(() => {
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
    const cargarNombre = async () => {
      const nombreGuardado = await AsyncStorage.getItem("@nombre_usuario");
      if (nombreGuardado) setNombreUsuario(nombreGuardado);
    };

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
          title: "¡Descanso terminado!",
          body: `Es hora de la siguiente serie, ${nombreUsuario}.`,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: tiempoEnSegundos,
          channelId: "default",
        } as any,
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
    return () => subscription.remove();
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
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

  const togglePausaDescanso = () => {
    if (activo) {
      setActivo(false);
      Notifications.cancelAllScheduledNotificationsAsync();
      AsyncStorage.removeItem("@descanso_activo");
    } else {
      setActivo(true);
      AsyncStorage.setItem(
        "@descanso_activo",
        JSON.stringify({ endTime: Date.now() + segundos * 1000 }),
      );
      programarNotificacionFin(segundos);
    }
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
    setNuevosMusculosSecundarios([]);
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

    const coincideCustom = verMisEjercicios ? e.id.includes("custom") : true;

    return (
      coincideBusqueda && coincideMusculo && coincideEquipo && coincideCustom
    );
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
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
    setRecordsLogrados(records);
    setRutinaActiva(false);
    setModalTerminarVisible(true);
  };

  const elegirFondoFacha = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso", "Necesitamos acceso a tu galería para el fondo.");
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 1,
    });
    if (!result.canceled) setFondoFacha(result.assets[0].uri);
  };

  // --- FUNCIÓN QUE GUARDA Y CIERRA EL ENTRENAMIENTO AUTOMÁTICAMENTE ---
  const guardarEnGaleria = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync(true);
      if (status !== "granted") {
        Alert.alert("Permiso", "Necesitamos permiso para guardar la foto.");
        return;
      }

      const uri = await viewShotRef.current.capture();
      await MediaLibrary.saveToLibraryAsync(uri);

      Alert.alert(
        "¡Éxito!",
        "El póster se guardó en tu galería y el entrenamiento ha finalizado.",
        [
          {
            text: "Excelente",
            onPress: () => ejecutarFinalizacion(), // Ejecuta el cierre de entrenamiento
          },
        ],
      );
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Hubo un problema al guardar la imagen.");
    }
  };

  const descartarEntrenamiento = () => {
    Alert.alert(
      "Descartar Entreno",
      "¿Seguro que querés descartar este entrenamiento? Perderás el progreso de hoy.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Descartar",
          style: "destructive",
          onPress: async () => {
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
            setModalCompartirVisible(false);
            setModalTerminarVisible(false);
            router.back();
          },
        },
      ],
    );
  };

  const ejecutarFinalizacion = async () => {
    try {
      const nuevaSesion = {
        id: Date.now().toString(),
        fecha: new Date().toISOString(),
        rutinaNombre: rutina,
        volumen: calcularVolumen(),
        ejercicios: ejerciciosSeleccionados,
        tiempo: tiempoGlobal,
        notas: notasEntreno,
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
      setNotasEntreno("");
      setFondoFacha(null);
      setEscalaStats(1);
      pan.setValue({ x: 0, y: 0 });
      setModalCompartirVisible(false);
      setModalTerminarVisible(false);
      router.back();
    } catch (error) {
      console.log(error);
      Alert.alert(
        "Error",
        "Hubo un problema al guardar la rutina en el calendario.",
      );
    }
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
              style={[
                styles.botonEmpezarGrande,
                { flexDirection: "row", justifyContent: "center" },
              ]}
              onPress={() => {
                setRutinaActiva(true);
                setTiempoGlobal(0);
                AsyncStorage.setItem(
                  "@rutina_activa",
                  JSON.stringify({ nombre: rutina, timestamp: Date.now() }),
                );
              }}
            >
              <MaterialCommunityIcons
                name="play"
                size={20}
                color={COLORES.textoBlanco}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.textoBotonEmpezar}>
                Empezar Entrenamiento
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
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <MaterialCommunityIcons
                    name="plus"
                    size={18}
                    color={COLORES.azulHevy}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.textoBotonEjercicio}>
                    Añadir Ejercicio
                  </Text>
                </View>
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
                      {urlMiniatura ? (
                        <Image
                          source={{ uri: urlMiniatura }}
                          style={styles.imagenMini}
                        />
                      ) : (
                        <View
                          style={[
                            styles.imagenMini,
                            { justifyContent: "center", alignItems: "center" },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name="dumbbell"
                            size={20}
                            color={COLORES.grisOscuro}
                          />
                        </View>
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
                          style={[
                            styles.botonEditarDescanso,
                            { flexDirection: "row", alignItems: "center" },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name="timer-outline"
                            size={14}
                            color={COLORES.grisClaro}
                            style={{ marginRight: 4 }}
                          />
                          <Text style={styles.textoEditarDescanso}>
                            Descanso: {formatearDescanso(descansoActual)}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.botonOpcionesMenu}
                      onPress={() => setOpcionesEjercicioId(item.id)}
                    >
                      <MaterialCommunityIcons
                        name="dots-vertical"
                        size={24}
                        color={COLORES.grisOscuro}
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.filaCabeceraSeries}>
                    <Text style={styles.textoCabeceraSerie}>SERIE</Text>
                    <Text style={styles.textoCabeceraSerieAnterior}>
                      ANTERIOR
                    </Text>
                    <Text style={styles.textoCabeceraSerie}>KG</Text>
                    <Text style={styles.textoCabeceraSerie}>REPS</Text>
                    <MaterialCommunityIcons
                      name="check"
                      size={16}
                      color={COLORES.grisOscuro}
                      style={styles.textoCabeceraSerieCheck}
                    />
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
                                    name="trophy"
                                    size={20}
                                    color="#FFD700"
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
                                <MaterialCommunityIcons
                                  name="check"
                                  size={16}
                                  color={COLORES.textoBlanco}
                                />
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
                    if (activo) {
                      AsyncStorage.setItem(
                        "@descanso_activo",
                        JSON.stringify({ endTime: Date.now() + n * 1000 }),
                      );
                      if (n > 0) programarNotificacionFin(n);
                      else Notifications.cancelAllScheduledNotificationsAsync();
                    }
                    return n;
                  })
                }
              >
                <Text style={styles.textoBtnTimer}>-15</Text>
              </TouchableOpacity>

              <Text
                style={[
                  styles.textoTimerGigante,
                  !activo && { color: COLORES.grisClaro },
                ]}
              >
                {formatearDescanso(segundos)}
              </Text>

              <TouchableOpacity
                style={styles.btnRestarSumar}
                onPress={() =>
                  setSegundos((s) => {
                    const n = s + 15;
                    if (activo) {
                      AsyncStorage.setItem(
                        "@descanso_activo",
                        JSON.stringify({ endTime: Date.now() + n * 1000 }),
                      );
                      programarNotificacionFin(n);
                    }
                    return n;
                  })
                }
              >
                <Text style={styles.textoBtnTimer}>+15</Text>
              </TouchableOpacity>

              <View style={styles.filaBotonesAccionTimer}>
                <TouchableOpacity
                  style={[
                    styles.btnPausarTimer,
                    !activo && { borderColor: COLORES.azulHevy },
                  ]}
                  onPress={togglePausaDescanso}
                >
                  <MaterialCommunityIcons
                    name={activo ? "pause" : "play"}
                    size={20}
                    color={!activo ? COLORES.azulHevy : COLORES.textoBlanco}
                  />
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
            </View>
          )}

          {/* ======================================================== */}
          {/* ======================= MODALES ========================== */}
          {/* ======================================================== */}

          {/* 1. MODAL DE OPCIONES DEL EJERCICIO */}
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
                  <MaterialCommunityIcons
                    name="swap-vertical"
                    size={20}
                    color={COLORES.textoBlanco}
                    style={styles.textoMenuIcono}
                  />
                  <Text style={styles.textoMenuOpcion}>
                    Reordenar Ejercicios
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.botonMenuOpcion}
                  onPress={() => prepararReemplazo(opcionesEjercicioId!)}
                >
                  <MaterialCommunityIcons
                    name="swap-horizontal"
                    size={20}
                    color={COLORES.textoBlanco}
                    style={styles.textoMenuIcono}
                  />
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

          {/* 2. MODAL PARA REORDENAR EJERCICIOS */}
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
                                <MaterialCommunityIcons
                                  name="minus"
                                  size={16}
                                  color={COLORES.rojoPeligro}
                                />
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
                                    {
                                      backgroundColor: COLORES.fondoInput,
                                      justifyContent: "center",
                                      alignItems: "center",
                                    },
                                  ]}
                                >
                                  <MaterialCommunityIcons
                                    name="dumbbell"
                                    size={20}
                                    color={COLORES.grisOscuro}
                                  />
                                </View>
                              )}
                              <Text
                                style={[styles.textoEjercicioDB, { flex: 1 }]}
                                numberOfLines={2}
                              >
                                {item.nombre}
                              </Text>
                            </View>
                            <TouchableOpacity onPressIn={drag}>
                              <MaterialCommunityIcons
                                name="menu"
                                size={24}
                                color={COLORES.grisClaro}
                                style={{ paddingHorizontal: 10 }}
                              />
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

          {/* 3. MODAL CATÁLOGO HEVY */}
          <Modal
            animationType="slide"
            transparent={false}
            visible={modalVisible}
            onRequestClose={() => {
              setModalVisible(false);
              setEjercicioAReemplazar(null);
            }}
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
                }}
              >
                <TouchableOpacity
                  onPress={() => {
                    setModalVisible(false);
                    setEjercicioAReemplazar(null);
                  }}
                >
                  <Text style={{ color: "#3b82f6", fontSize: 16 }}>
                    Cancelar
                  </Text>
                </TouchableOpacity>

                <Text
                  style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}
                >
                  {ejercicioAReemplazar
                    ? "Reemplazar Ejercicio"
                    : "Agregar Ejercicio"}
                </Text>

                <TouchableOpacity
                  onPress={() => {
                    setEjercicioEditandoId(null);
                    setNuevoNombreEjercicio("");
                    setNuevoMusculoEjercicio("Pecho");
                    setNuevoEquipamiento("Ninguno");
                    setNuevoMediaUrl("");
                    setNuevaDescripcion("");
                    setNuevosMusculosSecundarios([]);
                    setModalVisible(false);
                    setTimeout(() => setModalCrearEjercicioVisible(true), 300);
                  }}
                >
                  <Text style={{ color: "#3b82f6", fontSize: 16 }}>Crear</Text>
                </TouchableOpacity>
              </View>

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

              {/* FILTROS HORIZONTALES (Mis Ejercicios / Equipamiento / Músculo) */}
              <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 10 }}
                >
                  <TouchableOpacity
                    style={{
                      backgroundColor: verMisEjercicios
                        ? COLORES.azulHevy
                        : "#1c1c1e",
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

              <Text
                style={{
                  color: "#666",
                  fontSize: 14,
                  paddingHorizontal: 20,
                  marginBottom: 15,
                }}
              >
                Catálogo
              </Text>

              <FlatList
                data={ejerciciosFiltrados}
                keyExtractor={(e) => e.id}
                contentContainerStyle={{
                  paddingHorizontal: 20,
                  paddingBottom: 50,
                }}
                ListEmptyComponent={
                  <Text
                    style={{
                      color: "#666",
                      textAlign: "center",
                      marginTop: 20,
                    }}
                  >
                    No se encontraron ejercicios
                  </Text>
                }
                renderItem={({ item }) => {
                  const miniaturaCatalogo = item.imagenUrl || item.gifUrl;
                  return (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: "rgba(255,255,255,0.05)",
                      }}
                    >
                      <TouchableOpacity
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          flex: 1,
                        }}
                        onPress={() => agregarEjercicio(item)}
                      >
                        <View
                          style={{
                            width: 50,
                            height: 50,
                            borderRadius: 25,
                            backgroundColor: "#1c1c1e",
                            marginRight: 15,
                            overflow: "hidden",
                          }}
                        >
                          {miniaturaCatalogo ? (
                            <Image
                              source={{ uri: miniaturaCatalogo }}
                              style={{ width: "100%", height: "100%" }}
                            />
                          ) : (
                            <View
                              style={{
                                flex: 1,
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              <MaterialCommunityIcons
                                name="dumbbell"
                                size={24}
                                color="#666"
                              />
                            </View>
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              color: "#fff",
                              fontSize: 16,
                              marginBottom: 4,
                            }}
                          >
                            {item.nombre}
                          </Text>
                          <Text style={{ color: "#666", fontSize: 14 }}>
                            {item.musculo}
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
                              setNuevoEquipamiento(
                                item.equipamiento || "Ninguno",
                              );
                              setNuevoMediaUrl(item.imagenUrl || "");
                              setNuevaDescripcion(item.descripcion || "");
                              const secundariosPrevios = item.musculosTrabajados
                                ? item.musculosTrabajados.slice(1)
                                : [];
                              setNuevosMusculosSecundarios(secundariosPrevios);
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
          </Modal>

          {/* 4. MODAL CREAR EJERCICIO HEVY */}
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
                <Text
                  style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}
                >
                  {ejercicioEditandoId ? "Editar Ejercicio" : "Crear Ejercicio"}
                </Text>
                <TouchableOpacity
                  style={{
                    backgroundColor: COLORES.azulHevy,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 8,
                  }}
                  onPress={crearEjercicioPersonalizado}
                >
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>
                    Guardar
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <TouchableOpacity
                  style={{
                    alignItems: "center",
                    marginTop: 30,
                    marginBottom: 30,
                  }}
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
                    style={{
                      color: COLORES.azulHevy,
                      fontSize: 14,
                      marginTop: 15,
                    }}
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
                    <Text
                      style={{ color: "#fff", fontSize: 16, marginBottom: 5 }}
                    >
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
                    <Text
                      style={{ color: "#fff", fontSize: 16, marginBottom: 5 }}
                    >
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
                    <Text
                      style={{ color: "#fff", fontSize: 16, marginBottom: 5 }}
                    >
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

          {/* 5. SUB-MODAL DESLIZABLE (EQUIPAMIENTO / MUSCULOS / FILTROS) */}
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
                <Text
                  style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}
                >
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
                style={{
                  paddingHorizontal: 20,
                  marginTop: 15,
                  marginBottom: 15,
                }}
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
                      <Text style={{ color: "#fff", fontSize: 16 }}>
                        {item}
                      </Text>
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

          {/* 6. MODAL DETALLE DE EJERCICIO (FOTO/GIF) */}
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

          {/* 7. MODAL EDITAR DESCANSO */}
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
                        <MaterialCommunityIcons
                          name="minus"
                          size={20}
                          color={COLORES.textoBlanco}
                        />
                      </TouchableOpacity>
                      <Text style={styles.numeroSelector}>{tempMinutos}</Text>
                      <TouchableOpacity
                        style={styles.botonSelector}
                        onPress={() => setTempMinutos(tempMinutos + 1)}
                      >
                        <MaterialCommunityIcons
                          name="plus"
                          size={20}
                          color={COLORES.textoBlanco}
                        />
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
                        <MaterialCommunityIcons
                          name="minus"
                          size={20}
                          color={COLORES.textoBlanco}
                        />
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
                        <MaterialCommunityIcons
                          name="plus"
                          size={20}
                          color={COLORES.textoBlanco}
                        />
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

          {/* 8. PANTALLA DE RESUMEN (GUARDAR) */}
          <Modal
            animationType="slide"
            transparent={false}
            visible={modalTerminarVisible}
            onRequestClose={() => {
              setModalTerminarVisible(false);
              setRutinaActiva(true);
            }}
          >
            <View style={styles.modalPantallaCompleta}>
              <View style={styles.headerGuardar}>
                <TouchableOpacity
                  onPress={() => {
                    setModalTerminarVisible(false);
                    setRutinaActiva(true);
                  }}
                  style={{ padding: 10, marginLeft: -10 }}
                >
                  <Text
                    style={{
                      color: COLORES.rojoPeligro,
                      fontWeight: "bold",
                      fontSize: 14,
                      textTransform: "uppercase",
                    }}
                  >
                    Atrás
                  </Text>
                </TouchableOpacity>
                <Text style={styles.tituloGuardar}>Guardar</Text>
                <TouchableOpacity
                  style={styles.botonGuardarTop}
                  onPress={ejecutarFinalizacion}
                >
                  <Text style={styles.textoBotonGuardarTop}>Guardar</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                <View style={{ padding: 20 }}>
                  <Text style={styles.nombreRutinaGuardar}>{rutina}</Text>

                  <View style={styles.filaStatsGuardar}>
                    <View style={styles.cajaStatGuardar}>
                      <Text style={styles.labelStatGuardar}>Duración</Text>
                      <Text style={styles.valorStatAzul}>
                        {formatearTiempoGlobal(tiempoGlobal)}
                      </Text>
                    </View>
                    <View style={styles.cajaStatGuardar}>
                      <Text style={styles.labelStatGuardar}>Volumen</Text>
                      <Text style={styles.valorStatGuardar}>
                        {calcularVolumen()} kg
                      </Text>
                    </View>
                    <View style={styles.cajaStatGuardar}>
                      <Text style={styles.labelStatGuardar}>Series</Text>
                      <Text style={styles.valorStatGuardar}>
                        {calcularSeries()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.separador} />

                  <Text style={styles.valorStatAzul}>
                    {new Date().toLocaleDateString("es-AR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>

                  {recordsLogrados > 0 && (
                    <View
                      style={[
                        styles.cajaRecordsGuardar,
                        { alignSelf: "flex-start" },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="trophy"
                        size={20}
                        color="#FFD700"
                        style={{ marginRight: 8 }}
                      />
                      <Text style={styles.textoRecordG}>
                        ¡Rompiste {recordsLogrados} récord
                        {recordsLogrados > 1 ? "s" : ""} personal
                        {recordsLogrados > 1 ? "es" : ""} hoy!
                      </Text>
                    </View>
                  )}

                  <View style={styles.separador} />

                  <Text style={styles.labelStatGuardar}>Descripción</Text>
                  <TextInput
                    style={styles.inputNotasEntrenamiento}
                    placeholder="¿Cómo ha ido tu entrenamiento? Deja algunas notas aquí..."
                    placeholderTextColor="#666"
                    multiline={true}
                    value={notasEntreno}
                    onChangeText={setNotasEntreno}
                  />

                  <View style={styles.separador} />

                  <TouchableOpacity
                    style={styles.botonCompartirTexto}
                    onPress={() => setModalCompartirVisible(true)}
                  >
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <MaterialCommunityIcons
                        name="camera-outline"
                        size={18}
                        color={COLORES.azulHevy}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.textoCompartirTexto}>
                        Crear Foto para Historia
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.botonDescartar}
                    onPress={descartarEntrenamiento}
                  >
                    <Text style={styles.textoDescartar}>Descartar Entreno</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </Modal>

          {/* 9. PANTALLA COMPLETA DE EDICIÓN DE PÓSTER (SE ABRE DESDE LA DE GUARDAR) */}
          <Modal
            animationType="slide"
            transparent={false}
            visible={modalCompartirVisible}
            onRequestClose={() => setModalCompartirVisible(false)}
          >
            <View style={styles.modalPantallaCompleta}>
              <View style={styles.headerGuardar}>
                <TouchableOpacity
                  onPress={() => setModalCompartirVisible(false)}
                  style={{ padding: 10, marginLeft: -10 }}
                >
                  <Text
                    style={{
                      color: COLORES.rojoPeligro,
                      fontWeight: "bold",
                      fontSize: 14,
                      textTransform: "uppercase",
                    }}
                  >
                    Atrás
                  </Text>
                </TouchableOpacity>
                <Text style={styles.tituloGuardar}>Compartir Logro</Text>
                <TouchableOpacity
                  style={styles.botonGuardarTop}
                  onPress={guardarEnGaleria}
                >
                  <Text style={styles.textoBotonGuardarTop}>Guardar</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                bounces={false}
                scrollEnabled={scrollHabilitado}
              >
                <View style={styles.filaControlesFoto}>
                  <TouchableOpacity
                    style={[
                      styles.botonControlPeque,
                      { flexDirection: "row", alignItems: "center" },
                    ]}
                    onPress={elegirFondoFacha}
                  >
                    <MaterialCommunityIcons
                      name={fondoFacha ? "image-edit-outline" : "image-plus"}
                      size={16}
                      color={COLORES.grisClaro}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.textoControlPeque}>
                      {fondoFacha ? "Cambiar Fondo" : "Poner Fondo"}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.controlTamaño}>
                    <TouchableOpacity
                      onPress={() =>
                        setEscalaStats((e) => Math.max(0.4, e - 0.1))
                      }
                      style={styles.botonZoom}
                    >
                      <Text style={styles.textoZoom}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.textoControlPeque}>Tamaño</Text>
                    <TouchableOpacity
                      onPress={() =>
                        setEscalaStats((e) => Math.min(2, e + 0.1))
                      }
                      style={styles.botonZoom}
                    >
                      <Text style={styles.textoZoom}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View
                  style={{
                    width: anchoPantalla,
                    height: altoHistoria,
                    transform: [{ scale: escalaVisual }],
                    marginTop: compensacionMargen,
                    marginBottom: compensacionMargen,
                    alignSelf: "center",
                    borderRadius: 24,
                    overflow: "hidden",
                  }}
                >
                  <ViewShot
                    ref={viewShotRef}
                    options={{ format: "png", quality: 1.0 }}
                    style={{
                      width: "100%",
                      height: "100%",
                      backgroundColor: "#121212",
                    }}
                  >
                    <ImageBackground
                      source={fondoFacha ? { uri: fondoFacha } : undefined}
                      style={{ flex: 1, justifyContent: "center" }}
                      imageStyle={{
                        opacity: 0.4,
                        backgroundColor: "#000",
                        resizeMode: "cover",
                      }}
                    >
                      <Animated.View
                        {...panResponder.panHandlers}
                        style={[
                          pan.getLayout(),
                          {
                            transform: [{ scale: escalaStats }],
                            alignItems: "center",
                            padding: 20,
                            width: "100%",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.nombreRutinaGuardar,
                            fondoFacha && styles.textoCentradoAdidas,
                          ]}
                        >
                          {rutina}
                        </Text>

                        <View
                          style={[styles.filaStatsGuardar, { width: "100%" }]}
                        >
                          <View
                            style={[
                              styles.cajaStatGuardar,
                              fondoFacha && { alignItems: "center" },
                            ]}
                          >
                            <Text style={styles.labelStatGuardar}>
                              Duración
                            </Text>
                            <Text style={styles.valorStatAzul}>
                              {formatearTiempoGlobal(tiempoGlobal)}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.cajaStatGuardar,
                              fondoFacha && { alignItems: "center" },
                            ]}
                          >
                            <Text style={styles.labelStatGuardar}>Volumen</Text>
                            <Text style={styles.valorStatGuardar}>
                              {calcularVolumen()} kg
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.cajaStatGuardar,
                              fondoFacha && { alignItems: "center" },
                            ]}
                          >
                            <Text style={styles.labelStatGuardar}>Series</Text>
                            <Text style={styles.valorStatGuardar}>
                              {calcularSeries()}
                            </Text>
                          </View>
                        </View>

                        <View
                          style={[
                            styles.separador,
                            fondoFacha && { opacity: 0 },
                          ]}
                        />

                        <Text
                          style={[
                            styles.valorStatAzul,
                            fondoFacha && styles.textoCentradoAdidas,
                          ]}
                        >
                          {new Date().toLocaleDateString("es-AR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>

                        {recordsLogrados > 0 && (
                          <View
                            style={[
                              styles.cajaRecordsGuardar,
                              fondoFacha && {
                                alignSelf: "center",
                                marginTop: 30,
                              },
                            ]}
                          >
                            <MaterialCommunityIcons
                              name="trophy"
                              size={20}
                              color="#FFD700"
                              style={{ marginRight: 8 }}
                            />
                            <Text style={styles.textoRecordG}>
                              ¡Rompiste {recordsLogrados} récord
                              {recordsLogrados > 1 ? "s" : ""} personal
                              {recordsLogrados > 1 ? "es" : ""} hoy!
                            </Text>
                          </View>
                        )}
                      </Animated.View>
                    </ImageBackground>
                  </ViewShot>
                </View>
              </ScrollView>
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
    padding: 0,
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
  filaBotonesAccionTimer: {
    flexDirection: "row",
    gap: 8,
  },
  btnPausarTimer: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 20,
    justifyContent: "center",
  },
  textoBtnPausar: {
    color: COLORES.textoBlanco,
    fontSize: 14,
  },
  btnOmitir: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORES.rojoPeligro,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 20,
    justifyContent: "center",
  },
  textoBtnOmitir: {
    color: COLORES.rojoPeligro,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },

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
  modalPantallaCompleta: {
    flex: 1,
    backgroundColor: "#121212",
  },
  headerGuardar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  tituloGuardar: {
    color: COLORES.textoBlanco,
    fontSize: 16,
    fontWeight: "bold",
  },
  botonGuardarTop: {
    backgroundColor: COLORES.azulHevy,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  textoBotonGuardarTop: {
    color: COLORES.textoBlanco,
    fontWeight: "bold",
    fontSize: 14,
  },
  nombreRutinaGuardar: {
    color: COLORES.textoBlanco,
    fontSize: 22,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 25,
  },
  filaStatsGuardar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  cajaStatGuardar: {
    flex: 1,
  },
  labelStatGuardar: {
    color: COLORES.grisOscuro,
    fontSize: 11,
    marginBottom: 8,
  },
  valorStatGuardar: {
    color: COLORES.textoBlanco,
    fontSize: 16,
    fontWeight: "bold",
  },
  valorStatAzul: {
    color: COLORES.azulHevy,
    fontSize: 16,
    fontWeight: "bold",
  },
  separador: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginVertical: 20,
  },
  cajaRecordsGuardar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.3)",
  },
  iconoRecordG: {
    fontSize: 18,
    marginRight: 10,
  },
  textoRecordG: {
    color: "#FFD700",
    fontWeight: "bold",
    fontSize: 13,
  },
  inputNotasEntrenamiento: {
    color: COLORES.textoBlanco,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: "top",
  },
  botonCompartirTexto: {
    alignItems: "center",
    paddingVertical: 15,
    marginBottom: 20,
  },
  textoCompartirTexto: {
    color: COLORES.azulHevy,
    fontSize: 14,
    fontWeight: "bold",
  },
  botonDescartar: {
    alignItems: "center",
    paddingVertical: 15,
  },
  textoDescartar: {
    color: COLORES.rojoPeligro,
    fontSize: 14,
    fontWeight: "bold",
  },
  botonElegirFondo: {
    padding: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  textoElegirFondo: {
    color: COLORES.grisClaro,
    fontSize: 14,
    fontWeight: "bold",
  },
  textoCentradoAdidas: {
    textAlign: "center",
    fontSize: 28,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  filaControlesFoto: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  botonControlPeque: {
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
  },
  textoControlPeque: {
    color: COLORES.grisClaro,
    fontSize: 13,
    fontWeight: "bold",
  },
  controlTamaño: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    paddingHorizontal: 5,
  },
  botonZoom: {
    padding: 10,
    paddingHorizontal: 15,
  },
  textoZoom: {
    color: COLORES.textoBlanco,
    fontSize: 18,
    fontWeight: "bold",
  },
});
