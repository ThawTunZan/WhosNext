// src/profile page/EditProfileView.tsx
// Strictly the UI
import React from "react"
import { View, StyleSheet, Image, TouchableOpacity, Button } from "react-native"
import { Text, TextInput, useTheme } from "react-native-paper"

interface Props {
  username: string
  avatarUrl: string
  loading: boolean
  onChangeUsername: (u: string) => void
  onPickAvatar: () => Promise<void>
  onSave: () => void
  onCancel: () => void
  onChangePassword: () => void
}

export default function EditProfileView({
  username,
  avatarUrl,
  loading,
  onChangeUsername,
  onPickAvatar,
  onSave,
  onCancel,
  onChangePassword,
}: Props) {
  const theme = useTheme()
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineMedium" style={[styles.heading, { color: theme.colors.onBackground }]}>
        Edit Profile
      </Text>

      <TouchableOpacity onPress={onPickAvatar} style={styles.avatarContainer}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: theme.colors.elevation.level2 }]} />
        )}
        <Text style={[styles.changePhoto, { color: theme.colors.primary }]}>Change Photo</Text>
      </TouchableOpacity>

      <TextInput
        label="Username"
        value={username}
        onChangeText={onChangeUsername}
        mode="outlined"
        style={styles.input}
        autoCapitalize="none"
        theme={{ colors: { text: theme.colors.onSurface, background: theme.colors.surface } }}
      />

      <View style={styles.buttons}>
        <View style={{ flex: 1, marginRight: 4 }}>
          <Button title="Cancel" onPress={onCancel} disabled={loading} />
        </View>
        <View style={{ flex: 1, marginLeft: 4 }}>
          <Button title="Save" onPress={onSave} disabled={loading} />
        </View>
      </View>
      <View style={{ marginTop: 16 }}>
        <Button title="Change Password" onPress={onChangePassword} disabled={loading} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "flex-start" },
  heading: { marginBottom: 20, alignSelf: "center" },
  avatarContainer: { alignItems: "center", marginBottom: 16 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    marginBottom: 8,
  },
  changePhoto: { marginBottom: 24, textAlign: "center" },
  input: { width: "100%", marginBottom: 16 },
  buttons: { flexDirection: "row", width: "100%", justifyContent: "space-between" },
  button: { flex: 1, marginHorizontal: 4 },
})