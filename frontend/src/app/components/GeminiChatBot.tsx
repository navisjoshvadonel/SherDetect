"use client";

import React, { useState, useEffect, useRef } from "react";
import { DocumentItem } from "../types";

export type BotRole = "investigator" | "compliance" | "triage";
export type ModelSpeed = "fast" | "general" | "complex";

interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
  modelUsed?: string;
  botRole?: BotRole;
  isSimulated?: boolean;
}

interface GeminiChatBotProps {
  activeDocument?: DocumentItem | null;
  documents?: DocumentItem[];
}

export const GeminiChatBot: React.FC<GeminiChatBotProps> = ({
  activeDocument,
  documents = [],
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [role, setRole] = useState<BotRole>("investigator");
  const [modelSpeed, setModelSpeed] = useState<ModelSpeed>("general");
  const [inputMessage, setInputMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [includeDocContext, setIncludeDocContext] = useState<boolean>(true);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Initial welcome message
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      role: "model",
      text: "👋 **Hello! I am your SherDetect Gemini AI Assistant.**\n\nI can analyze document tampering, interpret Error Level Analysis (ELA) heatmaps, verify font discrepancies, audit KYC compliance, and draft official inspection reports.\n\n*Select a role above or ask any question to get started.*",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      modelUsed: "gemini-3.7-flash",
      botRole: "investigator",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of message thread
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isMinimized, isLoading]);

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputMessage.trim();
    if (!textToSend || isLoading) return;

    const userMessageId = "msg-" + Date.now();
    const userMessage: ChatMessage = {
      id: userMessageId,
      role: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputMessage("");
    setIsLoading(true);

    // Prepare context payload if enabled and active document exists
    let docContextPayload = null;
    if (includeDocContext) {
      const targetDoc = activeDocument || (documents.length > 0 ? documents[0] : null);
      if (targetDoc) {
        docContextPayload = {
          id: targetDoc.id,
          fileName: targetDoc.fileName,
          domain: targetDoc.domainDisplay || targetDoc.domain,
          docType: targetDoc.docTypeDisplay || targetDoc.docType,
          status: targetDoc.status,
          riskScore: targetDoc.report?.fraudRiskScore,
          verdict: targetDoc.report?.verdict,
          summary: targetDoc.report?.forensicSummary,
          findings: targetDoc.report?.detectedAnomalies,
        };
      }
    }

    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({ role: m.role, text: m.text })),
          role,
          modelSpeed,
          documentContext: docContextPayload,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to receive AI response.");
      }

      const botReply: ChatMessage = {
        id: "reply-" + Date.now(),
        role: "model",
        text: data.reply || "No response generated.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        modelUsed: data.model || (modelSpeed === "fast" ? "gemini-3.1-flash-lite" : modelSpeed === "complex" ? "gemini-3.1-pro-preview" : "gemini-3.7-flash"),
        botRole: role,
        isSimulated: data.isSimulated,
      };

      setMessages((prev) => [...prev, botReply]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: "error-" + Date.now(),
        role: "model",
        text: `⚠️ **Forensic Analysis Alert**: ${err?.message || "An unexpected error occurred while communicating with Gemini."}\n\n*Please ensure your network connection is active or retry your query.*`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        modelUsed: "fallback",
        botRole: role,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: "welcome-cleared-" + Date.now(),
        role: "model",
        text: "🧹 **Chat history cleared.** Ready for a new forensic or compliance investigation.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        modelUsed: modelSpeed === "fast" ? "gemini-3.1-flash-lite" : modelSpeed === "complex" ? "gemini-3.1-pro-preview" : "gemini-3.7-flash",
        botRole: role,
      },
    ]);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const quickPrompts = [
    {
      label: "🔍 Explain ELA Discrepancies",
      prompt: "Explain what high-contrast white artifacts in Error Level Analysis (ELA) indicate on a digital document.",
    },
    {
      label: "📑 Check Resume Integrity",
      prompt: "What are the most common signs of digital forgery or font tampering in PDF resumes?",
    },
    {
      label: "⚠️ Current File Risk Audit",
      prompt: activeDocument
        ? `Perform a forensic risk audit for Document #${activeDocument.id} (${activeDocument.fileName}) with status "${activeDocument.status}".`
        : "What are the standard 6-layer document verification stages in SherDetect?",
    },
    {
      label: "⚖️ Draft Rejection Letter",
      prompt: "Draft an official formal notice rejecting a document due to detected compression anomalies and font inconsistencies.",
    },
  ];

  const currentDocLabel = activeDocument?.fileName || (documents.length > 0 ? documents[0].fileName : "Sample Document");

  // Helper to format basic markdown (bold, headers, lists, code)
  const renderFormattedText = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      // Headers
      if (line.startsWith("### ")) {
        return (
          <h4 key={idx} className="font-extrabold text-sm text-brutal-black mt-2 mb-1">
            {line.replace("### ", "")}
          </h4>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h3 key={idx} className="font-black text-base text-brutal-black mt-2 mb-1">
            {line.replace("## ", "")}
          </h3>
        );
      }
      // Bullet items
      if (line.startsWith("- ") || line.startsWith("* ")) {
        const itemText = line.substring(2);
        return (
          <li key={idx} className="ml-4 list-disc text-xs text-slate-800 leading-relaxed">
            {renderInlineMarkdown(itemText)}
          </li>
        );
      }
      // Numbered lists
      if (/^\d+\.\s/.test(line)) {
        return (
          <p key={idx} className="text-xs text-slate-800 my-0.5 leading-relaxed font-medium">
            {renderInlineMarkdown(line)}
          </p>
        );
      }
      // Empty line
      if (line.trim() === "") {
        return <div key={idx} className="h-1.5" />;
      }
      // Regular line
      return (
        <p key={idx} className="text-xs text-slate-800 leading-relaxed">
          {renderInlineMarkdown(line)}
        </p>
      );
    });
  };

  const renderInlineMarkdown = (text: string) => {
    // Basic regex parser for **bold** and `code`
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-black text-brutal-black">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={i} className="bg-slate-200 text-slate-900 px-1 py-0.5 rounded text-[11px] font-mono border border-slate-300">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2">
          <button
            id="gemini-chat-launcher"
            type="button"
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
            }}
            className="neo-btn bg-brutal-yellow text-brutal-black px-4 py-2.5 rounded-2xl flex items-center gap-2.5 shadow-brutal hover:scale-105 transition-all group"
            aria-label="Open Gemini Forensic AI Chat"
          >
            <div className="w-7 h-7 rounded-lg bg-brutal-purple text-white flex items-center justify-center border-2 border-brutal-black shadow-brutal-sm group-hover:rotate-12 transition-transform">
              <i className="fa-solid fa-sparkles text-xs"></i>
            </div>
            <div className="text-left">
              <div className="text-xs font-black uppercase tracking-tight flex items-center gap-1.5">
                <span>Gemini Forensic AI</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <p className="text-[10px] font-extrabold text-slate-700">
                Multi-Turn Forensic Bot
              </p>
            </div>
          </button>
        </div>
      )}

      {/* Floating Chat Modal / Drawer */}
      {isOpen && (
        <div
          id="gemini-chat-window"
          className={`fixed bottom-5 right-4 sm:right-6 z-50 w-[94vw] sm:w-[460px] md:w-[500px] transition-all duration-300 ${
            isMinimized ? "h-14" : "h-[620px] max-h-[88vh]"
          } bg-white border-3 border-brutal-black rounded-2xl shadow-[6px_6px_0px_#121212] flex flex-col overflow-hidden`}
        >
          {/* Top Bar / Header */}
          <div className="bg-brutal-yellow border-b-2.5 border-brutal-black px-3.5 py-2.5 flex items-center justify-between gap-2 select-none">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-brutal-purple text-white border-2 border-brutal-black shadow-brutal-sm flex items-center justify-center text-sm font-extrabold">
                <i className="fa-solid fa-robot"></i>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-xs uppercase tracking-tight text-brutal-black">
                    SherDetect Gemini Bot
                  </span>
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-white border border-brutal-black shadow-brutal-sm">
                    {modelSpeed === "fast" ? "Fast Lite" : modelSpeed === "complex" ? "Pro Preview" : "3.7 Flash"}
                  </span>
                </div>
                <p className="text-[10px] font-bold text-slate-800">
                  {role === "investigator"
                    ? "Senior Forensic Investigator"
                    : role === "compliance"
                    ? "Compliance & KYC Auditor"
                    : "Rapid Triage Assistant"}
                </p>
              </div>
            </div>

            {/* Window Controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                id="chat-clear-btn"
                title="Clear conversation"
                onClick={handleClearChat}
                className="w-7 h-7 rounded-lg bg-white border-2 border-brutal-black shadow-brutal-sm flex items-center justify-center hover:bg-slate-100 transition-transform active:scale-95"
              >
                <i className="fa-solid fa-trash-can text-[11px] text-brutal-black"></i>
              </button>

              <button
                type="button"
                id="chat-minimize-btn"
                title={isMinimized ? "Expand" : "Minimize"}
                onClick={() => setIsMinimized(!isMinimized)}
                className="w-7 h-7 rounded-lg bg-white border-2 border-brutal-black shadow-brutal-sm flex items-center justify-center hover:bg-slate-100 transition-transform active:scale-95"
              >
                <i className={`fa-solid ${isMinimized ? "fa-up-right-and-down-left-from-center" : "fa-minus"} text-[11px] text-brutal-black`}></i>
              </button>

              <button
                type="button"
                id="chat-close-btn"
                title="Close chat"
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg bg-brutal-pink text-white border-2 border-brutal-black shadow-brutal-sm flex items-center justify-center hover:bg-pink-600 transition-transform active:scale-95"
              >
                <i className="fa-solid fa-xmark text-xs font-black"></i>
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Role & Model Speed Sub-Header Controls */}
              <div className="bg-slate-50 border-b-2 border-brutal-black p-2.5 space-y-2">
                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                  {/* Bot Role Selector */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-black uppercase text-slate-700">ROLE:</span>
                    <div className="flex bg-white border-1.5 border-brutal-black rounded-lg p-0.5 shadow-brutal-sm">
                      <button
                        type="button"
                        onClick={() => setRole("investigator")}
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase transition-all ${
                          role === "investigator"
                            ? "bg-brutal-yellow text-brutal-black"
                            : "text-slate-600 hover:text-brutal-black"
                        }`}
                        title="Senior Forensic Investigator (Deep ELA & Tamper Analysis)"
                      >
                        🔍 Investigator
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole("compliance")}
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase transition-all ${
                          role === "compliance"
                            ? "bg-brutal-cyan text-brutal-black"
                            : "text-slate-600 hover:text-brutal-black"
                        }`}
                        title="Regulatory Compliance & KYC Auditor"
                      >
                        📋 Auditor
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole("triage")}
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase transition-all ${
                          role === "triage"
                            ? "bg-brutal-green text-brutal-black"
                            : "text-slate-600 hover:text-brutal-black"
                        }`}
                        title="Rapid Document Triage"
                      >
                        ⚡ Triage
                      </button>
                    </div>
                  </div>

                  {/* Model Engine Selector */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-black uppercase text-slate-700">ENGINE:</span>
                    <select
                      id="gemini-model-select"
                      aria-label="Select Gemini Model Engine"
                      value={modelSpeed}
                      onChange={(e) => setModelSpeed(e.target.value as ModelSpeed)}
                      className="bg-white border-1.5 border-brutal-black text-[10px] font-extrabold uppercase rounded-lg px-1.5 py-0.5 shadow-brutal-sm focus:outline-none"
                    >
                      <option value="general">Gemini 3.7 Flash (Standard)</option>
                      <option value="fast">Gemini 3.1 Flash Lite (Fast)</option>
                      <option value="complex">Gemini 3.1 Pro (Deep STEM)</option>
                    </select>
                  </div>
                </div>

                {/* Context Attachment Indicator */}
                <div className="flex items-center justify-between text-[10.5px] bg-white border-1.5 border-brutal-black rounded-lg px-2.5 py-1 shadow-brutal-sm">
                  <div className="flex items-center gap-1.5 truncate max-w-[70%]">
                    <i className="fa-solid fa-paperclip text-brutal-purple text-xs"></i>
                    <span className="font-extrabold text-slate-800 truncate">
                      Context: {currentDocLabel}
                    </span>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeDocContext}
                      onChange={(e) => setIncludeDocContext(e.target.checked)}
                      className="w-3.5 h-3.5 accent-brutal-yellow rounded cursor-pointer"
                    />
                    <span className="text-[10px] font-black uppercase text-slate-700">
                      Inject Doc Data
                    </span>
                  </label>
                </div>
              </div>

              {/* Scrollable Message Thread */}
              <div
                id="chat-messages-container"
                className="flex-1 overflow-y-auto p-3.5 space-y-3 custom-scrollbar bg-[#fafaf7]"
              >
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.role === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    {/* Role Header above bubble */}
                    <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] font-extrabold text-slate-500">
                      {msg.role === "user" ? (
                        <>
                          <span>You</span>
                          <span>•</span>
                          <span>{msg.timestamp}</span>
                        </>
                      ) : (
                        <>
                          <span className="font-black text-brutal-purple uppercase">
                            {msg.botRole === "triage"
                              ? "⚡ Triage Bot"
                              : msg.botRole === "compliance"
                              ? "📋 Auditor Bot"
                              : "🔍 Forensic Bot"}
                          </span>
                          {msg.modelUsed && (
                            <span className="bg-slate-200 text-slate-700 px-1 py-0.2 rounded text-[9px] font-mono">
                              {msg.modelUsed}
                            </span>
                          )}
                          <span>•</span>
                          <span>{msg.timestamp}</span>
                        </>
                      )}
                    </div>

                    {/* Bubble Content */}
                    <div
                      className={`relative max-w-[88%] rounded-xl p-3 border-2 border-brutal-black shadow-brutal-sm ${
                        msg.role === "user"
                          ? "bg-brutal-yellow text-brutal-black font-semibold text-xs"
                          : "bg-white text-slate-900"
                      }`}
                    >
                      {msg.role === "user" ? (
                        <p className="whitespace-pre-wrap text-xs font-bold leading-relaxed">{msg.text}</p>
                      ) : (
                        <div className="space-y-1">{renderFormattedText(msg.text)}</div>
                      )}

                      {/* Copy Action for Bot Responses */}
                      {msg.role === "model" && (
                        <div className="mt-2 pt-1.5 border-t border-slate-200 flex items-center justify-between text-[10px]">
                          <span className="text-[9.5px] font-bold text-slate-600">
                            {msg.isSimulated ? "⚡ Offline Reasoning" : "✨ Powered by Gemini"}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(msg.text, msg.id)}
                            className="text-slate-700 hover:text-brutal-black font-extrabold flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-slate-100 transition-colors"
                          >
                            <i className={`fa-solid ${copiedMessageId === msg.id ? "fa-check text-emerald-600" : "fa-copy"}`}></i>
                            {copiedMessageId === msg.id ? "Copied!" : "Copy"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Loading Bubble */}
                {isLoading && (
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] font-extrabold text-slate-500">
                      <span className="font-black text-brutal-purple uppercase">Gemini AI</span>
                      <span>•</span>
                      <span>Analyzing...</span>
                    </div>
                    <div className="bg-white border-2 border-brutal-black rounded-xl p-3 shadow-brutal-sm flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-brutal-purple animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-brutal-yellow animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-2 h-2 rounded-full bg-brutal-pink animate-bounce [animation-delay:0.4s]"></div>
                      <span className="text-xs font-bold text-slate-700 ml-1">
                        Performing multi-layer forensic reasoning...
                      </span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompt Starters Carousel */}
              <div className="bg-white border-t border-b border-slate-200 px-3 py-1.5 overflow-x-auto whitespace-nowrap custom-scrollbar flex items-center gap-1.5">
                <span className="text-[9.5px] font-black uppercase text-slate-600 me-1">Quick:</span>
                {quickPrompts.map((qp, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSendMessage(qp.prompt)}
                    disabled={isLoading}
                    className="inline-block px-2 py-0.8 bg-slate-100 hover:bg-brutal-yellow text-brutal-black font-extrabold text-[10.5px] rounded-lg border border-brutal-black shadow-brutal-sm transition-all hover:scale-102 shrink-0 disabled:opacity-50"
                  >
                    {qp.label}
                  </button>
                ))}
              </div>

              {/* Input Area */}
              <div className="bg-white p-2.5 border-t-2 border-brutal-black">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={textareaRef}
                    id="gemini-chat-input"
                    rows={2}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about document forgery, ELA anomalies, compliance regulations..."
                    disabled={isLoading}
                    className="neo-input flex-1 p-2 text-xs font-medium resize-none focus:bg-amber-50 leading-normal"
                  />
                  <button
                    type="button"
                    id="gemini-chat-send-btn"
                    onClick={() => handleSendMessage()}
                    disabled={!inputMessage.trim() || isLoading}
                    className="neo-btn bg-brutal-yellow text-brutal-black px-3.5 py-2.5 rounded-xl h-[42px] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-400"
                    title="Send message (Enter)"
                  >
                    <i className="fa-solid fa-paper-plane text-xs"></i>
                  </button>
                </div>
                <div className="flex items-center justify-between mt-1.5 px-1 text-[9.5px] text-slate-500 font-bold">
                  <span>Press <strong>Enter</strong> to send • <strong>Shift+Enter</strong> for newline</span>
                  <span>SherDetect Forensics Engine</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};
