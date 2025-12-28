import { NextResponse } from "next/server";
import { programPhases, exerciseDefinitions, weeklySchedule } from "@/lib/program-data";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      phases: programPhases,
      exercises: exerciseDefinitions,
      weeklySchedule,
    },
  });
}
