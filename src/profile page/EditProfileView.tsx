// src/profile page/EditProfilePage.tsx
import React from "react"
import { View, StyleSheet, Image, TouchableOpacity } from "react-native"
import { Text, TextInput, Button, useTheme } from "react-native-paper"

interface Props {
  username: string
  avatarUrl: string
  loading: boolean
  onChangeUsername: (u: string) => void
  onPickAvatar: () => Promise<void>
  onSave: () => void
  onCancel: () => void
}

export default function EditProfileView({
  username,
  avatarUrl,
  loading,
  onChangeUsername,
  onPickAvatar,
  onSave,
  onCancel,
}: Props) {
  const theme = useTheme()
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineMedium" style={styles.heading}>
        Edit Profile
      </Text>

      <TouchableOpacity onPress={onPickAvatar}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: "#eee" }]} />
        )}
        <Text style={styles.changePhoto}>Change Photo</Text>
      </TouchableOpacity>

      <TextInput
        label="Username"
        value={username}
        onChangeText={onChangeUsername}
        mode="outlined"
        style={styles.input}
        autoCapitalize="none"
      />

      <View style={styles.buttons}>
        <Button mode="outlined" onPress={onCancel} disabled={loading} style={styles.button}>
          Cancel
        </Button>
        <Button mode="contained" onPress={onSave} loading={loading} style={styles.button}>
          Save
        </Button>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, alignItems: "center" },
  heading: { marginBottom: 20 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 8,
  },
  changePhoto: { color: "#007AFF", marginBottom: 24, textAlign: "center" },
  input: { width: "100%", marginBottom: 16 },
  buttons: { flexDirection: "row", width: "100%", justifyContent: "space-between" },
  button: { flex: 1, marginHorizontal: 4 },
})