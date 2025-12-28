import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient, ObjectId } from "mongodb";
import { NextRequest } from "next/server";

// Mock NextAuth before importing the route
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

let mongod: MongoMemoryServer;
let client: MongoClient;
let testUserId: ObjectId;
let testWorkoutId: ObjectId;

function createNextRequest(
  url: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string }
): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), init);
}

// Mock the mongodb module
vi.mock("@/lib/mongodb", async () => {
  return {
    getCollection: vi.fn(async (name: string) => {
      const db = client.db("test-workout-tracker");
      return db.collection(name);
    }),
    getDatabase: vi.fn(async () => {
      return client.db("test-workout-tracker");
    }),
  };
});

describe("Workouts [id] API", () => {
  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    client = new MongoClient(uri);
    await client.connect();
    testUserId = new ObjectId();
  });

  afterAll(async () => {
    await client.close();
    await mongod.stop();
  });

  beforeEach(async () => {
    const db = client.db("test-workout-tracker");
    await db.collection("workouts").deleteMany({});
    vi.clearAllMocks();

    // Create a test workout
    testWorkoutId = new ObjectId();
    const now = new Date();
    await db.collection("workouts").insertOne({
      _id: testWorkoutId,
      userId: testUserId,
      date: now,
      phase: 1,
      week: 2,
      session: "Push 1",
      isDeload: false,
      exercises: [
        {
          letter: "A1",
          exerciseName: "Ring Dip",
          progression: { variant: "Band assisted" },
          sets: [
            { setNumber: 1, reps: 6, completed: true },
            { setNumber: 2, reps: 5, completed: true },
          ],
        },
      ],
      notes: "Good workout",
      duration: 45,
      createdAt: now,
      updatedAt: now,
    });
  });

  describe("GET /api/workouts/[id]", () => {
    it("returns 401 when not authenticated", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(null);

      const { GET } = await import("@/app/api/workouts/[id]/route");

      const request = createNextRequest(`/api/workouts/${testWorkoutId}`);
      const response = await GET(request, {
        params: Promise.resolve({ id: testWorkoutId.toString() }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 400 for invalid workout ID", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: testUserId.toString(), email: "test@example.com" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const { GET } = await import("@/app/api/workouts/[id]/route");

      const request = createNextRequest("/api/workouts/invalid-id");
      const response = await GET(request, {
        params: Promise.resolve({ id: "invalid-id" }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid workout ID");
    });

    it("returns 404 when workout not found", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: testUserId.toString(), email: "test@example.com" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const { GET } = await import("@/app/api/workouts/[id]/route");

      const nonExistentId = new ObjectId();
      const request = createNextRequest(`/api/workouts/${nonExistentId}`);
      const response = await GET(request, {
        params: Promise.resolve({ id: nonExistentId.toString() }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Workout not found");
    });

    it("returns workout data for authenticated user", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: testUserId.toString(), email: "test@example.com" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const { GET } = await import("@/app/api/workouts/[id]/route");

      const request = createNextRequest(`/api/workouts/${testWorkoutId}`);
      const response = await GET(request, {
        params: Promise.resolve({ id: testWorkoutId.toString() }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(testWorkoutId.toString());
      expect(data.data.session).toBe("Push 1");
      expect(data.data.phase).toBe(1);
      expect(data.data.week).toBe(2);
      expect(data.data.exercises).toHaveLength(1);
      expect(data.data.exercises[0].exerciseName).toBe("Ring Dip");
      expect(data.data.notes).toBe("Good workout");
    });

    it("does not return workout from another user", async () => {
      const { getServerSession } = await import("next-auth");
      const otherUserId = new ObjectId();
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: otherUserId.toString(), email: "other@example.com" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const { GET } = await import("@/app/api/workouts/[id]/route");

      const request = createNextRequest(`/api/workouts/${testWorkoutId}`);
      const response = await GET(request, {
        params: Promise.resolve({ id: testWorkoutId.toString() }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });
  });

  describe("PUT /api/workouts/[id]", () => {
    it("returns 401 when not authenticated", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(null);

      const { PUT } = await import("@/app/api/workouts/[id]/route");

      const request = createNextRequest(`/api/workouts/${testWorkoutId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "Updated notes" }),
      });
      const response = await PUT(request, {
        params: Promise.resolve({ id: testWorkoutId.toString() }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it("updates workout notes", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: testUserId.toString(), email: "test@example.com" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const { PUT } = await import("@/app/api/workouts/[id]/route");

      const request = createNextRequest(`/api/workouts/${testWorkoutId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "Updated notes" }),
      });
      const response = await PUT(request, {
        params: Promise.resolve({ id: testWorkoutId.toString() }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.notes).toBe("Updated notes");
    });

    it("updates workout duration", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: testUserId.toString(), email: "test@example.com" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const { PUT } = await import("@/app/api/workouts/[id]/route");

      const request = createNextRequest(`/api/workouts/${testWorkoutId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duration: 60 }),
      });
      const response = await PUT(request, {
        params: Promise.resolve({ id: testWorkoutId.toString() }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.duration).toBe(60);
    });

    it("updates workout exercises", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: testUserId.toString(), email: "test@example.com" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const { PUT } = await import("@/app/api/workouts/[id]/route");

      const newExercises = [
        {
          letter: "A1",
          exerciseName: "Ring Dip",
          progression: { variant: "Full ROM" },
          sets: [
            { setNumber: 1, reps: 8, completed: true },
            { setNumber: 2, reps: 7, completed: true },
            { setNumber: 3, reps: 6, completed: true },
          ],
        },
      ];

      const request = createNextRequest(`/api/workouts/${testWorkoutId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exercises: newExercises }),
      });
      const response = await PUT(request, {
        params: Promise.resolve({ id: testWorkoutId.toString() }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.exercises).toHaveLength(1);
      expect(data.data.exercises[0].sets).toHaveLength(3);
      expect(data.data.exercises[0].progression.variant).toBe("Full ROM");
    });

    it("returns 404 when updating non-existent workout", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: testUserId.toString(), email: "test@example.com" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const { PUT } = await import("@/app/api/workouts/[id]/route");

      const nonExistentId = new ObjectId();
      const request = createNextRequest(`/api/workouts/${nonExistentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "Updated" }),
      });
      const response = await PUT(request, {
        params: Promise.resolve({ id: nonExistentId.toString() }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });
  });

  describe("DELETE /api/workouts/[id]", () => {
    it("returns 401 when not authenticated", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(null);

      const { DELETE } = await import("@/app/api/workouts/[id]/route");

      const request = createNextRequest(`/api/workouts/${testWorkoutId}`, {
        method: "DELETE",
      });
      const response = await DELETE(request, {
        params: Promise.resolve({ id: testWorkoutId.toString() }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it("deletes workout successfully", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: testUserId.toString(), email: "test@example.com" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const { DELETE } = await import("@/app/api/workouts/[id]/route");

      const request = createNextRequest(`/api/workouts/${testWorkoutId}`, {
        method: "DELETE",
      });
      const response = await DELETE(request, {
        params: Promise.resolve({ id: testWorkoutId.toString() }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify workout is deleted
      const db = client.db("test-workout-tracker");
      const deletedWorkout = await db
        .collection("workouts")
        .findOne({ _id: testWorkoutId });
      expect(deletedWorkout).toBeNull();
    });

    it("returns 404 when deleting non-existent workout", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: testUserId.toString(), email: "test@example.com" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const { DELETE } = await import("@/app/api/workouts/[id]/route");

      const nonExistentId = new ObjectId();
      const request = createNextRequest(`/api/workouts/${nonExistentId}`, {
        method: "DELETE",
      });
      const response = await DELETE(request, {
        params: Promise.resolve({ id: nonExistentId.toString() }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });

    it("cannot delete another user's workout", async () => {
      const { getServerSession } = await import("next-auth");
      const otherUserId = new ObjectId();
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: otherUserId.toString(), email: "other@example.com" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const { DELETE } = await import("@/app/api/workouts/[id]/route");

      const request = createNextRequest(`/api/workouts/${testWorkoutId}`, {
        method: "DELETE",
      });
      const response = await DELETE(request, {
        params: Promise.resolve({ id: testWorkoutId.toString() }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);

      // Verify workout still exists
      const db = client.db("test-workout-tracker");
      const workout = await db
        .collection("workouts")
        .findOne({ _id: testWorkoutId });
      expect(workout).not.toBeNull();
    });
  });
});
