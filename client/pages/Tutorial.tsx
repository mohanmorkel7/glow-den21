import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import RichTextEditor from "@/components/RichTextEditor";

// Sanitize HTML by decoding entities, removing data-* attributes and script/style tags
// Also preserves plain-text newlines by converting them into paragraphs or <br />
const sanitizeHtml = (html: string | undefined | null) => {
  if (!html) return "";
  try {
    // Decode HTML entities first in case content is escaped (e.g. &lt;h3&gt;...)
    const decoder = document.createElement("div");
    decoder.innerHTML = String(html);
    const decoded = decoder.textContent || decoder.innerText || String(html);

    const parser = new DOMParser();
    const doc = parser.parseFromString(decoded, "text/html");

    // remove script and style tags
    doc.querySelectorAll("script,style").forEach((el) => el.remove());

    // Remove data-* attributes and inline event handlers from all elements
    const all = doc.querySelectorAll("*");
    all.forEach((el) => {
      Array.from(el.attributes).forEach((a) => {
        if (a.name.startsWith("data-")) el.removeAttribute(a.name);
        if (/^on/i.test(a.name)) el.removeAttribute(a.name);
      });
    });

    // If the user entered plain text with newlines (no tags), convert into paragraphs
    const bodyHTML = doc.body.innerHTML.trim();
    const looksLikeHtmlTag = /<\s*[a-zA-Z][^>]*>/m.test(bodyHTML);
    if (!looksLikeHtmlTag) {
      // Split on double newlines for paragraphs, single newline -> <br>
      const paragraphs = decoded
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0)
        .map((p) => `<p>${p.replace(/\n/g, "<br />")}</p>`)
        .join("\n");
      return paragraphs;
    }

    // For mixed HTML where some text nodes include newlines, replace \n in text nodes with <br>
    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null);
    const textNodes: Node[] = [];
    let n: Node | null = walker.nextNode();
    while (n) {
      textNodes.push(n);
      n = walker.nextNode();
    }

    textNodes.forEach((tn) => {
      if (tn.nodeValue && tn.nodeValue.indexOf("\n") !== -1) {
        const parent = tn.parentNode as Element | null;
        if (!parent) return;
        const parts = (tn.nodeValue || "").split(/\n+/);
        const frag = doc.createDocumentFragment();
        parts.forEach((part, idx) => {
          frag.appendChild(doc.createTextNode(part));
          if (idx < parts.length - 1) {
            frag.appendChild(doc.createElement("br"));
          }
        });
        parent.replaceChild(frag, tn);
      }
    });

    return doc.body.innerHTML;
  } catch (e) {
    console.warn("sanitizeHtml failed", e);
    return String(html);
  }
};

// Enhanced sanitizer + formatter: preserves HTML, or converts plain text into headings/lists
const sanitizeAndFormatHtml = (html: string | undefined | null) => {
  if (!html) return "";
  try {
    const input = String(html);
    // Only decode HTML entities if the input contains escaped entities like &lt; or &gt;
    const needsDecode = /&lt;|&gt;|&amp;/.test(input);
    let decoded = input;
    if (needsDecode) {
      const decoder = document.createElement("div");
      decoder.innerHTML = input;
      decoded = decoder.textContent || decoder.innerText || input;
    }
    const parser = new DOMParser();
    const doc = parser.parseFromString(decoded, "text/html");
    // strip scripts/styles and data-/on* attributes
    doc.querySelectorAll("script,style").forEach((el) => el.remove());
    doc.querySelectorAll("*").forEach((el) => {
      Array.from(el.attributes).forEach((a) => {
        if (a.name.startsWith("data-") || /^on/i.test(a.name))
          el.removeAttribute(a.name);
      });
    });

    // Remove stray <br> tags that were inserted between blocks or as direct body children
    const blockTags = new Set([
      "P",
      "H1",
      "H2",
      "H3",
      "H4",
      "H5",
      "H6",
      "UL",
      "OL",
      "LI",
      "HR",
      "DIV",
    ]);
    doc.querySelectorAll("br").forEach((br) => {
      const parent = br.parentElement;
      if (!parent) {
        br.remove();
        return;
      }
      if (parent.tagName === "BODY") {
        br.remove();
        return;
      }
      const prev = br.previousSibling;
      const next = br.nextSibling;
      const prevIsBlock =
        prev && prev.nodeType === 1 && blockTags.has((prev as Element).tagName);
      const nextIsBlock =
        next && next.nodeType === 1 && blockTags.has((next as Element).tagName);
      if (prevIsBlock || nextIsBlock) {
        br.remove();
        return;
      }
      if (parent.tagName === "LI") {
        br.remove();
        return;
      }
      // collapse consecutive BRs
      if (next && next.nodeType === 1 && (next as Element).tagName === "BR") {
        br.remove();
        return;
      }
    });

    const bodyHTML = doc.body.innerHTML.trim();
    const hasStructural = /<(h[1-6]|ul|ol|li|strong|b|p)\b/i.test(bodyHTML);

    function escapeHtml(str: string) {
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    // If document consists only of <p> children, convert them into semantic blocks
    const children = Array.from(doc.body.children || []);
    if (
      children.length > 0 &&
      children.every((c) => c.tagName.toLowerCase() === "p")
    ) {
      const out: string[] = [];
      let i = 0;
      while (i < children.length) {
        const p = children[i] as HTMLParagraphElement;
        const text = (p.textContent || "").trim();
        if (!text) {
          i++;
          continue;
        }

        // Heading pattern: optional emoji(s) then number + dot (e.g. "🏠 1. Title" or "1. Title")
        const headingMatch = text.match(
          /^\s*(?:[\p{Extended_Pictographic}\uFE0F\s]*)?(\d+)\.\s+(.*)$/u,
        );
        if (headingMatch) {
          const title = headingMatch[2] || text;
          out.push(
            `<h3 class=\"text-base font-semibold\"><strong>${escapeHtml(title)}</strong></h3>`,
          );
          i++;
          continue;
        }

        // If this paragraph ends with ':' or contains 'here' intro, treat subsequent short paragraphs as a list
        const isListIntro =
          /:\s*$/.test(text) || /here[,\s]+you will see[:]?$/i.test(text);
        if (isListIntro) {
          // Start collecting subsequent short paragraphs as list items
          i++;
          const items: string[] = [];
          while (i < children.length) {
            const nxt = (children[i] as HTMLParagraphElement).textContent || "";
            const nxtTrim = nxt.trim();
            if (!nxtTrim) {
              i++;
              continue;
            }
            // Stop if next paragraph looks like a numbered heading
            if (
              /^\s*(?:[\p{Extended_Pictographic}\uFE0F\s]*)?\d+\.\s+/.test(
                nxtTrim,
              )
            )
              break;
            // Stop if next paragraph is long (> 200 chars) — heuristic
            if (nxtTrim.length > 200) break;
            items.push(`<li>${escapeHtml(nxtTrim)}</li>`);
            i++;
          }
          if (items.length > 0) {
            out.push("<ul>");
            out.push(...items);
            out.push("</ul>");
            continue;
          }
          // if no items found, fallthrough to render paragraph
        }

        // Bullet detection in paragraph
        if (/^[-*•]\s+/.test(text)) {
          // collect consecutive bullets
          out.push("<ul>");
          while (
            i < children.length &&
            /^[-*•]\s+/.test((children[i] as HTMLElement).textContent || "")
          ) {
            const t = ((children[i] as HTMLElement).textContent || "")
              .replace(/^[-*•]\s+/, "")
              .trim();
            out.push(`<li>${escapeHtml(t)}</li>`);
            i++;
          }
          out.push("</ul>");
          continue;
        }

        // Default paragraph
        out.push(`<p>${escapeHtml(text)}</p>`);
        i++;
      }
      return out.join("\n");
    }

    if (!hasStructural) {
      const lines = decoded
        .split(/\n+/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      const out: string[] = [];
      let inList = false;
      for (const line of lines) {
        const isNumberHeading =
          /^\s*(?:[\p{Extended_Pictographic}\uFE0F\s]*)?\d+\.\s+/.test(line);
        const isBullet = /^[-*•]\s+/.test(line);
        if (isNumberHeading) {
          if (inList) {
            out.push("</ul>");
            inList = false;
          }
          const title = line.replace(
            /^\s*(?:[\p{Extended_Pictographic}\uFE0F\s]*)?\d+\.\s*/,
            "",
          );
          out.push(
            `<h3 class=\"text-base font-semibold\"><strong>${escapeHtml(title)}</strong></h3>`,
          );
          continue;
        }
        if (isBullet) {
          if (!inList) {
            out.push("<ul>");
            inList = true;
          }
          out.push(`<li>${escapeHtml(line.replace(/^[-*•]\s+/, ""))}</li>`);
          continue;
        }
        if (inList) {
          out.push("</ul>");
          inList = false;
        }
        out.push(`<p>${escapeHtml(line)}</p>`);
      }
      if (inList) out.push("</ul>");
      return out.join("\n");
    }

    // normalize newlines inside text nodes
    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null);
    const textNodes: Node[] = [];
    let n: Node | null = walker.nextNode();
    while (n) {
      textNodes.push(n);
      n = walker.nextNode();
    }
    textNodes.forEach((tn) => {
      if (tn.nodeValue && tn.nodeValue.indexOf("\n") !== -1) {
        const parent = tn.parentNode as Element | null;
        if (!parent) return;
        const parts = (tn.nodeValue || "").split(/\n+/);
        const frag = doc.createDocumentFragment();
        parts.forEach((part, idx) => {
          frag.appendChild(doc.createTextNode(part));
          if (idx < parts.length - 1) frag.appendChild(doc.createElement("br"));
        });
        parent.replaceChild(frag, tn);
      }
    });

    // Unwrap <p> inside <li> (convert <li><p>text</p></li> to <li>text</li>)
    doc.querySelectorAll("li").forEach((li) => {
      const ps = Array.from(li.querySelectorAll("p"));
      if (ps.length) {
        const combined = ps.map((p) => p.innerHTML).join(" ");
        // Remove existing children and set innerHTML to combined content
        li.innerHTML = combined;
      }
    });

    // Remove empty <p> elements
    doc.querySelectorAll("p").forEach((p) => {
      if ((p.textContent || "").trim() === "") p.remove();
    });

    // Remove consecutive <br> tags
    doc.querySelectorAll("br").forEach((br) => {
      let next = br.nextSibling as Element | null;
      while (next && next.nodeType === 1 && next.tagName === "BR") {
        const dup = next as Element;
        next = dup.nextSibling as Element | null;
        dup.remove();
      }
    });

    // Convert paragraphs that use <br> as line separators into lists when appropriate.
    // Example: a single <p> containing multiple bullets separated by <br> should become a <ul>.
    doc.querySelectorAll("p").forEach((p) => {
      const html = p.innerHTML || "";
      // Split on <br> tags (handle variations) and also on LF if present
      const parts = html.split(/<br\s*\/?\s*>|\r?\n/).map((s) => s.trim()).filter(Boolean);
      if (parts.length <= 1) return;

      // If most lines look like bullets or start with bullet markers, convert to <ul>
      const bulletLikeCount = parts.filter((line) => /^[-*•\u2022\u25E6\u25CF]\s*/.test(line) || /^\d+\.\s*/.test(line)).length;
      if (bulletLikeCount >= Math.ceil(parts.length / 2)) {
        const lis: string[] = [];
        parts.forEach((line) => {
          // remove numeric prefix or bullet markers
          const cleaned = line.replace(/^\s*(?:[-*•\u2022\u25E6\u25CF]|\d+\.)\s*/, "").trim();
          lis.push(`<li>${escapeHtml(cleaned)}</li>`);
        });
        const ul = doc.createElement("ul");
        ul.innerHTML = lis.join("\n");
        p.replaceWith(ul);
        return;
      }

      // If first part looks like a heading and following parts are short, treat as heading + list
      const first = parts[0];
      const headingMatch = first.match(/^\s*(?:[\p{Extended_Pictographic}\uFE0F\s]*)?(\d+)\.\s+(.*)$/u);
      if (headingMatch && parts.length > 1) {
        const title = headingMatch[2] || first;
        const h = doc.createElement("h3");
        h.className = "text-base font-semibold";
        h.innerHTML = `<strong>${escapeHtml(title)}</strong>`;
        const items: string[] = [];
        for (let idx = 1; idx < parts.length; idx++) {
          const line = parts[idx].replace(/^\s*(?:[-*•\u2022\u25E6\u25CF]|\d+\.)\s*/, "").trim();
          if (line) items.push(`<li>${line}</li>`);
        }
        if (items.length) {
          const ul = doc.createElement("ul");
          ul.innerHTML = items.join("\n");
          p.replaceWith(h, ul);
          return;
        }
      }

      // Otherwise, keep as-is (multiple lines in a paragraph). Do not remove meaningful <br> here.
    });

    // After converting br-separated paragraphs into proper lists/headings, remove remaining stray <br> children of body
    doc.body.querySelectorAll(":scope > br").forEach((br) => br.remove());

    return doc.body.innerHTML;
  } catch (e) {
    console.warn("sanitizeAndFormatHtml failed", e);
    return String(html);
  }
};

import { cn } from "@/lib/utils";
import {
  PlayCircle,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  Plus,
  Edit,
  Trash2,
  Upload,
  Search,
  Star,
  StarIcon,
  BookmarkIcon,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  FileText,
  Settings,
} from "lucide-react";

// Import types
import type {
  Tutorial,
  TutorialCategory,
  UserTutorialProgress,
  TutorialCategoryInfo,
  TUTORIAL_CATEGORIES,
} from "@/shared/tutorial-types";

const TUTORIAL_CATEGORIES_DATA: TutorialCategoryInfo[] = [
  {
    id: "getting_started",
    name: "Getting Started",
    description: "Essential tutorials for new users to get up and running",
    icon: "PlayCircle",
    color: "#3b82f6",
    order: 1,
    requiredForRoles: ["user", "project_manager"],
  },
  {
    id: "daily_tasks",
    name: "Daily Tasks",
    description: "Learn how to perform common daily work activities",
    icon: "CheckCircle",
    color: "#10b981",
    order: 2,
    requiredForRoles: ["user"],
  },
  {
    id: "projects",
    name: "Project Management",
    description: "Managing projects, assignments, and team coordination",
    icon: "FileText",
    color: "#f59e0b",
    order: 3,
    requiredForRoles: ["project_manager"],
  },
];

interface VideoPlayerProps {
  src?: string;
  title: string;
  onTimeUpdate?: (currentTime: number) => void;
  onProgress?: (progress: number) => void;
}

// Custom Video Player Component
function VideoPlayer({
  src,
  title,
  onTimeUpdate,
  onProgress,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [resolvedSrc, setResolvedSrc] = useState<string | undefined>(() =>
    src && !src.startsWith("/api/") ? src : undefined,
  );

  useEffect(() => {
    let revokedUrl: string | null = null;
    let cancelled = false;

    const resolve = async () => {
      if (!src) {
        setResolvedSrc(undefined);
        return;
      }
      try {
        if (src.startsWith("/api/")) {
          const token = localStorage.getItem("authToken");
          const resp = await fetch(src, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (!resp.ok) throw new Error(`Video load failed (${resp.status})`);
          const blob = await resp.blob();
          const url = URL.createObjectURL(blob);
          revokedUrl = url;
          if (!cancelled) setResolvedSrc(url);
        } else {
          setResolvedSrc(src);
        }
      } catch (e) {
        setResolvedSrc(undefined);
      }
    };

    resolve();
    return () => {
      cancelled = true;
      if (revokedUrl) URL.revokeObjectURL(revokedUrl);
    };
  }, [src]);

  useEffect(() => {
    if (videoRef.current) {
      try {
        videoRef.current.pause();
      } catch {}
      videoRef.current.load();
      setIsPlaying(false);
    }
  }, [resolvedSrc]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      setCurrentTime(current);
      onTimeUpdate?.(current);

      const progress = (current / duration) * 100;
      onProgress?.(progress);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const skipForward = () => {
    handleSeek(Math.min(currentTime + 10, duration));
  };

  const skipBackward = () => {
    handleSeek(Math.max(currentTime - 10, 0));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="relative bg-black rounded-lg overflow-hidden">
      {src ? (
        <>
          <video
            ref={videoRef}
            className="w-full h-auto max-h-96"
            src={resolvedSrc}
            key={resolvedSrc || "no-src"}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            playsInline
          >
            Your browser does not support the video tag.
          </video>

          {/* Video Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            {/* Progress Bar */}
            <div className="mb-4">
              <input
                type="range"
                min={0}
                max={duration}
                value={currentTime}
                onChange={(e) => handleSeek(parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipBackward}
                  className="text-white hover:text-blue-400"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePlay}
                  className="text-white hover:text-blue-400"
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <PlayCircle className="h-5 w-5" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipForward}
                  className="text-white hover:text-blue-400"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>

                <span className="text-white text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Volume Control */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMute}
                    className="text-white hover:text-blue-400"
                  >
                    {isMuted ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>

                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={isMuted ? 0 : volume}
                    onChange={(e) =>
                      handleVolumeChange(parseFloat(e.target.value))
                    }
                    className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="text-white hover:text-blue-400"
                >
                  {isFullscreen ? (
                    <Minimize className="h-4 w-4" />
                  ) : (
                    <Maximize className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-64 bg-gray-800">
          <div className="text-center text-gray-400">
            <PlayCircle className="h-16 w-16 mx-auto mb-4" />
            <p className="text-lg">No video available</p>
            <p className="text-sm">Upload a video to get started</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Tutorial() {
  const stripHtml = (str: string) => {
    if (!str) return "";
    return str
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("browse");
  const [selectedCategory, setSelectedCategory] = useState<
    TutorialCategory | "all"
  >("all");
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTutorial, setEditingTutorial] = useState<Tutorial | null>(null);
  const [isUploadVideoOpen, setIsUploadVideoOpen] = useState(false);
  const [videoUpload, setVideoUpload] = useState({
    title: "",
    description: "",
    file: null as File | null,
    uploadProgress: 0,
    isUploading: false,
    previewUrl: "",
    dragActive: false,
  });
  const [newTutorial, setNewTutorial] = useState({
    title: "",
    description: "",
    category: "getting_started" as TutorialCategory,
    instructions: "",
    steps: [] as Array<{
      stepNumber: number;
      title: string;
      description: string;
      isRequired: boolean;
    }>,
    targetRoles: ["user"] as any[],
    isRequired: false,
    tags: [] as string[],
  });
  const [currentStep, setCurrentStep] = useState({
    stepNumber: 1,
    title: "",
    description: "",
    isRequired: false,
  });

  // Tutorials state loaded from API
  const [tutorials, setTutorials] = useState<Tutorial[]>([] as any);

  useEffect(() => {
    const load = async () => {
      try {
        const list: any[] = (await apiClient.getTutorials()) as any[];
        const mapped: Tutorial[] = list.map((t: any, idx: number) => ({
          id: t.id,
          title: t.title,
          description: t.description || "",
          category: (t.category || "getting_started") as any,
          status: (t.status || "published") as any,
          videoUrl: t.videoUrl || undefined,
          videoDuration: undefined as any,
          instructions: "",
          steps: [],
          targetRoles: ["user", "project_manager", "super_admin"] as any,
          isRequired: false,
          order: idx + 1,
          tags: [],
          createdBy: { id: t.createdBy || "", name: "" },
          createdAt: t.createdAt || new Date().toISOString(),
          updatedAt: t.updatedAt || new Date().toISOString(),
          viewCount: 0,
          completionCount: 0,
        }));
        setTutorials(mapped);
      } catch (e) {
        console.error("Failed to load tutorials", e);
        setTutorials([]);
      }
    };
    load();
  }, []);

  // Mock data for tutorials with sample videos
  const mockTutorials: Tutorial[] = [
    {
      id: "1",
      title: "Getting Started with the Platform",
      description:
        "Learn the basics of navigating and using the BPO management platform",
      category: "getting_started",
      status: "published",
      videoUrl:
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", // Sample video
      videoDuration: 596, // 9:56 duration
      instructions:
        "<h2>Welcome to the Platform</h2><p>This tutorial will guide you through the basic features of our BPO management system. You'll learn how to navigate the dashboard, access different modules, and understand the overall workflow.</p><h3>What you'll learn:</h3><ul><li>Platform navigation</li><li>Dashboard overview</li><li>Basic user interface elements</li><li>Getting help and support</li></ul>",
      steps: [
        {
          id: "step1",
          stepNumber: 1,
          title: "Login to your account",
          description:
            "Enter your credentials and click sign in. Make sure to use the correct email format.",
          isRequired: true,
        },
        {
          id: "step2",
          stepNumber: 2,
          title: "Navigate the dashboard",
          description:
            "Explore the main dashboard and its features. Notice the sidebar navigation and main content area.",
          isRequired: true,
        },
        {
          id: "step3",
          stepNumber: 3,
          title: "Access your profile",
          description:
            "Click on your profile icon to view and update your personal information.",
          isRequired: false,
        },
      ],
      targetRoles: ["user", "project_manager", "super_admin"],
      isRequired: true,
      order: 1,
      tags: ["basics", "navigation", "dashboard", "login"],
      createdBy: {
        id: "admin",
        name: "Admin User",
      },
      createdAt: "2024-01-15T00:00:00Z",
      updatedAt: "2024-01-15T00:00:00Z",
      viewCount: 245,
      completionCount: 198,
    },
    {
      id: "2",
      title: "Daily Count Submission",
      description:
        "Learn how to submit your daily work counts and track progress",
      category: "daily_tasks",
      status: "published",
      videoUrl:
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", // Sample video
      videoDuration: 653, // 10:53 duration
      instructions:
        "<h2>Submitting Daily Counts</h2><p>This tutorial covers the complete process of submitting your daily work counts. This is essential for tracking productivity and ensuring accurate payroll calculations.</p><h3>Key Points:</h3><ul><li>Daily submission deadlines</li><li>File count accuracy</li><li>Approval workflow</li><li>Tracking your progress</li></ul>",
      steps: [
        {
          id: "step1",
          stepNumber: 1,
          title: "Navigate to Daily Counts",
          description:
            "Click on the Daily Counts menu item from the sidebar navigation.",
          isRequired: true,
        },
        {
          id: "step2",
          stepNumber: 2,
          title: "Enter your counts",
          description:
            "Fill in the number of files processed for the current day. Be accurate with your counts.",
          isRequired: true,
        },
        {
          id: "step3",
          stepNumber: 3,
          title: "Submit for approval",
          description:
            "Click submit to send your counts to your manager for approval. You can add notes if needed.",
          isRequired: true,
        },
      ],
      targetRoles: ["user", "super_admin"],
      isRequired: true,
      order: 2,
      tags: ["daily", "counts", "submission", "tracking"],
      createdBy: {
        id: "admin",
        name: "Admin User",
      },
      createdAt: "2024-01-15T00:00:00Z",
      updatedAt: "2024-01-15T00:00:00Z",
      viewCount: 189,
      completionCount: 156,
    },
    {
      id: "3",
      title: "Project Management Overview",
      description:
        "Understanding how to manage projects and assign tasks to team members",
      category: "projects",
      status: "published",
      videoUrl:
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", // Sample video
      videoDuration: 15, // 0:15 duration - short demo
      instructions:
        "<h2>Project Management</h2><p>As a project manager, you can create and manage projects effectively using our platform. This tutorial covers the essential features for successful project coordination.</p><h3>Topics covered:</h3><ul><li>Creating new projects</li><li>Assigning team members</li><li>Setting deadlines and targets</li><li>Monitoring progress</li><li>Managing project resources</li></ul>",
      steps: [
        {
          id: "step1",
          stepNumber: 1,
          title: "Create a new project",
          description:
            "Click the add project button and fill in all required details including name, description, and timeline.",
          isRequired: true,
        },
        {
          id: "step2",
          stepNumber: 2,
          title: "Assign team members",
          description:
            "Select appropriate users to assign to the project based on their skills and availability.",
          isRequired: true,
        },
        {
          id: "step3",
          stepNumber: 3,
          title: "Set project targets",
          description:
            "Define file processing targets and deadlines for the project.",
          isRequired: true,
        },
      ],
      targetRoles: ["project_manager", "super_admin"],
      isRequired: true,
      order: 1,
      tags: ["projects", "management", "assignment", "planning"],
      createdBy: {
        id: "pm1",
        name: "Emily Wilson",
      },
      createdAt: "2024-01-16T00:00:00Z",
      updatedAt: "2024-01-16T00:00:00Z",
      viewCount: 78,
      completionCount: 45,
    },
    {
      id: "4",
      title: "Reports and Analytics",
      description:
        "Learn how to generate and interpret reports for better decision making",
      category: "reports",
      status: "published",
      videoUrl:
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", // Sample video
      videoDuration: 15, // 0:15 duration
      instructions:
        "<h2>Reports and Analytics</h2><p>Understanding reports and analytics is crucial for making informed business decisions. This tutorial will guide you through the various reports available and how to interpret the data.</p><h3>Report Types:</h3><ul><li>Productivity reports</li><li>Team performance analytics</li><li>Project progress reports</li><li>Financial summaries</li></ul>",
      steps: [
        {
          id: "step1",
          stepNumber: 1,
          title: "Access the Reports section",
          description: "Navigate to the Reports menu from the sidebar.",
          isRequired: true,
        },
        {
          id: "step2",
          stepNumber: 2,
          title: "Select report type",
          description:
            "Choose the appropriate report type based on your needs.",
          isRequired: true,
        },
        {
          id: "step3",
          stepNumber: 3,
          title: "Generate and export",
          description:
            "Generate the report and export it if needed for sharing.",
          isRequired: false,
        },
      ],
      targetRoles: ["project_manager", "super_admin"],
      isRequired: false,
      order: 1,
      tags: ["reports", "analytics", "data", "insights"],
      createdBy: {
        id: "admin",
        name: "Admin User",
      },
      createdAt: "2024-01-17T00:00:00Z",
      updatedAt: "2024-01-17T00:00:00Z",
      viewCount: 124,
      completionCount: 89,
    },
    {
      id: "5",
      title: "Troubleshooting Common Issues",
      description:
        "Solutions for frequently encountered problems and technical issues",
      category: "troubleshooting",
      status: "published",
      videoUrl:
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4", // Sample video
      videoDuration: 60, // 1:00 duration
      instructions:
        "<h2>Troubleshooting Guide</h2><p>This tutorial addresses the most common issues users encounter and provides step-by-step solutions. Keep this handy for quick problem resolution.</p><h3>Common Issues:</h3><ul><li>Login problems</li><li>File upload errors</li><li>Performance issues</li><li>Data sync problems</li><li>Permission errors</li></ul>",
      steps: [
        {
          id: "step1",
          stepNumber: 1,
          title: "Identify the problem",
          description:
            "Understand the specific issue you're experiencing and note any error messages.",
          isRequired: true,
        },
        {
          id: "step2",
          stepNumber: 2,
          title: "Try basic solutions",
          description:
            "Start with simple fixes like refreshing the page or logging out and back in.",
          isRequired: true,
        },
        {
          id: "step3",
          stepNumber: 3,
          title: "Contact support if needed",
          description:
            "If the issue persists, contact technical support with details about the problem.",
          isRequired: false,
        },
      ],
      targetRoles: ["user", "project_manager", "super_admin"],
      isRequired: false,
      order: 1,
      tags: ["troubleshooting", "support", "problems", "solutions"],
      createdBy: {
        id: "admin",
        name: "Admin User",
      },
      createdAt: "2024-01-18T00:00:00Z",
      updatedAt: "2024-01-18T00:00:00Z",
      viewCount: 156,
      completionCount: 98,
    },
  ];

  // Filter tutorials based on role, category, and search
  const filteredTutorials = tutorials.filter((tutorial) => {
    const matchesRole = tutorial.targetRoles.includes(user?.role || "user");
    const matchesCategory =
      selectedCategory === "all" || tutorial.category === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutorial.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesRole && matchesCategory && matchesSearch;
  });

  // Get categories accessible to current user
  const availableCategories = TUTORIAL_CATEGORIES_DATA.filter(
    (cat) =>
      !cat.requiredForRoles ||
      cat.requiredForRoles.includes(user?.role || "user"),
  );

  const handleTutorialSelect = (tutorial: Tutorial) => {
    setSelectedTutorial(tutorial);
    setActiveTab("watch");
  };

  const canManageTutorials =
    user?.role === "super_admin" ||
    user?.role === "project_manager" ||
    user?.role === "admin";

  // Helper function to handle file selection
  const handleFileSelect = (file: File) => {
    // Validate file type
    const allowedTypes = ["video/mp4", "video/avi", "video/mov", "video/wmv"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description:
          "Please select a supported video format (MP4, AVI, MOV, WMV)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (500MB limit)
    const maxSize = 500 * 1024 * 1024; // 500MB in bytes
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "File size must be less than 500MB",
        variant: "destructive",
      });
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);

    setVideoUpload({
      ...videoUpload,
      file,
      previewUrl,
    });

    toast({
      title: "File selected",
      description: `${file.name} is ready for upload`,
    });
  };

  // Upload tutorial video: either attach to existing tutorial (tutorialId) or create a new tutorial with title/description
  const handleVideoUpload = async () => {
    if (!videoUpload.file) return;

    setVideoUpload({ ...videoUpload, isUploading: true });

    try {
      if ((videoUpload as any).tutorialId) {
        await apiClient.uploadVideoForTutorial(
          (videoUpload as any).tutorialId,
          videoUpload.file,
        );
        toast({
          title: "Upload successful",
          description: `Video uploaded successfully`,
        });
      } else if ((videoUpload as any).title) {
        await apiClient.uploadTutorialVideo(
          videoUpload.file,
          (videoUpload as any).title,
          "getting_started",
          (videoUpload as any).description,
        );
        toast({
          title: "Upload successful",
          description: `Video uploaded successfully for tutorial: ${(videoUpload as any).tutorialName}`,
        });
      } else {
        toast({
          title: "Missing tutorial",
          description:
            "Please provide a tutorial title or select an existing tutorial",
          variant: "destructive",
        });
        setVideoUpload({ ...videoUpload, isUploading: false });
        return;
      }

      // Reload tutorials
      const list: any[] = (await apiClient.getTutorials()) as any[];
      const mapped: Tutorial[] = list.map((t: any, idx: number) => ({
        id: t.id,
        title: t.title,
        description: t.description || "",
        category: (t.category || "getting_started") as any,
        status: (t.status || "published") as any,
        videoUrl: t.videoUrl || undefined,
        videoDuration: undefined as any,
        instructions: t.instructions || "",
        steps: t.steps || [],
        targetRoles: t.targetRoles || ["user"],
        isRequired: t.isRequired || false,
        order: idx + 1,
        tags: t.tags || [],
        createdBy: { id: t.createdBy || "", name: "" },
        createdAt: t.createdAt || new Date().toISOString(),
        updatedAt: t.updatedAt || new Date().toISOString(),
        viewCount: t.viewCount || 0,
        completionCount: t.completionCount || 0,
      }));
      setTutorials(mapped);

      // Reset upload state and close dialog
      setVideoUpload({
        tutorialName: "",
        file: null,
        uploadProgress: 0,
        isUploading: false,
        previewUrl: "",
        dragActive: false,
      });
      setIsUploadVideoOpen(false);
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: String(error?.message || error),
        variant: "destructive",
      });
      setVideoUpload({ ...videoUpload, isUploading: false });
    }
  };

  // Handle edit tutorial
  const handleEditTutorial = (tutorial: Tutorial) => {
    setEditingTutorial(tutorial);
    setNewTutorial({
      title: tutorial.title,
      description: tutorial.description,
      category: tutorial.category,
      instructions: tutorial.instructions,
      steps: tutorial.steps.map((step) => ({
        stepNumber: step.stepNumber,
        title: step.title,
        description: step.description,
        isRequired: step.isRequired,
      })),
      targetRoles: tutorial.targetRoles,
      isRequired: tutorial.isRequired,
      tags: tutorial.tags,
    });
    setIsEditDialogOpen(true);
  };

  // Handle save edited tutorial
  const handleSaveEditedTutorial = async () => {
    if (!editingTutorial) return;
    try {
      await apiClient.updateTutorial(editingTutorial.id, {
        title: newTutorial.title,
        description: newTutorial.description,
        category: newTutorial.category,
        instructions: newTutorial.instructions,
        targetRoles: newTutorial.targetRoles,
        isRequired: newTutorial.isRequired,
        tags: newTutorial.tags,
        steps: newTutorial.steps,
      });
      const list: any[] = (await apiClient.getTutorials()) as any[];
      const mapped: Tutorial[] = list.map((t: any, idx: number) => ({
        id: t.id,
        title: t.title,
        description: t.description || "",
        category: (t.category || "getting_started") as any,
        status: (t.status || "published") as any,
        videoUrl: t.videoUrl || undefined,
        videoDuration: undefined as any,
        instructions: t.instructions || "",
        steps: [],
        targetRoles: t.targetRoles || ["user"],
        isRequired: t.isRequired || false,
        order: idx + 1,
        tags: t.tags || [],
        createdBy: { id: t.createdBy || "", name: "" },
        createdAt: t.createdAt || new Date().toISOString(),
        updatedAt: t.updatedAt || new Date().toISOString(),
        viewCount: t.viewCount || 0,
        completionCount: t.completionCount || 0,
      }));
      setTutorials(mapped);
      toast({
        title: "Tutorial updated",
        description: `"${newTutorial.title}" has been updated successfully`,
      });
      setIsEditDialogOpen(false);
      setEditingTutorial(null);
      setNewTutorial({
        title: "",
        description: "",
        category: "getting_started",
        instructions: "",
        steps: [],
        targetRoles: ["user"],
        isRequired: false,
        tags: [],
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: String(error?.message || error),
        variant: "destructive",
      });
    }
  };

  // Handle delete tutorial
  const handleDeleteTutorial = async (tutorial: Tutorial) => {
    try {
      await apiClient.deleteTutorial(tutorial.id);
      setTutorials((prev) => prev.filter((t) => t.id !== tutorial.id));
      toast({
        title: "Tutorial deleted",
        description: `"${tutorial.title}" has been deleted successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: String(error?.message || error),
        variant: "destructive",
      });
    }
  };

  // Handle create tutorial
  const handleCreateTutorial = () => {
    // Here you would save the tutorial via API
    console.log("Creating tutorial:", newTutorial);

    toast({
      title: "Tutorial created",
      description: `"${newTutorial.title}" has been created successfully`,
    });

    setIsCreateDialogOpen(false);

    // Reset form
    setNewTutorial({
      title: "",
      description: "",
      category: "getting_started",
      instructions: "",
      steps: [],
      targetRoles: ["user"],
      isRequired: false,
      tags: [],
    });
    setCurrentStep({
      stepNumber: 1,
      title: "",
      description: "",
      isRequired: false,
    });
  };

  const getCategoryIcon = (category: TutorialCategory) => {
    const categoryInfo = TUTORIAL_CATEGORIES_DATA.find(
      (cat) => cat.id === category,
    );
    switch (categoryInfo?.icon) {
      case "PlayCircle":
        return <PlayCircle className="h-5 w-5" />;
      case "CheckCircle":
        return <CheckCircle className="h-5 w-5" />;
      case "FileText":
        return <FileText className="h-5 w-5" />;
      case "Settings":
        return <Settings className="h-5 w-5" />;
      case "AlertCircle":
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <PlayCircle className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <PlayCircle className="h-8 w-8 text-blue-600" />
            Training Tutorials
          </h1>
          <p className="text-muted-foreground mt-1">
            Learn how to use the platform with step-by-step video tutorials and
            guides
          </p>
        </div>
        {canManageTutorials && (
          <div className="flex gap-2">
            <Button onClick={() => setIsUploadVideoOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Video
            </Button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="browse">Browse Tutorials</TabsTrigger>
          <TabsTrigger value="watch">Watch Tutorial</TabsTrigger>
          {false && <TabsTrigger value="manage">Manage Tutorials</TabsTrigger>}
        </TabsList>

        {/* Browse Tutorials Tab */}
        <TabsContent value="browse" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tutorials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={selectedCategory}
              onValueChange={(value) =>
                setSelectedCategory(value as TutorialCategory | "all")
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {availableCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category Overview (hidden for regular users) */}
          {canManageTutorials && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableCategories.map((category) => {
                const categoryTutorials = filteredTutorials.filter(
                  (t) => t.category === category.id,
                );
                const completedCount = Math.floor(
                  categoryTutorials.length * 0.7,
                ); // Mock completion

                return (
                  <Card
                    key={category.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <div
                          className="p-2 rounded-lg text-white"
                          style={{ backgroundColor: category.color }}
                        >
                          {getCategoryIcon(category.id)}
                        </div>
                        {category.name}
                      </CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{categoryTutorials.length} tutorials</span>
                        <span>{completedCount} completed</span>
                      </div>
                      <Progress
                        value={
                          (completedCount / categoryTutorials.length) * 100
                        }
                        className="mt-2"
                      />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Tutorials List */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">
              {selectedCategory === "all"
                ? "All Tutorials"
                : availableCategories.find((cat) => cat.id === selectedCategory)
                    ?.name}
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredTutorials.map((tutorial) => (
                <Card
                  key={tutorial.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {stripHtml(tutorial.title)}
                          {tutorial.isRequired && (
                            <Badge variant="secondary">Required</Badge>
                          )}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: TUTORIAL_CATEGORIES_DATA.find(
                              (cat) => cat.id === tutorial.category,
                            )?.color,
                          }}
                        >
                          {
                            TUTORIAL_CATEGORIES_DATA.find(
                              (cat) => cat.id === tutorial.category,
                            )?.name
                          }
                        </Badge>
                        {canManageTutorials && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Edit Tutorial"
                              onClick={() => handleEditTutorial(tutorial)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Delete Tutorial"
                              onClick={() => handleDeleteTutorial(tutorial)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {tutorial.viewCount} views
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          {tutorial.completionCount} completed
                        </span>
                        {tutorial.videoDuration && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {Math.ceil(tutorial.videoDuration / 60)} min
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleTutorialSelect(tutorial)}
                        className="flex-1"
                      >
                        <PlayCircle className="h-4 w-4 mr-2" />
                        {tutorial.videoUrl
                          ? "Watch Tutorial"
                          : "View Instructions"}
                      </Button>
                      <Button variant="outline" size="sm">
                        <BookmarkIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Watch Tutorial Tab */}
        <TabsContent value="watch" className="space-y-6">
          {selectedTutorial ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Video Player Section */}
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardContent className="space-y-4 pt-6">
                    <VideoPlayer
                      src={selectedTutorial.videoUrl}
                      title={selectedTutorial.title}
                      onTimeUpdate={(time) => {
                        console.log("Video time:", time);
                      }}
                      onProgress={(progress) => {
                        console.log("Video progress:", progress);
                      }}
                    />
                    <div>
                      <h2 className="text-xl font-semibold">
                        {selectedTutorial.title}
                      </h2>
                      <div
                        className="text-muted-foreground mt-1 prose max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeAndFormatHtml(
                            selectedTutorial.description,
                          ),
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Tutorial Instructions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Instructions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeAndFormatHtml(
                          selectedTutorial.instructions,
                        ),
                      }}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Steps and Progress Section */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Tutorial Steps</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedTutorial.steps.map((step, index) => (
                        <div key={step.id} className="flex gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                              {step.stepNumber}
                            </div>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{step.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {step.description}
                            </p>
                            {step.isRequired && (
                              <Badge variant="outline" className="mt-2 text-xs">
                                Required
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <PlayCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium text-muted-foreground">
                  No tutorial selected
                </h3>
                <p className="text-sm text-muted-foreground">
                  Choose a tutorial from the browse tab to start learning
                </p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Manage Tutorials Tab (Admin/PM only) */}
        {false && (
          <TabsContent value="manage" className="space-y-6">
            {/* Management Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">Manage Tutorials</h3>
                <p className="text-sm text-muted-foreground">
                  Create, edit, and organize training content
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Bulk Import
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New
                </Button>
              </div>
            </div>

            {/* Management Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <PlayCircle className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Total Tutorials</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">
                    {mockTutorials.length}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Published</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">
                    {
                      mockTutorials.filter((t) => t.status === "published")
                        .length
                    }
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">Total Views</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">
                    {mockTutorials.reduce((sum, t) => sum + t.viewCount, 0)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium">Avg. Completion</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">
                    {Math.round(
                      mockTutorials.reduce(
                        (sum, t) =>
                          sum + (t.completionCount / t.viewCount) * 100,
                        0,
                      ) / mockTutorials.length,
                    )}
                    %
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Filter and Search */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tutorials by title, description, or tags..."
                  className="pl-10"
                />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {TUTORIAL_CATEGORIES_DATA.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tutorials Management List */}
            <div className="space-y-4">
              {mockTutorials.map((tutorial) => (
                <Card key={tutorial.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      {/* Tutorial Header */}
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          {tutorial.videoUrl ? (
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                              <PlayCircle className="h-6 w-6 text-green-600" />
                            </div>
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                              <FileText className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h4 className="font-semibold text-lg">
                              {tutorial.title}
                            </h4>
                            <Badge
                              variant={
                                tutorial.status === "published"
                                  ? "default"
                                  : "secondary"
                              }
                              className="capitalize"
                            >
                              {tutorial.status}
                            </Badge>
                            {tutorial.isRequired && (
                              <Badge
                                variant="outline"
                                className="text-orange-600 border-orange-600"
                              >
                                Required
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Tutorial Metadata */}
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Badge
                            variant="outline"
                            style={{
                              borderColor: TUTORIAL_CATEGORIES_DATA.find(
                                (cat) => cat.id === tutorial.category,
                              )?.color,
                            }}
                          >
                            {
                              TUTORIAL_CATEGORIES_DATA.find(
                                (cat) => cat.id === tutorial.category,
                              )?.name
                            }
                          </Badge>
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {tutorial.viewCount} views
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          {tutorial.completionCount} completed
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {tutorial.steps.length} steps
                        </span>
                        <span>Created by {tutorial.createdBy.name}</span>
                        <span>
                          {new Date(tutorial.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Tutorial Tags */}
                      {tutorial.tags.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            Tags:
                          </span>
                          {tutorial.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Target Roles */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          Target Roles:
                        </span>
                        {tutorial.targetRoles.map((role) => (
                          <Badge
                            key={role}
                            variant="outline"
                            className="text-xs capitalize"
                          >
                            {role.replace("_", " ")}
                          </Badge>
                        ))}
                      </div>

                      {/* Progress Analytics */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium">
                            Completion Rate
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {Math.round(
                              (tutorial.completionCount / tutorial.viewCount) *
                                100,
                            )}
                            %
                          </span>
                        </div>
                        <Progress
                          value={
                            (tutorial.completionCount / tutorial.viewCount) *
                            100
                          }
                          className="h-2"
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 ml-6">
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Edit Tutorial"
                        disabled
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Upload/Replace Video"
                        onClick={() => {
                          setVideoUpload({
                            ...videoUpload,
                            title: tutorial.title,
                            description: tutorial.description,
                          });
                          setIsUploadVideoOpen(true);
                        }}
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="View Analytics"
                        onClick={() => {
                          toast({
                            title: "Analytics",
                            description: "Analytics feature coming soon!",
                          });
                        }}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Duplicate Tutorial"
                        onClick={() => {
                          toast({
                            title: "Tutorial duplicated",
                            description: `"${tutorial.title}" has been duplicated as a draft`,
                          });
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Delete Tutorial"
                        disabled
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Bulk Actions */}
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">Bulk Actions:</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Export Selected
                    </Button>
                    <Button variant="outline" size="sm">
                      Publish Selected
                    </Button>
                    <Button variant="outline" size="sm">
                      Archive Selected
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Select tutorials to perform bulk operations
                </div>
              </div>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Create Tutorial Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Tutorial</DialogTitle>
            <DialogDescription>
              Create a comprehensive training tutorial with step-by-step
              instructions
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="content">Content & Instructions</TabsTrigger>
              <TabsTrigger value="steps">Steps</TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Tutorial Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter tutorial title"
                    value={newTutorial.title}
                    onChange={(e) =>
                      setNewTutorial({ ...newTutorial, title: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={newTutorial.category}
                    onValueChange={(value) =>
                      setNewTutorial({
                        ...newTutorial,
                        category: value as TutorialCategory,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TUTORIAL_CATEGORIES_DATA.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <RichTextEditor
                  value={newTutorial.description}
                  onChange={(val) =>
                    setNewTutorial({ ...newTutorial, description: val })
                  }
                  placeholder="Brief description of what users will learn"
                  minHeight={120}
                />
              </div>

              <div>
                <Label>Target Roles *</Label>
                <div className="flex gap-2 mt-2">
                  {(["user", "project_manager", "super_admin"] as const).map(
                    (role) => (
                      <label key={role} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newTutorial.targetRoles.includes(role)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewTutorial({
                                ...newTutorial,
                                targetRoles: [...newTutorial.targetRoles, role],
                              });
                            } else {
                              setNewTutorial({
                                ...newTutorial,
                                targetRoles: newTutorial.targetRoles.filter(
                                  (r) => r !== role,
                                ),
                              });
                            }
                          }}
                        />
                        <span className="text-sm capitalize">
                          {role.replace("_", " ")}
                        </span>
                      </label>
                    ),
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isRequired"
                  checked={newTutorial.isRequired}
                  onChange={(e) =>
                    setNewTutorial({
                      ...newTutorial,
                      isRequired: e.target.checked,
                    })
                  }
                />
                <Label htmlFor="isRequired">
                  This tutorial is required for new users
                </Label>
              </div>

              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  placeholder="e.g. basics, navigation, getting started"
                  onChange={(e) => {
                    const tags = e.target.value
                      .split(",")
                      .map((tag) => tag.trim())
                      .filter((tag) => tag);
                    setNewTutorial({ ...newTutorial, tags });
                  }}
                />
              </div>
            </TabsContent>

            {/* Content & Instructions Tab */}
            <TabsContent value="content" className="space-y-4">
              <div>
                <Label>Tutorial Instructions</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Write detailed instructions that will help users understand
                  the process. Use headings, lists, and formatting to make it
                  clear.
                </p>
                <RichTextEditor
                  value={newTutorial.instructions}
                  onChange={(value) =>
                    setNewTutorial({ ...newTutorial, instructions: value })
                  }
                  placeholder="Write your tutorial instructions here. You can use headings, lists, bold text, and more..."
                  minHeight={300}
                  allowImages={true}
                  allowLinks={true}
                />
              </div>
            </TabsContent>

            {/* Steps Tab */}
            <TabsContent value="steps" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Tutorial Steps</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNewTutorial({
                      ...newTutorial,
                      steps: [
                        ...newTutorial.steps,
                        {
                          stepNumber: newTutorial.steps.length + 1,
                          title: currentStep.title,
                          description: currentStep.description,
                          isRequired: currentStep.isRequired,
                        },
                      ],
                    });
                    setCurrentStep({
                      stepNumber: newTutorial.steps.length + 2,
                      title: "",
                      description: "",
                      isRequired: false,
                    });
                  }}
                  disabled={!currentStep.title || !currentStep.description}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Step
                </Button>
              </div>

              {/* Current Step Form */}
              <Card className="p-4">
                <h4 className="font-medium mb-3">
                  Step {currentStep.stepNumber}
                </h4>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="stepTitle">Step Title *</Label>
                    <Input
                      id="stepTitle"
                      placeholder="e.g., Navigate to the dashboard"
                      value={currentStep.title}
                      onChange={(e) =>
                        setCurrentStep({
                          ...currentStep,
                          title: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="stepDescription">Step Description *</Label>
                    <Textarea
                      id="stepDescription"
                      placeholder="Detailed description of what the user should do"
                      value={currentStep.description}
                      onChange={(e) =>
                        setCurrentStep({
                          ...currentStep,
                          description: e.target.value,
                        })
                      }
                      rows={2}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="stepRequired"
                      checked={currentStep.isRequired}
                      onChange={(e) =>
                        setCurrentStep({
                          ...currentStep,
                          isRequired: e.target.checked,
                        })
                      }
                    />
                    <Label htmlFor="stepRequired">This step is required</Label>
                  </div>
                </div>
              </Card>

              {/* Existing Steps */}
              {newTutorial.steps.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Added Steps:</h4>
                  {newTutorial.steps.map((step, index) => (
                    <Card key={index} className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              Step {step.stepNumber}: {step.title}
                            </span>
                            {step.isRequired && (
                              <Badge variant="secondary" className="text-xs">
                                Required
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {step.description}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const updatedSteps = newTutorial.steps.filter(
                              (_, i) => i !== index,
                            );
                            // Renumber steps
                            const renumberedSteps = updatedSteps.map(
                              (s, i) => ({
                                ...s,
                                stepNumber: i + 1,
                              }),
                            );
                            setNewTutorial({
                              ...newTutorial,
                              steps: renumberedSteps,
                            });
                            setCurrentStep({
                              ...currentStep,
                              stepNumber: renumberedSteps.length + 1,
                            });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                // Reset form
                setNewTutorial({
                  title: "",
                  description: "",
                  category: "getting_started",
                  instructions: "",
                  steps: [],
                  targetRoles: ["user"],
                  isRequired: false,
                  tags: [],
                });
                setCurrentStep({
                  stepNumber: 1,
                  title: "",
                  description: "",
                  isRequired: false,
                });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTutorial}
              disabled={
                !newTutorial.title ||
                !newTutorial.description ||
                !newTutorial.instructions
              }
            >
              Create Tutorial
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Tutorial Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Tutorial</DialogTitle>
            <DialogDescription>
              Update the tutorial content and settings
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-title">Tutorial Title *</Label>
                  <Input
                    id="edit-title"
                    placeholder="Enter tutorial title"
                    value={newTutorial.title}
                    onChange={(e) =>
                      setNewTutorial({ ...newTutorial, title: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-category">Category *</Label>
                  <Select
                    value={newTutorial.category}
                    onValueChange={(value) =>
                      setNewTutorial({
                        ...newTutorial,
                        category: value as TutorialCategory,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TUTORIAL_CATEGORIES_DATA.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="edit-description">Description *</Label>
                <RichTextEditor
                  value={newTutorial.description}
                  onChange={(val) =>
                    setNewTutorial({ ...newTutorial, description: val })
                  }
                  placeholder="Brief description of what users will learn"
                  minHeight={120}
                />
              </div>

              <div>
                <Label>Target Roles *</Label>
                <div className="flex gap-2 mt-2">
                  {(["user", "project_manager", "super_admin"] as const).map(
                    (role) => (
                      <label key={role} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newTutorial.targetRoles.includes(role)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewTutorial({
                                ...newTutorial,
                                targetRoles: [...newTutorial.targetRoles, role],
                              });
                            } else {
                              setNewTutorial({
                                ...newTutorial,
                                targetRoles: newTutorial.targetRoles.filter(
                                  (r) => r !== role,
                                ),
                              });
                            }
                          }}
                        />
                        <span className="text-sm capitalize">
                          {role.replace("_", " ")}
                        </span>
                      </label>
                    ),
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-isRequired"
                  checked={newTutorial.isRequired}
                  onChange={(e) =>
                    setNewTutorial({
                      ...newTutorial,
                      isRequired: e.target.checked,
                    })
                  }
                />
                <Label htmlFor="edit-isRequired">
                  This tutorial is required for new users
                </Label>
              </div>

              <div>
                <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
                <Input
                  id="edit-tags"
                  placeholder="e.g. basics, navigation, getting started"
                  value={newTutorial.tags.join(", ")}
                  onChange={(e) => {
                    const tags = e.target.value
                      .split(",")
                      .map((tag) => tag.trim())
                      .filter((tag) => tag);
                    setNewTutorial({ ...newTutorial, tags });
                  }}
                />
              </div>

              {/* Existing attached video for this tutorial (if any) */}
              {editingTutorial && (
                <div className="mt-4">
                  <Label>Attached Video</Label>
                  {editingTutorial.videoUrl ? (
                    <div className="space-y-2">
                      <VideoPlayer
                        src={editingTutorial.videoUrl || undefined}
                        title={editingTutorial.title}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Open upload dialog targeted to this tutorial to replace the video
                            setVideoUpload({
                              tutorialId: editingTutorial.id,
                              tutorialName: editingTutorial.title,
                              file: null,
                              uploadProgress: 0,
                              isUploading: false,
                              previewUrl: "",
                              dragActive: false,
                            });
                            setIsUploadVideoOpen(true);
                          }}
                        >
                          Replace Video
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            // Open upload dialog to allow uploading (same as replace)
                            setVideoUpload({
                              tutorialId: editingTutorial.id,
                              tutorialName: editingTutorial.title,
                              file: null,
                              uploadProgress: 0,
                              isUploading: false,
                              previewUrl: "",
                              dragActive: false,
                            });
                            setIsUploadVideoOpen(true);
                          }}
                        >
                          Upload New
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-sm text-muted-foreground">
                        No video attached to this tutorial.
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          setVideoUpload({
                            tutorialId: editingTutorial.id,
                            tutorialName: editingTutorial.title,
                            file: null,
                            uploadProgress: 0,
                            isUploading: false,
                            previewUrl: "",
                            dragActive: false,
                          });
                          setIsUploadVideoOpen(true);
                        }}
                      >
                        Upload Video
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Content & Instructions Tab */}
            <TabsContent value="content" className="space-y-4">
              <div>
                <Label>Tutorial Instructions</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Write detailed instructions that will help users understand
                  the process. Use headings, lists, and formatting to make it
                  clear.
                </p>
                <RichTextEditor
                  value={newTutorial.instructions}
                  onChange={(value) =>
                    setNewTutorial({ ...newTutorial, instructions: value })
                  }
                  placeholder="Write your tutorial instructions here. You can use headings, lists, bold text, and more..."
                  minHeight={300}
                  allowImages={true}
                  allowLinks={true}
                />
              </div>
            </TabsContent>

            {/* Steps Tab */}
            <TabsContent value="steps" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Tutorial Steps</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNewTutorial({
                      ...newTutorial,
                      steps: [
                        ...newTutorial.steps,
                        {
                          stepNumber: newTutorial.steps.length + 1,
                          title: currentStep.title,
                          description: currentStep.description,
                          isRequired: currentStep.isRequired,
                        },
                      ],
                    });
                    setCurrentStep({
                      stepNumber: newTutorial.steps.length + 2,
                      title: "",
                      description: "",
                      isRequired: false,
                    });
                  }}
                  disabled={!currentStep.title || !currentStep.description}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Step
                </Button>
              </div>

              {/* Current Step Form */}
              <Card className="p-4">
                <h4 className="font-medium mb-3">
                  Step {currentStep.stepNumber}
                </h4>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="edit-stepTitle">Step Title *</Label>
                    <Input
                      id="edit-stepTitle"
                      placeholder="e.g., Navigate to the dashboard"
                      value={currentStep.title}
                      onChange={(e) =>
                        setCurrentStep({
                          ...currentStep,
                          title: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-stepDescription">
                      Step Description *
                    </Label>
                    <Textarea
                      id="edit-stepDescription"
                      placeholder="Detailed description of what the user should do"
                      value={currentStep.description}
                      onChange={(e) =>
                        setCurrentStep({
                          ...currentStep,
                          description: e.target.value,
                        })
                      }
                      rows={2}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="edit-stepRequired"
                      checked={currentStep.isRequired}
                      onChange={(e) =>
                        setCurrentStep({
                          ...currentStep,
                          isRequired: e.target.checked,
                        })
                      }
                    />
                    <Label htmlFor="edit-stepRequired">
                      This step is required
                    </Label>
                  </div>
                </div>
              </Card>

              {/* Existing Steps */}
              {newTutorial.steps.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Added Steps:</h4>
                  {newTutorial.steps.map((step, index) => (
                    <Card key={index} className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              Step {step.stepNumber}: {step.title}
                            </span>
                            {step.isRequired && (
                              <Badge variant="secondary" className="text-xs">
                                Required
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {step.description}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const updatedSteps = newTutorial.steps.filter(
                              (_, i) => i !== index,
                            );
                            // Renumber steps
                            const renumberedSteps = updatedSteps.map(
                              (s, i) => ({
                                ...s,
                                stepNumber: i + 1,
                              }),
                            );
                            setNewTutorial({
                              ...newTutorial,
                              steps: renumberedSteps,
                            });
                            setCurrentStep({
                              ...currentStep,
                              stepNumber: renumberedSteps.length + 1,
                            });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingTutorial(null);
                // Reset form
                setNewTutorial({
                  title: "",
                  description: "",
                  category: "getting_started",
                  instructions: "",
                  steps: [],
                  targetRoles: ["user"],
                  isRequired: false,
                  tags: [],
                });
                setCurrentStep({
                  stepNumber: 1,
                  title: "",
                  description: "",
                  isRequired: false,
                });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEditedTutorial}
              disabled={!newTutorial.title || !newTutorial.description}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Video Dialog */}
      <Dialog
        open={isUploadVideoOpen}
        onOpenChange={(open) => {
          setIsUploadVideoOpen(open);
          if (!open) {
            // Reset upload state when dialog closes
            setVideoUpload({
              title: "",
              description: "",
              file: null,
              uploadProgress: 0,
              isUploading: false,
              previewUrl: "",
              dragActive: false,
            });
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Tutorial Video</DialogTitle>
            <DialogDescription>
              Upload a video file to enhance your tutorial with visual
              demonstrations
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Tutorial Selection or New Tutorial */}
            <div>
              <Label>Title *</Label>
              <Input
                placeholder="Enter tutorial title"
                value={(videoUpload as any).title || ""}
                onChange={(e) =>
                  setVideoUpload({ ...videoUpload, title: e.target.value })
                }
                disabled={videoUpload.isUploading}
              />

              <div className="mt-4">
                <Label>Description (optional)</Label>
                <RichTextEditor
                  value={(videoUpload as any).description || ""}
                  onChange={(val) =>
                    setVideoUpload({ ...videoUpload, description: val })
                  }
                  placeholder="Enter a brief description"
                  readOnly={videoUpload.isUploading}
                  className="min-h-[120px]"
                />
              </div>
            </div>

            {/* File Upload Area */}
            <div>
              <Label>Video File *</Label>
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                  videoUpload.dragActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300",
                  videoUpload.isUploading && "opacity-50 pointer-events-none",
                )}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setVideoUpload({ ...videoUpload, dragActive: true });
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setVideoUpload({ ...videoUpload, dragActive: false });
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setVideoUpload({ ...videoUpload, dragActive: false });

                  const files = Array.from(e.dataTransfer.files);
                  const videoFile = files.find((file) =>
                    file.type.startsWith("video/"),
                  );

                  if (videoFile) {
                    handleFileSelect(videoFile);
                  }
                }}
              >
                {videoUpload.file ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center">
                      <FileText className="h-12 w-12 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium">{videoUpload.file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(videoUpload.file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    {videoUpload.previewUrl && (
                      <video
                        src={videoUpload.previewUrl}
                        className="max-w-full h-32 mx-auto rounded"
                        controls
                      />
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (videoUpload.previewUrl) {
                          URL.revokeObjectURL(videoUpload.previewUrl);
                        }
                        setVideoUpload({
                          ...videoUpload,
                          file: null,
                          previewUrl: "",
                        });
                      }}
                      disabled={videoUpload.isUploading}
                    >
                      Remove File
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center">
                      <Upload className="h-12 w-12 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-lg font-medium">
                        Drop your video file here
                      </p>
                      <p className="text-sm text-muted-foreground">
                        or click to browse
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "video/*";
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement)
                            .files?.[0];
                          if (file) {
                            handleFileSelect(file);
                          }
                        };
                        input.click();
                      }}
                      disabled={videoUpload.isUploading}
                    >
                      Browse Files
                    </Button>
                  </div>
                )}
              </div>

              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                <p>• Supported formats: MP4, AVI, MOV, WMV</p>
                <p>• Maximum file size: 500MB</p>
                <p>• Recommended resolution: 1080p or 720p</p>
                <p>• For best quality, use MP4 format with H.264 codec</p>
              </div>
            </div>

            {/* Upload Progress */}
            {videoUpload.isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading video...</span>
                  <span>{videoUpload.uploadProgress}%</span>
                </div>
                <Progress value={videoUpload.uploadProgress} />
                <p className="text-xs text-muted-foreground">
                  Please don't close this dialog while uploading.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUploadVideoOpen(false)}
              disabled={videoUpload.isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleVideoUpload}
              disabled={
                !(videoUpload as any).title ||
                !videoUpload.file ||
                videoUpload.isUploading
              }
            >
              {videoUpload.isUploading ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Video
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
