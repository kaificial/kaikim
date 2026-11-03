import NotesClient from "./NotesClient";
import { getMediaEntries, LETTERBOXD_PROFILE } from "../../lib/letterboxd";
import { withSpineColors } from "../../lib/spineColors";

export default async function NotesPage() {
    const media = await withSpineColors(await getMediaEntries());
    return <NotesClient media={media} letterboxdProfile={LETTERBOXD_PROFILE} />;
}
