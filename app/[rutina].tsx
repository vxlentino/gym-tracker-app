import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as Notifications from "expo-notifications";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import DraggableFlatList, {
  ScaleDecorator,
} from "react-native-draggable-flatlist";

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
    let recordsLogrados = 0;
    ejerciciosSeleccionados.forEach((ej) => {
      ej.series.forEach((s: any, idx: number) => {
        if (
          s.completada &&
          esRecord(s.kg, s.reps, obtenerSerieAnterior(ej.nombre, idx))
        )
          recordsLogrados++;
      });
    });

    const mensajeFelicidades =
      recordsLogrados > 0
        ? `¡Felicidades, ${nombreUsuario}!\n¡Rompiste ${recordsLogrados} récords personales hoy! 🏆🔥\n\nVolumen: ${calcularVolumen()} kg\nSeries: ${calcularSeries()}`
        : `¡Gran trabajo, ${nombreUsuario}!\n\nVolumen: ${calcularVolumen()} kg\nSeries: ${calcularSeries()}`;

    Alert.alert("¡Entrenamiento Finalizado!", mensajeFelicidades, [
      {
        text: "Finalizar",
        onPress: async () => {
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
          router.back();
        },
      },
    ]);
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
                        <Text style={styles.textoSubInfo}>
                          Agregar notas aquí...
                        </Text>
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
                                  🏆
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
            <View style={styles.barraTimerInferior}>
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
                <View style={styles.modalContenido}>
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
                              <Text style={{ fontSize: 18 }}>🗑️</Text>
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
    borderBottomColor: COLORES.grisBorde,
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
    fontSize: 20,
    fontWeight: "800", // Más agresivo
    color: COLORES.textoBlanco,
    textTransform: "uppercase", // Letra mayúscula para look más pro
    letterSpacing: 1, // Letras un poco separadas
  },
  botonTerminarCabecera: {
    backgroundColor: COLORES.azulHevy,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 4, // Bordes casi cuadrados
  },
  textoTerminarCabecera: {
    color: COLORES.textoBlanco,
    fontWeight: "bold",
    fontSize: 14,
    textTransform: "uppercase",
  },
  filaEstadisticas: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.grisBorde,
    marginBottom: 10,
    backgroundColor: "#121212", // Fondo apenitas distinto para separar
  },
  cajaEstadistica: {
    alignItems: "flex-start",
  },
  labelEstadistica: {
    color: COLORES.grisOscuro,
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  valorEstadistica: {
    color: COLORES.textoBlanco,
    fontSize: 18,
    fontWeight: "bold",
  },
  valorEstadisticaAzul: {
    color: COLORES.azulHevy,
    fontSize: 18,
    fontWeight: "bold",
  },
  botonEmpezarGrande: {
    backgroundColor: COLORES.verdeExito,
    margin: 20,
    padding: 15,
    borderRadius: 6, // Cuadrado moderno
    alignItems: "center",
  },
  textoBotonEmpezar: {
    color: COLORES.textoBlanco,
    fontSize: 16,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  tarjetaEjercicio: {
    marginBottom: 30, // Más aire entre ejercicios
  },
  cabeceraTarjeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    marginBottom: 10,
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
    borderRadius: 6, // Imagen cuadrada en lugar de círculo
    marginRight: 12,
    backgroundColor: COLORES.fondoInput,
    borderWidth: 1,
    borderColor: COLORES.grisBorde,
  },
  textoTarjeta: {
    color: COLORES.azulHevy,
    fontSize: 18,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  textoSubInfo: {
    color: COLORES.grisOscuro,
    fontSize: 13,
    marginVertical: 3,
  },
  botonEditarDescanso: {
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  textoEditarDescanso: {
    color: COLORES.grisClaro,
    fontSize: 13,
    fontWeight: "bold",
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
    paddingHorizontal: 20,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.grisBorde,
    paddingBottom: 5,
  },
  textoCabeceraSerie: {
    color: COLORES.grisOscuro,
    fontSize: 11,
    fontWeight: "bold",
    width: "15%",
    textAlign: "center",
    textTransform: "uppercase",
  },
  textoCabeceraSerieAnterior: {
    color: COLORES.grisOscuro,
    fontSize: 11,
    fontWeight: "bold",
    width: "35%",
    textAlign: "center",
    textTransform: "uppercase",
  },
  textoCabeceraSerieCheck: {
    color: COLORES.grisOscuro,
    fontSize: 11,
    fontWeight: "bold",
    width: "20%",
    textAlign: "center",
    paddingRight: 20,
  },
  filaSerie: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8, // Un poco más de aire
    paddingHorizontal: 20,
    backgroundColor: COLORES.fondoApp,
  },
  filaSerieCompletada: {
    backgroundColor: "rgba(46, 204, 113, 0.1)", // Verde muy muy sutil en lugar de sólido
  },
  contenedorIndiceSerie: {
    width: "15%",
    alignItems: "center",
  },
  numeroSerie: {
    color: COLORES.grisClaro,
    fontSize: 14,
    fontWeight: "bold",
  },
  textoAnterior: {
    color: COLORES.grisOscuro,
    fontSize: 13,
    width: "35%",
    textAlign: "center",
  },
  inputSerie: {
    backgroundColor: "transparent",
    color: COLORES.textoBlanco,
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "center",
    textAlignVertical: "center", // Centra el texto verticalmente en Android
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORES.grisBorde,
    width: "15%",
    height: 38, // Le damos un poquito más de aire (estaba en 35)
    padding: 0,
    marginHorizontal: "2.5%",
  },
  inputSerieCompletada: {
    borderColor: "transparent",
    backgroundColor: "transparent",
  },
  botonEliminarSwipe: {
    backgroundColor: COLORES.rojoPeligro,
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: "100%",
  },
  textoEliminarSwipe: {
    color: COLORES.textoBlanco,
    fontWeight: "bold",
    fontSize: 13,
    textTransform: "uppercase",
  },
  botonCheckPlaceHolder: {
    width: "20%",
    alignItems: "center",
  },
  botonCheck: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: COLORES.grisOscuro, // Cuadrado vacío cuando no está checkeado
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4, // Cuadrado con apenas curvatura
    marginRight: 25,
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
    borderStyle: "dashed",
    borderColor: COLORES.grisOscuro,
    marginHorizontal: 20,
    marginTop: 10,
    padding: 10,
    borderRadius: 4,
    alignItems: "center",
  },
  textoAgregarSerie: {
    color: COLORES.grisClaro,
    fontSize: 13,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  botonAgregarEjercicioFlotante: {
    backgroundColor: "rgba(30, 30, 30, 0.9)", // Oscuro transparente
    borderWidth: 1,
    borderColor: COLORES.azulHevy,
    margin: 20,
    padding: 15,
    borderRadius: 6,
    alignItems: "center",
  },
  textoBotonEjercicio: {
    color: COLORES.azulHevy,
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  barraTimerInferior: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#121212",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 2,
    borderTopColor: COLORES.azulHevy,
  },
  btnRestarSumar: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORES.grisBorde,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 4,
  },
  textoBtnTimer: {
    color: COLORES.textoBlanco,
    fontSize: 14,
    fontWeight: "bold",
  },
  textoTimerGigante: {
    color: COLORES.textoBlanco,
    fontSize: 36,
    fontWeight: "900",
    fontFamily: "monospace",
  },
  btnOmitir: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORES.rojoPeligro,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 4,
  },
  textoBtnOmitir: {
    color: COLORES.rojoPeligro,
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
  },

  // --- MODALES (Menos redondeados y más limpios) ---
  modalOscuro: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.85)", // Fondo un poco más oscuro
  },
  cajaOpcionesMenu: {
    backgroundColor: "#1c1c1e",
    width: "100%",
    borderTopLeftRadius: 12, // Curva menos pronunciada
    borderTopRightRadius: 12,
    padding: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: COLORES.grisBorde,
  },
  indicadorDrag: {
    width: 40,
    height: 4,
    backgroundColor: COLORES.grisOscuro,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  tituloOpciones: {
    color: COLORES.textoBlanco,
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    textTransform: "uppercase",
    marginBottom: 20,
    letterSpacing: 1,
  },
  botonMenuOpcion: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.grisBorde,
  },
  textoMenuIcono: { fontSize: 18, marginRight: 15 },
  textoMenuOpcion: {
    color: COLORES.textoBlanco,
    fontSize: 15,
    fontWeight: "600",
  },
  botonCancelarOpciones: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORES.grisOscuro,
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 20,
  },
  textoCancelarOpciones: {
    color: COLORES.grisClaro,
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.85)",
  },
  modalContenido: {
    backgroundColor: "#121212",
    height: "85%",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORES.grisBorde,
  },
  modalCabecera: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.grisBorde,
    paddingBottom: 15,
  },
  modalTitulo: {
    color: COLORES.textoBlanco,
    fontSize: 18,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  textoCerrar: {
    color: COLORES.azulHevy,
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  contenedorFiltros: { marginBottom: 20 },
  botonFiltro: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORES.grisBorde,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  botonFiltroActivo: {
    backgroundColor: COLORES.azulHevy,
    borderColor: COLORES.azulHevy,
  },
  textoFiltro: { color: COLORES.grisClaro, fontWeight: "600" },
  textoFiltroActivo: { color: COLORES.textoBlanco, fontWeight: "bold" },
  itemEjercicioDB: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.grisBorde,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  imagenMiniCatalogo: {
    width: 45,
    height: 45,
    borderRadius: 6,
    marginRight: 15,
    borderWidth: 1,
    borderColor: COLORES.grisBorde,
  },
  textoEjercicioDB: {
    color: COLORES.textoBlanco,
    fontSize: 16,
    fontWeight: "bold",
  },
  textoMusculoDB: {
    color: COLORES.grisOscuro,
    fontSize: 12,
    textTransform: "uppercase",
    marginTop: 2,
  },
  botonTachoDB: { padding: 10 },
  cajaDescanso: {
    backgroundColor: "#1c1c1e",
    width: "100%",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 20,
    alignItems: "center",
    paddingBottom: 40,
  },
  tituloCajaDescanso: {
    color: COLORES.textoBlanco,
    fontSize: 16,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 20,
    textAlign: "center",
    letterSpacing: 1,
  },
  selectorPropio: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  columnaSelector: { alignItems: "center" },
  labelSelector: {
    color: COLORES.grisOscuro,
    marginBottom: 10,
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    textTransform: "uppercase",
  },
  controlesSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORES.grisBorde,
    borderRadius: 6,
    padding: 5,
  },
  botonSelector: {
    backgroundColor: COLORES.azulHevy,
    width: 35,
    height: 35,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
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
    fontWeight: "bold",
    width: 50,
    textAlign: "center",
  },
  botonOkDescanso: {
    backgroundColor: COLORES.verdeExito,
    width: "100%",
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 10,
  },
  textoOkDescanso: {
    color: COLORES.textoBlanco,
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  cajaCrearEjercicioScroll: {
    backgroundColor: "#121212",
    width: "100%",
    maxHeight: "85%",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORES.grisBorde,
  },
  labelFormulario: {
    color: COLORES.grisClaro,
    fontSize: 12,
    marginBottom: 5,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  botonSubirFoto: {
    backgroundColor: "transparent",
    padding: 15,
    borderRadius: 6,
    flex: 1,
    alignItems: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: COLORES.grisOscuro,
  },
  textoSubirFoto: {
    color: COLORES.grisClaro,
    fontWeight: "bold",
    fontSize: 13,
    textTransform: "uppercase",
  },
  inputFormulario: {
    backgroundColor: "transparent",
    color: COLORES.textoBlanco,
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORES.grisBorde,
    fontSize: 16,
    marginBottom: 15,
  },
  botonLlamarCrear: {
    backgroundColor: "transparent",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORES.azulHevy,
  },
  textoLlamarCrear: {
    color: COLORES.azulHevy,
    fontSize: 13,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  contenedorFiltrosCreacion: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  botonFiltroCreacion: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORES.grisBorde,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  filaBotonesCrear: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  botonCancelarCrear: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORES.grisOscuro,
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: "center",
    marginRight: 10,
  },
  textoCancelarCrear: {
    color: COLORES.grisClaro,
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  botonGuardarCrear: {
    backgroundColor: COLORES.verdeExito,
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  cajaDetalle: {
    backgroundColor: "#1c1c1e",
    width: "90%",
    borderRadius: 8,
    padding: 20,
    maxHeight: "80%",
    alignSelf: "center",
    marginTop: "auto",
    marginBottom: "auto",
    borderWidth: 1,
    borderColor: COLORES.grisBorde,
  },
  tituloModalDetalle: {
    color: COLORES.textoBlanco,
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
    textTransform: "uppercase",
    marginBottom: 15,
    letterSpacing: 1,
  },
  gifEstilo: {
    width: "100%",
    height: 200,
    borderRadius: 6,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORES.grisBorde,
  },
  subtituloDetalle: {
    color: COLORES.grisOscuro,
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginTop: 5,
    marginBottom: 5,
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
    marginBottom: 10,
  },
  tagMusculo: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORES.azulHevy,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  textoTag: {
    color: COLORES.azulHevy,
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  botonCerrarDetalle: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORES.grisOscuro,
    padding: 12,
    borderRadius: 6,
    marginTop: 15,
    alignItems: "center",
  },
  textoCerrarDetalle: {
    color: COLORES.grisClaro,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  itemReordenar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.grisBorde,
  },
  circuloRojoRemover: {
    width: 24,
    height: 24,
    borderRadius: 4, // Cuadrado
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORES.rojoPeligro,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  textoMenos: {
    color: COLORES.rojoPeligro,
    fontWeight: "bold",
    fontSize: 18,
    marginTop: -2,
  },
  iconoDrag: { color: COLORES.grisOscuro, fontSize: 24, paddingHorizontal: 10 },
});
