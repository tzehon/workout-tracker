import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCollection } from "@/lib/mongodb";
import { BodyMetrics } from "@/types";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const metricsCollection = await getCollection<BodyMetrics>("bodyMetrics");
    const userId = new ObjectId(session.user.id);

    const metrics = await metricsCollection
      .find({ userId })
      .sort({ date: -1 })
      .limit(100)
      .toArray();

    const clientMetrics = metrics.map((m) => ({
      id: m._id.toString(),
      date: m.date.toISOString(),
      weight: m.weight,
      measurements: m.measurements,
      notes: m.notes,
      createdAt: m.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: clientMetrics,
    });
  } catch (error) {
    console.error("Error fetching metrics:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { date, weight, measurements, notes } = body;

    const metricsCollection = await getCollection<BodyMetrics>("bodyMetrics");

    const metric: Omit<BodyMetrics, "_id"> = {
      userId: new ObjectId(session.user.id),
      date: new Date(date || Date.now()),
      weight,
      measurements,
      notes,
      createdAt: new Date(),
    };

    const result = await metricsCollection.insertOne(metric as BodyMetrics);

    return NextResponse.json({
      success: true,
      data: {
        id: result.insertedId.toString(),
        ...metric,
        date: metric.date.toISOString(),
        createdAt: metric.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error creating metrics:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
