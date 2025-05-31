// app/invite/[inviteId].tsx
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { useUser } from "@clerk/clerk-expo";
import { addMemberToTrip } from "@/src/utilities/TripUtilities";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { Alert, View, ActivityIndicator } from "react-native";

export default function InviteHandler() {
  const { inviteId } = useLocalSearchParams<{ inviteId: string }>();
  const { isSignedIn, isLoaded, user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded || !inviteId) return;

    if (!isSignedIn) {
      router.push(`/auth/sign-in?redirect_to=/invite/${inviteId}`);
      return;
    }

    const processInvite = async () => {
      try {
        const inviteRef = doc(db, "invites", inviteId);
        const inviteSnap = await getDoc(inviteRef);

        if (!inviteSnap.exists()) {
          Alert.alert("Invalid Invite", "This invite link is no longer valid.");
          router.push("/"); // Go back to home or show a fallback
          return;
        }

        const { tripId } = inviteSnap.data();
        await addMemberToTrip(tripId, user.id, { 
          skipIfExists: true,
          sendNotifications: false 
        });
        router.push(`/trip/${tripId}`);
      } catch (err) {
        console.error("Invite processing error:", err);
        Alert.alert("Error", "Something went wrong. Please try again.");
        router.push("/");
      }
    };

    processInvite();
  }, [inviteId, isSignedIn, isLoaded]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
