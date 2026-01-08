import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCollection } from "@/lib/mongodb";
import { Workout, ExerciseLog } from "@/types";
import { ObjectId } from "mongodb";
import { getStartOfWeek, getEndOfWeek } from "@/lib/date-utils";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10");
    const thisWeek = searchParams.get("thisWeek") === "true";
    const phase = searchParams.get("phase");
    const week = searchParams.get("week");
    const sessionType = searchParams.get("session");

    const workoutsCollection = await getCollection<Workout>("workouts");
    const userId = new ObjectId(session.user.id);

    const query: Record<string, unknown> = { userId };

    if (thisWeek) {
      const now = new Date();
      const startOfWeek = getStartOfWeek(now);
      const endOfWeek = getEndOfWeek(now);
      query.date = { $gte: startOfWeek, $lte: endOfWeek };
    }

    if (phase) {
      query.phase = parseInt(phase);
    }

    if (week) {
      query.week = parseInt(week);
    }

    if (sessionType) {
      query.session = sessionType;
    }

    const workouts = await workoutsCollection
      .find(query)
      .sort({ date: -1 })
      .limit(limit)
      .toArray();

    const clientWorkouts = workouts.map((w) => ({
      id: w._id.toString(),
      date: w.date.toISOString(),
      phase: w.phase,
      week: w.week,
      session: w.session,
      isDeload: w.isDeload,
      exercises: w.exercises,
      notes: w.notes,
      duration: w.duration,
      createdAt: w.createdAt.toISOString(),
      updatedAt: w.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        workouts: clientWorkouts,
        count: clientWorkouts.length,
      },
    });
  } catch (error) {
    console.error("Error fetching workouts:", error);
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
    const {
      date,
      phase,
      week,
      session: workoutSession,
      isDeload = false,
      exercises = [],
      notes,
      duration,
    } = body as {
      date: string;
      phase: number;
      week: number;
      session: string;
      isDeload?: boolean;
      exercises?: ExerciseLog[];
      notes?: string;
      duration?: number;
    };

    if (!date || !phase || !week || !workoutSession) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const workoutsCollection = await getCollection<Workout>("workouts");
    const now = new Date();

    const workout: Omit<Workout, "_id"> = {
      userId: new ObjectId(session.user.id),
      date: new Date(date),
      phase: phase as 1 | 2 | 3,
      week: week as 1 | 2 | 3 | 4 | 5 | 6,
      session: workoutSession as Workout["session"],
      isDeload,
      exercises,
      notes,
      duration,
      createdAt: now,
      updatedAt: now,
    };

    const result = await workoutsCollection.insertOne(workout as Workout);

    return NextResponse.json({
      success: true,
      data: {
        id: result.insertedId.toString(),
        ...workout,
        date: workout.date.toISOString(),
        createdAt: workout.createdAt.toISOString(),
        updatedAt: workout.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error creating workout:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
