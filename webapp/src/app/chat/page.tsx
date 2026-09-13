"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { Bot, Loader2, Map as MapIcon, Send, Sparkles, Star, X } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { useTranslations } from "@/contexts/language-context";
import { useToast } from "@/contexts/toast-context";
import { RequireAuth } from "@/components/require-auth";
import { PlaceImage } from "@/components/ui/place-image";
import { PatternOverlay } from "@/components/ui/pattern-overlay";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import type { ChatMessage, ItineraryDayPlan, Place } from "@/lib/types";

interface ChatResponse {
  reply: string;
  suggestedPlaceIds: string[];
  itineraryPlan: ItineraryDayPlan[] | null;
}

function ChatInner() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const t = useTranslations();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [placesCache, setPlacesCache] = useState<Record<string, Place>>({});
  const [planModal, setPlanModal] = useState<ItineraryDayPlan[] | null>(null);
  const [planName, setPlanName] = useState(t("chat.defaultPlanName"));
  const [planStartDate, setPlanStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function handleCreateItineraryFromPlan() {
    if (!user || !planModal) return;
    setCreatingPlan(true);
    try {
      const days = planModal.filter((d) => d.placeIds.length > 0);
      const start = new Date(planStartDate);
      const end = new Date(start);
      end.setDate(end.getDate() + Math.max(1, days.length) - 1);

      const itineraryRef = await addDoc(collection(db, "itineraries"), {
        userId: user.uid,
        name: planName.trim() || t("chat.defaultPlanName"),
        startDate: Timestamp.fromDate(start),
        endDate: Timestamp.fromDate(end),
        isShared: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const batch = writeBatch(db);
      days.forEach((day, dayIndex) => {
        day.placeIds.forEach((placeId, order) => {
          const itemRef = doc(collection(db, "itineraries", itineraryRef.id, "itinerary_items"));
          batch.set(itemRef, { placeId, dayIndex, order, note: "", createdAt: serverTimestamp() });
        });
      });
      await batch.commit();

      toast.success(t("chat.toastCreated"));
      setPlanModal(null);
      router.push(`/itineraries/${itineraryRef.id}`);
    } catch {
      toast.error(t("chat.toastCreateFailed"));
    } finally {
      setCreatingPlan(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "users", user.uid, "chat_history", "default", "messages"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ChatMessage, "id">) })));
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (messages.length === 0) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, sending, streamingText]);

  async function resolvePlaces(ids: string[]) {
    const missing = ids.filter((id) => !placesCache[id]);
    if (missing.length === 0) return placesCache;
    const fetched = await Promise.all(missing.map((id) => getDoc(doc(db, "places", id))));
    const next = { ...placesCache };
    fetched.forEach((snap) => {
      if (snap.exists()) next[snap.id] = { id: snap.id, ...(snap.data() as Omit<Place, "id">) };
    });
    setPlacesCache(next);
    return next;
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || !user || sending) return;
    setInput("");
    setSending(true);

    const sessionRef = doc(db, "users", user.uid, "chat_history", "default");
    const messagesRef = collection(sessionRef, "messages");

    try {
      await setDoc(
        sessionRef,
        {
          ...(messages.length === 0
            ? { title: text.slice(0, 60), createdAt: serverTimestamp() }
            : {}),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      await setDoc(doc(messagesRef), {
        role: "user",
        content: text,
        createdAt: serverTimestamp(),
      });

      const history = messages.slice(-20).map((m) => ({ role: m.role, content: m.content }));
      const idToken = await user.getIdToken();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ message: text, history }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "chat_failed");
      }

      // Đọc SSE stream: hiện chữ dần ngay khi Claude sinh ra (giống ChatGPT/Claude.ai) thay vì
      // đợi trả lời đầy đủ rồi mới hiện 1 lần. Chỉ ghi Firestore 1 LẦN DUY NHẤT khi nhận event
      // "done" — không ghi mỗi delta, tránh spam write không cần thiết.
      setStreamingText("");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done: ChatResponse | null = null;
      let streamError: string | null = null;

      while (true) {
        const { value, done: readerDone } = await reader.read();
        if (readerDone) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const raw of events) {
          const line = raw.trim();
          if (!line.startsWith("data:")) continue;
          const event = JSON.parse(line.slice("data:".length).trim());
          if (event.type === "text_delta") {
            setStreamingText((prev) => (prev ?? "") + event.text);
          } else if (event.type === "done") {
            done = event as ChatResponse;
          } else if (event.type === "error") {
            streamError = event.error;
          }
        }
      }

      if (streamError) throw new Error(streamError);
      if (!done) throw new Error("chat_failed");

      const itineraryPlan = done.itineraryPlan ?? [];
      const planPlaceIds = itineraryPlan.flatMap((d) => d.placeIds);
      const places = await resolvePlaces([...done.suggestedPlaceIds, ...planPlaceIds]);

      await setDoc(doc(messagesRef), {
        role: "assistant",
        content: done.reply,
        placeCards: done.suggestedPlaceIds
          .filter((id) => places[id])
          .map((id) => ({
            placeId: id,
            name: places[id].name,
            image: places[id].coverImage,
            rating: places[id].ratingAvg,
          })),
        itineraryPlan,
        createdAt: serverTimestamp(),
      });
    } catch {
      toast.error(t("chat.toastUnavailable"));
    } finally {
      setStreamingText(null);
      setSending(false);
    }
  }

  return (
    <div className="relative flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
      <PatternOverlay />
      <div className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden px-4 sm:px-6">
      <div className="flex items-center gap-2 border-b border-border py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-foreground">{t("chat.assistantName")}</p>
          <p className="text-xs text-muted-foreground">{t("chat.assistantSubtitle")}</p>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto py-6">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
            <Sparkles className="mb-3 h-8 w-8 text-brand-300" />
            <p>{t("chat.emptyTitle")}</p>
            <p className="mt-1 text-sm">{t("chat.emptyExample")}</p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                m.role === "user"
                  ? "rounded-br-sm bg-brand-600 text-white"
                  : "rounded-bl-sm border border-border bg-surface text-foreground"
              )}
            >
              <p className="whitespace-pre-line">{m.content}</p>
              {m.placeCards && m.placeCards.length > 0 && (
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {m.placeCards.map((card) => (
                    <Link
                      key={card.placeId}
                      href={`/places/${card.placeId}`}
                      className="w-40 shrink-0 overflow-hidden rounded-xl border border-border bg-surface"
                    >
                      <PlaceImage src={card.image} alt={card.name} className="h-20 w-full" />
                      <div className="p-2">
                        <p className="line-clamp-1 text-xs font-medium text-foreground">{card.name}</p>
                        <p className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                          <Star className="h-3 w-3 fill-warning-600 text-warning-600" />
                          {card.rating?.toFixed(1) ?? "—"}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              {m.itineraryPlan && m.itineraryPlan.some((d) => d.placeIds.length > 0) && (
                <div className="mt-3 rounded-xl border border-border bg-surface-muted p-3">
                  {m.itineraryPlan
                    .filter((d) => d.placeIds.length > 0)
                    .map((day, i) => (
                      <div key={day.dayIndex} className={i > 0 ? "mt-2" : ""}>
                        <p className="text-xs font-semibold text-foreground">{t("common.day", { n: i + 1 })}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {day.placeIds.map((id) => {
                            const arrival = day.schedule?.find((s) => s.placeId === id)?.arrival;
                            return (
                              <span
                                key={id}
                                className="rounded-full bg-surface px-2 py-0.5 text-[11px] text-foreground"
                              >
                                {arrival ? `${arrival} · ` : ""}
                                {placesCache[id]?.name ?? "..."}
                              </span>
                            );
                          })}
                        </div>
                        {day.warnings && day.warnings.length > 0 && (
                          <ul className="mt-1 space-y-0.5">
                            {day.warnings.map((w, wi) => (
                              <li key={wi} className="text-[11px] text-warning-600">
                                ⚠ {w}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-3 w-full"
                    onClick={() => setPlanModal(m.itineraryPlan!)}
                  >
                    <MapIcon className="h-3.5 w-3.5" /> {t("chat.createItineraryFromSuggestion")}
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
        {sending && streamingText && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl rounded-bl-sm border border-border bg-surface px-4 py-2.5 text-sm text-foreground">
              <p className="whitespace-pre-line">{streamingText}</p>
            </div>
          </div>
        )}
        {sending && !streamingText && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-border bg-surface px-4 py-2.5 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t("chat.typing")}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-border py-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("chat.inputPlaceholder")}
          className="h-11 flex-1 rounded-full border border-border bg-surface px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <Button type="submit" size="icon" className="rounded-full" disabled={!input.trim() || sending}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
      </div>

      {planModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">{t("chat.createItineraryFromSuggestionTitle")}</h3>
              <button
                onClick={() => setPlanModal(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <Field label={t("common.itineraryName")}>
                <Input value={planName} onChange={(e) => setPlanName(e.target.value)} />
              </Field>
              <Field label={t("common.startDate")}>
                <Input type="date" value={planStartDate} onChange={(e) => setPlanStartDate(e.target.value)} />
              </Field>
              <Button className="w-full" onClick={handleCreateItineraryFromPlan} loading={creatingPlan}>
                {t("common.createItinerary")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <RequireAuth>
      <ChatInner />
    </RequireAuth>
  );
}
