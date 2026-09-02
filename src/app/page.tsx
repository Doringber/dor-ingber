import { SpatialHome } from "@/components/spatial-home";
import { buildStations } from "@/lib/stations";
import { getWorks } from "@/lib/works";
import { getWriting } from "@/lib/writing";

export default function Home() {
  const stations = buildStations(getWorks(), getWriting());

  return <SpatialHome stations={stations} />;
}
