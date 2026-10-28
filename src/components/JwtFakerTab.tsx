import { useState, useEffect } from "react";
import {
  generateJwt,
  decodeJwt,
  getClaimTimestamp,
} from "../utils/jwtUtils";
import type { JwtAlgorithm, JwtTemplate } from "../utils/types";
import { Copy, Check, Sparkles, X } from "lucide-react";

export interface JwtFakerTabProps {
  showToast?: (message: string, type?: "info" | "success" | "warning" | "error") => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const DEFAULT_HEADER = JSON.stringify({ alg: "HS256", typ: "JWT" }, null, 2);
const DEFAULT_PAYLOAD = JSON.stringify(
  {
    sub: "123456789",
    name: "John Doe",
    email: "john@example.com",
    role: "admin",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  },
  null,
  2
);

export const JwtFakerTab = ({ showToast, isOpen, onClose }: JwtFakerTabProps = {}) => {
  if (isOpen === false) return null;

  const [algorithm, setAlgorithm] = useState<JwtAlgorithm>("HS256");
  const [secret, setSecret] = useState("your-256-bit-secret");
  const [headerJson, setHeaderJson] = useState(DEFAULT_HEADER);
  const [payloadJson, setPayloadJson] = useState(DEFAULT_PAYLOAD);
  const [generatedJwt, setGeneratedJwt] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"editor" | "decoder" | "templates">("editor");
  const [inputTokenToDecode, setInputTokenToDecode] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);

  // Saved templates
  const [templates, setTemplates] = useState<JwtTemplate[]>(() => {
    try {
      const saved = localStorage.getItem("__voiden_jwt_templates__");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [templateName, setTemplateName] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem("__voiden_jwt_templates__", JSON.stringify(templates));
    } catch {
      // Ignore storage errors
    }
  }, [templates]);

  // Re-generate JWT whenever inputs change
  useEffect(() => {
    let isSubscribed = true;
    const generate = async () => {
      try {
        setParseError(null);
        let headerObj = {};
        let payloadObj = {};

        try {
          headerObj = JSON.parse(headerJson);
        } catch {
          setParseError("Invalid JSON in Header");
          return;
        }

        try {
          payloadObj = JSON.parse(payloadJson);
        } catch {
          setParseError("Invalid JSON in Payload");
          return;
        }

        const token = await generateJwt(headerObj, payloadObj, secret, algorithm);
        if (isSubscribed) {
          setGeneratedJwt(token);
        }
      } catch (err) {
        if (isSubscribed) {
          const msg = err instanceof Error ? err.message : String(err);
          setParseError(msg);
        }
      }
    };

    generate();
    return () => {
      isSubscribed = false;
    };
  }, [algorithm, secret, headerJson, payloadJson]);

  const handleCopy = () => {
    if (!generatedJwt) return;
    navigator.clipboard.writeText(generatedJwt);
    setCopied(true);
    showToast?.("JWT copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddClaim = (claimName: string, value: any) => {
    try {
      const current = JSON.parse(payloadJson || "{}");
      current[claimName] = value;
      setPayloadJson(JSON.stringify(current, null, 2));
    } catch {
      // Ignore parse error
    }
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) return;
    const newTemplate: JwtTemplate = {
      id: Date.now().toString(),
      name: templateName.trim(),
      algorithm,
      secret,
      header: headerJson,
      payload: payloadJson,
    };
    setTemplates([...templates, newTemplate]);
    setTemplateName("");
    showToast?.(`Saved template "${newTemplate.name}"`, "success");
  };

  const handleLoadTemplate = (tpl: JwtTemplate) => {
    setAlgorithm(tpl.algorithm);
    setSecret(tpl.secret);
    setHeaderJson(tpl.header);
    setPayloadJson(tpl.payload);
    setActiveTab("editor");
    showToast?.(`Loaded template "${tpl.name}"`, "info");
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates(templates.filter((t) => t.id !== id));
  };

  const decoded = decodeJwt(activeTab === "decoder" ? inputTokenToDecode || generatedJwt : generatedJwt);

  return (
    <div className="h-full w-full flex flex-col bg-bg text-text overflow-hidden">
      {/* Header toolbar */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-border bg-panel">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text">JWT Faker</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub-tabs: Generator / Decoder / Templates */}
          <div className="flex items-center bg-bg border border-border rounded p-0.5 text-xs">
            <button
              className={`px-3 py-1 rounded transition-colors ${
                activeTab === "editor"
                  ? "bg-active text-text font-medium shadow-sm"
                  : "text-comment hover:text-text hover:bg-hover/50"
              }`}
              onClick={() => setActiveTab("editor")}
            >
              Generator
            </button>
            <button
              className={`px-3 py-1 rounded transition-colors ${
                activeTab === "decoder"
                  ? "bg-active text-text font-medium shadow-sm"
                  : "text-comment hover:text-text hover:bg-hover/50"
              }`}
              onClick={() => {
                setActiveTab("decoder");
                if (!inputTokenToDecode) setInputTokenToDecode(generatedJwt);
              }}
            >
              Decoder
            </button>
            <button
              className={`px-3 py-1 rounded transition-colors ${
                activeTab === "templates"
                  ? "bg-active text-text font-medium shadow-sm"
                  : "text-comment hover:text-text hover:bg-hover/50"
              }`}
              onClick={() => setActiveTab("templates")}
            >
              Templates ({templates.length})
            </button>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-comment hover:text-text hover:bg-active rounded transition-colors"
              title="Close"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-editor">
        <div className="max-w-4xl mx-auto space-y-4">
          {activeTab === "editor" && (
            <>
              {/* Algorithm & Secret */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-comment mb-1.5">Algorithm</label>
                  <select
                    value={algorithm}
                    onChange={(e) => setAlgorithm(e.target.value as JwtAlgorithm)}
                    className="w-full bg-panel border border-border rounded px-2.5 py-1.5 text-xs text-text focus:border-accent outline-none transition-colors"
                  >
                    <option value="HS256">HS256 (HMAC SHA-256)</option>
                    <option value="HS384">HS384 (HMAC SHA-384)</option>
                    <option value="HS512">HS512 (HMAC SHA-512)</option>
                    <option value="none">none (Unsigned Token)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-comment mb-1.5">
                    Secret Key {algorithm === "none" && "(Not required for unsigned)"}
                  </label>
                  <input
                    type="text"
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    disabled={algorithm === "none"}
                    placeholder="Enter signing secret"
                    className="w-full bg-panel border border-border rounded px-2.5 py-1.5 text-xs text-text placeholder:text-comment/60 disabled:opacity-40 focus:border-accent outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Payload Claim Quick Buttons */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-comment font-medium">Quick Claims:</span>
                <button
                  onClick={() => handleAddClaim("exp", getClaimTimestamp(3600))}
                  className="px-2.5 py-1 bg-panel hover:bg-active border border-border rounded text-text transition-colors"
                >
                  +1h Exp
                </button>
                <button
                  onClick={() => handleAddClaim("exp", getClaimTimestamp(86400))}
                  className="px-2.5 py-1 bg-panel hover:bg-active border border-border rounded text-text transition-colors"
                >
                  +1d Exp
                </button>
                <button
                  onClick={() => handleAddClaim("iat", getClaimTimestamp(0))}
                  className="px-2.5 py-1 bg-panel hover:bg-active border border-border rounded text-text transition-colors"
                >
                  Set iat Now
                </button>
                <button
                  onClick={() => handleAddClaim("nbf", getClaimTimestamp(0))}
                  className="px-2.5 py-1 bg-panel hover:bg-active border border-border rounded text-text transition-colors"
                >
                  Set nbf Now
                </button>
              </div>

              {/* JSON Editors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-comment">Header (JSON)</label>
                  </div>
                  <textarea
                    rows={7}
                    value={headerJson}
                    onChange={(e) => setHeaderJson(e.target.value)}
                    className="w-full font-mono text-xs bg-panel border border-border rounded p-2.5 text-text focus:border-accent outline-none transition-colors resize-y"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-comment">Payload (JSON)</label>
                  </div>
                  <textarea
                    rows={7}
                    value={payloadJson}
                    onChange={(e) => setPayloadJson(e.target.value)}
                    className="w-full font-mono text-xs bg-panel border border-border rounded p-2.5 text-text focus:border-accent outline-none transition-colors resize-y"
                  />
                </div>
              </div>

              {/* Parse Error */}
              {parseError && (
                <div className="text-xs text-status-error bg-status-error/10 border border-status-error/30 rounded px-3 py-2 font-mono">
                  {parseError}
                </div>
              )}

              {/* Encoded Token Result */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-text">Generated Encoded JWT</label>
                  <button
                    onClick={handleCopy}
                    disabled={!generatedJwt}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs bg-panel hover:bg-active text-text font-medium border border-border rounded transition-colors disabled:opacity-50"
                  >
                    {copied ? <Check size={13} className="text-status-success" /> : <Copy size={13} className="text-comment" />}
                    <span className={copied ? "text-status-success" : ""}>{copied ? "Copied!" : "Copy JWT"}</span>
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={3}
                  value={generatedJwt}
                  className="w-full font-mono text-xs bg-panel border border-border rounded p-2.5 text-text select-all focus:border-accent outline-none transition-colors resize-none"
                />
              </div>

              {/* Save Template Bar */}
              <div className="flex items-center gap-2 pt-3 border-t border-border">
                <input
                  type="text"
                  placeholder="Template name (e.g. Admin Token)"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="flex-1 bg-panel border border-border rounded px-3 py-1.5 text-xs text-text placeholder:text-comment/60 focus:border-accent outline-none transition-colors"
                />
                <button
                  onClick={handleSaveTemplate}
                  disabled={!templateName.trim()}
                  className="px-3.5 py-1.5 bg-panel hover:bg-active text-text border border-border text-xs font-medium rounded transition-colors disabled:opacity-50"
                >
                  Save as Template
                </button>
              </div>
            </>
          )}

          {activeTab === "decoder" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-comment mb-1.5">JWT Token to Decode</label>
                <textarea
                  rows={4}
                  value={inputTokenToDecode}
                  onChange={(e) => setInputTokenToDecode(e.target.value)}
                  placeholder="Paste JWT token here..."
                  className="w-full font-mono text-xs bg-panel border border-border rounded p-2.5 text-text placeholder:text-comment/60 focus:border-accent outline-none transition-colors"
                />
              </div>

              {decoded.isValid ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="block text-xs font-semibold text-accent mb-1.5">Decoded Header</span>
                    <pre className="font-mono text-xs bg-panel border border-border rounded p-2.5 overflow-x-auto text-text">
                      {JSON.stringify(decoded.header, null, 2)}
                    </pre>
                  </div>

                  <div>
                    <span className="block text-xs font-semibold text-alt mb-1.5">Decoded Payload</span>
                    <pre className="font-mono text-xs bg-panel border border-border rounded p-2.5 overflow-x-auto text-text">
                      {JSON.stringify(decoded.payload, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-status-error bg-status-error/10 border border-status-error/30 rounded p-3 font-mono">
                  {decoded.error || "Invalid token structure"}
                </div>
              )}
            </div>
          )}

          {activeTab === "templates" && (
            <div className="space-y-3">
              {templates.length === 0 ? (
                <div className="text-xs text-comment text-center py-10">
                  No saved templates yet. Customize claims in the Generator and click "Save as Template".
                </div>
              ) : (
                templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="flex items-center justify-between p-3 border border-border rounded bg-panel hover:bg-surface transition-colors"
                  >
                    <div>
                      <div className="text-xs font-semibold text-text">{tpl.name}</div>
                      <div className="text-[11px] text-comment mt-0.5">
                        Alg: {tpl.algorithm} | Key: {tpl.secret || "(none)"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleLoadTemplate(tpl)}
                        className="px-3 py-1 text-xs bg-active hover:bg-hover text-text border border-border rounded font-medium transition-colors"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(tpl.id)}
                        className="p-1 text-comment hover:text-status-error rounded transition-colors"
                        title="Delete template"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const JwtFakerModal = JwtFakerTab;
export default JwtFakerTab;
