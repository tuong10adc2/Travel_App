"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { Bot, Loader2, Send, Sparkles, Star } from "lucide-react";
import { db, functions } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import { RequireAuth } from "@/components/require-auth";
import { PlaceImage } from "@/components/ui/place-image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { ChatMessage, Place } from "@/lib/types";

interface ChatResponse {
  reply: string;
  suggestedPlaceIds: string[];
}

function ChatInner() {
  const { user } = useAuth();
  const toast = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [placesCache, setPlacesCache] = useState<Record<string, Place>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

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
      const places = await resolvePlaces(result.data.suggestedPlaceIds);

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
                  : "rounded-bl-sm border border-border bg-white text-foreground"
              )}
            >
              <p className="whitespace-pre-line">{m.content}</p>
              {m.placeCards && m.placeCards.length > 0 && (
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {m.placeCards.map((card) => (
                    <Link
                      key={card.placeId}
                      href={`/places/${card.placeId}`}
                      className="w-40 shrink-0 overflow-hidden rounded-xl border border-border bg-white"
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
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-border bg-white px-4 py-2.5 text-sm text-muted-foreground">
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
          className="h-11 flex-1 rounded-full border border-border bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <Button type="submit" size="icon" className="rounded-full" disabled={!input.trim() || sending}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
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
