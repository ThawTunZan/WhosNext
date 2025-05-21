import React from "react";
import { View, Button } from "react-native";
import { useClerk } from "@clerk/clerk-expo";

export default function ChangePasswordScreen() {
  const { openUserProfile } = useClerk();

  return (
    <View style={{ padding: 20 }}>
      <Button title="Change Password" onPress={() => openUserProfile()} />
    </View>
  );
}
