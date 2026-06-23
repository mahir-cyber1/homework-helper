import { getPowerEventState } from "../../../lib/powerEvent";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(getPowerEventState());
}
