// Shares a makan spot via the Web Share API, falling back to a clipboard copy.
// Returns true when the text was copied to the clipboard (so callers can show
// a confirmation), false when the native share sheet was used instead or the
// user cancelled it.
export async function shareMakanSpot(spot) {
  const mapsLink = spot.lat != null && spot.lng != null
    ? `https://www.google.com/maps?q=${spot.lat},${spot.lng}`
    : '';
  const text = [`${spot.name} — ${spot.location}`, spot.specialty, mapsLink]
    .filter(Boolean)
    .join('\n');

  if (navigator.share) {
    try {
      await navigator.share({ title: spot.name, text });
    } catch (err) {
      // User cancelled the share sheet; nothing to do.
    }
    return false;
  }

  await navigator.clipboard.writeText(text);
  return true;
}
