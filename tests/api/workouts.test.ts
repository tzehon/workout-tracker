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

function createNextRequest(url: string, init?: { method?: string; headers?: Record<string, string>; body?: string }): NextRequest {
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

describe("Workouts API", () => {
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
    // Clear workouts collection before each test
    const db = client.db("test-workout-tracker");
    await db.collection("workouts").deleteMany({});
    vi.clearAllMocks();
  });

  describe("GET /api/workouts", () => {
    it("returns 401 when not authenticated", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(null);

      const { GET } = await import("@/app/api/workouts/route");

      const request = createNextRequest("/api/workouts");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns empty array when no workouts exist", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: testUserId.toString(), email: "test@example.com" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const { GET } = await import("@/app/api/workouts/route");

      const request = createNextRequest("/api/workouts");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.workouts).toEqual([]);
      expect(data.data.count).toBe(0);
    });

    it("returns workouts for authenticated user", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: testUserId.toString(), email: "test@example.com" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      // Insert a test workout
      const db = client.db("test-workout-tracker");
      const now = new Date();
      await db.collection("workouts").insertOne({
        userId: testUserId,
        date: now,
        phase: 1,
        week: 1,
        session: "Push A",
        isDeload: false,
        exercises: [],
        createdAt: now,
        updatedAt: now,
      });

      const { GET } = await import("@/app/api/workouts/route");

      const request = createNextRequest("/api/workouts");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.workouts).toHaveLength(1);
      expect(data.data.workouts[0].phase).toBe(1);
      expect(data.data.workouts[0].session).toBe("Push A");
    });

    it("does not return workouts from other users", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: testUserId.toString(), email: "test@example.com" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      // Insert workout for a different user
      const db = client.db("test-workout-tracker");
      const now = new Date();
      const otherUserId = new ObjectId();
      await db.collection("workouts").insertOne({
        userId: otherUserId,
        date: now,
        phase: 1,
        week: 1,
        session: "Push A",
        isDeload: false,
        exercises: [],
        createdAt: now,
        updatedAt: now,
      });

      const { GET } = await import("@/app/api/workouts/route");

      const request = createNextRequest("/api/workouts");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.workouts).toHaveLength(0);
    });
  });

  describe("POST /api/workouts", () => {
    it("returns 401 when not authenticated", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(null);

      const { POST } = await import("@/app/api/workouts/route");

      const request = createNextRequest("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date().toISOString(),
          phase: 1,
          week: 1,
          session: "Push A",
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it("returns 400 when required fields are missing", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: testUserId.toString(), email: "test@example.com" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const { POST } = await import("@/app/api/workouts/route");

      const request = createNextRequest("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date().toISOString(),
          // Missing phase, week, session
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Missing required fields");
    });

    it("creates a workout when all fields are provided", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: testUserId.toString(), email: "test@example.com" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const { POST } = await import("@/app/api/workouts/route");

      const workoutDate = new Date().toISOString();
      const request = createNextRequest("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: workoutDate,
          phase: 2,
          week: 3,
          session: "Pull B",
          isDeload: false,
          exercises: [],
          notes: "Great workout!",
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBeDefined();
      expect(data.data.phase).toBe(2);
      expect(data.data.week).toBe(3);
      expect(data.data.session).toBe("Pull B");
      expect(data.data.notes).toBe("Great workout!");

      // Verify it was saved to the database
      const db = client.db("test-workout-tracker");
      const savedWorkout = await db.collection("workouts").findOne({
        _id: new ObjectId(data.data.id),
      });
      expect(savedWorkout).toBeTruthy();
      expect(savedWorkout?.phase).toBe(2);
    });
  });
});
