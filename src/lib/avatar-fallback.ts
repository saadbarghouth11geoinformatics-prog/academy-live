// These assets are verified JPEG files in public/images/avatars. Keep this
// list explicit: tarek_momen.jpg is intentionally excluded because it is not
// an image file and would produce a broken portrait in the welcome screen.
const VERIFIED_STUDENT_AVATARS = [
  "/images/avatars/abouelghar.jpg",
  "/images/avatars/ali_farag.jpg",
  "/images/avatars/batta.jpg",
  "/images/avatars/hania_hammamy.jpg",
  "/images/avatars/jana.jpg",
  "/images/avatars/mahmoud.jpg",
  "/images/avatars/malak.jpg",
  "/images/avatars/maram.jpg",
  "/images/avatars/menna_hamed.jpg",
  "/images/avatars/mostafa_asal.jpg",
  "/images/avatars/nouran_gohar.jpg",
  "/images/avatars/nour_sherbini.jpg",
  "/images/avatars/omar.jpg",
  "/images/avatars/omar_marmoush.jpg",
  "/images/avatars/renad.jpg",
  "/images/avatars/youssef.jpg",
  "/images/avatars/ziad.jpg",
] as const;

/**
 * Gives every account the same verified local portrait when it has not yet
 * selected or uploaded one. The account id, rather than a display name, keeps
 * the assignment stable across devices and Arabic name edits.
 */
export function fallbackStudentAvatar(userId: string | null | undefined) {
  if (!userId) return null;

  let hash = 0;
  for (let index = 0; index < userId.length; index += 1) {
    hash = (hash * 31 + userId.charCodeAt(index)) >>> 0;
  }
  return VERIFIED_STUDENT_AVATARS[hash % VERIFIED_STUDENT_AVATARS.length];
}
