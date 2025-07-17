import { useState } from "react";
import { CopyOutlined, CheckOutlined } from "@ant-design/icons";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

const CodeBlock = ({ language, value }: { language?: string; value: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ position: "relative" }}>
      <SyntaxHighlighter
        language={language}
        style={oneLight}
      >
        {value}
      </SyntaxHighlighter>
      <button
        onClick={handleCopy}
        style={{
          position: "absolute",
          top: 8,
          right: 12,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontSize: 16,
        }}
        title="Copy to clipboard"
      >
        {copied ? <CheckOutlined /> : <CopyOutlined />}
      </button>
    </div>
  );
};

export default CodeBlock;
