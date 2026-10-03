export const MAX_FILE_BYTES = 15 * 1024 * 1024;

export const ALLOWED_EXTENSIONS = ["pdf", "docx", "pptx", "png", "jpg", "jpeg"] as const;

export const CATEGORIES = [
  "بدون تصنيف",
  "الدروس والتدريب",
  "الأنشطة التعليمية",
  "المبادرات والمشاريع",
  "الفعاليات والمناسبات",
  "أعمال الطلبة",
  "التطوير المهني",
  "الإنجازات والتكريم",
  "الشراكة المجتمعية",
  "تحليل الورقة الامتحانية (المستويات)",
  "تبادل الزيارات بين المعلمات",
  "ملف الإنجاز لإجادة",
] as const;

export const CATEGORY_EMOJI: Record<string, string> = {
  "بدون تصنيف": "🗂️",
  "الدروس والتدريب": "📖",
  "الأنشطة التعليمية": "🎯",
  "المبادرات والمشاريع": "🌸",
  "الفعاليات والمناسبات": "🎉",
  "أعمال الطلبة": "🎨",
  "التطوير المهني": "👩‍🏫",
  "الإنجازات والتكريم": "🏆",
  "الشراكة المجتمعية": "🤝",
  "تحليل الورقة الامتحانية (المستويات)": "📊",
  "تبادل الزيارات بين المعلمات": "🔁",
  "ملف الإنجاز لإجادة": "🌷",
};

export function categoryEmoji(name: string | null | undefined): string {
  return (name && CATEGORY_EMOJI[name]) || "🗂️";
}

export const SUBJECTS = [
  "الرياضيات",
  "اللغة العربية",
  "العلوم",
  "اللغة الإنجليزية",
  "الدراسات الاجتماعية",
  "التربية الإسلامية",
  "تقنية المعلومات",
  "التربية الفنية",
  "التربية الموسيقية",
  "الرياضة المدرسية",
  "المهارات الحياتية",
] as const;

export const GRADES = [
  "الصف الأول",
  "الصف الثاني",
  "الصف الثالث",
  "الصف الرابع",
  "الصف الخامس",
  "الصف السادس",
  "الصف السابع",
  "الصف الثامن",
  "الصف التاسع",
  "الصف العاشر",
  "الصف الحادي عشر",
  "الصف الثاني عشر",
] as const;

export const EXT_COLOR: Record<string, string> = {
  pdf: "bg-coral",
  docx: "bg-blue",
  pptx: "bg-amber",
  png: "bg-grape",
  jpg: "bg-teal",
  jpeg: "bg-teal",
  link: "bg-ink",
};

export const EXT_SHADOW: Record<string, string> = {
  pdf: "pop-coral",
  docx: "pop-blue",
  pptx: "pop-amber",
  png: "pop-ink",
  jpg: "pop-teal",
  jpeg: "pop-teal",
  link: "pop-ink",
};

export function formatSize(bytes: number | null | undefined): string {
  if (!bytes) return "—";
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return `${Math.round(bytes / 1024)} ك.ب`;
  return `${mb.toFixed(1)} م.ب`;
}
