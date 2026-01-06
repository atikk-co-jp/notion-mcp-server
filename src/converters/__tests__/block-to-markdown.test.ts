import { describe, expect, it, vi } from "vitest";
import { blocksToMarkdown, blocksToMarkdownSync, type NotionBlock } from "../block-to-markdown.js";

describe("blocksToMarkdownSync", () => {
  describe("basic blocks", () => {
    it("converts paragraph block", () => {
      const blocks: NotionBlock[] = [
        {
          type: "paragraph",
          paragraph: {
            rich_text: [{ type: "text", text: { content: "Hello World" } }],
          },
        },
      ];
      expect(blocksToMarkdownSync(blocks)).toBe("Hello World");
    });

    it("handles empty paragraph", () => {
      const blocks: NotionBlock[] = [
        {
          type: "paragraph",
          paragraph: { rich_text: [] },
        },
      ];
      expect(blocksToMarkdownSync(blocks)).toBe("");
    });

    it("handles empty array", () => {
      expect(blocksToMarkdownSync([])).toBe("");
    });

    it("handles undefined input", () => {
      expect(blocksToMarkdownSync(undefined as unknown as NotionBlock[])).toBe("");
    });
  });

  describe("headings", () => {
    it("converts heading_1", () => {
      const blocks: NotionBlock[] = [
        {
          type: "heading_1",
          heading_1: {
            rich_text: [{ type: "text", text: { content: "Heading 1" } }],
          },
        },
      ];
      expect(blocksToMarkdownSync(blocks)).toBe("# Heading 1");
    });

    it("converts heading_2", () => {
      const blocks: NotionBlock[] = [
        {
          type: "heading_2",
          heading_2: {
            rich_text: [{ type: "text", text: { content: "Heading 2" } }],
          },
        },
      ];
      expect(blocksToMarkdownSync(blocks)).toBe("## Heading 2");
    });

    it("converts heading_3", () => {
      const blocks: NotionBlock[] = [
        {
          type: "heading_3",
          heading_3: {
            rich_text: [{ type: "text", text: { content: "Heading 3" } }],
          },
        },
      ];
      expect(blocksToMarkdownSync(blocks)).toBe("### Heading 3");
    });
  });

  describe("list items", () => {
    it("converts bulleted_list_item", () => {
      const blocks: NotionBlock[] = [
        {
          type: "bulleted_list_item",
          bulleted_list_item: {
            rich_text: [{ type: "text", text: { content: "Item 1" } }],
          },
        },
        {
          type: "bulleted_list_item",
          bulleted_list_item: {
            rich_text: [{ type: "text", text: { content: "Item 2" } }],
          },
        },
      ];
      expect(blocksToMarkdownSync(blocks)).toBe("- Item 1\n- Item 2");
    });

    it("converts numbered_list_item with correct indices", () => {
      const blocks: NotionBlock[] = [
        {
          type: "numbered_list_item",
          numbered_list_item: {
            rich_text: [{ type: "text", text: { content: "First" } }],
          },
        },
        {
          type: "numbered_list_item",
          numbered_list_item: {
            rich_text: [{ type: "text", text: { content: "Second" } }],
          },
        },
        {
          type: "numbered_list_item",
          numbered_list_item: {
            rich_text: [{ type: "text", text: { content: "Third" } }],
          },
        },
      ];
      expect(blocksToMarkdownSync(blocks)).toBe("1. First\n2. Second\n3. Third");
    });

    it("resets numbered list index after non-list block", () => {
      const blocks: NotionBlock[] = [
        {
          type: "numbered_list_item",
          numbered_list_item: {
            rich_text: [{ type: "text", text: { content: "First" } }],
          },
        },
        {
          type: "paragraph",
          paragraph: {
            rich_text: [{ type: "text", text: { content: "Break" } }],
          },
        },
        {
          type: "numbered_list_item",
          numbered_list_item: {
            rich_text: [{ type: "text", text: { content: "New First" } }],
          },
        },
      ];
      expect(blocksToMarkdownSync(blocks)).toBe("1. First\nBreak\n1. New First");
    });
  });

  describe("to_do", () => {
    it("converts unchecked to_do", () => {
      const blocks: NotionBlock[] = [
        {
          type: "to_do",
          to_do: {
            rich_text: [{ type: "text", text: { content: "Task" } }],
            checked: false,
          },
        },
      ];
      expect(blocksToMarkdownSync(blocks)).toBe("- [ ] Task");
    });

    it("converts checked to_do", () => {
      const blocks: NotionBlock[] = [
        {
          type: "to_do",
          to_do: {
            rich_text: [{ type: "text", text: { content: "Done Task" } }],
            checked: true,
          },
        },
      ];
      expect(blocksToMarkdownSync(blocks)).toBe("- [x] Done Task");
    });
  });

  describe("code block", () => {
    it("converts code block with language", () => {
      const blocks: NotionBlock[] = [
        {
          type: "code",
          code: {
            rich_text: [{ type: "text", text: { content: "console.log('hello')" } }],
            language: "javascript",
          },
        },
      ];
      expect(blocksToMarkdownSync(blocks)).toBe("```javascript\nconsole.log('hello')\n```");
    });

    it("converts code block without language", () => {
      const blocks: NotionBlock[] = [
        {
          type: "code",
          code: {
            rich_text: [{ type: "text", text: { content: "plain code" } }],
          },
        },
      ];
      expect(blocksToMarkdownSync(blocks)).toBe("```\nplain code\n```");
    });
  });

  describe("quote and callout", () => {
    it("converts quote", () => {
      const blocks: NotionBlock[] = [
        {
          type: "quote",
          quote: {
            rich_text: [{ type: "text", text: { content: "A wise quote" } }],
          },
        },
      ];
      expect(blocksToMarkdownSync(blocks)).toBe("> A wise quote");
    });

    it("converts multiline quote", () => {
      const blocks: NotionBlock[] = [
        {
          type: "quote",
          quote: {
            rich_text: [{ type: "text", text: { content: "Line 1\nLine 2" } }],
          },
        },
      ];
      expect(blocksToMarkdownSync(blocks)).toBe("> Line 1\n> Line 2");
    });

    it("converts callout with emoji icon", () => {
      const blocks: NotionBlock[] = [
        {
          type: "callout",
          callout: {
            rich_text: [{ type: "text", text: { content: "Important info" } }],
            icon: { type: "emoji", emoji: "💡" },
          },
        },
      ];
      expect(blocksToMarkdownSync(blocks)).toBe("> 💡 **Note:** Important info");
    });

    it("converts callout without icon", () => {
      const blocks: NotionBlock[] = [
        {
          type: "callout",
          callout: {
            rich_text: [{ type: "text", text: { content: "Info" } }],
          },
        },
      ];
      expect(blocksToMarkdownSync(blocks)).toBe("> **Note:** Info");
    });
  });

  describe("divider", () => {
    it("converts divider", () => {
      const blocks: NotionBlock[] = [{ type: "divider", divider: {} }];
      expect(blocksToMarkdownSync(blocks)).toBe("---");
    });
  });

  describe("bookmark and links", () => {
    it("converts bookmark", () => {
      const blocks: NotionBlock[] = [
        {
          type: "bookmark",
          bookmark: {
            url: "https://example.com",
          },
        },
      ];
      expect(blocksToMarkdownSync(blocks)).toBe("[https://example.com](https://example.com)");
    });

    it("converts bookmark with caption", () => {
      const blocks: NotionBlock[] = [
        {
          type: "bookmark",
          bookmark: {
            url: "https://example.com",
            caption: [{ type: "text", text: { content: "Example Site" } }],
          },
        },
      ];
      expect(blocksToMarkdownSync(blocks)).toBe("[Example Site](https://example.com)");
    });

    it("converts link_preview", () => {
      const blocks: NotionBlock[] = [
        {
          type: "link_preview",
          link_preview: {
            url: "https://example.com/preview",
          },
        },
      ];
      expect(blocksToMarkdownSync(blocks)).toBe(
        "[https://example.com/preview](https://example.com/preview)",
      );
    });
  });

  describe("media blocks", () => {
    it("converts image with external url", () => {
      const blocks: NotionBlock[] = [
        {
          type: "image",
          image: {
            type: "external",
            external: { url: "https://example.com/image.png" },
          },
        },
      ];
      expect(blocksToMarkdownSync(blocks)).toBe("![](https://example.com/image.png)");
    });

    it("converts image with caption", () => {
      const blocks: NotionBlock[] = [
        {
          type: "image",
          image: {
            type: "external",
            external: { url: "https://example.com/image.png" },
            caption: [{ type: "text", text: { content: "My Image" } }],
          },
        },
      ];
      expect(blocksToMarkdownSync(blocks)).toBe("![My Image](https://example.com/image.png)");
    });

    it("converts image with file url", () => {
      const blocks: NotionBlock[] = [
        {
          type: "image",
          image: {
            type: "file",
            file: { url: "https://s3.amazonaws.com/file.png" },
          },
        },
      ];
      expect(blocksToMarkdownSync(blocks)).toBe("![](https://s3.amazonaws.com/file.png)");
    });

    it("converts video", () => {
      const blocks: NotionBlock[] = [
        {
          type: "video",
          video: {
            type: "external",
            external: { url: "https://youtube.com/watch?v=123" },
          },
        },
      ];
      expect(blocksToMarkdownSync(blocks)).toBe("[Video](https://youtube.com/watch?v=123)");
    });

    it("converts audio", () => {
      const blocks: NotionBlock[] = [
        {
          type: "audio",
          audio: {
            type: "external",
            external: { url: "https://example.com/audio.mp3" },
          },
        },
      ];
      expect(blocksToMarkdownSync(blocks)).toBe("[Audio](https://example.com/audio.mp3)");
    });

    it("converts file", () => {
      const blocks: NotionBlock[] = [
        {
          type: "file",
          file: {
            type: "file",
            file: { url: "https://example.com/doc.pdf" },
            name: "Document",
          },
        },
      ];
      expect(blocksToMarkdownSync(blocks)).toBe("[Document](https://example.com/doc.pdf)");
    });

    it("converts pdf", () => {
      const blocks: NotionBlock[] = [
        {
          type: "pdf",
          pdf: {
            type: "external",
            external: { url: "https://example.com/doc.pdf" },
          },
        },
      ];
      expect(blocksToMarkdownSync(blocks)).toBe("[File](https://example.com/doc.pdf)");
    });

    it("converts embed", () => {
      const blocks: NotionBlock[] = [
        {
          type: "embed",
          embed: {
            url: "https://codepen.io/pen/123",
          },
        },
      ];
      expect(blocksToMarkdownSync(blocks)).toBe("[Embed](https://codepen.io/pen/123)");
    });
  });

  describe("toggle", () => {
    it("converts toggle block", () => {
      const blocks: NotionBlock[] = [
        {
          type: "toggle",
          toggle: {
            rich_text: [{ type: "text", text: { content: "Click to expand" } }],
          },
        },
      ];
      expect(blocksToMarkdownSync(blocks)).toBe(
        "<details>\n<summary>Click to expand</summary>\n</details>",
      );
    });
  });

  describe("special blocks", () => {
    it("converts table_of_contents", () => {
      const blocks: NotionBlock[] = [
        {
          type: "table_of_contents",
          table_of_contents: {},
        },
      ];
      expect(blocksToMarkdownSync(blocks)).toBe("[TOC]");
    });

    it("converts equation", () => {
      const blocks: NotionBlock[] = [
        {
          type: "equation",
          equation: {
            expression: "E = mc^2",
          },
        },
      ];
      expect(blocksToMarkdownSync(blocks)).toBe("$$\nE = mc^2\n$$");
    });

    it("converts child_page", () => {
      const blocks: NotionBlock[] = [
        {
          type: "child_page",
          child_page: {
            title: "My Subpage",
          },
        },
      ];
      expect(blocksToMarkdownSync(blocks)).toBe("📄 [My Subpage]");
    });

    it("converts child_database", () => {
      const blocks: NotionBlock[] = [
        {
          type: "child_database",
          child_database: {
            title: "My Database",
          },
        },
      ];
      expect(blocksToMarkdownSync(blocks)).toBe("📊 [My Database]");
    });
  });

  describe("unsupported blocks", () => {
    it("handles unsupported block type", () => {
      const blocks: NotionBlock[] = [
        {
          type: "unknown_type",
          unknown_type: { some: "data" },
        },
      ];
      expect(blocksToMarkdownSync(blocks)).toBe("<!-- Unsupported block type: unknown_type -->");
    });
  });

  describe("real world data", () => {
    it("converts actual Notion block data", () => {
      // 実際のNotionから取得したデータ形式
      const blocks: NotionBlock[] = [
        {
          object: "block",
          id: "f542c96d-5d08-4488-83a0-ec2bb4af3d10",
          type: "heading_2",
          heading_2: {
            rich_text: [
              {
                type: "text",
                text: { content: "問題", link: null },
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                  color: "default",
                },
                plain_text: "問題",
                href: null,
              },
            ],
            is_toggleable: false,
            color: "default",
          },
        },
        {
          object: "block",
          id: "8c7f084b-e946-4456-a85b-1bd160ffed9a",
          type: "paragraph",
          paragraph: {
            rich_text: [
              {
                type: "text",
                text: { content: "以下のパッケージで ", link: null },
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                  color: "default",
                },
                plain_text: "以下のパッケージで ",
                href: null,
              },
              {
                type: "text",
                text: { content: "exports", link: null },
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: true,
                  color: "default",
                },
                plain_text: "exports",
                href: null,
              },
              {
                type: "text",
                text: { content: " が必要：", link: null },
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                  color: "default",
                },
                plain_text: " が必要：",
                href: null,
              },
            ],
            color: "default",
          },
        },
        {
          object: "block",
          id: "cde242b1-9b0c-47f4-af8e-29122bd1f048",
          type: "bulleted_list_item",
          bulleted_list_item: {
            rich_text: [
              {
                type: "text",
                text: { content: "apps/supabase-client/package.json", link: null },
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: true,
                  color: "default",
                },
                plain_text: "apps/supabase-client/package.json",
                href: null,
              },
            ],
            color: "default",
          },
        },
      ];

      const result = blocksToMarkdownSync(blocks);
      expect(result).toBe(
        "## 問題\n以下のパッケージで `exports` が必要：\n- `apps/supabase-client/package.json`",
      );
    });
  });
});

describe("blocksToMarkdown (async)", () => {
  it("works without fetchChildren option", async () => {
    const blocks: NotionBlock[] = [
      {
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: "Hello" } }],
        },
      },
    ];
    const result = await blocksToMarkdown(blocks);
    expect(result).toBe("Hello");
  });

  it("fetches children for nested bulleted_list_item", async () => {
    const mockFetchChildren = vi.fn().mockResolvedValue([
      {
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: "Nested content" } }],
        },
      },
    ]);

    const blocks: NotionBlock[] = [
      {
        id: "parent-id",
        type: "bulleted_list_item",
        has_children: true,
        bulleted_list_item: {
          rich_text: [{ type: "text", text: { content: "Parent item" } }],
        },
      },
    ];

    const result = await blocksToMarkdown(blocks, { fetchChildren: mockFetchChildren });

    expect(mockFetchChildren).toHaveBeenCalledWith("parent-id");
    expect(result).toContain("- Parent item");
    expect(result).toContain("Nested content");
  });

  it("handles toggle block with children", async () => {
    const mockFetchChildren = vi.fn().mockResolvedValue([
      {
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: "Toggle content" } }],
        },
      },
    ]);

    const blocks: NotionBlock[] = [
      {
        id: "toggle-id",
        type: "toggle",
        has_children: true,
        toggle: {
          rich_text: [{ type: "text", text: { content: "Click me" } }],
        },
      },
    ];

    const result = await blocksToMarkdown(blocks, { fetchChildren: mockFetchChildren });

    expect(mockFetchChildren).toHaveBeenCalledWith("toggle-id");
    expect(result).toContain("<summary>Click me</summary>");
    expect(result).toContain("Toggle content");
  });
});
