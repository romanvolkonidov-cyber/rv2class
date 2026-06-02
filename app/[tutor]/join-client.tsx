"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, getDoc, getDocFromServer } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import type { TutorKey } from "./config";

export default function JoinTutorRoom({
  tutorKey,
  tutor,
}: {
  tutorKey: TutorKey;
  tutor: { name: string; room: string; accent: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [studentName, setStudentName] = useState("");
  const [error, setError] = useState("");
  const [origin, setOrigin] = useState("https://online.rv2class.com");
  const [isWaiting, setIsWaiting] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);

  const { room, name, accent } = tutor;

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
      // Pre-fill student name from URL parameter
      const nameParam = searchParams.get("name");
      if (nameParam) {
        setStudentName(decodeURIComponent(nameParam));
      }
    }
  }, [searchParams]);

  // Listen for approval
  useEffect(() => {
    if (!requestId) return;

    const unsubscribe = onSnapshot(
      query(
        collection(db, "joinRequests"),
        where("__name__", "==", requestId)
      ),
      async (snapshot) => {
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          if (data.status === "approved") {
            setIsWaiting(false);
            
            // CRITICAL: Fetch the active session directly from server (bypass cache)
            // to ensure we get the LATEST room name and session code
            try {
              console.log(`🔍 Fetching LATEST session data for ${tutorKey} from server...`);
              const sessionDoc = await getDocFromServer(doc(db, "activeSessions", tutorKey));
              
              if (sessionDoc.exists() && sessionDoc.data().isActive) {
                const sessionData = sessionDoc.data();
                const targetRoomName = sessionData.roomName;
                const targetSessionCode = sessionData.sessionCode;
                
                console.log(`✅ Got session data from server:`, {
                  roomName: targetRoomName,
                  sessionCode: targetSessionCode,
                  tutorKey,
                  studentName: studentName.trim()
                });
                
                // Verify the room name format is correct
                if (!targetRoomName.includes(tutorKey)) {
                  console.error(`❌ ROOM NAME MISMATCH! Expected format: ${tutorKey}-XXXXXX, got: ${targetRoomName}`);
                  setError("Invalid room configuration. Please contact your teacher.");
                  setIsWaiting(false);
                  setRequestId(null);
                  return;
                }
                
                const joinUrl = `/room?room=${encodeURIComponent(targetRoomName)}&name=${encodeURIComponent(studentName.trim())}&isTutor=false&sessionCode=${targetSessionCode}&subject=English&teacherName=${encodeURIComponent(name)}`;
                console.log(`🚀 Navigating student to room:`, joinUrl);
                
                router.push(joinUrl);
              } else {
                setError("The lesson has ended. Please try again later.");
                setIsWaiting(false);
                setRequestId(null);
              }
            } catch (error) {
              console.error("Error fetching session:", error);
              setError("Failed to join the lesson.");
              setIsWaiting(false);
              setRequestId(null);
            }
          } else if (data.status === "denied") {
            setIsWaiting(false);
            setError("Your request to join was denied. Please try again.");
            setRequestId(null);
          }
        }
      }
    );

    return () => unsubscribe();
  }, [requestId, router, room, studentName, tutorKey]);

  const shareLink = useMemo(() => `${origin}/${tutorKey}`, [origin, tutorKey]);

  const joinClass = async () => {
    if (!studentName.trim()) {
      setError("Please enter your name to join the class.");
      return;
    }

    setError("");
    setIsWaiting(true);

    try {
      // CRITICAL: Fetch session from SERVER (not cache) to ensure we have the latest data
      console.log(`🔍 Fetching CURRENT session data for ${tutorKey} from server...`);
      const sessionDoc = await getDocFromServer(doc(db, "activeSessions", tutorKey));
      
      if (!sessionDoc.exists() || !sessionDoc.data().isActive) {
        setError(`${name} hasn't started a lesson yet. Please try again later.`);
        setIsWaiting(false);
        return;
      }
      
      const sessionData = sessionDoc.data();
      
      console.log(`📋 Current session for ${tutorKey}:`, {
        roomName: sessionData.roomName,
        sessionCode: sessionData.sessionCode,
        teacherName: sessionData.teacherName
      });
      
      // Verify the room actually exists on LiveKit server
      console.log(`🔍 Checking if room ${sessionData.roomName} exists on LiveKit...`);
      const roomCheckResponse = await fetch("/api/check-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName: sessionData.roomName }),
      });
      
      if (roomCheckResponse.ok) {
        const roomStatus = await roomCheckResponse.json();
        
        if (!roomStatus.exists) {
          console.log(`❌ Room ${sessionData.roomName} doesn't exist on LiveKit server`);
          setError(`${name} hasn't started the lesson yet or it has ended. Please try again later.`);
          setIsWaiting(false);
          return;
        }
        
        console.log(`✅ Room ${sessionData.roomName} exists with ${roomStatus.numParticipants} participants`);
      } else {
        console.warn("⚠️ Failed to check room status, proceeding anyway...");
      }
      
      const response = await fetch("/api/join-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomName: sessionData.roomName,
          studentName: studentName.trim(),
          sessionCode: sessionData.sessionCode,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setRequestId(data.requestId);
      } else {
        setError(data.error || "Failed to send join request");
        setIsWaiting(false);
      }
    } catch (err) {
      console.error("Error sending join request:", err);
      setError("Failed to send join request. Please try again.");
      setIsWaiting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-xl w-full space-y-6">
        <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
          <CardHeader>
            <CardTitle className={`text-3xl font-semibold ${accent}`}>{`${name}'s Classroom`}</CardTitle>
            <CardDescription>
              {isWaiting 
                ? `Waiting for ${name} to approve your request...` 
                : `Welcome! Enter your name below to join the live session with ${name}.`
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isWaiting ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Your join request has been sent to {name}.<br />
                  Please wait for approval...
                </p>
              </div>
            ) : (
              <>
                <div>
                  <label className="text-sm font-medium mb-2 block">Your Name</label>
                  <Input
                    value={studentName}
                    onChange={(event) => setStudentName(event.target.value)}
                    placeholder="Type your name"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        joinClass();
                      }
                    }}
                  />
                  {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
                </div>
                <Button className="w-full" size="lg" onClick={joinClass}>
                  {`Join ${name}'s Session`}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {!isWaiting && (
          <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70">
            <CardHeader>
              <CardTitle className="text-lg">Need this link later?</CardTitle>
              <CardDescription>Save or share it with classmates.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-mono text-sm break-all">{shareLink}</p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => navigator.clipboard.writeText(shareLink)}>
                  Copy link
                </Button>
                <Button variant="ghost" asChild>
                  <Link href="/">Back to tutors</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
