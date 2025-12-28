import { MongoClient, ObjectId } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
const SEED_USER_EMAIL = process.env.SEED_USER_EMAIL;

async function main() {
  if (!MONGODB_URI) {
    console.error("Error: MONGODB_URI environment variable is required");
    process.exit(1);
  }

  if (!SEED_USER_EMAIL) {
    console.error("Error: SEED_USER_EMAIL environment variable is required");
    console.error("Set it to the email of the user to delete seed data for:");
    console.error("  SEED_USER_EMAIL=your@email.com npm run seed:delete");
    process.exit(1);
  }

  console.log(`\nDeleting seed data for user: ${SEED_USER_EMAIL}\n`);

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db("workout-tracker");

    // Find user
    const user = await db.collection("users").findOne({ email: SEED_USER_EMAIL });
    if (!user) {
      console.error(`Error: User with email "${SEED_USER_EMAIL}" not found`);
      process.exit(1);
    }

    const userId = user._id as ObjectId;
    console.log(`Found user: ${user.name} (${user.email})`);

    // Delete seed data
    const deleteWorkouts = await db.collection("workouts").deleteMany({ userId, isSeed: true });
    const deleteMetrics = await db.collection("bodyMetrics").deleteMany({ userId, isSeed: true });

    // Reset user settings to Phase 1, Week 1
    await db.collection("users").updateOne(
      { _id: userId },
      {
        $set: {
          "settings.currentPhase": 1,
          "settings.currentWeek": 1,
          updatedAt: new Date(),
        },
      }
    );

    console.log(`\n✓ Deleted seed data:`);
    console.log(`  - ${deleteWorkouts.deletedCount} workouts`);
    console.log(`  - ${deleteMetrics.deletedCount} body metrics`);
    console.log(`  - Reset user to Phase 1, Week 1`);

    if (deleteWorkouts.deletedCount === 0 && deleteMetrics.deletedCount === 0) {
      console.log(`\nNo seed data found. Run "npm run seed" first to create some.`);
    }

  } finally {
    await client.close();
  }
}

main().catch(console.error);
