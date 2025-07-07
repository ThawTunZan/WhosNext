import React from "react";
import { Modal, View, StyleSheet, useWindowDimensions, Button, ActivityIndicator, Text, TextInput } from "react-native";

export default function PasswordChangeModal({
  visible,
  onClose,
  onChangePassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  loading,
}) {
  const { width } = useWindowDimensions();
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View
          style={[
            styles.modal,
            {
              width: width * 0.9,
            },
          ]}
        >
          <Text style={styles.title}>Change Password</Text>
          <TextInput
            placeholder="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            style={styles.input}
            autoCapitalize="none"
          />
          <TextInput
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            style={styles.input}
            autoCapitalize="none"
          />
          {loading && <ActivityIndicator style={{ marginBottom: 16 }} />}
          <View style={styles.buttonRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Button title="Cancel" onPress={onClose} disabled={loading} />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Button title="Save" onPress={onChangePassword} disabled={loading} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", alignItems: "center" },
  modal: {
    borderRadius: 12,
    padding: 24,
    paddingBottom: 40,
    borderWidth: 1,
    minHeight: 280,
    justifyContent: "center",
    backgroundColor: "#222", // fallback for dark mode
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#fff",
    textAlign: "center",
  },
  input: {
    backgroundColor: "#333",
    color: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#444",
  },
  buttonRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
});
