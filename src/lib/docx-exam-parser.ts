import JSZip from "jszip";

const WORD_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

export type ImportedMcqQuestion = {
  prompt: string;
  options: { label: string; is_correct: boolean }[];
};

export type ImportedDocxExam = {
  suggestedTitle: string;
  questions: ImportedMcqQuestion[];
  warnings: string[];
};

type ParagraphLine = {
  text: string;
  highlighted: boolean;
  numberedListId: string | null;
  centered: boolean;
  bold: boolean;
};

function wordAttribute(node: Element | undefined, name: string) {
  if (!node) return null;
  return node.getAttributeNS(WORD_NS, name) ?? node.getAttribute(`w:${name}`);
}

function paragraphLines(xml: string): ParagraphLine[] {
  const documentXml = new DOMParser().parseFromString(xml, "application/xml");
  if (documentXml.querySelector("parsererror")) throw new Error("invalid_docx_xml");

  return Array.from(documentXml.getElementsByTagNameNS(WORD_NS, "p"))
    .map((paragraph) => {
      const text = Array.from(paragraph.getElementsByTagNameNS(WORD_NS, "t"))
        .map((node) => node.textContent ?? "")
        .join("")
        .replace(/\u00a0/g, " ")
        .replace(/[ \t]+/g, " ")
        .trim();
      const listId = paragraph.getElementsByTagNameNS(WORD_NS, "numId")[0];
      const alignment = paragraph.getElementsByTagNameNS(WORD_NS, "jc")[0];
      const highlights = Array.from(paragraph.getElementsByTagNameNS(WORD_NS, "highlight"));
      const shadings = Array.from(paragraph.getElementsByTagNameNS(WORD_NS, "shd"));
      const bold = paragraph.getElementsByTagNameNS(WORD_NS, "b").length > 0;
      const highlighted =
        highlights.some((node) => {
          const value = (wordAttribute(node, "val") ?? "").toLowerCase();
          return value === "yellow" || value === "darkyellow";
        }) ||
        shadings.some((node) => {
          const fill = (wordAttribute(node, "fill") ?? "").toLowerCase();
          return fill === "ffff00" || fill === "yellow";
        });

      return {
        text,
        highlighted,
        numberedListId: wordAttribute(listId, "val"),
        centered: wordAttribute(alignment, "val") === "center",
        bold,
      };
    })
    .filter((line) => line.text.length > 0);
}

function isSectionHeading(line: ParagraphLine) {
  return (
    line.centered ||
    /^(?:المُ?حاضرة|أسئلة\s+على\s+ما\s+سبق|أسئلة\s+على\s*\(|إضافة\s+سؤال|النصوص\s+كما\s+هي|القراءة\s*:)/u.test(
      line.text,
    )
  );
}

/**
 * Reads the academy's Word format: every question is followed by four list
 * items. A yellow highlight is optional; missing answers are selected later
 * from the import preview.
 */
export async function parseDocxExam(file: File): Promise<ImportedDocxExam> {
  if (!/\.docx$/i.test(file.name)) throw new Error("docx_only");
  if (file.size > 15 * 1024 * 1024) throw new Error("docx_too_large");

  const archive = await JSZip.loadAsync(await file.arrayBuffer());
  const documentEntry = archive.file("word/document.xml");
  if (!documentEntry) throw new Error("invalid_docx");
  const lines = paragraphLines(await documentEntry.async("string"));
  if (!lines.length) throw new Error("empty_docx");

  const optionGroups: { start: number; end: number; lines: ParagraphLine[] }[] = [];
  const highlightedIndexes = lines
    .map((line, index) => (line.highlighted ? index : -1))
    .filter((index) => index >= 0);
  let lastOptionEnd = 0;

  for (const highlightedIndex of highlightedIndexes) {
    const candidates: { start: number; end: number; lines: ParagraphLine[]; score: number }[] = [];
    for (let start = highlightedIndex - 3; start <= highlightedIndex; start += 1) {
      if (start < lastOptionEnd || start < 0 || start + 3 >= lines.length) continue;
      const group = lines.slice(start, start + 4);
      if (group.filter((line) => line.highlighted).length !== 1) continue;
      const numberedCount = group.filter((line) => line.numberedListId !== null).length;
      if (numberedCount < 3) continue;

      const nonAnswerBoldCount = group.filter((line) => line.bold && !line.highlighted).length;
      const centeredCount = group.filter((line) => line.centered).length;
      const listIds = new Set(group.map((line) => line.numberedListId).filter(Boolean));
      const score =
        nonAnswerBoldCount * 1000 +
        centeredCount * 500 +
        (4 - numberedCount) * 250 +
        Math.max(0, listIds.size - 1) * 40 +
        group.reduce((sum, line) => sum + line.text.length, 0);
      candidates.push({ start, end: start + 4, lines: group, score });
    }
    candidates.sort((a, b) => a.score - b.score || a.start - b.start);
    if (candidates[0]) {
      optionGroups.push(candidates[0]);
      lastOptionEnd = candidates[0].end;
    }
  }

  // Import four-item Word lists even when the teacher did not highlight an
  // answer. The preview will ask for the correct option before publishing.
  // Keep the stricter highlighted-answer detection above because it also
  // handles documents whose list metadata is slightly inconsistent.
  const occupiedIndexes = new Set(
    optionGroups.flatMap((group) =>
      Array.from({ length: group.end - group.start }, (_, index) => group.start + index),
    ),
  );
  for (let start = 0; start < lines.length; ) {
    const listId = lines[start].numberedListId;
    if (!listId) {
      start += 1;
      continue;
    }

    let end = start + 1;
    while (end < lines.length && lines[end].numberedListId === listId) end += 1;
    const groupLines = lines.slice(start, end);
    const overlapsKnownGroup = Array.from({ length: end - start }, (_, index) => start + index).some(
      (index) => occupiedIndexes.has(index),
    );
    if (
      groupLines.length === 4 &&
      groupLines.every((line) => !line.highlighted) &&
      !overlapsKnownGroup
    ) {
      optionGroups.push({ start, end, lines: groupLines });
    }
    start = end;
  }
  optionGroups.sort((a, b) => a.start - b.start);

  const questions: ImportedMcqQuestion[] = [];
  const warnings: string[] = [];
  let previousEnd = 0;

  for (const group of optionGroups) {
    const beforeOptions = lines.slice(previousEnd, group.start);
    let promptStart = -1;
    for (let i = beforeOptions.length - 1; i >= 0; i -= 1) {
      if (beforeOptions[i].numberedListId !== null && beforeOptions[i].bold) {
        promptStart = i;
        break;
      }
    }
    if (promptStart < 0) {
      for (let i = beforeOptions.length - 1; i >= 0; i -= 1) {
        if (beforeOptions[i].numberedListId !== null) {
          promptStart = i;
          break;
        }
      }
    }
    let promptLines = beforeOptions.slice(promptStart >= 0 ? promptStart : Math.max(0, beforeOptions.length - 3));
    promptLines = promptLines.filter((line, index) => !isSectionHeading(line) || index === promptLines.length - 1);
    const prompt = promptLines.map((line) => line.text).join("\n").trim();
    if (!prompt) {
      warnings.push(`تعذر تحديد نص السؤال رقم ${questions.length + 1}.`);
      previousEnd = group.end;
      continue;
    }

    questions.push({
      prompt,
      options: group.lines.map((line) => ({
        label: line.text,
        is_correct: line.highlighted,
      })),
    });
    previousEnd = group.end;
  }

  const highlightedCount = lines.filter((line) => line.highlighted).length;
  if (highlightedCount > questions.length) {
    warnings.push(
      `تم تجاهل ${highlightedCount - questions.length} إجابة مظللة لأنها ليست داخل مجموعة من 4 اختيارات.`,
    );
  }
  const unansweredQuestionNumbers = questions.flatMap((question, index) =>
    question.options.some((option) => option.is_correct) ? [] : [index + 1],
  );
  if (unansweredQuestionNumbers.length > 0) {
    warnings.push(
      `تم استيراد ${unansweredQuestionNumbers.length} سؤال بدون إجابة صحيحة: ${unansweredQuestionNumbers.join(
        "، ",
      )}. اختر الإجابة الصحيحة لكل سؤال من المعاينة قبل النشر.`,
    );
  }
  if (!questions.length) throw new Error("no_mcq_questions");

  return {
    suggestedTitle: lines[0].text,
    questions,
    warnings,
  };
}
