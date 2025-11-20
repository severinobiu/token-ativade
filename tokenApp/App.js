import { useState, useEffect, useRef } from "react";
import { Button, Platform, View, Text, TouchableOpacity } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import * as Clipboard from "expo-clipboard";

// Configura como as notificações serão exibidas
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState("");
  const [notification, setNotification] = useState(false);

  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      setExpoPushToken(token);
    });

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Usuário clicou na notificação:", response);
      });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
        Seu Expo Push Token:
      </Text>

      <Text
        selectable
        style={{
          backgroundColor: "#eee",
          padding: 10,
          borderRadius: 6,
          marginBottom: 20,
          textAlign: "center",
        }}
      >
        {expoPushToken ? expoPushToken : "Gerando token..."}
      </Text>

      <TouchableOpacity
        onPress={() => {
          Clipboard.setStringAsync(expoPushToken);
          alert("Token copiado!");
        }}
        style={{
          backgroundColor: "#2a5d8f",
          paddingVertical: 10,
          paddingHorizontal: 20,
          borderRadius: 8,
          marginBottom: 20,
        }}
      >
        <Text style={{ color: "white", fontWeight: "bold" }}>Copiar Token</Text>
      </TouchableOpacity>

      <Button
        title="Enviar notificação local"
        onPress={async () => {
          await Notifications.scheduleNotificationAsync({
            content: { title: "Olá!", body: "Essa é uma notificação local!" },
            trigger: { seconds: 2 },
          });
        }}
      />

      <Text style={{ marginTop: 20 }}>
        Última notificação:{" "}
        {notification ? notification.request.content.body : "Nenhuma ainda"}
      </Text>
    </View>
  );
}

async function registerForPushNotificationsAsync() {
  let token;

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      alert("Permissão para notificações negada!");
      return;
    }

    token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
    alert("Você precisa testar em um dispositivo físico!");
  }

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  return token;
}
