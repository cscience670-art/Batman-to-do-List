import { Slot } from "expo-router";
import { ImageBackground, StyleSheet, View } from "react-native";

export default function RootLayout() {
  return (
    <View style={{ flex: 1 }}>
      <ImageBackground
        source={require("../img/batman5.jpg")}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <Slot />
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
});
