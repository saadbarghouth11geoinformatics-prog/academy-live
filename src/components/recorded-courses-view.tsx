import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  AlertCircle,
  Award,
  BookOpen,
  Bookmark,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Copy,
  Download,
  ExternalLink,
  FileCheck,
  FileText,
  Filter,
  GraduationCap,
  HelpCircle,
  Layers,
  Lightbulb,
  ListVideo,
  Lock,
  Maximize2,
  MessageSquare,
  Pause,
  Play,
  Plus,
  Printer,
  RotateCcw,
  RotateCw,
  Search,
  Send,
  Settings,
  Share2,
  SlidersHorizontal,
  Star,
  ThumbsUp,
  Trash2,
  Trophy,
  Users,
  Video,
  Volume2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";

export type CourseItemType = "video" | "reading" | "quiz" | "exam";

export interface CourseItem {
  id: string;
  unitId: string;
  type: CourseItemType;
  title: string;
  durationOrEstimate: string;
  videoUrl?: string;
  videoPoster?: string;
  completed: boolean;
  pdfTitle?: string;
  pdfSize?: string;
  objectives?: string[];
  keyPoints?: string[];
  readingContent?: {
    introduction: string;
    sections: {
      heading: string;
      body: string;
      examples?: { label: string; text: string; breakdown?: string }[];
      warningNotice?: string;
      table?: { headers: string[]; rows: string[][] };
    }[];
    summary: string;
  };
  quizQuestions?: {
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
}

export interface Unit {
  id: string;
  unitNumber: number;
  title: string;
  description: string;
  badge: string;
  color: string;
  items: CourseItem[];
}

function getYouTubeEmbedUrl(videoUrl?: string): string | null {
  if (!videoUrl) return null;
  try {
    const url = new URL(videoUrl);
    const isYouTube = ["youtube.com", "www.youtube.com", "m.youtube.com"].includes(url.hostname);
    const videoId = isYouTube
      ? url.pathname.startsWith("/embed/")
        ? url.pathname.split("/")[2]
        : url.searchParams.get("v")
      : url.hostname === "youtu.be"
        ? url.pathname.slice(1)
        : null;
    return videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)
      ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`
      : null;
  } catch {
    return null;
  }
}

export const COURSE_UNITS: Unit[] = [
  {
    id: "unit-1",
    unitNumber: 1,
    title: "الوحدة الأولى: قواعد النحو والإعراب الشامل",
    description:
      "البناء والإعراب، الأسماء الخمسة، كان وكاد وأخواتها، إعمال المشتقات، والمصادر الصريحة والمؤولة",
    badge: "نحو وتطبيقات",
    color: "#2563eb",
    items: [
      {
        id: "u1-v1",
        unitId: "unit-1",
        type: "video",
        title: "علامات الإعراب الأصلية والفرعية والأسماء الخمسة",
        durationOrEstimate: "42 دقيقة",
        videoUrl: "https://www.youtube.com/watch?v=O-JkUYmoixU",
        videoPoster: "/images/teacher-celebration.png",
        completed: true,
        pdfTitle: "مذكرة علامات الإعراب الشاملة - الأستاذ عبيدة.pdf",
        pdfSize: "3.4 ميجابايت",
        objectives: [
          "التمييز بين الحركات الأصلية (الضمة، الفتحة، الكسرة) والحركات المقدرة والفرعية.",
          "شروط إعراب الأسماء الخمسة بالحروف وإعراب ذو وفو بدقة.",
          "تطبيقات نماذج امتحانات الثانوية العامة للأعوام السابقة.",
        ],
        keyPoints: [
          "الأسماء الخمسة ترفع بالواو وتنصب بالألف وتجر بالياء بشرط إفرادها وإضافتها لغير ياء المتكلم.",
          "الممنوع من الصرف يجر بالفتحة نيابة عن الكسرة إذا جرد من أل والإضافة.",
          "جمع المؤنث السالم ينصب بالكسرة نيابة عن الفتحة وتعد علامة فرعية في حالة النصب فقط.",
        ],
      },
      {
        id: "u1-r1",
        unitId: "unit-1",
        type: "reading",
        title: "مستند وثائقي: الدليل الإعرابي الشامل لعلامات الأسماء والأفعال والممنوع من الصرف",
        durationOrEstimate: "قراءة 12 دقيقة",
        completed: true,
        pdfTitle: "الدليل الإعرابي المطبوع - نسخة المنصة الرسمية.pdf",
        pdfSize: "4.8 ميجابايت",
        readingContent: {
          introduction:
            "الإعراب هو الأثر الظاهر أو المقدر الذي يجلبه العامل في آخر الكلمة العربية. وتنقسم علامات الإعراب في لغة الضاد إلى علامات أصلية تمثل القاعدة العامة، وعلامات فرعية تنوب عن الأصلية في سبعة أبواب مخصوصة.",
          sections: [
            {
              heading: "أولاً: منظومة الحركات الأصلية والفرعية",
              body: "الحركات الأصلية أربع: الضمة للرفع، الفتحة للنصب، الكسرة للجر، والسكون للجزم. وما عدا ذلك فهو علامة فرعية تنوب عن هذه الحركات.",
              table: {
                headers: ["الباب الإعرابي", "حالة الرفع", "حالة النصب", "حالة الجر"],
                rows: [
                  [
                    "الأسماء الخمسة (أب، أخ، حم، فو، ذو)",
                    "الواو (جاء أبوك)",
                    "الألف (رأيت أباك)",
                    "الياء (مررت بأبيك)",
                  ],
                  [
                    "المثنى وما يلحق به",
                    "الألف (حضر الطالبان)",
                    "الياء (أكرمت الطالبين)",
                    "الياء (مررت بالطالبين)",
                  ],
                  [
                    "جمع المذكر السالم وملحقاته",
                    "الواو (نجح المعلمون)",
                    "الياء (شكرت المعلمين)",
                    "الياء (أثنيت على المعلمين)",
                  ],
                  [
                    "جمع المؤنث السالم",
                    "الضمة (أصلية)",
                    "الكسرة نيابة عن الفتحة (فرعية)",
                    "الكسرة (أصلية)",
                  ],
                  [
                    "الممنوع من الصرف",
                    "الضمة (أصلية)",
                    "الفتحة (أصلية)",
                    "الفتحة نيابة عن الكسرة (فرعية)",
                  ],
                ],
              },
            },
            {
              heading: "ثانياً: شروط إعراب الأسماء الخمسة بالحروف",
              body: "لكي تعرب هذه الأسماء بالواو رفعاً وبالألف نصباً وبالياء جراً، يشترط النحاة أربعة شروط حاسمة لا بد من تحققها مجتمعة:",
              examples: [
                {
                  label: "شرط الإفراد",
                  text: "أن تكون مفردة؛ فإن ثُنّيت أعربت إعراب المثنى (جاء أَبَوانِ)، وإن جُمعت أعربت بالحركات (هؤلاءِ آباءٌ كِرامٌ).",
                },
                {
                  label: "شرط الإضافة",
                  text: "أن تكون مضافة لاسم ظاهر أو ضمير؛ فإن قُطعت عن الإضافة نُوِّنت وأُعربت بالحركات الأصلية (هذا أَبٌ رحيمٌ).",
                },
                {
                  label: "الإضافة لغير ياء المتكلم",
                  text: "فإن أضيفت لياء المتكلم أعربت بحركات مقدرة منع من ظهورها اشتغال المحل بحركة المناسبة (حضرَ أَبِي: فاعل مرفوع بضمة مقدرة).",
                },
                {
                  label: "خصوصية كلمة (فو) و (ذو)",
                  text: "يشترط في (فو) خلوها من الميم (فإن لحقتها الميم أعربت بالحركات: هذا فَمٌ)، ويشترط في (ذو) أن تكون بمعنى صاحب وتضاف لاسم جنس ظاهر غير ضمير.",
                },
              ],
              warningNotice:
                "تنبيه امتحاني هام: إذا وردت كلمة 'أبي' في جملة مثل: 'أبي يعلمني الفضائل' فهي ليست من الأسماء الخمسة في الإعراب، بل تعرب بالحركات المقدرة لاشتغال المحل بكسرة المناسبة!",
            },
          ],
          summary:
            "التمكن من علامات الإعراب الأصلية والفرعية هو حجر الزاوية الذي تبنى عليه كافة قواعد النحو في امتحان الثانوية العامة، ويمنع الخلط بين المعمول والتابع.",
        },
      },
      {
        id: "u1-q1",
        unitId: "unit-1",
        type: "quiz",
        title: "كويز تطبيقي فوري: علامات الإعراب والأسماء الخمسة",
        durationOrEstimate: "5 أسئلة · 10 دقائق",
        completed: true,
        quizQuestions: [
          {
            id: "q1",
            question:
              "ما إعراب كلمة 'ذا' في قول الشاعر: 'لا تحسبنّ العلمَ ينفعُ وحدَهُ ... ما لم يَتَوَّجْ رَبُّهُ بِخَلاقِ ذا الفضلِ'؟",
            options: [
              "مفعول به منصوب وعلامة نصبه الألف لأنه من الأسماء الخمسة",
              "اسم إشارة مبني في محل نصب مفعول به",
              "نعت منصوب وعلامة نصبه الألف",
              "مضاف إليه مجرور وعلامة جره الياء",
            ],
            correctIndex: 0,
            explanation:
              "'ذا' هنا بمعنى صاحب، وهي مضافة إلى 'الفضل'، فتعرب مفعولاً به منصوباً بالألف لأنها من الأسماء الخمسة.",
          },
          {
            id: "q2",
            question: "أي الجمل الآتية وردت فيها كلمة (فم) معربة بعلامة فرعية؟",
            options: [
              "ينطقُ فَمُ الشاهدِ بالحقِّ المبين",
              "لا تضعْ أصبعك في فمِكَ أثناء التحدث",
              "لافُوكَ لا يُفَضُّ بما فيهِ من حكمٍ",
              "رأيتُ فماً طاهراً لا ينطق كذباً",
            ],
            correctIndex: 2,
            explanation:
              "في الجملة الثالثة 'لا فوك' حذفت الميم وأضيفت للكاف فرُفعت بالواو كعلامة فرعية من الأسماء الخمسة.",
          },
          {
            id: "q3",
            question: "ما الموقع الإعرابي لجملة 'يعملون بجد' في: 'إن هؤلاءِ العمالَ يعملون بجد'؟",
            options: [
              "في محل رفع خبر إن",
              "في محل نصب حال",
              "في محل نصب نعت",
              "لا محل لها من الإعراب صلة الموصول",
            ],
            correctIndex: 0,
            explanation:
              "'إن' ناسخة، 'هؤلاء' اسمها، 'العمال' بدل مطابق، وجملة 'يعملون' في محل رفع خبر إن.",
          },
        ],
      },
      {
        id: "u1-v2",
        unitId: "unit-1",
        type: "video",
        title: "كان وأخواتها وكاد وأخواتها وأحكام اقتران الخبر بأن",
        durationOrEstimate: "50 دقيقة",
        videoUrl: "https://www.youtube.com/watch?v=Y6YL3eP4pR4",
        videoPoster: "/images/obaida-social-preview.png",
        completed: true,
        pdfTitle: "ملزمة النواسخ التامة والناقصة وأفعال الرجاء والشروع.pdf",
        pdfSize: "4.1 ميجابايت",
        objectives: [
          "التفرقة الحاسمة بين كان الناقصة وكان التامة ومواضع ورودها.",
          "أفعال المقاربة والرجاء والشروع وحكم اقتران خبرها بأن (يجب، يكثر، يقل، يمتنع).",
          "إعراب معمول أفعال الشروع عند عدم وجود جملة فعلية مضارعة.",
        ],
        keyPoints: [
          "عسى وأوشك يكثر اقتران خبرهما بأن، بينما كاد وكرب يقل، وحرى واخلولق يجب، وأفعال الشروع يمتنع.",
          "كان التامة تكتفي بمرفوعها ويعرب فاعلاً، مثل: 'فسبحان الله حين تمسون وحين تصبحون'.",
        ],
      },
      {
        id: "u1-r2",
        unitId: "unit-1",
        type: "reading",
        title: "مستند وثائقي: كاد وأخواتها وأفعال الشروع في ميزان الامتحان الوزاري",
        durationOrEstimate: "قراءة 10 دقائق",
        completed: false,
        pdfTitle: "ملخص أفعال الشروع والمقاربة والرجاء.pdf",
        pdfSize: "3.2 ميجابايت",
        readingContent: {
          introduction:
            "تعمل أفعال المقاربة والرجاء والشروع عمل (كان) فترفع المبتدأ ويسمى اسمها وتنصب الخبر ويسمى خبرها، ولكن بشرط صارم: أن يكون خبرها جملة فعلية فعلها مضارع.",
          sections: [
            {
              heading: "أولاً: أحكام اقتران الخبر بـ (أن) المصدرية",
              body: "ينقسم اقتران خبر هذه الأفعال بأن إلى أربعة أحكام نحوية قياسية يترتب عليها حكم إعراب الفعل المضارع:",
              table: {
                headers: ["الحكم النحوي", "الأفعال المخصوصة", "المثال التوضيحي", "ملاحظة امتحانية"],
                rows: [
                  [
                    "يجب الاقتران",
                    "حرى، اخلولق",
                    "حرى الطالبُ أن يجتهدَ",
                    "إذا تجرد الخبر من أن بطل عملها",
                  ],
                  [
                    "يكثر الاقتران",
                    "عسى، أوشك",
                    "عسى ربُّكم أن يرحمَكم",
                    "يجوز تجرده قليلاً: يوشك الامتحان ينتهي",
                  ],
                  [
                    "يقل الاقتران",
                    "كاد، كرب",
                    "كاد المعلمُ يكونُ رسولا",
                    "ورد في الشعر مقروناً بأن قليلاً",
                  ],
                  [
                    "يمتنع الاقتران",
                    "أفعال الشروع (بدأ، شرع، طفق، أخذ، أنشأ، جعل)",
                    "بدأ الأستاذُ يشرحُ الدرس",
                    "إذا اقترن بأن أصبح الفعل تاماً وما بعده فاعل!",
                  ],
                ],
              },
            },
            {
              heading: "ثانياً: متى تكون أفعال الشروع تامة؟",
              body: "أفعال الشروع لا تعمل عمل كان إلا إذا دلت على البدء وكان خبرها جملة فعلية مضارعة غير مقترنة بأن. فإن فقدت هذا الشرط كانت تامة ورفعت فاعلاً ونصبت مفعولاً به.",
              examples: [
                {
                  label: "مثال الفعل الناقص",
                  text: "أخذَ الطالبُ يذاكرُ دروسَه -> الطالب: اسم أخذ مرفوع، وجملة يذاكر في محل نصب خبر أخذ.",
                },
                {
                  label: "مثال الفعل التام",
                  text: "أخذَ الطالبُ الكتابَ من زميله -> الطالب: فاعل مرفوع، الكتاب: مفعول به منصوب.",
                },
              ],
            },
          ],
          summary:
            "ركز دائماً على فعل الجملة: هل هو مضارع؟ هل اقترن بأن؟ هذا يحدد مباشرة هل الفعل ناقص أم تام.",
        },
      },
      {
        id: "u1-e1",
        unitId: "unit-1",
        type: "exam",
        title: "🏆 امتحان الوحدة الأولى الشامل: النحو والتركيب اللغوي (نظام البابل شيت)",
        durationOrEstimate: "10 أسئلة · 25 دقيقة · درجة الاجتياز 80%",
        completed: false,
        quizQuestions: [
          {
            id: "e1-1",
            question:
              "قال تعالى: 'وَطَفِقَا يَخْصِفَانِ عَلَيْهِمَا مِن وَرَقِ الْجَنَّةِ'. ما إعراب 'ألف الاثنين' في (طفقا)؟",
            options: [
              "ضمير متصل مبني في محل رفع اسم طفق",
              "ضمير متصل مبني في محل رفع فاعل",
              "ضمير مبني في محل نصب مفعول به",
              "حرف دال على التثنية لا محل له من الإعراب",
            ],
            correctIndex: 0,
            explanation:
              "'طفق' من أفعال الشروع الناقصة، والاسم هو الضمير المتصل (ألف الاثنين)، وجملة 'يخصفان' في محل نصب خبرها.",
          },
          {
            id: "e1-2",
            question:
              "أصبحَ المجتهدُ ذا شأنٍ عظيم حين أمسى في عمله مخلصاً. ميز الكلمة المنصوبة بعلامة فرعية في العبارة:",
            options: ["ذا", "شأنٍ", "عظيم", "مخلصاً"],
            correctIndex: 0,
            explanation:
              "'ذا' خبر أصبح منصوب بالألف لأنه من الأسماء الخمسة، والألف علامة فرعية تنوب عن الفتحة.",
          },
          {
            id: "e1-3",
            question: "ما إعراب كلمة 'المعلماتِ' في: 'كافأتِ الدولةُ المعلماتِ المتميزاتِ'؟",
            options: [
              "مفعول به منصوب بالكسرة الظاهرة نيابة عن الفتحة لأنه جمع مؤنث سالم",
              "مفعول به منصوب بالفتحة المقدرة",
              "فاعل مرفوع بالضمة الظاهرة",
              "مضاف إليه مجرور وعلامة جره الكسرة",
            ],
            correctIndex: 0,
            explanation:
              "جمع المؤنث السالم ينصب بالكسرة نيابة عن الفتحة، وهي علامة إعراب فرعية في حالة النصب فقط.",
          },
        ],
      },
    ],
  },
  {
    id: "unit-2",
    unitNumber: 2,
    title: "الوحدة الثانية: علم البلاغة وفنون البيان والبديع",
    description:
      "التشبيه المفرد والضمني، الاستعارة المكنية والتصريحية، الكناية، المجاز المرسل، والمحسنات البديعية",
    badge: "بلاغة وبيان",
    color: "#8b5cf6",
    items: [
      {
        id: "u2-v1",
        unitId: "unit-2",
        type: "video",
        title: "التشبيه المفرد والتمثيلي والضمني وسر الجمال",
        durationOrEstimate: "52 دقيقة",
        videoUrl: "https://www.youtube.com/watch?v=zbk0tlER_GE",
        videoPoster: "/images/homepage-background.png",
        completed: true,
        pdfTitle: "ملزمة البلاغة الذهبية - فنون التشبيه وأسرار البلاغة.pdf",
        pdfSize: "3.9 ميجابايت",
        objectives: [
          "التفرقة بين التشبيه المفصل والمجمل والمؤكد والبليغ.",
          "فهم التشبيه الضمني واستخراجه من شواهد الشعر العربي القديم والحديث.",
          "تحديد سر الجمال بدقة (التشخيص، التجسيم، التوضيح).",
        ],
        keyPoints: [
          "تشبيه غير العاقل بالعاقل سر جماله التشخيص.",
          "تشبيه المعنوي بالمادي سر جماله التجسيم.",
          "تشبيه المادي بالمادي أو المعنوي بالمعنوي سر جماله التوضيح.",
        ],
      },
      {
        id: "u2-r1",
        unitId: "unit-2",
        type: "reading",
        title: "مستند وثائقي: كبسولة أسرار الاستعارة المكنية والتصريحية وسر الجمال",
        durationOrEstimate: "قراءة 15 دقيقة",
        completed: true,
        pdfTitle: "كتالوج الاستعارات وتحليل الشواهد البلاغية.pdf",
        pdfSize: "4.2 ميجابايت",
        readingContent: {
          introduction:
            "الاستعارة في أصلها تشبيه بليغ حُذف أحد طرفيه (إما المشبه أو المشبه به)، مع وجود قرينة مانعة من إرادة المعنى الحقيقي. وهي أرقى فنون البيان لأنها تنقل المعنى من التقريرية المباشرة إلى الإيحاء التعبيري الساحر.",
          sections: [
            {
              heading: "أولاً: الاستعارة المكنية (حذف المشبه به)",
              body: "هي التي يُحذف فيها المشبه به ويُرمز إليه بشيء من لوازمه أو صفاته (صفة تدل عليه). المعادلة الرياضية للاستعارة المكنية: [مشبه موجود + مشبه به محذوف + قرينة دالة عليه].",
              examples: [
                {
                  label: "شاهد شعري",
                  text: "قال المتنبي يمدح كافوراً: 'وإذا المنيّةُ أنشَبَتْ أظفارَها ... ألفيتَ كلَّ تميمةٍ لا تنفعُ'.",
                  breakdown:
                    "شبه المنية (الموت) بوحش مفترس، ثم حذف الوحش وأبقى صفة من صفاته وهي (الأظفار)، فسر جمالها التجسيم وتوحي بقسوة الموت.",
                },
                {
                  label: "شاهد قرآني",
                  text: "قال تعالى: 'وَاخْفِضْ لَهُمَا جَنَاحَ الذُّلِّ مِنَ الرَّحْمَةِ'.",
                  breakdown:
                    "شبه الذل بطائر له جناح، وحذف الطائر ورمز له بالجناح: استعارة مكنية سر جمالها التجسيم.",
                },
              ],
            },
            {
              heading: "ثانياً: الاستعارة التصريحية (حذف المشبه والتصريح بالمشبه به)",
              body: "هي التي يُحذف فيها المشبه تماماً، ويُصرح بلفظ المشبه به في كلمة واحدة غالباً تكون اسماً جامداً يعبر عن معنى استعاري.",
              examples: [
                {
                  label: "مثال امتحاني",
                  text: "قول الشاعر عن جيش الأعداء: 'هجمتِ الذئابُ على ديارنا فصَدَّها الأبطالُ'.",
                  breakdown:
                    "حذف (الأعداء/المستعمرين) وصرح بلفظ المشبه به (الذئاب): استعارة تصريحية توحي بالخسة والغدر.",
                },
              ],
              warningNotice:
                "فائدة كبرى: إذا كانت الكلمة اسماً مفرداً مقصوداً به شيئاً آخر فهي غالباً استعارة تصريحية (مثل: النور، الظلام، النسور، الأرانب، الأزهار).",
            },
          ],
          summary:
            "حدد دائماً: ما المحذوف؟ إن كان المشبه به محذوفاً فهي مكنية، وإن كان المشبه هو المحذوف والمصرح به هو المشبه به فهي تصريحية.",
        },
      },
      {
        id: "u2-q1",
        unitId: "unit-2",
        type: "quiz",
        title: "كويز تفاعلي: التفرقة بين الاستعارة المكنية والتصريحية",
        durationOrEstimate: "4 أسئلة · 8 دقائق",
        completed: false,
        quizQuestions: [
          {
            id: "q2-1",
            question:
              "في قول الشاعر: 'وسلا مصرَ هل سلا القلبُ عنها ... أو أسا جُرحَهُ الزمانُ المُؤَسِّي؟' ما نوع الصورة في 'جرحه'؟",
            options: [
              "استعارة تصريحية حيث شبه آلام المنفى والغربة بالجرح",
              "استعارة مكنية حيث شبه الجرح بإنسان يتألم",
              "تشبيه بليغ حذفت أداته",
              "كناية عن موصوف وهو الوطن",
            ],
            correctIndex: 0,
            explanation:
              "شوقي حذف المشبه (ألم المنفى وفراق الوطن) وصرح بالمشبه به (الجرح) في كلمة واحدة، فهي استعارة تصريحية.",
          },
          {
            id: "q2-2",
            question: "ما الصورة البيانية في قولنا: 'عضَّنا الدهرُ بنابهِ'؟",
            options: [
              "استعارة مكنية سر جمالها التجسيم",
              "استعارة تصريحية",
              "تشبيه مجمل",
              "مجاز مرسل علاقته المحلية",
            ],
            correctIndex: 0,
            explanation:
              "شبه الدهر بحيوان مفترس له ناب يعض، وحذف المشبه به ورمز له بصفته (الناب)، فهي استعارة مكنية.",
          },
        ],
      },
      {
        id: "u2-e1",
        unitId: "unit-2",
        type: "exam",
        title: "🏆 امتحان الوحدة الثانية الشامل: البلاغة العربية ونقد الشواهد الشعرية",
        durationOrEstimate: "8 أسئلة · 20 دقيقة · درجة الاجتياز 80%",
        completed: false,
        quizQuestions: [
          {
            id: "e2-1",
            question:
              "قال الشاعر: 'تهونُ علينا في المعالي نفوسُنا ... ومَن يخطبِ الحسناءَ لم يُغْلِها المهرُ'. ما نوع التشبيه؟",
            options: [
              "تشبيه ضمني لا تذكر فيه الأداة صراحة ويلمح من سياق الكلام",
              "تشبيه تمثيلي لوجود أداة تشبيه",
              "تشبيه بليغ مبتدأ وخبر",
              "استعارة مكنية مركبة",
            ],
            correctIndex: 0,
            explanation:
              "الشطر الثاني قضية مستقلة وبرهان وحكمة تؤكد الشطر الأول دون أداة تشبيه صريحة، فهذا هو التشبيه الضمني بعينه.",
          },
        ],
      },
    ],
  },
  {
    id: "unit-3",
    unitNumber: 3,
    title: "الوحدة الثالثة: تاريخ الأدب والمدارس الشعرية والنصوص المتحررة",
    description:
      "مدرسة الإحياء والبعث، الاتجاه الوجداني، الديوان، أبوللو، المهاجر، والواقعية مع مهارات نقد النصوص",
    badge: "أدب ونصوص",
    color: "#10b981",
    items: [
      {
        id: "u3-v1",
        unitId: "unit-3",
        type: "video",
        title: "مدرسة الإحياء والبعث وجيل التطوير (شوقي وحافظ والبارودي)",
        durationOrEstimate: "58 دقيقة",
        videoUrl: "https://www.youtube.com/watch?v=APJ3jq6gZ1g",
        videoPoster: "/images/teacher-celebration.png",
        completed: true,
        pdfTitle: "ملخص مدرسة الإحياء والبعث وجيل التطوير وتطبيقات الامتحان.pdf",
        pdfSize: "4.8 ميجابايت",
        objectives: [
          "العوامل التي هيأت لشوقي تطوير شعر الكلاسيكية الجديدة.",
          "موقف تلامذة البارودي من التراث وقضايا العصر ومشكلات المجتمع.",
        ],
        keyPoints: ["أحمد شوقي عدل عن المديح إلى التاريخ في قصيدته 'كبار الحوادث في وادي النيل'."],
      },
      {
        id: "u3-r1",
        unitId: "unit-3",
        type: "reading",
        title: "مستند وثائقي: الجدول المقارن الحصري بين المدارس الرومانتيكية والواقعية",
        durationOrEstimate: "قراءة 18 دقيقة",
        completed: false,
        pdfTitle: "المقارنة الكبرى بين المدارس الأدبية لشهادة الثانوية العامة.pdf",
        pdfSize: "5.5 ميجابايت",
        readingContent: {
          introduction:
            "شهد الشعر العربي في القرن العشرين صراعاً فنياً بديعاً بين المحافظين الكلاسيكيين الذين تمسكوا بأصالة التراث، وبين المدارس الرومانتيكية التجديدية التي قدست الذات والوجدان والطبيعة، حتى استقرت القصيدة عند الواقعية الحديثة بعد الحرب العالمية الثانية.",
          sections: [
            {
              heading: "أولاً: جدول المقارنة بين المدارس الرومانتيكية (الديوان، أبوللو، المهاجر)",
              body: "لكل مدرسة سمات فارقة تتكرر في أسئلة الامتحان بصيغ: (من مآخذ...، من سمات التجديد في المضمون، من سمات التجديد في الشكل):",
              table: {
                headers: [
                  "المدرسة الأدبية",
                  "رواد المدرسة",
                  "أبرز سمات المضمون والفكر",
                  "أبرز سمات الشكل والموسيقى",
                ],
                rows: [
                  [
                    "مدرسة الديوان",
                    "العقاد، المازني، شكري",
                    "غلبة الطابع الفلسفي والذهني والجفاف العاطفي، وضوح الجانب الفكري",
                    "التخلص من المحسنات البديعية المتكلفة، الوحدة العضوية، شعر مرسل",
                  ],
                  [
                    "مدرسة أبوللو",
                    "أحمد زكي أبو شادي، إبراهيم ناجي",
                    "الحنين لمواطن الذكريات، استعمال اللغة استعمالاً جديداً، التشاؤم والاستسلام للآلام",
                    "الميل إلى الموسيقى الهادئة لا الصاخبة، تقسيم القصيدة لمقاطع، القافية المزدوجة",
                  ],
                  [
                    "مدرسة المهاجر",
                    "جبران، ميخائيل نعيمة، إيليا أبو ماضي",
                    "النزعة الروحية، التأمل في حقائق الكون والحياة والموت، استبطان النفس الإنسانية",
                    "الميل إلى الرمز، المغالاة في التجديد وإهمال قواعد اللغة أحياناً، التمسك بالوحدة العضوية",
                  ],
                ],
              },
            },
          ],
          summary:
            "احفظ دائماً الكلمات المفتاحية: الفلسفة والذهنية = ديوان، الحنين للذكريات والعطر القمري = أبوللو، النزعة الروحية والغربة = مهاجر.",
        },
      },
      {
        id: "u3-e1",
        unitId: "unit-3",
        type: "exam",
        title: "🏆 امتحان الوحدة الثالثة الشامل: نصوص متحررة وتاريخ المدارس الأدبية",
        durationOrEstimate: "10 أسئلة · 25 دقيقة · درجة الاجتياز 80%",
        completed: false,
        quizQuestions: [
          {
            id: "e3-1",
            question:
              "يقول إيليا أبو ماضي: 'نسي الطينُ ساعةً أنه طينٌ ... حقيرٌ فصالَ تيهاً وعربدْ'. ما السمة البلاغية والأدبية التي يمثلها هذا البيت لمدرسة المهاجر؟",
            options: [
              "الميل إلى الرمز والتأمل في النفس الإنسانية ونقد الغرور والتكبر",
              "غلبة الجانب الفلسفي والذهنية الجافة",
              "استعمال الكلمات الأجنبية والأساطير الإغريقية",
              "شعر المناسبات والمجاملات",
            ],
            correctIndex: 0,
            explanation:
              "استعمل الشاعر الرمز بـ 'الطين' ليرمز للإنسان المتكبر، وهي سمة أصيلة من سمات مدرسة المهاجر في التأمل الإنساني والدعوة للتواضع.",
          },
        ],
      },
    ],
  },
  {
    id: "unit-4",
    unitNumber: 4,
    title: "الوحدة الرابعة: مهارات التعبير والقراءة المتحررة والامتحان النهائي",
    description:
      "رسم الهمزات، علامات الترقيم، استراتيجيات القراءة المتحررة، فنون التعبير المقالي، والامتحان الشامل",
    badge: "مهارات وتعبير",
    color: "#f59e0b",
    items: [
      {
        id: "u4-v1",
        unitId: "unit-4",
        type: "video",
        title: "قواعد رسم الهمزات (المتوسطة والمتطرفة) وعلامات الترقيم بلا أخطاء",
        durationOrEstimate: "38 دقيقة",
        videoUrl: "https://www.youtube.com/watch?v=ZBAZr6XDqNI",
        videoPoster: "/images/obaida-social-preview.png",
        completed: true,
        pdfTitle: "كتيب قواعد الإملاء والرسم الإملائي الصحيح للثانوية العامة.pdf",
        pdfSize: "2.5 ميجابايت",
        objectives: [
          "إتقان قاعدة قوة الحركات (الكسرة > الضمة > الفتحة > السكون) في رسم الهمزة المتوسطة.",
          "رسم الهمزة المتطرفة بحسب حركة الحرف السابق لها.",
        ],
        keyPoints: [
          "ترسم الهمزة المتوسطة بمقارنة حركتها مع حركة ما قبلها وتكتب على الحرف المناسب لأقوى الحركتين.",
        ],
      },
      {
        id: "u4-r1",
        unitId: "unit-4",
        type: "reading",
        title: "مستند وثائقي: الكتالوج الذهبي للعلاقات الضمنية بين الجمل في القراءة المتحررة",
        durationOrEstimate: "قراءة 12 دقيقة",
        completed: false,
        pdfTitle: "دليل فك شفرات القراءة المتحررة وتحديد العلاقات.pdf",
        pdfSize: "3.8 ميجابايت",
        readingContent: {
          introduction:
            "أسئلة القراءة المتحررة في نظام الامتحانات الحديث لا تعتمد على الحفظ الصم، بل تقيس مهارة التحليل المنطقي والعلاقات الدلالية بين الجمل والفقرات (التعليل، النتيجة، التوكيد، التفصيل بعد الإجمال، الاستدراك، والتوضيح).",
          sections: [
            {
              heading: "أولاً: الفروق الجوهرية بين التعليل والنتيجة",
              body: "التعليل يبين السبب (لماذا حدث؟)، بينما النتيجة تبين الثمرة أو الأثر المترتب (ماذا حدث بعد ذلك؟).",
              examples: [
                {
                  label: "مثال التعليل",
                  text: "سافر الطالب إلى القاهرة ليلتحق بالجامعة -> (ليلتحق بالجامعة) تعليل لما قبلها.",
                },
                {
                  label: "مثال النتيجة",
                  text: "اجتهد الطالب طوال العام فنال الدرجة النهائية -> (فنال الدرجة النهائية) نتيجة مترتبة على الاجتهاد.",
                },
              ],
            },
          ],
          summary:
            "اسأل نفسك دائماً: هل الجملة الثانية سبب للأولى؟ إذن هي تعليل. هل هي أثر ترتب عليها؟ إذن هي نتيجة.",
        },
      },
      {
        id: "u4-e1",
        unitId: "unit-4",
        type: "exam",
        title: "🎓 الامتحان الوزاري الشامل التجريبي لمنهاج اللغة العربية كاملاً",
        durationOrEstimate: "15 سؤالاً · 40 دقيقة · شهادة إتمام المنهاج",
        completed: false,
        quizQuestions: [
          {
            id: "final-1",
            question: "أي الكلمات التالية كُتبت همزتها خطأ وفق قواعد الإملاء؟",
            options: ["عُلماؤنا في حالة النصب (الصواب: علماءَنا)", "بِداية", "مَسْؤُول", "شاطِئ"],
            correctIndex: 0,
            explanation:
              "الهمزة المتطرفة المتصلة بضمير تكتب على واو في الرفع (علماؤنا)، وعلى السطر في النصب (علماءنا)، وعلى نبرة في الجر (علمائنا).",
          },
          {
            id: "final-2",
            question: "ما نوع المصدر في كلمة 'استباق'؟",
            options: [
              "مصدر خماسي من الفعل استبق",
              "مصدر سداسي لأنه يبدأ بـ است",
              "مصدر رباعي سماعي",
              "مصدر ميمي",
            ],
            correctIndex: 0,
            explanation:
              "الفعل هو (اسْتَبَقَ) وزنه (افْتَعَلَ) وحروفه خمسة والسين أصلية في بنية الفعل وليست زائدة للاستفعال.",
          },
        ],
      },
    ],
  },
];

// ─── Helper ───────────────────────────────────────────────────────────
const ITEM_META: Record<
  CourseItemType,
  { label: string; shortLabel: string; tone: string; bg: string; icon: typeof Play }
> = {
  video: {
    label: "محاضرة فيديو",
    shortLabel: "فيديو",
    tone: "text-blue-700",
    bg: "bg-blue-100 text-blue-700",
    icon: Play,
  },
  reading: {
    label: "شرح ووثيقة قراءة",
    shortLabel: "قراءة",
    tone: "text-purple-700",
    bg: "bg-purple-100 text-purple-700",
    icon: BookOpen,
  },
  quiz: {
    label: "كويز تطبيقي",
    shortLabel: "كويز",
    tone: "text-amber-700",
    bg: "bg-amber-100 text-amber-700",
    icon: HelpCircle,
  },
  exam: {
    label: "امتحان شامل ومحاكي",
    shortLabel: "امتحان",
    tone: "text-emerald-700",
    bg: "bg-emerald-100 text-emerald-700",
    icon: Trophy,
  },
};

// ─── Component ────────────────────────────────────────────────────────
export function RecordedCoursesView({ isTeacher }: { isTeacher?: boolean }) {
  const { user, roles } = useAuth();
  const isTeacherUser =
    isTeacher ?? (roles?.includes("teacher") || roles?.includes("admin") || false);
  const studentName =
    user?.user_metadata?.full_name ||
    (typeof window !== "undefined"
      ? (JSON.parse(localStorage.getItem("academy_user_profile") || "{}") as any).name
      : null) ||
    "سعد السيد";

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [activeItemId, setActiveItemId] = useState<string>("u1-v1");
  const [selectedUnitId, setSelectedUnitId] = useState<string>("unit-1");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [playbackSpeed, setPlaybackSpeed] = useState<string>("1x");
  const [activeSubTab, setActiveSubTab] = useState<string>("overview");
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [autoPlayNext, setAutoPlayNext] = useState<boolean>(true);
  const [certificateOpen, setCertificateOpen] = useState<boolean>(false);
  const [newLessonDialogOpen, setNewLessonDialogOpen] = useState<boolean>(false);
  const [allExpanded, setAllExpanded] = useState<boolean>(false);
  const [videoState, setVideoState] = useState<"idle" | "loading" | "ready" | "error">("idle");

  // Completion State
  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const u of COURSE_UNITS) {
      for (const item of u.items) {
        map[item.id] = item.completed;
      }
    }
    return map;
  });

  const allItems = useMemo(() => COURSE_UNITS.flatMap((u) => u.items), []);
  const totalItemsCount = allItems.length;
  const completedCount = allItems.filter((item) => completedMap[item.id]).length;
  const overallPercentage = Math.round((completedCount / totalItemsCount) * 100);

  const activeItem = allItems.find((item) => item.id === activeItemId) || allItems[0];
  const activeUnit = COURSE_UNITS.find((u) => u.id === activeItem.unitId) || COURSE_UNITS[0];
  const youtubeEmbedUrl = getYouTubeEmbedUrl(activeItem.videoUrl);
  const nativeVideoUrl = activeItem.videoUrl && !youtubeEmbedUrl ? activeItem.videoUrl : undefined;

  // Navigation helpers
  const activeIdx = allItems.findIndex((item) => item.id === activeItemId);
  const prevItem = activeIdx > 0 ? allItems[activeIdx - 1] : null;
  const nextItem = activeIdx < allItems.length - 1 ? allItems[activeIdx + 1] : null;

  // Notes state (localStorage backed per lesson)
  const [notes, setNotes] = useState<
    { id: string; text: string; time: string; createdAt: string }[]
  >(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(`academy_course_notes_${activeItemId}`);
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: "1",
              text: "التركيز على شروط إعراب الأسماء الخمسة بالحروف وخصوصية كلمة (ذو).",
              time: "14:20",
              createdAt: "اليوم",
            },
          ];
    } catch {
      return [];
    }
  });
  const [newNoteText, setNewNoteText] = useState("");

  // Load notes on active item change
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(`academy_course_notes_${activeItemId}`);
      if (saved) setNotes(JSON.parse(saved));
      else {
        setNotes([
          {
            id: "1",
            text: `ملاحظة هامة على درس: ${activeItem.title}`,
            time: "05:10",
            createdAt: "اليوم",
          },
        ]);
      }
    } catch {}
  }, [activeItemId, activeItem.title]);

  // Q&A Community discussions
  const [questions, setQuestions] = useState([
    {
      id: "q-1",
      author: "سعد السيد",
      role: "طالب",
      time: "منذ ساعتين",
      text: "أستاذنا الحبيب، هل يمكن حل الاختبار أكثر من مرة لتحسين النسبة المئوية؟",
      upvotes: 14,
      userUpvoted: false,
      reply: {
        author: "الأستاذ عُبيدة",
        role: "المعلم المشرف",
        text: "نعم يا سعد، النظام يتيح لك إعادة التدريب والاستفادة من شرح الإجابات النموذجية حتى تتقن القاعدة 100%.",
        verified: true,
      },
    },
    {
      id: "q-2",
      author: "مريم خالد",
      role: "طالبة",
      time: "منذ 5 ساعات",
      text: "هل مذكرات الـ PDF كافية لمراجعة ليلة الامتحان أم نحتاج كتب خارجية؟",
      upvotes: 21,
      userUpvoted: true,
      reply: {
        author: "الأستاذ عُبيدة",
        role: "المعلم المشرف",
        text: "مذكرات المنصة مصممة ومحدثة لنظام 2026 بنك الأسئلة الشامل، وتغنيك تماماً عن أي مصدر خارجي بفضل شمولها وتدرجها.",
        verified: true,
      },
    },
  ]);
  const [newQuestionText, setNewQuestionText] = useState("");

  const navigateTo = useCallback((item: CourseItem) => {
    setActiveItemId(item.id);
    setSelectedUnitId(item.unitId);
    setActiveSubTab("overview");
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setVideoState("idle");
  }, []);

  const toggleItemCompleted = useCallback((itemId: string) => {
    setCompletedMap((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  }, []);

  const handleSelectQuizAnswer = useCallback(
    (qId: string, optIdx: number) => {
      if (quizSubmitted) return;
      setSelectedAnswers((prev) => ({ ...prev, [qId]: optIdx }));
    },
    [quizSubmitted],
  );

  const handleSubmitQuiz = useCallback(() => {
    setQuizSubmitted(true);
    if (activeItem.quizQuestions) {
      let correct = 0;
      activeItem.quizQuestions.forEach((q) => {
        if (selectedAnswers[q.id] === q.correctIndex) correct++;
      });
      if (Math.round((correct / activeItem.quizQuestions.length) * 100) >= 60) {
        setCompletedMap((prev) => ({ ...prev, [activeItem.id]: true }));
      }
    }
  }, [activeItem, selectedAnswers]);

  const handleResetQuiz = useCallback(() => {
    setSelectedAnswers({});
    setQuizSubmitted(false);
  }, []);

  // Video Control Handlers
  const changePlaybackSpeed = (speed: string) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = parseFloat(speed);
    }
  };

  const seekRelative = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime + seconds);
    }
  };

  const seekToTime = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      void videoRef.current.play();
    }
  };

  // Add Note Handler
  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    const currentSec = videoRef.current ? Math.floor(videoRef.current.currentTime) : 0;
    const mins = Math.floor(currentSec / 60);
    const secs = currentSec % 60;
    const timeFormatted = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    const noteItem = {
      id: Date.now().toString(),
      text: newNoteText.trim(),
      time: timeFormatted,
      createdAt: "الآن",
    };
    const updated = [noteItem, ...notes];
    setNotes(updated);
    setNewNoteText("");
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`academy_course_notes_${activeItemId}`, JSON.stringify(updated));
      } catch {}
    }
  };

  const handleDeleteNote = (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`academy_course_notes_${activeItemId}`, JSON.stringify(updated));
      } catch {}
    }
  };

  // Add Community Question Handler
  const handleAddQuestion = () => {
    if (!newQuestionText.trim()) return;
    const qItem = {
      id: `q-${Date.now()}`,
      author: studentName,
      role: isTeacherUser ? "المعلم المشرف" : "طالب",
      time: "الآن",
      text: newQuestionText.trim(),
      upvotes: 1,
      userUpvoted: true,
      reply: undefined,
    };
    setQuestions([qItem, ...questions]);
    setNewQuestionText("");
  };

  const handleToggleUpvote = (qId: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === qId) {
          const userUpvoted = !q.userUpvoted;
          return { ...q, userUpvoted, upvotes: userUpvoted ? q.upvotes + 1 : q.upvotes - 1 };
        }
        return q;
      }),
    );
  };

  // Chapters / Timestamps breakdown for current lesson
  const lessonChapters = [
    { time: "00:00", seconds: 0, title: "المقدمة والربط بالمنهاج التأسيسي" },
    { time: "10:15", seconds: 615, title: "شرح القواعد وتفكيك الشواهد بالتفصيل" },
    { time: "22:40", seconds: 1360, title: "تحليل النماذج الاسترشادية والنصوص الوزارية" },
    { time: "34:20", seconds: 2060, title: "تفكيك تريكات البابل شيت التي يقع فيها الطلاب" },
    { time: "42:00", seconds: 2520, title: "الخلاصة الذهبية والتكليف والواجب المنزلي" },
  ];

  const lessonRoadmap = [
    { label: "القاعدة", detail: "تعرّف علامة الإعراب", tone: "bg-blue-600" },
    { label: "الشرط", detail: "تحقق من مواضع التطبيق", tone: "bg-cyan-600" },
    { label: "الشاهد", detail: "حلّل الجملة خطوة بخطوة", tone: "bg-teal-600" },
    { label: "التثبيت", detail: "اختبر فهمك سريعاً", tone: "bg-amber-500" },
  ];

  // Filtered units for sidebar
  const filteredUnits = useMemo(
    () =>
      COURSE_UNITS.map((unit) => ({
        ...unit,
        items: unit.items.filter((item) => {
          const matchesSearch =
            !searchQuery ||
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.objectives?.some((o) => o.toLowerCase().includes(searchQuery.toLowerCase()));
          const matchesType = typeFilter === "all" || item.type === typeFilter;
          return matchesSearch && matchesType;
        }),
      })).filter((unit) => unit.items.length > 0),
    [searchQuery, typeFilter],
  );

  const meta = ITEM_META[activeItem.type];

  return (
    <div className="space-y-5" dir="rtl">
      {/* ╔══════════════════════════════════════════════════════════╗
          ║  1. TEACHER SUPERVISOR CONTROL TOOLBAR (For Teachers)  ║
          ╚══════════════════════════════════════════════════════════╝ */}
      {isTeacherUser && (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-900 text-white shadow-sm">
                <SlidersHorizontal className="h-4 w-4" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900">
                    لوحة تحكم المعلم المشرف (الأستاذ عُبيدة)
                  </h3>
                  <Badge
                    variant="outline"
                    className="text-emerald-700 bg-emerald-50 border-emerald-200 text-[10px] font-bold"
                  >
                    إدارة المنهاج المسجل
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500">
                  متابعة إحصائيات الدفعة، إضافة وتعديل الفيديوهات والمذكرات، وتصدير التقارير
                  الأكاديمية
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => setNewLessonDialogOpen(true)}
                className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-8 shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                إضافة درس جديد
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  alert("تم تصدير تقرير إنجاز 2,450 طالباً بصيغة Excel / CSV بنجاح!");
                }}
                className="gap-1.5 text-slate-700 border-slate-200 hover:bg-slate-50 text-xs h-8"
              >
                <Download className="h-3.5 w-3.5" />
                تصدير تقرير الإنجاز
              </Button>
            </div>
          </div>

          {/* Teacher Clean Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
            <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
              <span className="block text-[11px] font-medium text-slate-500 mb-0.5">
                الطلاب المسجلين
              </span>
              <strong className="text-base font-black text-slate-900">2,450 طالب</strong>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
              <span className="block text-[11px] font-medium text-slate-500 mb-0.5">
                متوسط إتمام المنهاج
              </span>
              <strong className="text-base font-black text-slate-900">76%</strong>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
              <span className="block text-[11px] font-medium text-slate-500 mb-0.5">
                متوسط درجات الكويزات
              </span>
              <strong className="text-base font-black text-slate-900">84%</strong>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
              <span className="block text-[11px] font-medium text-slate-500 mb-0.5">
                أسئلة بانتظار الرد
              </span>
              <strong className="text-base font-black text-blue-600">
                {questions.filter((q) => !q.reply).length} أسئلة جديدة
              </strong>
            </div>
          </div>
        </section>
      )}

      {/* ╔══════════════════════════════════════════════════════════╗
          ║  2. CLEAN PROFESSIONAL COURSE HERO BANNER              ║
          ╚══════════════════════════════════════════════════════════╝ */}
      <section className="rounded-xl border border-slate-800 bg-[#0f172a] px-6 py-5 shadow-sm text-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Text Side */}
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-blue-600 text-white font-bold hover:bg-blue-600 text-[11px]">
                منهاج الثانوية العامة 2026
              </Badge>
              <span className="flex items-center gap-1 text-xs font-semibold text-amber-400">
                <Star className="h-3 w-3 fill-amber-400" />
                4.98 (2,450 طالب مسجل)
              </span>
              <Badge variant="outline" className="text-slate-300 border-slate-700 text-[10px]">
                محدّث لنظام البابل شيت
              </Badge>
            </div>

            <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl">
              منهاج النخبة في اللغة العربية
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5 text-blue-400" />
                الأستاذ عُبيدة
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Video className="h-3.5 w-3.5 text-slate-300" />8 محاضرات فيديو
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5 text-slate-300" />5 وثائق قراءة
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Trophy className="h-3.5 w-3.5 text-slate-300" />5 امتحانات
              </span>
            </div>
          </div>

          {/* Progress & Certificate Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Progress Mini Card */}
            <div className="rounded-lg bg-slate-800/80 border border-slate-700/80 px-4 py-3 min-w-[210px] space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-300">إنجازك الإجمالي</span>
                <strong className="text-base font-black text-white">{overallPercentage}%</strong>
              </div>
              <Progress value={overallPercentage} className="h-2 bg-slate-700" />
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>
                  {completedCount} / {totalItemsCount} مكتمل
                </span>
                <span className="text-slate-300 font-medium">هدف الأسبوع: 4/5</span>
              </div>
            </div>

            {/* Certificate Button */}
            <Button
              onClick={() => setCertificateOpen(true)}
              className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 px-4 shadow-sm"
            >
              <Award className="h-4 w-4" />
              الشهادة المعتمدة
            </Button>
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════════════════════╗
          ║  3. MAIN SPLIT: SYLLABUS SIDEBAR + VIEWER/PLAYER       ║
          ╚══════════════════════════════════════════════════════════╝ */}
      <div className="grid gap-5 lg:grid-cols-[340px_1fr] items-start">
        {/* ── SIDEBAR (Syllabus) ── sticky on left ─────────── */}
        <aside className="lg:sticky lg:top-20 space-y-3 order-2 lg:order-1">
          {/* Search + Filter */}
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">خريطة المنهاج</h3>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setAllExpanded((e) => !e)}
                  className="text-[10px] font-bold text-slate-500 hover:text-blue-600 underline"
                >
                  {allExpanded ? "طي الكل" : "توسيع الكل"}
                </button>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  {completedCount}/{totalItemsCount}
                </span>
              </div>
            </div>

            {/* Type Filter */}
            <div className="grid grid-cols-4 gap-0.5 p-0.5 bg-slate-100 rounded-lg text-[10px] font-bold text-center">
              {[
                { key: "all", label: "الكل" },
                { key: "video", label: "فيديو" },
                { key: "reading", label: "قراءة" },
                { key: "quiz", label: "امتحانات" },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTypeFilter(t.key)}
                  className={`py-1 rounded-md transition ${
                    typeFilter === t.key
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute right-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث في الدروس والموضوعات..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50/60 py-1.5 pr-8 pl-2.5 text-[11px] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Unit Accordion List */}
          <div className="space-y-2 max-h-[calc(100vh-14rem)] overflow-y-auto scrollbar-thin">
            {filteredUnits.map((unit) => {
              const unitCompleted = unit.items.filter((item) => completedMap[item.id]).length;
              const unitPercent = Math.round((unitCompleted / unit.items.length) * 100);
              const isSelected = selectedUnitId === unit.id || allExpanded;

              return (
                <div
                  key={unit.id}
                  className={`rounded-xl border transition-all ${
                    selectedUnitId === unit.id
                      ? "border-blue-200 bg-white shadow-sm ring-1 ring-blue-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  {/* Unit Header */}
                  <button
                    type="button"
                    onClick={() => setSelectedUnitId(selectedUnitId === unit.id ? "" : unit.id)}
                    className="w-full px-3 py-2.5 text-right flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span
                        className="h-2.5 w-2.5 rounded-full flex-none"
                        style={{ background: unit.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1.5 mb-0.5">
                          <span className="text-[10px] font-bold text-slate-500">
                            الوحدة {unit.unitNumber}
                          </span>
                          <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded">
                            {unitCompleted}/{unit.items.length} ({unitPercent}%)
                          </span>
                        </div>
                        <h4 className="text-[12px] font-bold text-slate-800 leading-snug line-clamp-1">
                          {unit.title}
                        </h4>
                      </div>
                    </div>
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-slate-400 flex-none transition-transform ${
                        isSelected ? "rotate-180 text-blue-600" : ""
                      }`}
                    />
                  </button>

                  {/* Items list inside unit */}
                  {isSelected && (
                    <div className="border-t border-slate-100 px-1.5 py-1.5 space-y-0.5">
                      {unit.items.map((item, idx) => {
                        const isCurrentActive = activeItemId === item.id;
                        const isDone = completedMap[item.id];
                        const ItemIcon = ITEM_META[item.type].icon;

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => navigateTo(item)}
                            className={`w-full px-2.5 py-2 rounded-lg text-right flex items-start gap-2.5 transition ${
                              isCurrentActive
                                ? "bg-blue-50 border border-blue-200 shadow-sm"
                                : "hover:bg-slate-50"
                            }`}
                          >
                            <div className="mt-0.5 flex-none">
                              {isDone ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              ) : isCurrentActive ? (
                                <ItemIcon className="h-4 w-4 text-blue-600" />
                              ) : (
                                <div className="h-4 w-4 rounded-full border border-slate-300 grid place-items-center text-[9px] text-slate-500 font-bold">
                                  {idx + 1}
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1 space-y-0.5">
                              <span
                                className={`block text-[11px] font-semibold leading-snug ${
                                  isCurrentActive ? "text-blue-900 font-bold" : "text-slate-700"
                                }`}
                              >
                                {item.title}
                              </span>
                              <div className="flex items-center gap-1.5 text-[9px] text-slate-400">
                                <span>{item.durationOrEstimate}</span>
                                <span>·</span>
                                <span className={ITEM_META[item.type].tone + " font-semibold"}>
                                  {ITEM_META[item.type].shortLabel}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* ── MAIN CONTENT AREA (right side) ───────────────── */}
        <main className="space-y-4 order-1 lg:order-2 min-h-[400px]">
          {/* Breadcrumb + Nav + Completion Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${meta.bg}`}>
                {meta.shortLabel}
              </span>
              <span className="text-[11px] text-slate-500 truncate max-w-[180px]">
                {activeUnit.badge}
              </span>
              <span className="text-[10px] text-slate-300">|</span>
              <span className="text-[11px] font-bold text-slate-700 truncate max-w-[320px]">
                {activeItem.title}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Prev / Next */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={!prevItem}
                  onClick={() => prevItem && navigateTo(prevItem)}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  title="الدرس السابق"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
                <span className="text-[10px] text-slate-400 tabular-nums">
                  {activeIdx + 1}/{totalItemsCount}
                </span>
                <button
                  type="button"
                  disabled={!nextItem}
                  onClick={() => nextItem && navigateTo(nextItem)}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  title="الدرس التالي"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Completion Toggle */}
              <button
                type="button"
                onClick={() => toggleItemCompleted(activeItem.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition shadow-sm ${
                  completedMap[activeItem.id]
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {completedMap[activeItem.id] ? "مكتمل ✓" : "تحديد كمكتمل"}
              </button>
            </div>
          </div>

          {/* ════════════ CASE A: VIDEO PLAYER ════════════ */}
          {activeItem.type === "video" && (
            <div className="rounded-xl overflow-hidden bg-[#0f172a] border border-slate-800 shadow-xl">
              {/* Player Header */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-[#090e1c] border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full"
                    style={{ background: activeUnit.color }}
                  >
                    {activeUnit.badge}
                  </span>
                  <span className="text-[11px] font-bold text-slate-300 truncate max-w-[320px]">
                    {activeItem.title}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="border border-cyan-500/20 bg-slate-800/90 text-[9px] text-cyan-400"
                  >
                    {youtubeEmbedUrl
                      ? "فيديو YouTube"
                      : activeItem.videoUrl
                        ? "فيديو المنصة"
                        : "بانتظار رفع الفيديو"}
                  </Badge>
                  {youtubeEmbedUrl && activeItem.videoUrl && (
                    <a
                      href={activeItem.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-300 transition hover:text-white"
                    >
                      المصدر
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {nativeVideoUrl && (
                    <button
                      type="button"
                      onClick={() => setAutoPlayNext((a) => !a)}
                      className={`rounded px-2 py-0.5 text-[9px] font-bold transition ${
                        autoPlayNext ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"
                      }`}
                      title="تشغيل الدرس التالي تلقائياً"
                    >
                      تشغيل تلقائي {autoPlayNext ? "مفعل" : "معطل"}
                    </button>
                  )}
                </div>
              </div>

              {/* Video Element */}
              <div className="relative aspect-video w-full bg-slate-950">
                {youtubeEmbedUrl ? (
                  <iframe
                    key={youtubeEmbedUrl}
                    src={youtubeEmbedUrl}
                    title={`فيديو: ${activeItem.title}`}
                    className="h-full w-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                    onLoad={() => setVideoState("ready")}
                  />
                ) : nativeVideoUrl ? (
                  <video
                    ref={videoRef}
                    key={nativeVideoUrl}
                    src={nativeVideoUrl}
                    poster={activeItem.videoPoster}
                    controls
                    preload="metadata"
                    onLoadStart={() => setVideoState("loading")}
                    onCanPlay={() => setVideoState("ready")}
                    onError={() => setVideoState("error")}
                    onEnded={() => {
                      setCompletedMap((prev) => ({ ...prev, [activeItem.id]: true }));
                      if (autoPlayNext && nextItem) navigateTo(nextItem);
                    }}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_top,_#1e3a5f,_#0f172a_58%)] p-6 text-center text-white">
                    <div className="max-w-sm space-y-3">
                      <Video className="mx-auto h-8 w-8 text-cyan-300" />
                      <p className="text-sm font-black">الفيديو قيد الإتاحة</p>
                      <p className="text-xs leading-6 text-slate-300">
                        سيظهر المشغل هنا تلقائياً عند إضافة رابط الفيديو من لوحة المعلم. يمكنك الآن
                        متابعة ملخص الدرس والتدريب المرتبط به.
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveSubTab("overview")}
                        className="rounded-lg border border-cyan-200/40 bg-white/10 px-3 py-2 text-xs font-bold text-cyan-50 transition hover:bg-white/20"
                      >
                        الانتقال إلى ملخص الدرس
                      </button>
                    </div>
                  </div>
                )}
                {videoState === "loading" && (
                  <div className="absolute inset-0 grid place-items-center bg-slate-950/55 text-center text-white pointer-events-none">
                    <span className="rounded-full border border-white/20 bg-slate-900/90 px-4 py-2 text-xs font-bold">
                      يتم تجهيز الفيديو
                    </span>
                  </div>
                )}
                {videoState === "error" && (
                  <div className="absolute inset-0 grid place-items-center bg-slate-950 p-6 text-center text-white">
                    <div className="max-w-sm space-y-3">
                      <AlertCircle className="mx-auto h-7 w-7 text-amber-400" />
                      <p className="text-sm font-bold">تعذر تشغيل هذا الفيديو حالياً</p>
                      <p className="text-xs leading-6 text-slate-300">
                        يمكنك الانتقال إلى الملخص أو متابعة الدرس التالي، وسيُعاد التحميل عند فتح
                        الدرس مرة أخرى.
                      </p>
                      {nextItem && (
                        <button
                          type="button"
                          onClick={() => navigateTo(nextItem)}
                          className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-500"
                        >
                          متابعة الدرس التالي
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {youtubeEmbedUrl && (
                <div className="flex items-center gap-2 border-t border-slate-800 bg-slate-900 px-4 py-2 text-[10px] leading-5 text-slate-300">
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-cyan-300" />
                  <span>
                    يُشغَّل هذا الفيديو من YouTube، وتخضع إتاحته وسياسة عرضه لمنصة YouTube.
                  </span>
                </div>
              )}

              {/* Video Controls Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#0b1124] border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 text-[11px] text-slate-300 font-semibold">
                    <Clock className="h-3.5 w-3.5 text-cyan-400" />
                    {activeItem.durationOrEstimate}
                  </span>

                  {/* 10s Rewind / Forward */}
                  {nativeVideoUrl && (
                    <div className="mr-1 flex items-center gap-1 border-r border-slate-700/60 pr-2">
                      <button
                        type="button"
                        onClick={() => seekRelative(-10)}
                        className="rounded-md bg-slate-800/80 px-2 py-1 text-[10px] font-bold text-slate-300 transition hover:bg-slate-700"
                        title="رجوع عشر ثوانٍ"
                      >
                        −10 ث
                      </button>
                      <button
                        type="button"
                        onClick={() => seekRelative(10)}
                        className="rounded-md bg-slate-800/80 px-2 py-1 text-[10px] font-bold text-slate-300 transition hover:bg-slate-700"
                        title="تقديم عشر ثوانٍ"
                      >
                        +10 ث
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {nativeVideoUrl && (
                    <div className="flex items-center gap-0.5 rounded-lg border border-slate-700/60 bg-slate-800/80 p-0.5 text-[10px] font-bold text-slate-400">
                      {["0.75x", "1x", "1.25x", "1.5x", "2x"].map((speed) => (
                        <button
                          key={speed}
                          type="button"
                          onClick={() => changePlaybackSpeed(speed)}
                          className={`rounded-md px-1.5 py-0.5 transition ${
                            playbackSpeed === speed
                              ? "bg-blue-600 text-white shadow-sm"
                              : "hover:text-white"
                          }`}
                        >
                          {speed}
                        </button>
                      ))}
                    </div>
                  )}

                  {activeItem.pdfTitle && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-[10px] font-bold border-slate-700 text-slate-200 bg-slate-800/80 hover:bg-slate-700 h-7"
                      onClick={() => setActiveSubTab("resources")}
                    >
                      <Download className="h-3 w-3" />
                      المذكرة PDF
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ════════════ CASE B: READING DOCUMENT (Meticulous Document Viewer) ════════════ */}
          {activeItem.type === "video" && (
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-600 text-white">
                      <ListVideo className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs font-black text-slate-900">استوديو الدرس</p>
                      <p className="text-[11px] text-slate-500">
                        خريطة ذكية للمشاهدة والمراجعة والتطبيق
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab("chapters")}
                    className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-50"
                  >
                    عرض محطات الفيديو
                  </button>
                </div>
              </div>
              <div className="grid gap-5 p-5 lg:grid-cols-[1.1fr_.9fr]">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    قبل أن تبدأ
                  </div>
                  <p className="text-sm leading-7 text-slate-600">
                    راقب الأمثلة أثناء الشرح، ثم ثبّت القاعدة من خلال مخطط المراجعة واختبر نفسك في
                    النشاط التالي.
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="rounded-lg border border-slate-200 bg-[#fffdf8] p-3">
                      <span className="text-[10px] font-bold text-slate-500">نوع المادة</span>
                      <p className="mt-1 text-xs font-bold text-slate-900">
                        فيديو مشروح مع تطبيقات
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-[#f6fbfb] p-3">
                      <span className="text-[10px] font-bold text-slate-500">الخطوة التالية</span>
                      <p className="mt-1 text-xs font-bold text-slate-900">
                        راجع الملخص ثم أجب عن التدريب
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-900">خريطة الفهم</h3>
                    <span className="text-[10px] font-bold text-teal-700">أربع خطوات</span>
                  </div>
                  <ol className="space-y-0">
                    {lessonRoadmap.map((step, index) => (
                      <li key={step.label} className="relative flex gap-3 pb-4 last:pb-0">
                        {index < lessonRoadmap.length - 1 && (
                          <span className="absolute right-[11px] top-6 h-full w-px bg-slate-200" />
                        )}
                        <span
                          className={`relative z-10 mt-0.5 grid h-6 w-6 place-items-center rounded-full text-[10px] font-black text-white ${step.tone}`}
                        >
                          {index + 1}
                        </span>
                        <span>
                          <strong className="block text-xs text-slate-900">{step.label}</strong>
                          <small className="mt-0.5 block text-[11px] leading-5 text-slate-500">
                            {step.detail}
                          </small>
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </section>
          )}

          {activeItem.type === "reading" &&
            activeItem.readingContent &&
            (() => {
              const totalSections = activeItem.readingContent.sections.length;
              return (
                <article className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  {/* ── Document Top Header ── */}
                  <div className="bg-slate-900 px-6 py-5 text-white">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-slate-300 border-slate-700 bg-slate-800 text-[10px] gap-1"
                        >
                          <BookOpen className="h-3 w-3 text-blue-400" /> مذكرة وشرح أكاديمي
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-slate-300 border-slate-700 text-[10px] gap-1"
                        >
                          <Clock className="h-3 w-3" /> {activeItem.durationOrEstimate}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-slate-300 border-slate-700 text-[10px]"
                        >
                          {totalSections} أجزاء رئيسية
                        </Badge>
                      </div>
                      <h2 className="text-lg font-black tracking-tight leading-snug">
                        {activeItem.title}
                      </h2>
                      {activeItem.pdfTitle && (
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <FileText className="h-3.5 w-3.5 text-slate-400" />
                          <span>{activeItem.pdfTitle}</span>
                          <span>({activeItem.pdfSize})</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Document Content Body ── */}
                  <div className="p-6 space-y-6">
                    {/* Introduction section */}
                    <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-4 space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-700 block">
                        المقدمة والتمهيد:
                      </span>
                      <p className="text-xs text-slate-600 leading-[1.9]">
                        {activeItem.readingContent.introduction}
                      </p>
                    </div>

                    {/* Numbered Sections */}
                    <div className="space-y-6">
                      {activeItem.readingContent.sections.map((sec, idx) => (
                        <section
                          key={idx}
                          className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs"
                        >
                          {/* Section Title Bar */}
                          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200/80 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <span className="grid h-6 w-6 place-items-center rounded bg-slate-900 text-white text-[11px] font-bold flex-none">
                                {idx + 1}
                              </span>
                              <h3 className="text-sm font-bold text-slate-900">{sec.heading}</h3>
                            </div>
                            <span className="text-[10px] font-semibold text-slate-500">
                              الجزء {idx + 1} من {totalSections}
                            </span>
                          </div>

                          <div className="p-4 space-y-4">
                            {/* Body explanation */}
                            <p className="text-xs text-slate-700 leading-[1.9]">{sec.body}</p>

                            {/* Structured Table */}
                            {sec.table && (
                              <div className="overflow-x-auto rounded-lg border border-slate-200">
                                <table className="w-full text-right text-[11px]">
                                  <thead className="bg-slate-100 text-slate-800 border-b border-slate-200 font-bold">
                                    <tr>
                                      {sec.table.headers.map((h, i) => (
                                        <th key={i} className="p-3 font-semibold text-[11px]">
                                          {h}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {sec.table.rows.map((row, rIdx) => (
                                      <tr key={rIdx} className="hover:bg-slate-50/60">
                                        {row.map((cell, cIdx) => (
                                          <td
                                            key={cIdx}
                                            className={`p-3 text-slate-700 ${cIdx === 0 ? "font-bold text-slate-900" : ""}`}
                                          >
                                            {cell}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}

                            {/* Examples & Evidence */}
                            {sec.examples && (
                              <div className="space-y-2">
                                <span className="text-[11px] font-bold text-slate-800 block">
                                  الشواهد والأمثلة التوضيحية:
                                </span>
                                <div className="grid gap-2.5 sm:grid-cols-2">
                                  {sec.examples.map((ex, eIdx) => (
                                    <div
                                      key={eIdx}
                                      className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 space-y-1.5"
                                    >
                                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded inline-block">
                                        {ex.label}
                                      </span>
                                      <p className="text-[11px] font-semibold text-slate-900 leading-relaxed">
                                        {ex.text}
                                      </p>
                                      {ex.breakdown && (
                                        <p className="text-[10px] text-slate-600 border-t border-slate-200/60 pt-1.5 mt-1 leading-relaxed">
                                          <strong>التحليل:</strong> {ex.breakdown}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Exam Caution Note */}
                            {sec.warningNotice && (
                              <div className="rounded-lg bg-amber-50/60 border border-amber-200 p-3 text-[11px] text-amber-900 flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-amber-600 flex-none mt-0.5" />
                                <div className="leading-relaxed">
                                  <strong>تنبيه للامتحان:</strong> {sec.warningNotice}
                                </div>
                              </div>
                            )}
                          </div>
                        </section>
                      ))}
                    </div>

                    {/* Summary Box */}
                    <div className="rounded-lg bg-slate-100 p-4 border border-slate-200 space-y-1">
                      <span className="text-[11px] font-bold text-slate-900 block">الخلاصة:</span>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {activeItem.readingContent.summary}
                      </p>
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-200">
                      {activeItem.pdfTitle && (
                        <div className="flex items-center gap-2.5">
                          <span className="grid h-8 w-8 place-items-center rounded bg-slate-100 text-slate-700 flex-none border border-slate-200">
                            <FileText className="h-4 w-4" />
                          </span>
                          <div className="text-xs">
                            <strong className="text-slate-800 block truncate max-w-[240px]">
                              {activeItem.pdfTitle}
                            </strong>
                            <small className="text-slate-500">
                              {activeItem.pdfSize} · ملف PDF جاهز للطباعة
                            </small>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => alert(`جاري تنزيل: ${activeItem.pdfTitle}`)}
                            className="gap-1 text-xs font-bold text-slate-700 h-8 mr-2"
                          >
                            <Download className="h-3.5 w-3.5" />
                            تحميل الملف
                          </Button>
                        </div>
                      )}
                      <Button
                        size="sm"
                        onClick={() => toggleItemCompleted(activeItem.id)}
                        className={`gap-1.5 font-bold text-xs h-8 px-4 ${
                          completedMap[activeItem.id]
                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {completedMap[activeItem.id]
                          ? "تمت القراءة بنجاح ✓"
                          : "تأكيد إتمام القراءة"}
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })()}

          {/* ════════════ CASE C & D: QUIZ / EXAM (Coursera Professional) ════════════ */}
          {(activeItem.type === "quiz" || activeItem.type === "exam") &&
            activeItem.quizQuestions &&
            (() => {
              const totalQ = activeItem.quizQuestions.length;
              const answeredQ = Object.keys(selectedAnswers).length;
              const answeredPercent = Math.round((answeredQ / totalQ) * 100);
              const isExam = activeItem.type === "exam";
              const correctCount = quizSubmitted
                ? activeItem.quizQuestions.filter((q) => selectedAnswers[q.id] === q.correctIndex)
                    .length
                : 0;
              const scorePercent = quizSubmitted ? Math.round((correctCount / totalQ) * 100) : 0;
              const passed = scorePercent >= (isExam ? 80 : 60);

              return (
                <div className="rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                  {/* ── Exam Hero Header ── */}
                  <div className="bg-slate-900 px-6 py-5 text-white">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`font-bold text-[10px] gap-1 ${
                            isExam
                              ? "text-emerald-400 border-emerald-700/80 bg-emerald-950/40"
                              : "text-amber-400 border-amber-700/80 bg-amber-950/40"
                          }`}
                        >
                          {isExam ? (
                            <>
                              <Trophy className="h-3 w-3" /> امتحان وزاري شامل ومحاكي
                            </>
                          ) : (
                            <>
                              <HelpCircle className="h-3 w-3" /> كويز تدريبي فوري
                            </>
                          )}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-slate-300 border-slate-700 text-[10px] gap-1"
                        >
                          <Clock className="h-3 w-3" /> {activeItem.durationOrEstimate}
                        </Badge>
                        {isExam && (
                          <Badge
                            variant="outline"
                            className="text-slate-300 border-slate-700 text-[10px]"
                          >
                            درجة الاجتياز 80%
                          </Badge>
                        )}
                      </div>
                      <h2 className="text-lg font-black tracking-tight leading-snug">
                        {activeItem.title}
                      </h2>

                      {/* Stats row */}
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5">
                          <span className="text-slate-400">إجمالي الأسئلة:</span>
                          <strong className="text-white font-bold">{totalQ} سؤال</strong>
                        </div>
                        <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5">
                          <span className="text-slate-400">تم الإجابة:</span>
                          <strong
                            className={answeredQ === totalQ ? "text-emerald-400" : "text-amber-400"}
                          >
                            {answeredQ}/{totalQ}
                          </strong>
                        </div>
                        {quizSubmitted && (
                          <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5">
                            <span className="text-slate-400">النتيجة:</span>
                            <strong className={passed ? "text-emerald-400" : "text-red-400"}>
                              {scorePercent}% ({correctCount}/{totalQ})
                            </strong>
                          </div>
                        )}
                      </div>

                      {/* Progress bar */}
                      {!quizSubmitted && (
                        <div className="flex items-center gap-3 pt-1">
                          <Progress value={answeredPercent} className="h-1.5 bg-slate-800 flex-1" />
                          <span className="text-[10px] font-bold text-slate-400">
                            {answeredPercent}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Result Banner (after submission) ── */}
                  {quizSubmitted && (
                    <div
                      className={`px-5 py-4 flex flex-wrap items-center justify-between gap-3 border-b ${
                        passed ? "bg-slate-50 border-emerald-200" : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`grid h-10 w-10 place-items-center rounded-lg ${
                            passed ? "bg-emerald-600 text-white" : "bg-slate-700 text-white"
                          }`}
                        >
                          {passed ? (
                            <Trophy className="h-5 w-5" />
                          ) : (
                            <AlertCircle className="h-5 w-5" />
                          )}
                        </span>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">
                            {passed
                              ? "تم اجتياز الاختبار بنجاح"
                              : "يمكنك مراجعة الإجابات وإعادة المحاولة"}
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {passed
                              ? `حققت ${scorePercent}% (${correctCount} من ${totalQ} إجابات صحيحة).`
                              : `حققت ${scorePercent}% والدرجة المطلوبة هي ${isExam ? "80%" : "60%"}.`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-center">
                        <div>
                          <strong className="block text-xl font-black text-emerald-700">
                            {correctCount}
                          </strong>
                          <small className="text-[10px] text-slate-500 font-medium">صحيحة</small>
                        </div>
                        <div>
                          <strong className="block text-xl font-black text-red-600">
                            {totalQ - correctCount}
                          </strong>
                          <small className="text-[10px] text-slate-500 font-medium">خاطئة</small>
                        </div>
                        <div className="border-r border-slate-200 pr-5">
                          <strong
                            className={`block text-2xl font-black ${passed ? "text-emerald-700" : "text-slate-800"}`}
                          >
                            {scorePercent}%
                          </strong>
                          <small className="text-[10px] text-slate-500 font-medium">النسبة</small>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Question Navigation Map ── */}
                  <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/80">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-slate-500 flex-none">
                        الأسئلة:
                      </span>
                      {activeItem.quizQuestions.map((q, idx) => {
                        const userAns = selectedAnswers[q.id];
                        const answered = userAns !== undefined;
                        const correct = answered && userAns === q.correctIndex;
                        let dotStyle =
                          "bg-white border-slate-300 text-slate-600 hover:bg-slate-100";
                        if (quizSubmitted) {
                          dotStyle = correct
                            ? "bg-emerald-100 border-emerald-500 text-emerald-800"
                            : answered
                              ? "bg-red-100 border-red-500 text-red-800"
                              : "bg-slate-100 border-slate-300 text-slate-500";
                        } else if (answered) {
                          dotStyle = "bg-blue-100 border-blue-500 text-blue-800";
                        }
                        return (
                          <button
                            key={q.id}
                            type="button"
                            onClick={() =>
                              document
                                .getElementById(`rcq-${q.id}`)
                                ?.scrollIntoView({ behavior: "smooth", block: "center" })
                            }
                            className={`h-7 w-7 rounded-lg border text-[10px] font-bold transition-all shadow-sm ${dotStyle}`}
                          >
                            {idx + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── Questions List ── */}
                  <div className="p-5 space-y-5">
                    {activeItem.quizQuestions.map((q, idx) => {
                      const userAnswer = selectedAnswers[q.id];
                      const isAnswered = userAnswer !== undefined;
                      const isCorrect = isAnswered && userAnswer === q.correctIndex;

                      return (
                        <div
                          id={`rcq-${q.id}`}
                          key={q.id}
                          className={`rounded-xl border-2 overflow-hidden transition-all ${
                            quizSubmitted
                              ? isCorrect
                                ? "border-emerald-300 bg-emerald-50/30 shadow-emerald-100"
                                : isAnswered
                                  ? "border-red-300 bg-red-50/30 shadow-red-100"
                                  : "border-slate-200 bg-slate-50/30"
                              : isAnswered
                                ? "border-blue-300 bg-blue-50/20 shadow-blue-50"
                                : "border-slate-200 bg-white hover:border-slate-300"
                          } shadow-sm`}
                        >
                          {/* Question header */}
                          <div
                            className={`px-4 py-3 flex items-start gap-3 ${
                              quizSubmitted
                                ? isCorrect
                                  ? "bg-emerald-100/60"
                                  : isAnswered
                                    ? "bg-red-100/60"
                                    : "bg-slate-100/60"
                                : "bg-slate-50/80"
                            }`}
                          >
                            <span
                              className={`grid h-8 w-8 place-items-center rounded-xl text-[11px] font-black flex-none shadow-sm ${
                                quizSubmitted
                                  ? isCorrect
                                    ? "bg-emerald-600 text-white"
                                    : isAnswered
                                      ? "bg-red-600 text-white"
                                      : "bg-slate-500 text-white"
                                  : "bg-slate-800 text-white"
                              }`}
                            >
                              {quizSubmitted
                                ? isCorrect
                                  ? "✓"
                                  : isAnswered
                                    ? "✗"
                                    : idx + 1
                                : idx + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge
                                  variant="outline"
                                  className="text-[9px] font-bold text-slate-500 border-slate-200"
                                >
                                  السؤال {idx + 1} من {totalQ}
                                </Badge>
                                {isExam && (
                                  <Badge
                                    variant="outline"
                                    className={`text-[9px] font-bold ${
                                      idx < 3
                                        ? "text-blue-600 border-blue-200 bg-blue-50"
                                        : idx < 7
                                          ? "text-amber-600 border-amber-200 bg-amber-50"
                                          : "text-red-600 border-red-200 bg-red-50"
                                    }`}
                                  >
                                    {idx < 3 ? "سهل" : idx < 7 ? "متوسط" : "صعب"}
                                  </Badge>
                                )}
                              </div>
                              <h4 className="text-[12px] font-bold text-slate-900 leading-[1.7]">
                                {q.question}
                              </h4>
                            </div>
                          </div>

                          {/* Options */}
                          <div className="px-4 py-3 space-y-2">
                            {q.options.map((opt, optIdx) => {
                              const isSelected = userAnswer === optIdx;
                              const isCorrectOpt = optIdx === q.correctIndex;

                              let optClass =
                                "bg-white border-slate-200 text-slate-800 hover:bg-slate-50 hover:border-slate-300";
                              let iconArea = null;

                              if (isSelected && !quizSubmitted) {
                                optClass =
                                  "bg-blue-50 border-blue-500 text-blue-900 font-bold ring-2 ring-blue-100 shadow-sm";
                              } else if (quizSubmitted) {
                                if (isCorrectOpt) {
                                  optClass =
                                    "bg-emerald-50 border-emerald-500 text-emerald-900 font-bold shadow-sm";
                                  iconArea = (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-none" />
                                  );
                                } else if (isSelected && !isCorrect) {
                                  optClass = "bg-red-50 border-red-400 text-red-800 font-bold";
                                  iconArea = <XCircle className="h-4 w-4 text-red-500 flex-none" />;
                                }
                              }

                              return (
                                <button
                                  key={optIdx}
                                  type="button"
                                  onClick={() => handleSelectQuizAnswer(q.id, optIdx)}
                                  disabled={quizSubmitted}
                                  className={`w-full p-3 rounded-xl text-right text-[11px] border-2 transition-all flex items-center gap-3 ${optClass}`}
                                >
                                  <span
                                    className={`grid h-7 w-7 place-items-center rounded-lg text-[11px] font-black flex-none border ${
                                      isSelected && !quizSubmitted
                                        ? "bg-blue-600 text-white border-blue-600"
                                        : quizSubmitted && isCorrectOpt
                                          ? "bg-emerald-600 text-white border-emerald-600"
                                          : quizSubmitted && isSelected && !isCorrect
                                            ? "bg-red-500 text-white border-red-500"
                                            : "bg-slate-100 text-slate-600 border-slate-200"
                                    }`}
                                  >
                                    {["أ", "ب", "ج", "د"][optIdx]}
                                  </span>
                                  <span className="flex-1 leading-relaxed">{opt}</span>
                                  {iconArea}
                                </button>
                              );
                            })}
                          </div>

                          {/* Detailed Explanation */}
                          {quizSubmitted && (
                            <div className="mx-4 mb-4">
                              <div
                                className={`rounded-xl p-4 space-y-2 ${
                                  isCorrect
                                    ? "bg-gradient-to-l from-emerald-50 to-green-50 border border-emerald-200"
                                    : "bg-gradient-to-l from-blue-50 to-indigo-50 border border-blue-200"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`grid h-6 w-6 place-items-center rounded-lg ${
                                      isCorrect ? "bg-emerald-500" : "bg-blue-500"
                                    } text-white`}
                                  >
                                    {isCorrect ? (
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                    ) : (
                                      <BookOpen className="h-3.5 w-3.5" />
                                    )}
                                  </span>
                                  <strong
                                    className={`text-[11px] font-black ${isCorrect ? "text-emerald-800" : "text-blue-800"}`}
                                  >
                                    {isCorrect
                                      ? "✓ أحسنت! إجابة صحيحة"
                                      : "📖 الإجابة الصحيحة والتفسير"}
                                  </strong>
                                </div>
                                {!isCorrect && (
                                  <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-800 bg-emerald-100/60 rounded-lg px-3 py-1.5 border border-emerald-200">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                    الإجابة الصحيحة:{" "}
                                    <strong>
                                      {["أ", "ب", "ج", "د"][q.correctIndex]} -{" "}
                                      {q.options[q.correctIndex]}
                                    </strong>
                                  </div>
                                )}
                                <div className="bg-white/80 rounded-lg p-3 border border-slate-100">
                                  <span className="text-[10px] font-black text-slate-500 block mb-1">
                                    💡 التفسير والتحليل النحوي:
                                  </span>
                                  <p className="text-[11px] text-slate-700 leading-[1.8]">
                                    {q.explanation}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* ── Submit / Reset Footer ── */}
                  <div className="px-5 py-4 border-t border-slate-200 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3">
                    {!quizSubmitted ? (
                      <>
                        <div className="text-[11px] text-slate-500">
                          أجبت عن <strong className="text-slate-900">{answeredQ}</strong> من{" "}
                          <strong className="text-slate-900">{totalQ}</strong> سؤال
                          {answeredQ < totalQ && (
                            <span className="text-amber-600 font-bold mr-1">
                              {" "}
                              · تبقى {totalQ - answeredQ} أسئلة
                            </span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={handleSubmitQuiz}
                          disabled={answeredQ < totalQ}
                          className={`gap-1.5 font-bold text-white px-6 text-xs shadow-md h-10 ${
                            isExam
                              ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                              : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                          }`}
                        >
                          <Send className="h-3.5 w-3.5" />
                          {isExam ? "تسليم الامتحان النهائي" : "تسليم الاختبار"}
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleResetQuiz}
                            className="gap-1.5 font-bold text-[11px] h-9"
                          >
                            <RotateCcw className="h-3 w-3" />
                            إعادة المحاولة
                          </Button>
                          <span
                            className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border ${
                              passed
                                ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                                : "text-amber-700 bg-amber-50 border-amber-200"
                            }`}
                          >
                            {passed
                              ? "🎉 تم اجتياز الاختبار وحفظ النتيجة!"
                              : "📖 راجع الشرح وأعد المحاولة للتحسين"}
                          </span>
                        </div>
                        {nextItem && (
                          <Button
                            size="sm"
                            onClick={() => navigateTo(nextItem)}
                            className="gap-1 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 h-9 shadow-sm"
                          >
                            الدرس التالي
                            <ChevronLeft className="h-3 w-3" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })()}

          {/* ╔══════════════════════════════════════════════════════════╗
              ║  4. LESSON DETAILS SUB-TABS (Coursera Style)            ║
              ╚══════════════════════════════════════════════════════════╝ */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <Tabs value={activeSubTab} onValueChange={setActiveSubTab} dir="rtl">
              <TabsList className="grid grid-cols-5 w-full bg-slate-100/90 p-0.5 rounded-lg">
                <TabsTrigger
                  value="overview"
                  className="text-[11px] font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  أهداف التعلم
                </TabsTrigger>
                <TabsTrigger
                  value="chapters"
                  className="text-[11px] font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  محطات الدرس
                </TabsTrigger>
                <TabsTrigger
                  value="notes"
                  className="text-[11px] font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  مفكرتي الخاصة
                </TabsTrigger>
                <TabsTrigger
                  value="resources"
                  className="text-[11px] font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  المذكرات (PDF)
                </TabsTrigger>
                <TabsTrigger
                  value="qa"
                  className="text-[11px] font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  النقاشات ({questions.length})
                </TabsTrigger>
              </TabsList>

              {/* Sub-Tab 1: Overview */}
              <TabsContent value="overview" className="mt-3 space-y-3">
                {activeItem.objectives && (
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      نواتج التعلم المستهدفة:
                    </h3>
                    <ul className="space-y-1 text-xs text-slate-700">
                      {activeItem.objectives.map((obj, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-none mt-0.5" />
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {activeItem.keyPoints && (
                  <div className="rounded-lg bg-blue-50/70 border border-blue-100 p-3 space-y-1.5">
                    <h4 className="text-[10px] font-black text-blue-900 flex items-center gap-1">
                      <Lightbulb className="h-3 w-3 text-blue-600" />
                      توصيات الأستاذ عُبيدة للامتحان:
                    </h4>
                    <ul className="space-y-0.5 text-[11px] text-blue-800 leading-relaxed">
                      {activeItem.keyPoints.map((kp, i) => (
                        <li key={i}>• {kp}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </TabsContent>

              {/* Sub-Tab 2: Chapters / Timestamps */}
              <TabsContent value="chapters" className="mt-3 space-y-2">
                <p className="text-[11px] text-slate-500">
                  انقر على أي محطة للانتقال المباشر إليها داخل الفيديو:
                </p>
                <div className="space-y-1.5">
                  {lessonChapters.map((ch, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => seekToTime(ch.seconds)}
                      className="w-full p-2.5 rounded-lg border border-slate-200/80 bg-slate-50/70 hover:bg-blue-50 hover:border-blue-300 text-right flex items-center justify-between transition group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                          {ch.time}
                        </span>
                        <span className="text-xs font-semibold text-slate-800 group-hover:text-blue-900">
                          {ch.title}
                        </span>
                      </div>
                      <Play className="h-3 w-3 text-slate-400 group-hover:text-blue-600" />
                    </button>
                  ))}
                </div>
              </TabsContent>

              {/* Sub-Tab 3: Notes (Personal notebook) */}
              <TabsContent value="notes" className="mt-3 space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                    placeholder="دوّن ملاحظة سريعة في هذه اللحظة من الفيديو..."
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button
                    size="sm"
                    onClick={handleAddNote}
                    className="gap-1 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 h-8"
                  >
                    <Plus className="h-3 w-3" />
                    حفظ الملاحظة
                  </Button>
                </div>

                {notes.length > 0 ? (
                  <div className="space-y-1.5">
                    {notes.map((note) => (
                      <div
                        key={note.id}
                        className="rounded-lg border border-slate-200 bg-slate-50/80 p-2.5 flex items-start justify-between gap-2"
                      >
                        <div className="space-y-0.5">
                          <span className="font-mono text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                            {note.time}
                          </span>
                          <p className="text-xs text-slate-800 font-medium">{note.text}</p>
                          <small className="text-[9px] text-slate-400">{note.createdAt}</small>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-slate-400 hover:text-red-600 p-1 transition"
                          title="حذف الملاحظة"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">
                    لم تدون أي ملاحظات بعد. اكتب ملاحظاتك الخاصة لتستذكرها قبل الامتحان!
                  </p>
                )}
              </TabsContent>

              {/* Sub-Tab 4: Resources & PDFs */}
              <TabsContent value="resources" className="mt-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-red-100 text-red-600 flex-none">
                      <FileText className="h-4 w-4" />
                    </span>
                    <div>
                      <strong className="block text-xs font-bold text-slate-900">
                        {activeItem.pdfTitle || "مذكرة الشرح الوافي للدرس.pdf"}
                      </strong>
                      <small className="text-[10px] text-slate-500">
                        {activeItem.pdfSize || "3.5 ميجابايت"} · نسخة عالية الجودة ملونة
                      </small>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      alert(`جاري تنزيل ملف: ${activeItem.pdfTitle || "مذكرة الدرس"}`);
                    }}
                    className="gap-1 text-[10px] font-bold bg-slate-900 hover:bg-slate-800 h-7"
                  >
                    <Download className="h-3 w-3" />
                    تحميل
                  </Button>
                </div>
              </TabsContent>

              {/* Sub-Tab 5: Community Discussions & Q&A */}
              <TabsContent value="qa" className="mt-3 space-y-3">
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-0.5">
                  {questions.map((q) => (
                    <div
                      key={q.id}
                      className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <div className="h-6 w-6 rounded-full bg-blue-600 text-white font-bold text-[10px] grid place-items-center flex-none">
                            {q.author[0]}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <strong className="text-slate-900">{q.author}</strong>
                              <span className="text-slate-400">({q.role})</span>
                              <span className="text-slate-300">·</span>
                              <span className="text-slate-400">{q.time}</span>
                            </div>
                            <p className="text-[11px] text-slate-800 font-medium mt-1">{q.text}</p>
                          </div>
                        </div>

                        {/* Upvote button */}
                        <button
                          type="button"
                          onClick={() => handleToggleUpvote(q.id)}
                          className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border transition ${
                            q.userUpvoted
                              ? "bg-blue-50 border-blue-300 text-blue-700"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <ThumbsUp className="h-3 w-3" />
                          <span>{q.upvotes}</span>
                        </button>
                      </div>

                      {/* Verified Teacher Reply */}
                      {q.reply && (
                        <div className="mr-6 rounded-lg bg-blue-50/90 border border-blue-100 p-2.5 space-y-0.5">
                          <div className="flex items-center gap-1 text-[10px] font-bold text-blue-900">
                            <GraduationCap className="h-3.5 w-3.5 text-blue-600" />
                            {q.reply.author}
                            <Badge className="bg-blue-600 text-white text-[8px] h-3.5 px-1 font-bold mr-1">
                              إجابة معتمدة ✓
                            </Badge>
                          </div>
                          <p className="text-[11px] text-blue-800 leading-relaxed">
                            {q.reply.text}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Question Input */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  <input
                    type="text"
                    value={newQuestionText}
                    onChange={(e) => setNewQuestionText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddQuestion()}
                    placeholder="اطرح استفسارك الأكاديمي وسيجيبك الأستاذ عُبيدة مباشرة..."
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button
                    size="sm"
                    onClick={handleAddQuestion}
                    className="gap-1 text-[10px] font-bold bg-blue-600 hover:bg-blue-700 h-7"
                  >
                    <Send className="h-3 w-3" />
                    إرسال
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* ── Next Lesson Card ── */}
          {nextItem && (
            <div className="rounded-xl border border-slate-200 bg-gradient-to-l from-blue-50/50 to-white p-4 flex items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-100 text-blue-600 flex-none">
                  {React.createElement(ITEM_META[nextItem.type].icon, { className: "h-4 w-4" })}
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-500">الدرس التالي:</span>
                  <p className="text-xs font-bold text-slate-800 truncate">{nextItem.title}</p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => navigateTo(nextItem)}
                className="gap-1 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 h-8 flex-none shadow-sm"
              >
                الانتقال للدرس
                <ChevronLeft className="h-3 w-3" />
              </Button>
            </div>
          )}
        </main>
      </div>

      {/* ╔══════════════════════════════════════════════════════════╗
          ║  5. OFFICIAL COURSERA CERTIFICATE MODAL               ║
          ╚══════════════════════════════════════════════════════════╝ */}
      <Dialog open={certificateOpen} onOpenChange={setCertificateOpen}>
        <DialogContent
          className="max-w-2xl p-0 overflow-hidden border-2 border-amber-300 shadow-2xl rounded-2xl bg-white"
          dir="rtl"
        >
          <div className="p-8 bg-gradient-to-br from-amber-50/80 via-white to-blue-50/60 border-8 border-double border-amber-200 m-2 rounded-xl text-center space-y-6 relative print:border-none">
            {/* Golden Seal Badge */}
            <div className="absolute top-4 left-6 hidden sm:block">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 p-1 shadow-lg text-white grid place-items-center">
                <div className="h-full w-full rounded-full border-2 border-dashed border-white grid place-items-center text-center p-1">
                  <Trophy className="h-6 w-6 text-white mb-0.5" />
                  <span className="text-[8px] font-black uppercase">معتمد 2026</span>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <span className="inline-block text-[11px] font-black tracking-widest text-amber-700 uppercase bg-amber-100 px-3 py-1 rounded-full">
                جمهورية مصر العربية · منصة الأستاذ عُبيدة
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-2">
                شهادة إتمام وتفوق أكاديمي معتمدة
              </h2>
              <p className="text-xs text-slate-500 font-semibold">
                توثيق رسمي لاجتياز منهاج اللغة العربية للثانوية العامة
              </p>
            </div>

            <div className="py-2 space-y-3">
              <p className="text-sm text-slate-600">يشهد الأستاذ عُبيدة بأن الطالب / الطالبة:</p>
              <div className="inline-block px-6 py-2 border-b-2 border-amber-500 bg-amber-50/50 rounded-lg">
                <span className="text-2xl font-black text-blue-900">{studentName}</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed max-w-lg mx-auto">
                قد أتم بنجاح واقتدار كافة متطلبات دراسة{" "}
                <strong>منهاج النخبة الشامل في اللغة العربية (الثانوية العامة - دفعة 2026)</strong>{" "}
                بنسبة إنجاز <strong>{overallPercentage}%</strong> واجتياز كافة التدريبات ونماذج
                البابل شيت بنجاح وتفوق.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-amber-200/80 text-xs text-slate-600">
              <div>
                <span className="block text-[10px] text-slate-400">كود التحقق الأكاديمي</span>
                <strong className="font-mono text-slate-800 text-[11px]">
                  CERT-OBAIDA-2026-{Math.abs(studentName.length * 37 + 104)}
                </strong>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400">تاريخ الإصدار</span>
                <strong className="text-slate-800 text-[11px]">نوفمبر 2026</strong>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400">توقيع المعلم المشرف</span>
                <strong className="font-serif text-blue-900 text-sm italic">الأستاذ عُبيدة</strong>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-3 print:hidden">
              <Button
                onClick={() => window.print()}
                className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-9 shadow-sm"
              >
                <Printer className="h-4 w-4" />
                طباعة الشهادة
              </Button>
              <Button
                variant="outline"
                onClick={() => setCertificateOpen(false)}
                className="text-xs h-9"
              >
                إغلاق
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ╔══════════════════════════════════════════════════════════╗
          ║  6. TEACHER ADD LESSON DIALOG                          ║
          ╚══════════════════════════════════════════════════════════╝ */}
      <Dialog open={newLessonDialogOpen} onOpenChange={setNewLessonDialogOpen}>
        <DialogContent className="max-w-md p-5 rounded-2xl bg-white" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-slate-900">
              إضافة درس أو محاضرة جديدة للمنهاج
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">عنوان الدرس</label>
              <input
                type="text"
                placeholder="مثال: إعمال صيغ المبالغة وأسرار الامتحان..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">نوع المحتوى</label>
              <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="video">محاضرة فيديو (FHD)</option>
                <option value="reading">مستند وثائقي وقراءة</option>
                <option value="quiz">كويز تدريبي فوري</option>
                <option value="exam">امتحان شامل</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">رابط الفيديو أو الملف</label>
              <input
                type="text"
                placeholder="https://..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">المدة المقدرة</label>
              <input
                type="text"
                placeholder="مثال: 45 دقيقة"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button
              onClick={() => {
                alert("تم إضافة الدرس بنجاح ونشره لكافة الطلاب المسجلين!");
                setNewLessonDialogOpen(false);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
            >
              حفظ ونشر الدرس
            </Button>
            <Button
              variant="outline"
              onClick={() => setNewLessonDialogOpen(false)}
              className="text-xs"
            >
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
