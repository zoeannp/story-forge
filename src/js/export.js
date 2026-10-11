
import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType
} from "docx";

// Convert inline HTML formatting into Word text runs.
function getTextRuns(node, formatting = {}) {
    if (node.nodeType === Node.TEXT_NODE) {
        return [
            new TextRun({
                text: node.textContent,
                ...formatting
            })
        ];
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
        return [];
    }

    if (node.tagName === "BR") {
        return [new TextRun({ break: 1 })];
    }

    const next = { ...formatting };

    if (["STRONG", "B"].includes(node.tagName)) {
        next.bold = true;
    }

    if (["EM", "I"].includes(node.tagName)) {
        next.italics = true;
    }

    if (node.tagName === "U") {
        next.underline = {};
    }

    return Array.from(node.childNodes).flatMap(
        child => getTextRuns(child, next)
    );
}

// Convert a stored scene's HTML into Word paragraphs.
function convertSceneContent(html) {
    const container = document.createElement("div");
    container.innerHTML = html || "";

    const paragraphs = [];

    function processNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            if (node.textContent.trim()) {
                paragraphs.push(
                    new Paragraph({
                        children: getTextRuns(node)
                    })
                );
            }
            return;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) {
            return;
        }

        const tag = node.tagName;

        if (["P", "H1", "H2", "H3"].includes(tag)) {
            const alignment = {
                left: AlignmentType.LEFT,
                center: AlignmentType.CENTER,
                right: AlignmentType.RIGHT,
                justify: AlignmentType.JUSTIFIED
            };

            const options = {
                children: getTextRuns(node),
                alignment: alignment[node.style.textAlign]
                    || AlignmentType.LEFT
            };

            if (tag !== "P") {
                options.heading = {
                    H1: HeadingLevel.HEADING_1,
                    H2: HeadingLevel.HEADING_2,
                    H3: HeadingLevel.HEADING_3
                }[tag];
            }

            paragraphs.push(new Paragraph(options));
            return;
        }

        for (const child of node.childNodes) {
            processNode(child);
        }
    }

    for (const child of container.childNodes) {
        processNode(child);
    }

    return paragraphs;
}

// Generate and download a manuscript without modifying storage.
export async function downloadManuscript(project) {
    if (!project?.chapters?.length) {
        throw new Error("This project has no chapters to export.");
    }

    const content = [
        new Paragraph({
            text: project.title,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER
        })
    ];

    for (const chapter of project.chapters) {
        content.push(
            new Paragraph({
                text: chapter.title,
                heading: HeadingLevel.HEADING_1,
                pageBreakBefore: true
            })
        );

        chapter.scenes.forEach((scene, index) => {
            // Separate scenes without exposing internal scene titles.
            if (index > 0) {
                content.push(
                    new Paragraph({
                        text: "* * *",
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 240, after: 240 }
                    })
                );
            }

            content.push(
                ...convertSceneContent(scene.content)
            );
        });
    }

    const documentFile = new Document({
        sections: [{
            children: content
        }]
    });

    const blob = await Packer.toBlob(documentFile);
    const url = URL.createObjectURL(blob);

    const filename = project.title
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
        .trim() || "StoryForge-Manuscript";

    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.docx`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 60000);
}
