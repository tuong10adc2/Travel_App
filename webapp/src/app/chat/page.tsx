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
import { httpsCallable } from "firebase/functions";
import { Bot, Loader2, Map as MapIcon, Send, Sparkles, Star, X } from "lucide-react";
import { db, functions } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import { RequireAuth } from "@/components/require-auth";
import { PlaceImage } from "@/components/ui/place-image";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import type { ChatMessage, Place } from "@/lib/types";

interface ChatResponse {
  reply: string;
  suggestedPlaceIds: string[];
  itineraryPlan: { dayIndex: number; placeIds: string[] }[] | null;
}

function ChatInner() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [placesCache, setPlacesCache] = useState<Record<string, Place>>({});
  const [planModal, setPlanModal] = useState<{ dayIndex: number; placeIds: string[] }[] | null>(null);
  const [planName, setPlanName] = useState("Lịch trình gợi ý từ AI");
  const [planStartDate, setPlanStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [creatingPlan, setCreatingPlan] = useState(false);
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
        name: planName.trim() || "Lịch trình gợi ý từ AI",
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

      toast.success("Đã tạo lịch trình từ gợi ý AI.");
      setPlanModal(null);
      router.push(`/itineraries/${itineraryRef.id}`);
    } catch {
      toast.error("Không thể tạo lịch trình.");
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
  }, [messages, sending]);

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
      const call = httpsCallable<{ message: string; history: typeof history }, ChatResponse>(
        functions,
        "chatWithAssistant"
      );
      const result = await call({ message: text, history });
      const itineraryPlan = result.data.itineraryPlan ?? [];
      const planPlaceIds = itineraryPlan.flatMap((d) => d.placeIds);
      const places = await resolvePlaces([...result.data.suggestedPlaceIds, ...planPlaceIds]);

      await setDoc(doc(messagesRef), {
        role: "assistant",
        content: result.data.reply,
        placeCards: result.data.suggestedPlaceIds
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
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";
      if (code === "functions/not-found" || code === "functions/internal" || code === "functions/unavailable") {
        toast.error(
          "Trợ lý AI hiện chưa khả dụng (backend chưa được triển khai). Vui lòng thử lại sau."
        );
      } else {
        toast.error("Không thể gửi tin nhắn, vui lòng thử lại.");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-3xl flex-col px-4 sm:px-6">
      <div className="flex items-center gap-2 border-b border-border py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Trợ lý du lịch AI</p>
          <p className="text-xs text-muted-foreground">Hỏi về lịch sử, văn hoá, ẩm thực hay địa điểm ẩn</p>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto py-6">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
            <Sparkles className="mb-3 h-8 w-8 text-brand-300" />
            <p>Hỏi mình bất cứ điều gì về du lịch Việt Nam!</p>
            <p className="mt-1 text-sm">vd: &ldquo;Gợi ý địa điểm thiên nhiên gần Đà Lạt&rdquo;</p>
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
                        <p className="text-xs font-semibold text-foreground">Ngày {i + 1}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {day.placeIds.map((id) => (
                            <span
                              key={id}
                              className="rounded-full bg-surface px-2 py-0.5 text-[11px] text-foreground"
                            >
                              {placesCache[id]?.name ?? "..."}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-3 w-full"
                    onClick={() => setPlanModal(m.itineraryPlan!)}
                  >
                    <MapIcon className="h-3.5 w-3.5" /> Tạo lịch trình từ gợi ý này
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-border bg-surface px-4 py-2.5 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang trả lời...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-border py-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nhập câu hỏi của bạn..."
          className="h-11 flex-1 rounded-full border border-border bg-surface px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <Button type="submit" size="icon" className="rounded-full" disabled={!input.trim() || sending}>
          <Send className="h-4 w-4" />
        </Button>
      </form>

      {planModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">Tạo lịch trình từ gợi ý AI</h3>
              <button
                onClick={() => setPlanModal(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <Field label="Tên lịch trình">
                <Input value={planName} onChange={(e) => setPlanName(e.target.value)} />
              </Field>
              <Field label="Ngày bắt đầu">
                <Input type="date" value={planStartDate} onChange={(e) => setPlanStartDate(e.target.value)} />
              </Field>
              <Button className="w-full" onClick={handleCreateItineraryFromPlan} loading={creatingPlan}>
                Tạo lịch trình
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
