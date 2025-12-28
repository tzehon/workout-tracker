import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCollection } from "@/lib/mongodb";
import { User, UserSettings } from "@/types";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const usersCollection = await getCollection<User>("users");
    const user = await usersCollection.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        image: user.image,
        settings: user.settings,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { settings } = body as { settings: UserSettings };

    if (!settings) {
      return NextResponse.json(
        { success: false, error: "Settings required" },
        { status: 400 }
      );
    }

    const usersCollection = await getCollection<User>("users");

    // First get the current user to merge settings
    const currentUser = await usersCollection.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const mergedSettings: UserSettings = {
      ...currentUser.settings,
      ...settings,
    };

    const result = await usersCollection.findOneAndUpdate(
      { email: session.user.email },
      {
        $set: {
          settings: mergedSettings,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: result._id.toString(),
        email: result.email,
        name: result.name,
        image: result.image,
        settings: result.settings,
        createdAt: result.createdAt.toISOString(),
        updatedAt: result.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const usersCollection = await getCollection<User>("users");

    // Delete user and all their data
    const userId = new ObjectId(session.user.id);

    // Delete workouts
    const workoutsCollection = await getCollection("workouts");
    await workoutsCollection.deleteMany({ userId });

    // Delete body metrics
    const metricsCollection = await getCollection("bodyMetrics");
    await metricsCollection.deleteMany({ userId });

    // Delete exercise progress
    const progressCollection = await getCollection("exerciseProgress");
    await progressCollection.deleteMany({ userId });

    // Delete user variants
    const variantsCollection = await getCollection("userVariants");
    await variantsCollection.deleteMany({ userId });

    // Delete user
    await usersCollection.deleteOne({ email: session.user.email });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
