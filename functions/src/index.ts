// functions/src/index.ts
import * as functions from "firebase-functions";
import { Request, Response } from "express";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { onRequest } from "firebase-functions/https";

initializeApp();

export type TripsTableDDB = {
  tripId: string;
  destinationName: string;
  currency: string;
  createdBy: string;
  debts: string[];
  isTripPremium: boolean;
  totalAmtLeft: number;
  totalBudget: number;
  createdAt: string;
  updatedAt: string;
  startDate?: string;
  endDate?: string;
  members: string[];
};

// ---------- Create Trip ----------
export const createTrip = functions.https.onRequest(
  async (req: Request, res: Response) => {
    try {
      res.set("Access-Control-Allow-Origin", "*");
      if (req.method === "OPTIONS") {
        res.set("Access-Control-Allow-Headers", "content-type, authorization");
        res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
        res.status(204).send("");
        return;
      }

      if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
      }

      const body = req.body as Partial<TripsTableDDB>;

      if (!body.tripId || !body.destinationName || !body.currency || !body.createdBy) {
        res.status(400).send("Missing required fields");
        return;
      }

      const db = getFirestore();
      const tripId = body.tripId;

      // Trip payload
      const tripPayload = {
        tripId,
        destinationName: body.destinationName,
        currency: body.currency,
        createdBy: body.createdBy,
        debts: Array.isArray(body.debts) ? body.debts : [],
        isTripPremium: !!body.isTripPremium,
        totalAmtLeft: typeof body.totalAmtLeft === "number" ? body.totalAmtLeft : 0,
        totalBudget: typeof body.totalBudget === "number" ? body.totalBudget : 0,
        startDate: body.startDate ?? null,
        endDate: body.endDate ?? null,
        members: [],
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      // Write trip doc
      await db.collection("trips").doc(tripId).set(tripPayload);

      // Initialize empty members + expenses docs
      await db.collection("members").doc(tripId).set({ tripId, members: {} });
      await db.collection("expenses").doc(tripId).set({ tripId, expenses: {} });

      res.status(201).json({ message: "Trip created successfully", tripId });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Internal error" });
    }
  }
);

// ---------- Add Member ----------
// ---------- Add Member (Option A: map-based storage) ----------
export const addMember = functions.https.onRequest(async (req: Request, res: Response) => {
  try {
    res.set("Access-Control-Allow-Origin", "*");
    if (req.method === "OPTIONS") {
      res.set("Access-Control-Allow-Headers", "content-type, authorization");
      res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const {
      tripId,
      userId,
      username,
      budget,
      amtLeft,
      currency,
      owesTotalMap = {},
      addMemberType,
      receiptsCount = 0,
    } = req.body;

    if (!tripId || !userId || !username || !budget || !currency) {
      res.status(400).send("Missing required fields");
      return;
    }

    const db = getFirestore();

    // Member payload
    const memberPayload = {
      userId,
      username,
      amtLeft: amtLeft ?? budget,
      budget,
      currency,
      owesTotalMap,
      addMemberType: addMemberType ?? "friends",
      receiptsCount,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    // ✅ Update members/{tripId} doc (no subcollection!)
    await db.collection("members").doc(tripId).set(
      {
        members: {
          [userId]: memberPayload, // merge into the nested map
        },
      },
      { merge: true } // important: don’t overwrite other members
    );

    // Also update the trip doc’s members array
    await db.collection("trips").doc(tripId).update({
      members: FieldValue.arrayUnion(userId),
      updatedAt: FieldValue.serverTimestamp(),
    });

    res.status(201).json({ message: "Member added successfully", tripId, userId });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal error" });
  }
});


export const updateUserTrips = onRequest(async (req, res) => {
  try {
    const { userId, tripId } = req.body;
    const db = getFirestore();

    await db.collection("users").doc(userId).update({
      trips: FieldValue.arrayUnion(tripId),
    });

    res.json({ message: "User trips updated", userId, tripId });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to update user trips");
  }
});
