import { User } from "@clerk/nextjs/server";
import { getUserById } from "@/src/services/FirebaseServices";
import { PremiumStatus } from "@/src/types/DataTypes";

function isPremiumUser(user: any) {
    //return user.publicMetadata.isPremium;
    return true;
}

function isFreeUser(user: any) {
    //return user.publicMetadata.isFree;
    return true;
}

function isTrialUser(user: any) {
    //return user.publicMetadata.isTrial;
    return true;
}

export async function getUserPremiumStatus(userId: string) {
    const user = await getUserById(userId);
    if (isPremiumUser(user)) {
        return PremiumStatus.PREMIUM;
    } else if (isFreeUser(user)) {
        return PremiumStatus.FREE;
    } else if (isTrialUser(user)) {
        return PremiumStatus.TRIAL;
    }
}

