import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCollection } from "@/lib/mongodb";
import { Workout, ExerciseLog } from "@/types";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid workout ID" },
        { status: 400 }
      );
    }

    const workoutsCollection = await getCollection<Workout>("workouts");
    const workout = await workoutsCollection.findOne({
      _id: new ObjectId(id),
      userId: new ObjectId(session.user.id),
    });

    if (!workout) {
      return NextResponse.json(
        { success: false, error: "Workout not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: workout._id.toString(),
        date: workout.date.toISOString(),
        phase: workout.phase,
        week: workout.week,
        session: workout.session,
        isDeload: workout.isDeload,
        exercises: workout.exercises,
        notes: workout.notes,
        duration: workout.duration,
        createdAt: workout.createdAt.toISOString(),
        updatedAt: workout.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching workout:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid workout ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { exercises, notes, duration } = body as {
      exercises?: ExerciseLog[];
      notes?: string;
      duration?: number;
    };

    const workoutsCollection = await getCollection<Workout>("workouts");

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (exercises !== undefined) updateData.exercises = exercises;
    if (notes !== undefined) updateData.notes = notes;
    if (duration !== undefined) updateData.duration = duration;

    const result = await workoutsCollection.findOneAndUpdate(
      {
        _id: new ObjectId(id),
        userId: new ObjectId(session.user.id),
      },
      { $set: updateData },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json(
        { success: false, error: "Workout not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: result._id.toString(),
        date: result.date.toISOString(),
        phase: result.phase,
        week: result.week,
        session: result.session,
        isDeload: result.isDeload,
        exercises: result.exercises,
        notes: result.notes,
        duration: result.duration,
        createdAt: result.createdAt.toISOString(),
        updatedAt: result.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error updating workout:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid workout ID" },
        { status: 400 }
      );
    }

    const workoutsCollection = await getCollection<Workout>("workouts");
    const result = await workoutsCollection.deleteOne({
      _id: new ObjectId(id),
      userId: new ObjectId(session.user.id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Workout not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting workout:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
