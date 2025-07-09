import { User } from "@clerk/nextjs/server";
import { PremiumStatus } from "@/src/types/DataTypes";
import { useUserTripsContext } from "@/src/context/UserTripsContext";

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

export async function getUserPremiumStatus(user) {
    if (isPremiumUser(user)) {
        return PremiumStatus.PREMIUM;
    } else if (isTrialUser(user)) {
        return PremiumStatus.TRIAL;
    } else {
        return PremiumStatus.FREE;
    }
}

