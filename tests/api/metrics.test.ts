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
let testMetricId: ObjectId;

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

describe("Metrics API", () => {
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
    await db.collection("bodyMetrics").deleteMany({});
    vi.clearAllMocks();

    // Create a test metric
    testMetricId = new ObjectId();
    const now = new Date();
    await db.collection("bodyMetrics").insertOne({
      _id: testMetricId,
      userId: testUserId,
      date: now,
      weight: 75.5,
      notes: "Morning weight",
      createdAt: now,
    });
  });

  describe("GET /api/metrics", () => {
    it("returns 401 when not authenticated", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(null);

      const { GET } = await import("@/app/api/metrics/route");

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns metrics for authenticated user", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: testUserId.toString(), email: "test@example.com" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const { GET } = await import("@/app/api/metrics/route");

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].weight).toBe(75.5);
      expect(data.data[0].notes).toBe("Morning weight");
    });

    it("returns empty array when user has no metrics", async () => {
      const { getServerSession } = await import("next-auth");
      const otherUserId = new ObjectId();
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: otherUserId.toString(), email: "other@example.com" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const { GET } = await import("@/app/api/metrics/route");

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(0);
    });

    it("returns metrics sorted by date descending", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: testUserId.toString(), email: "test@example.com" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      // Add another older metric
      const db = client.db("test-workout-tracker");
      const olderDate = new Date(Date.now() - 86400000); // Yesterday
      await db.collection("bodyMetrics").insertOne({
        _id: new ObjectId(),
        userId: testUserId,
        date: olderDate,
        weight: 76.0,
        createdAt: olderDate,
      });

      const { GET } = await import("@/app/api/metrics/route");

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(2);
      // Most recent should be first
      expect(data.data[0].weight).toBe(75.5);
      expect(data.data[1].weight).toBe(76.0);
    });
  });

  describe("POST /api/metrics", () => {
    it("returns 401 when not authenticated", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(null);

      const { POST } = await import("@/app/api/metrics/route");

      const request = createNextRequest("/api/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weight: 80.0 }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it("creates a new metric entry", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: testUserId.toString(), email: "test@example.com" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const { POST } = await import("@/app/api/metrics/route");

      const request = createNextRequest("/api/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weight: 74.5,
          notes: "After workout",
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.weight).toBe(74.5);
      expect(data.data.notes).toBe("After workout");
      expect(data.data.id).toBeDefined();
    });

    it("creates metric with custom date", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: testUserId.toString(), email: "test@example.com" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const { POST } = await import("@/app/api/metrics/route");

      const customDate = new Date("2024-01-15T10:00:00Z");
      const request = createNextRequest("/api/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: customDate.toISOString(),
          weight: 73.0,
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(new Date(data.data.date).toISOString()).toBe(customDate.toISOString());
    });

    it("creates metric with only notes (no weight)", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: testUserId.toString(), email: "test@example.com" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const { POST } = await import("@/app/api/metrics/route");

      const request = createNextRequest("/api/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: "Feeling lighter today",
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.weight).toBeUndefined();
      expect(data.data.notes).toBe("Feeling lighter today");
    });
  });

  describe("DELETE /api/metrics/[id]", () => {
    it("returns 401 when not authenticated", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(null);

      const { DELETE } = await import("@/app/api/metrics/[id]/route");

      const request = createNextRequest(`/api/metrics/${testMetricId}`, {
        method: "DELETE",
      });
      const response = await DELETE(request, {
        params: Promise.resolve({ id: testMetricId.toString() }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it("returns 400 for invalid metric ID", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: testUserId.toString(), email: "test@example.com" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const { DELETE } = await import("@/app/api/metrics/[id]/route");

      const request = createNextRequest("/api/metrics/invalid-id", {
        method: "DELETE",
      });
      const response = await DELETE(request, {
        params: Promise.resolve({ id: "invalid-id" }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid ID");
    });

    it("deletes metric successfully", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: testUserId.toString(), email: "test@example.com" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const { DELETE } = await import("@/app/api/metrics/[id]/route");

      const request = createNextRequest(`/api/metrics/${testMetricId}`, {
        method: "DELETE",
      });
      const response = await DELETE(request, {
        params: Promise.resolve({ id: testMetricId.toString() }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify metric is deleted
      const db = client.db("test-workout-tracker");
      const deletedMetric = await db
        .collection("bodyMetrics")
        .findOne({ _id: testMetricId });
      expect(deletedMetric).toBeNull();
    });

    it("returns 404 when deleting non-existent metric", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: testUserId.toString(), email: "test@example.com" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const { DELETE } = await import("@/app/api/metrics/[id]/route");

      const nonExistentId = new ObjectId();
      const request = createNextRequest(`/api/metrics/${nonExistentId}`, {
        method: "DELETE",
      });
      const response = await DELETE(request, {
        params: Promise.resolve({ id: nonExistentId.toString() }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Metric not found");
    });

    it("cannot delete another user's metric", async () => {
      const { getServerSession } = await import("next-auth");
      const otherUserId = new ObjectId();
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: otherUserId.toString(), email: "other@example.com" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const { DELETE } = await import("@/app/api/metrics/[id]/route");

      const request = createNextRequest(`/api/metrics/${testMetricId}`, {
        method: "DELETE",
      });
      const response = await DELETE(request, {
        params: Promise.resolve({ id: testMetricId.toString() }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);

      // Verify metric still exists
      const db = client.db("test-workout-tracker");
      const metric = await db
        .collection("bodyMetrics")
        .findOne({ _id: testMetricId });
      expect(metric).not.toBeNull();
    });
  });
});
