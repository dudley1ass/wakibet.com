import type { SessionUser } from "../App";
import HostPersonaPanel from "./HostPersonaPanel";
import "./app-floating-corner.css";

export default function AppFloatingCorner({ user, path }: { user: SessionUser; path: string }) {
  if (path === "/") {
    return null;
  }

  return (
    <div className="app-float-corner" aria-label="Session host">
      <HostPersonaPanel user={user} path={path} layout="floating" />
    </div>
  );
}
