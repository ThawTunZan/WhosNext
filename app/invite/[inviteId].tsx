// app/invite/[inviteId].tsx
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { useUser } from "@clerk/clerk-expo";
import { acceptInvite } from "@/src/screens/Invite/utilities/InviteUtilities";
import { Alert, View, ActivityIndicator } from "react-native";

export default function InviteHandler() {
  const params = useLocalSearchParams<{ inviteId: string; mockUserId: string }>();
  const inviteId = params.inviteId;
  const mockUserId = params.mockUserId; // Get mockUserId from URL if present
  const { isSignedIn, isLoaded, user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded || !inviteId) return;

    if (!isSignedIn) {
      // Include mockUserId in redirect if present
      const redirectPath = mockUserId 
        ? `/auth/sign-in?redirect_to=/invite/${inviteId}/claim/${mockUserId}`
        : `/auth/sign-in?redirect_to=/invite/${inviteId}`;
      router.push(redirectPath);
      return;
    }

    const processInvite = async () => {
      try {
        const result = await acceptInvite(
          inviteId,
          { 
            name: user.fullName || user.username || user.primaryEmailAddress?.emailAddress || 'Unknown User'
          },
          mockUserId
        );
        
        // Navigate to trip page with a query param to show the choose modal if needed
        router.push(result.shouldShowChooseModal 
          ? `/trip/${result.tripId}?showChooseModal=true` 
          : `/trip/${result.tripId}`
        );
      } catch (err) {
        console.error("Invite processing error:", err);
        Alert.alert(
          "Error", 
          mockUserId 
            ? "Failed to claim this profile. The invite might be invalid or the profile has already been claimed."
            : "Invalid or expired invite link."
        );
        router.push("/");
      }
    };

    processInvite();
  }, [inviteId, mockUserId, isSignedIn, isLoaded]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
