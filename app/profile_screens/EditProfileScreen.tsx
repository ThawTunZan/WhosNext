import React, { useState, useEffect } from "react";
import { Alert } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { Portal } from "react-native-paper";
import EditProfileView from "./EditProfileView";
import PasswordChangeModal from "./PasswordChangeModal";

export default function EditProfileScreen({ navigation }) {
  const { user, isLoaded } = useUser();
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // Password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Initialize once the clerk user is ready
  useEffect(() => {
    if (isLoaded && user) {
      setUsername(user.username || "");
      setAvatarUrl(user.imageUrl || "");
      setEmail(user.primaryEmailAddress?.emailAddress || "");
    }
  }, [isLoaded, user]);

  // Don't render until clerk is ready
  if (!isLoaded) return null;

  const onSave = async () => {
    setLoading(true);
    try {
      await user.update({ username /*, imageUrl: avatarUrl*/ });
      Alert.alert("Profile updated!");
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
    setLoading(false);
  };

  const onPickAvatar = async () => {
    // Implement image picker logic here, then:
    // setAvatarUrl(newUrl);
  };

  const onChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await user.updatePassword({ newPassword });
      Alert.alert("Password updated!");
      setShowPasswordModal(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
    setLoading(false);
  };

  return (
    <>
      <EditProfileView
        username={username}
        email={email}
        avatarUrl={avatarUrl}
        loading={loading}
        onChangeUsername={() => {}}
        onPickAvatar={onPickAvatar}
        onSave={onSave}
        onCancel={() => navigation.goBack()}
        onChangePassword={() => setShowPasswordModal(true)}
      />

      <Portal>
        <PasswordChangeModal
          visible={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          onChangePassword={onChangePassword}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          loading={loading}
        />
      </Portal>
    </>
  );
}
