// src/parser/tokenizer.js
var TokenType = {
  COMMAND: "COMMAND",
  OPEN_BRACE: "OPEN_BRACE",
  CLOSE_BRACE: "CLOSE_BRACE",
  OPEN_BRACKET: "OPEN_BRACKET",
  CLOSE_BRACKET: "CLOSE_BRACKET",
  TEXT: "TEXT",
  NEWLINE: "NEWLINE",
  // \\
  COMMENT: "COMMENT",
  BEGIN: "BEGIN",
  END: "END",
  MATH: "MATH",
  PARAGRAPH_BREAK: "PARAGRAPH_BREAK",
  EOF: "EOF"
};
function isLetter(ch) {
  return /[a-zA-Z]/.test(ch);
}
function isCJK(ch) {
  const code = ch.codePointAt(0);
  if (code >= 19968 && code <= 40959) return true;
  if (code >= 13312 && code <= 19903) return true;
  if (code >= 63744 && code <= 64255) return true;
  return false;
}
function isCommandChar(ch) {
  return isLetter(ch) || isCJK(ch) || ch === "@" || ch === "*";
}
var Tokenizer = class {
  constructor(source) {
    this.source = source;
    this.pos = 0;
    this.tokens = [];
  }
  peek() {
    if (this.pos >= this.source.length) return null;
    return this.source[this.pos];
  }
  advance() {
    const ch = this.source[this.pos];
    this.pos++;
    return ch;
  }
  tokenize() {
    while (this.pos < this.source.length) {
      const ch = this.peek();
      if (ch === "%") {
        this.skipComment();
        continue;
      }
      if (ch === "$") {
        this.readMath();
        continue;
      }
      if (ch === "\\") {
        this.readCommand();
        continue;
      }
      if (ch === "{") {
        this.tokens.push({ type: TokenType.OPEN_BRACE, value: "{" });
        this.advance();
        continue;
      }
      if (ch === "}") {
        this.tokens.push({ type: TokenType.CLOSE_BRACE, value: "}" });
        this.advance();
        continue;
      }
      if (ch === "[") {
        this.tokens.push({ type: TokenType.OPEN_BRACKET, value: "[" });
        this.advance();
        continue;
      }
      if (ch === "]") {
        this.tokens.push({ type: TokenType.CLOSE_BRACKET, value: "]" });
        this.advance();
        continue;
      }
      this.readText();
    }
    this.tokens.push({ type: TokenType.EOF, value: "" });
    return this.tokens;
  }
  skipComment() {
    while (this.pos < this.source.length && this.source[this.pos] !== "\n") {
      this.pos++;
    }
    if (this.pos < this.source.length) this.pos++;
  }
  readCommand() {
    this.advance();
    if (this.pos >= this.source.length) {
      this.tokens.push({ type: TokenType.TEXT, value: "\\" });
      return;
    }
    const nextCh = this.peek();
    if (nextCh === "\\") {
      this.advance();
      this.tokens.push({ type: TokenType.NEWLINE, value: "\\\\" });
      return;
    }
    if ("{}[]%$&#_~^".includes(nextCh)) {
      this.advance();
      this.tokens.push({ type: TokenType.TEXT, value: nextCh });
      return;
    }
    if (nextCh === " " || nextCh === "\n") {
      this.advance();
      this.tokens.push({ type: TokenType.TEXT, value: " " });
      return;
    }
    if (!isCommandChar(nextCh)) {
      this.advance();
      this.tokens.push({ type: TokenType.COMMAND, value: nextCh });
      return;
    }
    const isAsciiStart = isLetter(nextCh) || nextCh === "@" || nextCh === "*";
    const isCJKStart = isCJK(nextCh);
    let name = "";
    if (isAsciiStart) {
      while (this.pos < this.source.length && (isLetter(this.peek()) || this.peek() === "@" || this.peek() === "*")) {
        name += this.advance();
      }
      while (this.pos < this.source.length && this.source[this.pos] === " ") {
        this.pos++;
      }
    } else if (isCJKStart) {
      while (this.pos < this.source.length && isCJK(this.peek())) {
        name += this.advance();
      }
    }
    if (name === "begin") {
      this.tokens.push({ type: TokenType.BEGIN, value: "begin" });
    } else if (name === "end") {
      this.tokens.push({ type: TokenType.END, value: "end" });
    } else {
      this.tokens.push({ type: TokenType.COMMAND, value: name });
    }
  }
  readMath() {
    this.advance();
    let content = "";
    while (this.pos < this.source.length) {
      const ch = this.peek();
      if (ch === "$") {
        this.advance();
        this.tokens.push({ type: TokenType.MATH, value: content });
        return;
      }
      content += this.advance();
    }
    this.tokens.push({ type: TokenType.TEXT, value: "$" + content });
  }
  readText() {
    let text = "";
    while (this.pos < this.source.length) {
      const ch = this.peek();
      if (ch === "\\" || ch === "{" || ch === "}" || ch === "[" || ch === "]" || ch === "%" || ch === "$") {
        break;
      }
      text += this.advance();
    }
    if (text) {
      const parts = text.split(/\n[ \t]*\n/);
      for (let i = 0; i < parts.length; i++) {
        if (i > 0) {
          this.tokens.push({ type: TokenType.PARAGRAPH_BREAK, value: "" });
        }
        const collapsed = parts[i].replace(/[ \t]+/g, " ");
        if (collapsed.trim() || collapsed === " ") {
          this.tokens.push({ type: TokenType.TEXT, value: collapsed });
        }
      }
    }
  }
};

// src/parser/commands.js
var commandRegistry = {
  // Document structure
  "documentclass": { args: ["optional", "required"] },
  "title": { args: ["required"] },
  "chapter": { args: ["required"] },
  // Jiazhu (夹注)
  "\u5939\u6CE8": { args: ["optional", "required"], node: "jiazhu" },
  "JiaZhu": { alias: "\u5939\u6CE8" },
  "\u5355\u884C\u5939\u6CE8": { args: ["optional", "required"], node: "jiazhu", single: true },
  "DanHangJiaZhu": { alias: "\u5355\u884C\u5939\u6CE8" },
  // SideNote (侧批)
  "\u4FA7\u6279": { args: ["optional", "required"], node: "sidenote" },
  "SideNode": { alias: "\u4FA7\u6279" },
  "CePi": { alias: "\u4FA7\u6279" },
  // MeiPi (眉批)
  "\u7709\u6279": { args: ["optional", "required"], node: "meipi" },
  "MeiPi": { alias: "\u7709\u6279" },
  // PiZhu (批注)
  "\u6279\u6CE8": { args: ["optional", "required"], node: "pizhu" },
  "PiZhu": { alias: "\u6279\u6CE8" },
  // TextBox
  "\u6587\u672C\u6846": { args: ["optional", "required"], node: "textbox" },
  "TextBox": { alias: "\u6587\u672C\u6846" },
  "\u586B\u5145\u6587\u672C\u6846": { args: ["optional", "required"], node: "fillTextbox" },
  "FillTextBox": { alias: "\u586B\u5145\u6587\u672C\u6846" },
  // Decoration
  "\u5708\u70B9": { args: ["optional", "required"], node: "emphasis" },
  "EmphasisMark": { alias: "\u5708\u70B9" },
  "\u88C5\u9970": { args: ["optional", "required"], node: "decorate" },
  "decorate": { alias: "\u88C5\u9970" },
  "\u4E13\u540D\u53F7": { args: ["optional", "required"], node: "properName" },
  "ProperNameMark": { alias: "\u4E13\u540D\u53F7" },
  "\u4E66\u540D\u53F7": { args: ["optional", "required"], node: "bookTitle" },
  "BookTitleMark": { alias: "\u4E66\u540D\u53F7" },
  "\u4E0B\u5212\u7EBF": { alias: "\u4E13\u540D\u53F7" },
  "Underline": { alias: "\u4E13\u540D\u53F7" },
  "\u6CE2\u6D6A\u7EBF": { alias: "\u4E66\u540D\u53F7" },
  "WavyUnderline": { alias: "\u4E66\u540D\u53F7" },
  "\u53CD\u767D": { args: ["required"], node: "inverted" },
  "inverted": { alias: "\u53CD\u767D" },
  "\u516B\u89D2\u6846": { args: ["required"], node: "octagon" },
  "octagon": { alias: "\u516B\u89D2\u6846" },
  "\u5E26\u5708": { args: ["required"], node: "circled" },
  "circled": { alias: "\u5E26\u5708" },
  "\u53CD\u767D\u516B\u89D2\u6846": { args: ["required"], node: "invertedOctagon" },
  "invertedOctagon": { alias: "\u53CD\u767D\u516B\u89D2\u6846" },
  "\u6539": { args: ["required"], node: "fix" },
  "fix": { alias: "\u6539" },
  // Layout control
  "\u7A7A\u683C": { args: ["optional"], node: "space" },
  "Space": { alias: "\u7A7A\u683C" },
  "\u8BBE\u7F6E\u7F29\u8FDB": { args: ["required"], node: "setIndent" },
  "SetIndent": { alias: "\u8BBE\u7F6E\u7F29\u8FDB" },
  "\u6362\u884C": { args: [], node: "columnBreak" },
  // Taitou (抬头)
  "\u62AC\u5934": { args: ["optional"], node: "taitou" },
  "\u5E73\u62AC": { args: [], node: "taitou", defaultOpt: "0" },
  "\u5355\u62AC": { args: [], node: "taitou", defaultOpt: "1" },
  "\u53CC\u62AC": { args: [], node: "taitou", defaultOpt: "2" },
  "\u4E09\u62AC": { args: [], node: "taitou", defaultOpt: "3" },
  "\u632A\u62AC": { args: ["optional"], node: "nuotai" },
  "\u7A7A\u62AC": { args: [], node: "nuotai", defaultOpt: "1" },
  "\u76F8\u5BF9\u62AC\u5934": { args: ["optional"], node: "relativeTaitou" },
  // Setup commands
  "contentSetup": { args: ["required"], node: "setupCmd", setupType: "content" },
  "pageSetup": { args: ["required"], node: "setupCmd", setupType: "page" },
  "banxinSetup": { args: ["required"], node: "setupCmd", setupType: "banxin" },
  "sidenodeSetup": { args: ["required"], node: "setupCmd", setupType: "sidenode" },
  "jiazhuSetup": { args: ["required"], node: "setupCmd", setupType: "jiazhu" },
  "pizhuSetup": { args: ["required"], node: "setupCmd", setupType: "pizhu" },
  "meipiSetup": { args: ["required"], node: "setupCmd", setupType: "meipi" },
  "gujiSetup": { args: ["required"], node: "setupCmd", setupType: "guji" },
  "judouSetup": { args: ["required"], node: "setupCmd", setupType: "judou" },
  // Judou
  "\u53E5\u8BFB\u6A21\u5F0F": { args: ["optional"], node: "setupCmd", setupType: "judou-on" },
  "JudouOn": { alias: "\u53E5\u8BFB\u6A21\u5F0F" },
  "\u6B63\u5E38\u6807\u70B9\u6A21\u5F0F": { args: ["optional"], node: "setupCmd", setupType: "judou-off" },
  "JudouOff": { alias: "\u6B63\u5E38\u6807\u70B9\u6A21\u5F0F" },
  "\u65E0\u6807\u70B9\u6A21\u5F0F": { args: ["optional"], node: "setupCmd", setupType: "judou-none" },
  "NonePunctuationMode": { alias: "\u65E0\u6807\u70B9\u6A21\u5F0F" },
  // Ignored commands
  "usepackage": { args: ["optional", "required"], ignore: true },
  "RequirePackage": { alias: "usepackage" },
  "setmainfont": { args: ["optional", "required"], ignore: true },
  "pagestyle": { args: ["required"], ignore: true },
  "noindent": { args: [], ignore: true },
  "par": { args: [], ignore: true },
  "relax": { args: [], ignore: true },
  "ignorespaces": { args: [], ignore: true },
  "definecolor": { args: ["required", "required", "required"], ignore: true },
  "AddToHook": { args: ["required", "required"], ignore: true },
  "\u7981\u7528\u5206\u9875\u88C1\u526A": { args: [], ignore: true },
  "\u663E\u793A\u5750\u6807": { args: [], ignore: true },
  "LtcDebugOn": { args: [], ignore: true },
  "LtcDebugOff": { args: [], ignore: true },
  // Seal stamp (simplified)
  "\u5370\u7AE0": { args: ["optional", "required"], node: "stamp" },
  // Catalog/Index entries
  "\u6761\u76EE": { args: ["optional", "required"], node: "muluItem" },
  "\u689D\u76EE": { alias: "\u6761\u76EE" }
};
var environmentRegistry = {
  "document": { node: "body" },
  "\u6B63\u6587": { node: "contentBlock" },
  "BodyText": { alias: "\u6B63\u6587" },
  "\u6BB5\u843D": { node: "paragraph", hasOptions: true },
  "Paragraph": { alias: "\u6BB5\u843D" },
  "\u5217\u8868": { node: "list" },
  "\u5939\u6CE8\u73AF\u5883": { node: "jiazhu" },
  "JiaZhuEnv": { alias: "\u5939\u6CE8\u73AF\u5883" }
};
function resolveCommand(name) {
  let def = commandRegistry[name];
  const visited = /* @__PURE__ */ new Set();
  while (def && def.alias && !visited.has(def.alias)) {
    visited.add(name);
    name = def.alias;
    def = commandRegistry[name];
  }
  return def || null;
}
function resolveEnvironment(name) {
  let def = environmentRegistry[name];
  const visited = /* @__PURE__ */ new Set();
  while (def && def.alias && !visited.has(def.alias)) {
    visited.add(name);
    name = def.alias;
    def = environmentRegistry[name];
  }
  return def || null;
}

// src/model/nodes.js
var NodeType = {
  DOCUMENT: "document",
  CONTENT_BLOCK: "contentBlock",
  PARAGRAPH: "paragraph",
  TEXT: "text",
  NEWLINE: "newline",
  JIAZHU: "jiazhu",
  SIDENOTE: "sidenote",
  MEIPI: "meipi",
  PIZHU: "pizhu",
  TEXTBOX: "textbox",
  FILL_TEXTBOX: "fillTextbox",
  SPACE: "space",
  COLUMN_BREAK: "columnBreak",
  TAITOU: "taitou",
  NUOTAI: "nuotai",
  SET_INDENT: "setIndent",
  EMPHASIS: "emphasis",
  PROPER_NAME: "properName",
  BOOK_TITLE: "bookTitle",
  INVERTED: "inverted",
  OCTAGON: "octagon",
  CIRCLED: "circled",
  INVERTED_OCTAGON: "invertedOctagon",
  FIX: "fix",
  DECORATE: "decorate",
  LIST: "list",
  LIST_ITEM: "listItem",
  SETUP: "setup",
  STAMP: "stamp",
  MATH: "math",
  PARAGRAPH_BREAK: "paragraphBreak",
  MULU_ITEM: "muluItem",
  UNKNOWN: "unknown"
};
function createNode(type, props = {}) {
  return { type, children: [], ...props };
}
function parseKeyValue(str) {
  if (!str || !str.trim()) return {};
  const result = {};
  let depth = 0;
  let currentKey = "";
  let currentValue = "";
  let inValue = false;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === "{") depth++;
    if (ch === "}") depth--;
    if (depth === 0 && ch === ",") {
      if (currentKey.trim()) {
        result[currentKey.trim()] = inValue ? currentValue.trim() : "true";
      }
      currentKey = "";
      currentValue = "";
      inValue = false;
      continue;
    } else if (depth === 0 && ch === "=" && !inValue) {
      inValue = true;
    } else if (inValue) {
      currentValue += ch;
    } else {
      currentKey += ch;
    }
  }
  if (currentKey.trim()) {
    const key = currentKey.trim();
    if (inValue) {
      result[key] = currentValue.trim();
    } else {
      if (/^\d+$/.test(key)) {
        result["value"] = key;
      } else {
        result[key] = "true";
      }
    }
  }
  return result;
}

// src/parser/parser.js
var Parser = class _Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
    this.warnings = [];
  }
  peek() {
    if (this.pos >= this.tokens.length) return { type: TokenType.EOF, value: "" };
    return this.tokens[this.pos];
  }
  advance() {
    const token = this.tokens[this.pos];
    this.pos++;
    return token;
  }
  expect(type) {
    const token = this.peek();
    if (token.type !== type) {
      this.warnings.push(`Expected ${type} but got ${token.type} ("${token.value}") at token ${this.pos}`);
      return null;
    }
    return this.advance();
  }
  /**
   * Read content inside { ... }, handling nested braces.
   * Returns the raw text content.
   */
  readBraceGroup() {
    if (this.peek().type !== TokenType.OPEN_BRACE) return "";
    this.advance();
    let content = "";
    let depth = 1;
    while (this.pos < this.tokens.length && depth > 0) {
      const token = this.peek();
      if (token.type === TokenType.OPEN_BRACE) {
        depth++;
        content += "{";
        this.advance();
      } else if (token.type === TokenType.CLOSE_BRACE) {
        depth--;
        if (depth > 0) content += "}";
        this.advance();
      } else if (token.type === TokenType.EOF) {
        break;
      } else {
        content += token.value;
        this.advance();
      }
    }
    return content;
  }
  /**
   * Read content inside [ ... ], handling nested brackets.
   * Returns the raw text content or null if no bracket group.
   */
  readBracketGroup() {
    if (this.peek().type !== TokenType.OPEN_BRACKET) return null;
    this.advance();
    let content = "";
    let depth = 1;
    while (this.pos < this.tokens.length && depth > 0) {
      const token = this.peek();
      if (token.type === TokenType.OPEN_BRACKET) {
        depth++;
        content += "[";
        this.advance();
      } else if (token.type === TokenType.CLOSE_BRACKET) {
        depth--;
        if (depth > 0) content += "]";
        this.advance();
      } else if (token.type === TokenType.EOF) {
        break;
      } else {
        content += token.value;
        this.advance();
      }
    }
    return content;
  }
  /**
   * Parse the content of a brace group as child nodes (recursive).
   */
  readBraceGroupAsNodes() {
    if (this.peek().type !== TokenType.OPEN_BRACE) return [];
    this.advance();
    const children = [];
    while (this.pos < this.tokens.length) {
      const token = this.peek();
      if (token.type === TokenType.CLOSE_BRACE) {
        this.advance();
        break;
      }
      if (token.type === TokenType.EOF) break;
      const node = this.parseToken();
      if (node) children.push(node);
    }
    return children;
  }
  /**
   * Parse command arguments according to its definition.
   */
  parseCommandArgs(def) {
    let optionalArg = null;
    const requiredArgs = [];
    if (!def.args) return { optionalArg, requiredArgs };
    for (const argType of def.args) {
      if (argType === "optional") {
        optionalArg = this.readBracketGroup();
      } else if (argType === "required") {
        const content = this.readBraceGroup();
        requiredArgs.push(content);
      }
    }
    return { optionalArg, requiredArgs };
  }
  /**
   * Main entry point: parse the full document.
   */
  parse() {
    const doc = createNode(NodeType.DOCUMENT);
    doc.template = "";
    doc.documentClass = "";
    doc.title = "";
    doc.chapter = "";
    doc.setupCommands = [];
    while (this.pos < this.tokens.length) {
      const token = this.peek();
      if (token.type === TokenType.EOF) break;
      const node = this.parseToken(doc);
      if (node) {
        doc.children.push(node);
      }
    }
    return doc;
  }
  /**
   * Parse a single token and return a node (or null).
   * @param {object} doc - The document node (for storing metadata)
   */
  parseToken(doc) {
    const token = this.peek();
    switch (token.type) {
      case TokenType.TEXT:
        this.advance();
        return createNode(NodeType.TEXT, { value: token.value });
      case TokenType.NEWLINE:
        this.advance();
        return createNode(NodeType.NEWLINE);
      case TokenType.MATH:
        this.advance();
        return createNode(NodeType.MATH, { value: token.value });
      case TokenType.PARAGRAPH_BREAK:
        this.advance();
        return createNode(NodeType.PARAGRAPH_BREAK);
      case TokenType.COMMAND:
        return this.parseCommand(doc);
      case TokenType.BEGIN:
        return this.parseEnvironment(doc);
      case TokenType.END:
        return null;
      case TokenType.OPEN_BRACE:
        return this.parseBareGroup();
      default:
        this.advance();
        return null;
    }
  }
  parseBareGroup() {
    const children = this.readBraceGroupAsNodes();
    if (children.length === 0) return null;
    if (children.length === 1) return children[0];
    const group = createNode("group");
    group.children = children;
    return group;
  }
  parseCommand(doc) {
    const token = this.advance();
    const name = token.value;
    const def = resolveCommand(name);
    if (name === "documentclass") {
      const optArg = this.readBracketGroup();
      const reqArg = this.readBraceGroup();
      if (doc) {
        doc.documentClass = reqArg;
        doc.template = optArg || "";
      }
      return null;
    }
    if (name === "title") {
      const content = this.readBraceGroup();
      if (doc) doc.title = content;
      return null;
    }
    if (name === "chapter") {
      const content = this.readBraceGroup();
      if (doc) doc.chapter = content;
      return null;
    }
    if (name === "item") {
      return createNode(NodeType.LIST_ITEM);
    }
    if (!def) {
      this.warnings.push(`Unknown command: \\${name} at token ${this.pos}`);
      let content = "";
      if (this.peek().type === TokenType.OPEN_BRACE) {
        content = this.readBraceGroup();
      }
      return createNode(NodeType.TEXT, { value: content });
    }
    if (def.ignore) {
      this.parseCommandArgs(def);
      return null;
    }
    if (def.node === "setupCmd") {
      const { optionalArg: optionalArg2, requiredArgs: requiredArgs2 } = this.parseCommandArgs(def);
      const params = parseKeyValue(requiredArgs2[0] || optionalArg2 || "");
      const setupNode = createNode(NodeType.SETUP, {
        setupType: def.setupType,
        params
      });
      if (doc) doc.setupCommands.push(setupNode);
      return null;
    }
    const { optionalArg, requiredArgs } = this.parseCommandArgs(def);
    const options = parseKeyValue(optionalArg || "");
    const nodeType = this.mapNodeType(def.node);
    const node = createNode(nodeType, { options });
    if (def.defaultOpt !== void 0 && optionalArg === null) {
      node.options = { value: def.defaultOpt };
    }
    if (requiredArgs.length > 0 && def.node !== "stamp") {
      const { Tokenizer: Tokenizer2 } = require_tokenizer();
      const innerTokens = new Tokenizer2(requiredArgs[0]).tokenize();
      const innerParser = new _Parser(innerTokens);
      while (innerParser.pos < innerParser.tokens.length) {
        const t = innerParser.peek();
        if (t.type === TokenType.EOF) break;
        const child = innerParser.parseToken();
        if (child) node.children.push(child);
      }
    }
    if (def.node === "space" || def.node === "taitou" || def.node === "nuotai" || def.node === "relativeTaitou") {
      node.value = optionalArg || def.defaultOpt || "1";
    }
    if (def.node === "setIndent") {
      node.value = requiredArgs[0] || "0";
    }
    if (def.node === "stamp") {
      node.options = parseKeyValue(optionalArg || "");
      node.src = requiredArgs[0] || "";
    }
    return node;
  }
  parseEnvironment(doc) {
    this.advance();
    const envName = this.readBraceGroup();
    const def = resolveEnvironment(envName);
    if (!def) {
      this.warnings.push(`Unknown environment: ${envName}`);
      const children = this.parseUntilEnd(envName, doc);
      const node2 = createNode(NodeType.UNKNOWN, { envName });
      node2.children = children;
      return node2;
    }
    let options = {};
    if (def.hasOptions) {
      const optArg = this.readBracketGroup();
      if (optArg) options = parseKeyValue(optArg);
    }
    const nodeType = this.mapNodeType(def.node);
    const node = createNode(nodeType, { options });
    if (def.node === "body") {
      node.children = this.parseUntilEnd(envName, doc);
      return node;
    }
    node.children = this.parseUntilEnd(envName, doc);
    if (def.node === "list") {
      node.children = this.groupListItems(node.children);
    }
    return node;
  }
  /**
   * Parse tokens until we encounter \end{envName}.
   */
  parseUntilEnd(envName, doc) {
    const children = [];
    while (this.pos < this.tokens.length) {
      const token = this.peek();
      if (token.type === TokenType.EOF) {
        this.warnings.push(`Unclosed environment: ${envName}`);
        break;
      }
      if (token.type === TokenType.END) {
        this.advance();
        const endName = this.readBraceGroup();
        if (endName === envName) {
          break;
        }
        this.warnings.push(`Mismatched \\end{${endName}}, expected \\end{${envName}}`);
        continue;
      }
      const node = this.parseToken(doc);
      if (node) children.push(node);
    }
    return children;
  }
  /**
   * Group list items: \item separators become container nodes.
   */
  groupListItems(children) {
    const items = [];
    let currentItem = null;
    for (const child of children) {
      if (child.type === NodeType.LIST_ITEM) {
        currentItem = createNode(NodeType.LIST_ITEM);
        items.push(currentItem);
      } else {
        if (!currentItem) {
          currentItem = createNode(NodeType.LIST_ITEM);
          items.push(currentItem);
        }
        currentItem.children.push(child);
      }
    }
    return items;
  }
  mapNodeType(nodeName) {
    const map = {
      "contentBlock": NodeType.CONTENT_BLOCK,
      "paragraph": NodeType.PARAGRAPH,
      "jiazhu": NodeType.JIAZHU,
      "sidenote": NodeType.SIDENOTE,
      "meipi": NodeType.MEIPI,
      "pizhu": NodeType.PIZHU,
      "textbox": NodeType.TEXTBOX,
      "fillTextbox": NodeType.FILL_TEXTBOX,
      "space": NodeType.SPACE,
      "columnBreak": NodeType.COLUMN_BREAK,
      "taitou": NodeType.TAITOU,
      "nuotai": NodeType.NUOTAI,
      "setIndent": NodeType.SET_INDENT,
      "emphasis": NodeType.EMPHASIS,
      "properName": NodeType.PROPER_NAME,
      "bookTitle": NodeType.BOOK_TITLE,
      "inverted": NodeType.INVERTED,
      "octagon": NodeType.OCTAGON,
      "circled": NodeType.CIRCLED,
      "invertedOctagon": NodeType.INVERTED_OCTAGON,
      "fix": NodeType.FIX,
      "decorate": NodeType.DECORATE,
      "list": NodeType.LIST,
      "body": "body",
      "stamp": NodeType.STAMP,
      "muluItem": NodeType.MULU_ITEM,
      "relativeTaitou": NodeType.TAITOU
    };
    return map[nodeName] || NodeType.UNKNOWN;
  }
};
var _Tokenizer = null;
function require_tokenizer() {
  if (!_Tokenizer) {
    _Tokenizer = { Tokenizer: null };
  }
  return _Tokenizer;
}
function setTokenizer(TokenizerClass) {
  if (!_Tokenizer) _Tokenizer = {};
  _Tokenizer.Tokenizer = TokenizerClass;
}

// src/parser/index.js
setTokenizer(Tokenizer);
function parse(source) {
  const tokenizer = new Tokenizer(source);
  const tokens = tokenizer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parse();
  return { ast, warnings: parser.warnings };
}

// src/config/templates.js
var templateCSSMap = {
  "\u56DB\u5E93\u5168\u4E66": "siku-quanshu",
  "\u56DB\u5EAB\u5168\u66F8": "siku-quanshu",
  "\u56DB\u5E93\u5168\u4E66\u5F69\u8272": "siku-quanshu-colored",
  "\u56DB\u5EAB\u5168\u66F8\u5F69\u8272": "siku-quanshu-colored",
  "\u7EA2\u697C\u68A6\u7532\u620C\u672C": "honglou",
  "\u7D05\u6A13\u5922\u7532\u620C\u672C": "honglou",
  "\u6781\u7B80": "minimal",
  "\u6975\u7C21": "minimal",
  "default": "siku-quanshu"
};
var templateGridConfig = {
  "siku-quanshu": { nRows: 21, nCols: 8 },
  "siku-quanshu-colored": { nRows: 21, nCols: 8 },
  "honglou": { nRows: 20, nCols: 9 },
  "minimal": { nRows: 21, nCols: 8 }
};
function resolveTemplateId(ast) {
  let templateId = templateCSSMap[ast.template] || "siku-quanshu";
  for (const cmd of ast.setupCommands || []) {
    if (cmd.setupType === "guji" && cmd.params?.template) {
      const override = templateCSSMap[cmd.params.template];
      if (override) templateId = override;
    }
  }
  return templateId;
}
function getGridConfig(templateId) {
  return templateGridConfig[templateId] || { nRows: 21, nCols: 8 };
}

// src/layout/grid-layout.js
function getPlainText(children) {
  let text = "";
  for (const child of children) {
    if (child.type === NodeType.TEXT) {
      text += child.value;
    } else if (child.children && child.children.length > 0) {
      text += getPlainText(child.children);
    }
  }
  return text;
}
function splitJiazhu(text, align = "outward") {
  const chars = [...text];
  if (chars.length === 0) return { col1: "", col2: "" };
  if (chars.length === 1) return { col1: chars[0], col2: "" };
  const mid = align === "inward" ? Math.floor(chars.length / 2) : Math.ceil(chars.length / 2);
  return {
    col1: chars.slice(0, mid).join(""),
    col2: chars.slice(mid).join("")
  };
}
function splitJiazhuMulti(text, maxCharsPerCol = 20, align = "outward", firstMaxPerCol = 0) {
  const first = firstMaxPerCol > 0 ? firstMaxPerCol : maxCharsPerCol;
  const chars = [...text];
  const firstChunkSize = first * 2;
  if (chars.length <= firstChunkSize) {
    return [splitJiazhu(text, align)];
  }
  const segments = [];
  const firstChunk = chars.slice(0, firstChunkSize).join("");
  segments.push(splitJiazhu(firstChunk, align));
  const fullChunkSize = maxCharsPerCol * 2;
  for (let i = firstChunkSize; i < chars.length; i += fullChunkSize) {
    const chunk = chars.slice(i, i + fullChunkSize).join("");
    segments.push(splitJiazhu(chunk, align));
  }
  return segments;
}
var LayoutMarker = {
  PARAGRAPH_START: "_paragraphStart",
  PARAGRAPH_END: "_paragraphEnd",
  LIST_START: "_listStart",
  LIST_END: "_listEnd",
  LIST_ITEM_START: "_listItemStart",
  LIST_ITEM_END: "_listItemEnd",
  MULU_ITEM_START: "_muluItemStart",
  MULU_ITEM_END: "_muluItemEnd"
};
function newPage() {
  return { items: [], floats: [], halfBoundary: null };
}
var GridLayoutEngine = class {
  /**
   * @param {number} nRows  Chars per column
   * @param {number} nCols  Columns per half-page
   */
  constructor(nRows, nCols) {
    this.nRows = nRows;
    this.nCols = nCols;
    this.colsPerSpread = 2 * nCols;
    this.currentCol = 0;
    this.currentRow = 0;
    this.currentIndent = 0;
    this.pages = [newPage()];
  }
  get currentPage() {
    return this.pages[this.pages.length - 1];
  }
  get effectiveRows() {
    return this.nRows - this.currentIndent;
  }
  /**
   * Check and mark the half-page boundary when crossing from right to left.
   */
  checkHalfBoundary() {
    if (this.currentPage.halfBoundary === null && this.currentCol >= this.nCols) {
      this.currentPage.halfBoundary = this.currentPage.items.length;
    }
  }
  /**
   * Advance to the next column. Triggers page break if needed.
   */
  advanceColumn() {
    this.currentCol++;
    this.currentRow = 0;
    this.checkHalfBoundary();
    if (this.currentCol >= this.colsPerSpread) {
      this.newPageBreak();
    }
  }
  /**
   * Create a new page and reset cursor.
   */
  newPageBreak() {
    if (this.currentPage.halfBoundary === null) {
      this.currentPage.halfBoundary = this.currentPage.items.length;
    }
    this.pages.push(newPage());
    this.currentCol = 0;
    this.currentRow = 0;
  }
  /**
   * Place a node at the current cursor position.
   */
  placeItem(node, extra = {}) {
    this.checkHalfBoundary();
    this.currentPage.items.push({
      node,
      col: this.currentCol,
      row: this.currentRow,
      indent: this.currentIndent,
      ...extra
    });
  }
  /**
   * Place a layout marker (paragraph start/end, list start/end, etc.).
   */
  placeMarker(markerType, data = {}) {
    this.checkHalfBoundary();
    this.currentPage.items.push({
      node: { type: markerType },
      col: this.currentCol,
      row: this.currentRow,
      indent: this.currentIndent,
      ...data
    });
  }
  /**
   * Walk a list of AST child nodes.
   */
  walkChildren(children) {
    for (const child of children) {
      this.walkNode(child);
    }
  }
  /**
   * Advance cursor by a given number of rows, wrapping columns as needed.
   * Preserves the remainder correctly across column and page breaks.
   */
  advanceRows(count) {
    this.currentRow += count;
    while (this.currentRow >= this.effectiveRows) {
      this.currentRow -= this.effectiveRows;
      this.currentCol++;
      this.checkHalfBoundary();
      if (this.currentCol >= this.colsPerSpread) {
        const remainder = this.currentRow;
        this.newPageBreak();
        this.currentRow = remainder;
      }
    }
  }
  /**
   * Walk a single AST node and place it on the grid.
   */
  walkNode(node) {
    if (!node) return;
    switch (node.type) {
      case "body":
        this.walkChildren(node.children);
        break;
      case NodeType.CONTENT_BLOCK:
        this.walkContentBlock(node);
        break;
      case NodeType.PARAGRAPH:
        this.walkParagraph(node);
        break;
      case NodeType.TEXT:
        this.walkText(node);
        break;
      case NodeType.NEWLINE:
      case NodeType.PARAGRAPH_BREAK:
      case NodeType.COLUMN_BREAK:
        this.placeItem(node);
        this.advanceColumn();
        break;
      case NodeType.JIAZHU:
        this.walkJiazhu(node);
        break;
      case NodeType.SPACE:
      case NodeType.NUOTAI: {
        const count = parseInt(node.value, 10) || 1;
        this.placeItem(node);
        this.advanceRows(count);
        break;
      }
      case NodeType.TAITOU: {
        this.advanceColumn();
        const level = parseInt(node.value, 10) || 0;
        this.currentRow = level;
        this.placeItem(node);
        break;
      }
      case NodeType.MULU_ITEM: {
        if (this.currentRow > 0) {
          this.advanceColumn();
        }
        const level = parseInt(node.options?.value || "0", 10);
        this.currentRow = level;
        this.placeMarker(LayoutMarker.MULU_ITEM_START, { level });
        this.walkChildren(node.children);
        this.placeMarker(LayoutMarker.MULU_ITEM_END);
        break;
      }
      case NodeType.LIST:
        this.walkList(node);
        break;
      case NodeType.LIST_ITEM:
        this.walkListItem(node);
        break;
      // Floating elements — don't consume grid space
      case NodeType.MEIPI:
      case NodeType.PIZHU:
      case NodeType.STAMP:
        this.currentPage.floats.push(node);
        break;
      // Decorative wrappers — place as single item, count text for cursor
      case NodeType.EMPHASIS:
      case NodeType.PROPER_NAME:
      case NodeType.BOOK_TITLE:
      case NodeType.INVERTED:
      case NodeType.OCTAGON:
      case NodeType.CIRCLED:
      case NodeType.INVERTED_OCTAGON:
      case NodeType.FIX:
      case NodeType.DECORATE:
        this.placeItem(node);
        this.advanceRowsByNodeText(node);
        break;
      case NodeType.SIDENOTE:
        this.placeItem(node);
        break;
      case NodeType.TEXTBOX:
      case NodeType.FILL_TEXTBOX: {
        this.placeItem(node);
        const height = parseInt(node.options?.height || node.options?.value || "1", 10);
        this.advanceRows(height);
        break;
      }
      case NodeType.MATH:
      case NodeType.SET_INDENT:
        this.placeItem(node);
        break;
      default:
        if (node.children && node.children.length > 0) {
          this.walkChildren(node.children);
        }
        break;
    }
  }
  /**
   * Walk content block — separate floats from inline content.
   */
  walkContentBlock(node) {
    for (const child of node.children) {
      if (child.type === NodeType.MEIPI || child.type === NodeType.PIZHU || child.type === NodeType.STAMP) {
        this.currentPage.floats.push(child);
      } else {
        this.walkNode(child);
      }
    }
  }
  /**
   * Walk a paragraph node.
   * Emits start/end markers so the renderer can wrap the content with indent.
   * Walks children individually so they can span page boundaries.
   */
  walkParagraph(node) {
    const indent = parseInt(node.options?.indent || "0", 10);
    const prevIndent = this.currentIndent;
    this.currentIndent = indent;
    this.placeMarker(LayoutMarker.PARAGRAPH_START, { paragraphNode: node });
    this.walkChildren(node.children);
    this.placeMarker(LayoutMarker.PARAGRAPH_END);
    this.currentIndent = prevIndent;
  }
  /**
   * Walk LIST node — emits start/end markers and walks children.
   * Tracks whether first item needs advanceColumn or not.
   */
  walkList(node) {
    this.placeMarker(LayoutMarker.LIST_START);
    let first = true;
    for (const child of node.children) {
      if (child.type === NodeType.LIST_ITEM) {
        this.walkListItem(child, first);
        first = false;
      } else {
        this.walkNode(child);
      }
    }
    this.placeMarker(LayoutMarker.LIST_END);
  }
  /**
   * Walk LIST_ITEM node — emits markers. Advances column for non-first items.
   */
  walkListItem(node, isFirst = false) {
    if (!isFirst) {
      this.advanceColumn();
    }
    this.placeMarker(LayoutMarker.LIST_ITEM_START, { isFirstListItem: isFirst });
    this.walkChildren(node.children);
    this.placeMarker(LayoutMarker.LIST_ITEM_END);
  }
  /**
   * Walk TEXT node — advance cursor row by character count.
   */
  walkText(node) {
    const chars = [...node.value || ""];
    this.placeItem(node);
    this.advanceRows(chars.length);
  }
  /**
   * Advance cursor rows by counting text in a node (for compound nodes).
   */
  advanceRowsByNodeText(node) {
    const text = getPlainText(node.children || []);
    const len = [...text].length;
    this.advanceRows(len);
  }
  /**
   * Walk jiazhu node. Pre-compute segments based on remaining column space.
   * Each segment is placed as a separate item so page breaks work correctly.
   */
  walkJiazhu(node) {
    const hasComplexChildren = node.children.some((c) => c.type !== NodeType.TEXT);
    const text = getPlainText(node.children);
    const align = node.options?.align || "outward";
    const maxPerCol = this.effectiveRows;
    const remaining = maxPerCol - this.currentRow;
    const firstMax = remaining > 0 && remaining < maxPerCol ? remaining : maxPerCol;
    if (hasComplexChildren) {
      this.placeItem(node, { jiazhuSegments: null });
      const totalChars = [...text].length;
      this.advanceRows(Math.ceil(totalChars / 2));
      return;
    }
    const jiazhuSegments = splitJiazhuMulti(text, maxPerCol, align, firstMax);
    if (jiazhuSegments.length <= 1) {
      this.placeItem(node, { jiazhuSegments });
      const totalChars = [...text].length;
      this.advanceRows(Math.ceil(totalChars / 2));
      return;
    }
    this.placeItem(node, {
      jiazhuSegments: [jiazhuSegments[0]],
      jiazhuSegmentIndex: 0,
      jiazhuTotalSegments: jiazhuSegments.length
    });
    this.advanceRows(firstMax);
    for (let i = 1; i < jiazhuSegments.length; i++) {
      const seg = jiazhuSegments[i];
      const segRows = Math.max([...seg.col1].length, [...seg.col2].length);
      this.placeItem(node, {
        jiazhuSegments: [seg],
        jiazhuSegmentIndex: i,
        jiazhuTotalSegments: jiazhuSegments.length
      });
      this.advanceRows(segRows);
    }
  }
};
function layout(ast) {
  const templateId = resolveTemplateId(ast);
  const { nRows, nCols } = getGridConfig(templateId);
  const engine = new GridLayoutEngine(nRows, nCols);
  for (const child of ast.children) {
    if (child.type === "body") {
      engine.walkNode(child);
    }
  }
  const lastPage = engine.currentPage;
  if (lastPage.halfBoundary === null) {
    lastPage.halfBoundary = lastPage.items.length;
  }
  const meta = {
    title: ast.title || "",
    chapter: ast.chapter || "",
    setupCommands: ast.setupCommands || []
  };
  return {
    pages: engine.pages,
    gridConfig: { nRows, nCols },
    templateId,
    meta
  };
}

// src/renderer/html-renderer.js
var setupParamMap = {
  content: {
    "font-size": "--wtc-font-size",
    "line-height": "--wtc-line-height",
    "letter-spacing": "--wtc-letter-spacing",
    "font-color": "--wtc-font-color",
    "border-color": "--wtc-border-color",
    "border-thickness": "--wtc-border-thickness"
  },
  page: {
    "page-width": "--wtc-page-width",
    "page-height": "--wtc-page-height",
    "margin-top": "--wtc-margin-top",
    "margin-bottom": "--wtc-margin-bottom",
    "margin-left": "--wtc-margin-left",
    "margin-right": "--wtc-margin-right",
    "background": "--wtc-page-background"
  },
  banxin: {
    "width": "--wtc-banxin-width",
    "font-size": "--wtc-banxin-font-size"
  },
  jiazhu: {
    "font-size": "--wtc-jiazhu-font-size",
    "color": "--wtc-jiazhu-color",
    "line-height": "--wtc-jiazhu-line-height",
    "gap": "--wtc-jiazhu-gap"
  },
  sidenode: {
    "font-size": "--wtc-sidenote-font-size",
    "color": "--wtc-sidenote-color"
  },
  meipi: {
    "font-size": "--wtc-meipi-font-size",
    "color": "--wtc-meipi-color"
  },
  pizhu: {
    "font-size": "--wtc-pizhu-font-size",
    "color": "--wtc-pizhu-color"
  }
};
function escapeHTML(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
var HTMLRenderer = class {
  constructor(ast) {
    this.ast = ast;
    this.templateId = resolveTemplateId(ast);
    this.meipiCount = 0;
    const grid = getGridConfig(this.templateId);
    this.nRows = grid.nRows;
    this.nCols = grid.nCols;
    this.currentIndent = 0;
    this.colPos = 0;
  }
  /**
   * Collect CSS variable overrides from setup commands.
   */
  getSetupStylesFromCommands(setupCommands) {
    const overrides = [];
    for (const cmd of setupCommands || []) {
      const mapping = setupParamMap[cmd.setupType];
      if (!mapping || !cmd.params) continue;
      for (const [param, value] of Object.entries(cmd.params)) {
        const cssVar = mapping[param];
        if (cssVar) {
          overrides.push(`${cssVar}: ${value}`);
        }
      }
    }
    return overrides.length > 0 ? ` style="${overrides.join("; ")}"` : "";
  }
  getSetupStyles() {
    return this.getSetupStylesFromCommands(this.ast.setupCommands);
  }
  // =====================================================================
  // Legacy render() — walks AST directly (kept for backward compat)
  // =====================================================================
  render() {
    let html = "";
    for (const child of this.ast.children) {
      html += this.renderNode(child);
    }
    return html;
  }
  renderPage() {
    const content = this.render();
    return `<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHTML(this.ast.title || "WebTeX-CN")}</title>
<link rel="stylesheet" href="base.css">
</head>
<body>
<div class="wtc-page" data-template="${this.templateId}">
${content}
</div>
</body>
</html>`;
  }
  // =====================================================================
  // New layout-based render pipeline
  // =====================================================================
  /**
  * Render a LayoutResult into multi-page HTML.
  * Each layout page is split into two visual half-pages, each with its own banxin.
  *
  * @param {object} layoutResult  Output of layout()
  * @returns {string[]} Array of page HTML strings (two per layout page)
  */
  renderFromLayout(layoutResult) {
    const setupStyles = this.getSetupStylesFromCommands(layoutResult.meta.setupCommands);
    const banxin = this.renderBanxinFromMeta(layoutResult.meta);
    let carryStack = [];
    const pages = [];
    for (const page of layoutResult.pages) {
      const boundary = page.halfBoundary ?? page.items.length;
      const rightItems = page.items.slice(0, boundary);
      const leftItems = page.items.slice(boundary);
      const right = this.renderLayoutItems(rightItems, carryStack);
      const left = this.renderLayoutItems(leftItems, right.openStack);
      carryStack = left.openStack;
      const rightHTML = right.html;
      const leftHTML = left.html;
      const floatsHTML = page.floats.map((f) => this.renderNode(f)).join("\n");
      pages.push(`<div class="wtc-spread wtc-spread-right"${setupStyles}>
${floatsHTML}<div class="wtc-half-page wtc-half-right"><div class="wtc-content-border"><div class="wtc-content">${rightHTML}</div></div></div>${banxin}
</div>`);
      pages.push(`<div class="wtc-spread wtc-spread-left"${setupStyles}>
<div class="wtc-half-page wtc-half-left"><div class="wtc-content-border"><div class="wtc-content">${leftHTML}</div></div></div>${banxin}
</div>`);
    }
    return pages;
  }
  /**
   * Get the open tag HTML for a marker item.
   */
  markerOpenTag(item) {
    const type = item.node.type;
    if (type === LayoutMarker.PARAGRAPH_START) {
      const indent = parseInt(item.paragraphNode?.options?.indent || "0", 10);
      if (indent > 0) {
        return `<span class="wtc-paragraph wtc-paragraph-indent" style="--wtc-paragraph-indent: calc(${indent} * var(--wtc-grid-height)); --wtc-paragraph-indent-height: calc((var(--wtc-n-rows) - ${indent}) * var(--wtc-grid-height))">`;
      }
      return '<span class="wtc-paragraph">';
    }
    if (type === LayoutMarker.LIST_START) return '<span class="wtc-list">';
    if (type === LayoutMarker.LIST_ITEM_START) return '<span class="wtc-list-item">';
    if (type === LayoutMarker.MULU_ITEM_START) {
      const level = item.level || 0;
      return `<span class="wtc-mulu-item" style="padding-inline-start: calc(${level} * var(--wtc-grid-height))">`;
    }
    return "";
  }
  /**
   * Get the close tag HTML for a marker type.
   */
  markerCloseTag(type) {
    if (type === LayoutMarker.PARAGRAPH_START) return "</span>";
    if (type === LayoutMarker.LIST_START) return "</span>";
    if (type === LayoutMarker.LIST_ITEM_START) return "</span>";
    if (type === LayoutMarker.MULU_ITEM_START) return "</span>";
    return "";
  }
  /**
   * Check if a marker type is an "open" marker.
   */
  isOpenMarker(type) {
    return type === LayoutMarker.PARAGRAPH_START || type === LayoutMarker.LIST_START || type === LayoutMarker.LIST_ITEM_START || type === LayoutMarker.MULU_ITEM_START;
  }
  /**
   * Check if a marker type is a "close" marker, and return its matching open type.
   */
  matchingOpenMarker(type) {
    if (type === LayoutMarker.PARAGRAPH_END) return LayoutMarker.PARAGRAPH_START;
    if (type === LayoutMarker.LIST_END) return LayoutMarker.LIST_START;
    if (type === LayoutMarker.LIST_ITEM_END) return LayoutMarker.LIST_ITEM_START;
    if (type === LayoutMarker.MULU_ITEM_END) return LayoutMarker.MULU_ITEM_START;
    return null;
  }
  /**
   * Render an array of layout items into HTML.
   * Handles start/end markers for paragraphs, lists, and list items.
   * markerStack: open markers inherited from a previous slice (for tag balancing).
   * Returns { html, openStack } where openStack is the unclosed markers at the end.
   */
  renderLayoutItems(items, markerStack = []) {
    let html = "";
    for (const entry of markerStack) {
      html += this.markerOpenTag(entry);
    }
    const stack = [...markerStack];
    for (const item of items) {
      const type = item.node.type;
      if (this.isOpenMarker(type)) {
        if (type === LayoutMarker.LIST_ITEM_START && !item.isFirstListItem) {
          html += '<br class="wtc-newline">';
        }
        html += this.markerOpenTag(item);
        stack.push(item);
      } else if (this.matchingOpenMarker(type)) {
        html += this.markerCloseTag(this.matchingOpenMarker(type));
        for (let i = stack.length - 1; i >= 0; i--) {
          if (stack[i].node.type === this.matchingOpenMarker(type)) {
            stack.splice(i, 1);
            break;
          }
        }
      } else {
        html += this.renderLayoutItem(item);
      }
    }
    const unclosed = [...stack];
    for (let i = stack.length - 1; i >= 0; i--) {
      html += this.markerCloseTag(stack[i].node.type);
    }
    return { html, openStack: unclosed };
  }
  /**
   * Render a single layout item.
   * If the item has pre-computed jiazhuSegments, use those directly.
   */
  renderLayoutItem(item) {
    if (item.jiazhuSegments && item.node.type === NodeType.JIAZHU) {
      return this.renderJiazhuFromSegments(item.node, item.jiazhuSegments);
    }
    return this.renderNode(item.node);
  }
  /**
   * Render jiazhu from pre-computed segments.
   */
  renderJiazhuFromSegments(node, segments) {
    const hasComplexChildren = node.children.some((c) => c.type !== NodeType.TEXT);
    if (hasComplexChildren) {
      return this.renderJiazhuComplex(node);
    }
    return segments.map(
      ({ col1, col2 }) => `<span class="wtc-jiazhu"><span class="wtc-jiazhu-col">${escapeHTML(col1)}</span><span class="wtc-jiazhu-col">${escapeHTML(col2)}</span></span>`
    ).join("");
  }
  /**
   * Render banxin from layout metadata.
   */
  renderBanxinFromMeta(meta) {
    if (!meta.title && !meta.chapter) return "";
    const title = escapeHTML(meta.title || "");
    const chapterParts = (meta.chapter || "").split(/\\\\|\n/).map((s) => s.trim()).filter(Boolean);
    const chapterHTML = chapterParts.map((p) => `<span class="wtc-banxin-chapter-part">${escapeHTML(p)}</span>`).join("");
    return `<div class="wtc-banxin">
  <div class="wtc-banxin-section wtc-banxin-upper">
    <span class="wtc-banxin-book-name">${title}</span>
    <div class="wtc-yuwei wtc-yuwei-upper"></div>
  </div>
  <div class="wtc-banxin-section wtc-banxin-middle">
    <div class="wtc-banxin-chapter">${chapterHTML}</div>
  </div>
  <div class="wtc-banxin-section wtc-banxin-lower">
    <div class="wtc-yuwei wtc-yuwei-lower"></div>
  </div>
</div>`;
  }
  // =====================================================================
  // Node rendering (shared between legacy and layout pipelines)
  // =====================================================================
  renderNode(node) {
    if (!node) return "";
    switch (node.type) {
      case "body":
        return this.renderChildren(node.children);
      case NodeType.CONTENT_BLOCK:
        return this.renderContentBlock(node);
      case NodeType.PARAGRAPH:
        return this.renderParagraph(node);
      case NodeType.TEXT: {
        const val = node.value || "";
        this.colPos += [...val].length;
        return escapeHTML(val);
      }
      case NodeType.NEWLINE:
        this.colPos = 0;
        return '<br class="wtc-newline">';
      case NodeType.MATH:
        return `<span class="wtc-math">${escapeHTML(node.value || "")}</span>`;
      case NodeType.PARAGRAPH_BREAK:
        this.colPos = 0;
        return '<br class="wtc-paragraph-break">';
      case NodeType.JIAZHU:
        return this.renderJiazhu(node);
      case NodeType.SIDENOTE:
        return this.renderSidenote(node);
      case NodeType.MEIPI:
        return this.renderMeipi(node);
      case NodeType.PIZHU:
        return this.renderPizhu(node);
      case NodeType.TEXTBOX:
        return this.renderTextbox(node);
      case NodeType.FILL_TEXTBOX:
        return this.renderFillTextbox(node);
      case NodeType.SPACE:
        return this.renderSpace(node);
      case NodeType.COLUMN_BREAK:
        this.colPos = 0;
        return '<br class="wtc-column-break">';
      case NodeType.TAITOU:
        return this.renderTaitou(node);
      case NodeType.NUOTAI:
        return this.renderNuotai(node);
      case NodeType.SET_INDENT:
        return `<span class="wtc-set-indent" data-indent="${node.value || 0}"></span>`;
      case NodeType.EMPHASIS:
        return `<span class="wtc-emphasis">${this.renderChildren(node.children)}</span>`;
      case NodeType.PROPER_NAME:
        return `<span class="wtc-proper-name">${this.renderChildren(node.children)}</span>`;
      case NodeType.BOOK_TITLE:
        return `<span class="wtc-book-title-mark">${this.renderChildren(node.children)}</span>`;
      case NodeType.INVERTED:
        return `<span class="wtc-inverted">${this.renderChildren(node.children)}</span>`;
      case NodeType.OCTAGON:
        return `<span class="wtc-octagon">${this.renderChildren(node.children)}</span>`;
      case NodeType.CIRCLED:
        return `<span class="wtc-circled">${this.renderChildren(node.children)}</span>`;
      case NodeType.INVERTED_OCTAGON:
        return `<span class="wtc-inverted wtc-octagon">${this.renderChildren(node.children)}</span>`;
      case NodeType.FIX:
        return `<span class="wtc-fix">${this.renderChildren(node.children)}</span>`;
      case NodeType.DECORATE:
        return `<span class="wtc-decorate">${this.renderChildren(node.children)}</span>`;
      case NodeType.LIST:
        return this.renderList(node);
      case NodeType.LIST_ITEM:
        return `<div class="wtc-list-item">${this.renderChildren(node.children)}</div>`;
      case NodeType.STAMP:
        return this.renderStamp(node);
      default:
        if (node.children && node.children.length > 0) {
          return this.renderChildren(node.children);
        }
        return "";
    }
  }
  renderChildren(children) {
    return children.map((c) => this.renderNode(c)).join("");
  }
  renderContentBlock(node) {
    const floatingHTML = [];
    const inlineChildren = [];
    for (const child of node.children) {
      if (child.type === NodeType.MEIPI || child.type === NodeType.PIZHU || child.type === NodeType.STAMP) {
        floatingHTML.push(this.renderNode(child));
      } else {
        inlineChildren.push(child);
      }
    }
    const inner = inlineChildren.map((c) => this.renderNode(c)).join("");
    const floating = floatingHTML.join("\n");
    const banxin = this.renderBanxin();
    const setupStyles = this.getSetupStyles();
    return `<div class="wtc-spread"${setupStyles}>
${floating}<div class="wtc-half-page wtc-half-right"><div class="wtc-content-border"><div class="wtc-content">${inner}</div></div></div>${banxin}<div class="wtc-half-page wtc-half-left"><div class="wtc-content-border"><div class="wtc-content"></div></div></div>
</div>`;
  }
  renderBanxin() {
    if (!this.ast.title && !this.ast.chapter) return "";
    const title = escapeHTML(this.ast.title || "");
    const chapterParts = (this.ast.chapter || "").split(/\\\\|\n/).map((s) => s.trim()).filter(Boolean);
    const chapterHTML = chapterParts.map((p) => `<span class="wtc-banxin-chapter-part">${escapeHTML(p)}</span>`).join("");
    return `<div class="wtc-banxin">
  <div class="wtc-banxin-section wtc-banxin-upper">
    <span class="wtc-banxin-book-name">${title}</span>
    <div class="wtc-yuwei wtc-yuwei-upper"></div>
  </div>
  <div class="wtc-banxin-section wtc-banxin-middle">
    <div class="wtc-banxin-chapter">${chapterHTML}</div>
  </div>
  <div class="wtc-banxin-section wtc-banxin-lower">
    <div class="wtc-yuwei wtc-yuwei-lower"></div>
  </div>
</div>`;
  }
  renderParagraph(node) {
    const indent = parseInt(node.options?.indent || "0", 10);
    if (indent > 0) {
      const prevIndent = this.currentIndent;
      this.currentIndent = indent;
      const inner = this.renderChildren(node.children);
      this.currentIndent = prevIndent;
      return `<span class="wtc-paragraph wtc-paragraph-indent" style="--wtc-paragraph-indent: calc(${indent} * var(--wtc-grid-height)); --wtc-paragraph-indent-height: calc((var(--wtc-n-rows) - ${indent}) * var(--wtc-grid-height))">${inner}</span>`;
    }
    return `<span class="wtc-paragraph">${this.renderChildren(node.children)}</span>`;
  }
  renderJiazhu(node) {
    const hasComplexChildren = node.children.some((c) => c.type !== NodeType.TEXT);
    if (hasComplexChildren) {
      return this.renderJiazhuComplex(node);
    }
    const text = getPlainText(node.children);
    const align = node.options?.align || "outward";
    const maxPerCol = this.nRows - this.currentIndent;
    const remaining = maxPerCol - this.colPos % maxPerCol;
    const firstMax = remaining > 0 && remaining < maxPerCol ? remaining : maxPerCol;
    const segments = splitJiazhuMulti(text, maxPerCol, align, firstMax);
    const totalChars = [...text].length;
    const firstSegChars = firstMax * 2;
    if (totalChars <= firstSegChars) {
      this.colPos += Math.ceil(totalChars / 2);
    } else {
      const lastSeg = segments[segments.length - 1];
      this.colPos = Math.max([...lastSeg.col1].length, [...lastSeg.col2].length);
    }
    return segments.map(
      ({ col1, col2 }) => `<span class="wtc-jiazhu"><span class="wtc-jiazhu-col">${escapeHTML(col1)}</span><span class="wtc-jiazhu-col">${escapeHTML(col2)}</span></span>`
    ).join("");
  }
  renderJiazhuComplex(node) {
    const text = getPlainText(node.children);
    const mid = Math.ceil([...text].length / 2);
    let charCount = 0;
    let splitIdx = node.children.length;
    for (let i = 0; i < node.children.length; i++) {
      const childText = getPlainText([node.children[i]]);
      charCount += [...childText].length;
      if (charCount >= mid) {
        splitIdx = i + 1;
        break;
      }
    }
    const col1HTML = node.children.slice(0, splitIdx).map((c) => this.renderNode(c)).join("");
    const col2HTML = node.children.slice(splitIdx).map((c) => this.renderNode(c)).join("");
    return `<span class="wtc-jiazhu"><span class="wtc-jiazhu-col">${col1HTML}</span><span class="wtc-jiazhu-col">${col2HTML}</span></span>`;
  }
  renderSidenote(node) {
    const opts = node.options || {};
    let style = this.buildStyleFromOptions(opts, {
      color: "--wtc-sidenote-color",
      "font-size": "--wtc-sidenote-font-size"
    });
    if (opts.yoffset) {
      style += `margin-block-start: ${opts.yoffset};`;
    }
    return `<span class="wtc-sidenote"${style ? ` style="${style}"` : ""}>${this.renderChildren(node.children)}</span>`;
  }
  renderMeipi(node) {
    const opts = node.options || {};
    let style = "";
    if (opts.x) {
      style += `right: ${opts.x};`;
    } else {
      const autoX = this.meipiCount * 2;
      style += `right: ${autoX}em;`;
      this.meipiCount++;
    }
    if (opts.y) style += `top: ${opts.y};`;
    if (opts.height) style += `height: ${opts.height};`;
    if (opts.color) style += `color: ${this.parseColor(opts.color)};`;
    if (opts["font-size"]) style += `font-size: ${opts["font-size"]};`;
    return `<div class="wtc-meipi"${style ? ` style="${style}"` : ""}>${this.renderChildren(node.children)}</div>`;
  }
  renderPizhu(node) {
    const opts = node.options || {};
    let style = "";
    if (opts.x) style += `right: ${opts.x};`;
    if (opts.y) style += `top: ${opts.y};`;
    if (opts.color) style += `color: ${this.parseColor(opts.color)};`;
    if (opts["font-size"]) style += `font-size: ${opts["font-size"]};`;
    return `<div class="wtc-pizhu"${style ? ` style="${style}"` : ""}>${this.renderChildren(node.children)}</div>`;
  }
  renderTextbox(node) {
    const opts = node.options || {};
    let style = "";
    if (opts.height) {
      const h = opts.height;
      if (/^\d+$/.test(h)) {
        style += `--wtc-textbox-height: ${h};`;
      } else {
        style += `inline-size: ${h};`;
      }
    }
    if (opts.border === "true") style += "border: 1px solid var(--wtc-border-color);";
    if (opts["background-color"]) style += `background-color: ${this.parseColor(opts["background-color"])};`;
    if (opts["font-color"]) style += `color: ${this.parseColor(opts["font-color"])};`;
    if (opts["font-size"]) style += `font-size: ${opts["font-size"]};`;
    return `<span class="wtc-textbox"${style ? ` style="${style}"` : ""}>${this.renderChildren(node.children)}</span>`;
  }
  renderFillTextbox(node) {
    const opts = node.options || {};
    let style = "";
    if (opts.height) {
      style += `--wtc-textbox-height: ${opts.height};`;
    }
    if (opts.value && /^\d+$/.test(opts.value)) {
      style += `--wtc-textbox-height: ${opts.value};`;
    }
    return `<span class="wtc-textbox wtc-textbox-fill"${style ? ` style="${style}"` : ""}>${this.renderChildren(node.children)}</span>`;
  }
  renderSpace(node) {
    const count = parseInt(node.value, 10) || 1;
    return "\u3000".repeat(count);
  }
  renderTaitou(node) {
    const level = node.value || "0";
    return `<br class="wtc-newline"><span class="wtc-taitou" data-level="${level}"></span>`;
  }
  renderNuotai(node) {
    const count = parseInt(node.value, 10) || 1;
    return "\u3000".repeat(count);
  }
  renderList(node) {
    return `<div class="wtc-list">${this.renderChildren(node.children)}</div>`;
  }
  renderStamp(node) {
    const opts = node.options || {};
    let style = "position: absolute;";
    if (opts.xshift) style += `right: ${opts.xshift};`;
    if (opts.yshift) style += `top: ${opts.yshift};`;
    if (opts.width) style += `width: ${opts.width};`;
    if (opts.opacity) style += `opacity: ${opts.opacity};`;
    return `<img class="wtc-stamp" src="${escapeHTML(node.src || "")}" style="${style}" alt="stamp">`;
  }
  parseColor(colorStr) {
    if (!colorStr) return "inherit";
    colorStr = colorStr.replace(/[{}]/g, "").trim();
    if (/^[a-zA-Z]+$/.test(colorStr)) return colorStr;
    const parts = colorStr.split(/[\s,]+/).map(Number);
    if (parts.length === 3) {
      if (parts.every((v) => v >= 0 && v <= 1)) {
        return `rgb(${Math.round(parts[0] * 255)}, ${Math.round(parts[1] * 255)}, ${Math.round(parts[2] * 255)})`;
      }
      if (parts.every((v) => v >= 0 && v <= 255)) {
        return `rgb(${parts[0]}, ${parts[1]}, ${parts[2]})`;
      }
    }
    return colorStr;
  }
  buildStyleFromOptions(opts, mapping) {
    if (!opts) return "";
    let style = "";
    for (const [key, cssVar] of Object.entries(mapping)) {
      if (opts[key] && cssVar) {
        style += `${cssVar}: ${opts[key]};`;
      }
    }
    return style;
  }
};

// src/index.js
function renderToHTML(texSource) {
  const { ast, warnings } = parse(texSource);
  if (warnings.length > 0) {
    console.warn("[WebTeX-CN] Parse warnings:", warnings);
  }
  const layoutResult = layout(ast);
  const renderer = new HTMLRenderer(ast);
  const pageHTMLs = renderer.renderFromLayout(layoutResult);
  return pageHTMLs.map(
    (html) => `<div class="wtc-page" data-template="${layoutResult.templateId}">${html}</div>`
  ).join("\n");
}
function renderToPage(texSource) {
  const { ast, warnings } = parse(texSource);
  if (warnings.length > 0) {
    console.warn("[WebTeX-CN] Parse warnings:", warnings);
  }
  const renderer = new HTMLRenderer(ast);
  return renderer.renderPage();
}
function renderToDOM(texSource, container, options = {}) {
  const { cssBasePath } = options;
  const { ast, warnings } = parse(texSource);
  if (warnings.length > 0) {
    console.warn("[WebTeX-CN] Parse warnings:", warnings);
  }
  const layoutResult = layout(ast);
  const renderer = new HTMLRenderer(ast);
  const pageHTMLs = renderer.renderFromLayout(layoutResult);
  const el = typeof container === "string" ? document.querySelector(container) : container;
  if (!el) {
    throw new Error(`[WebTeX-CN] Container not found: ${container}`);
  }
  if (cssBasePath && typeof document !== "undefined") {
    setTemplate(layoutResult.templateId, cssBasePath);
  }
  el.innerHTML = pageHTMLs.map(
    (html) => `<div class="wtc-page" data-template="${layoutResult.templateId}">${html}</div>`
  ).join("\n");
}
async function render(url, container, options = {}) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`[WebTeX-CN] Failed to fetch ${url}: ${response.status}`);
  }
  const texSource = await response.text();
  renderToDOM(texSource, container, options);
}
function getTemplates() {
  return [
    { id: "siku-quanshu", name: "\u56DB\u5E93\u5168\u4E66 (\u9ED1\u767D)" },
    { id: "siku-quanshu-colored", name: "\u56DB\u5E93\u5168\u4E66 (\u5F69\u8272)" },
    { id: "honglou", name: "\u7EA2\u697C\u68A6\u7532\u620C\u672C" },
    { id: "minimal", name: "\u6781\u7B80" }
  ];
}
function setTemplate(templateId, basePath = "") {
  if (typeof document === "undefined") return;
  const old = document.querySelector("link[data-wtc-template]");
  if (old) old.remove();
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `${basePath}${templateId}.css`;
  link.dataset.wtcTemplate = templateId;
  document.head.appendChild(link);
}
if (typeof window !== "undefined") {
  window.WebTeX = { render, renderToDOM, renderToHTML, renderToPage, parse, getTemplates, setTemplate };
}
export {
  HTMLRenderer,
  getTemplates,
  layout,
  parse,
  render,
  renderToDOM,
  renderToHTML,
  renderToPage,
  setTemplate
};
