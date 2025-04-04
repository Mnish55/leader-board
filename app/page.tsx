// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Minus, Trophy, UserPlus, Save, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner"

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

// Define types for participants
interface Participant {
  id: string;
  name: string;
  score: number;
}

export default function Leaderboard() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newParticipant, setNewParticipant] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [participantToDelete, setParticipantToDelete] = useState<Participant | null>(null);
  const [useDatabase, setUseDatabase] = useState<boolean>(false);

  // Load participants from localStorage or API on component mount
  useEffect(() => {
    const loadParticipants = async () => {
      setIsLoading(true);
      try {
        // Check if we should use the database
        const dbPreference = localStorage.getItem("useDatabase");
        const shouldUseDb = dbPreference === "true";
        setUseDatabase(shouldUseDb);

        if (shouldUseDb) {
          // Load from API
          const response = await fetch("/api/participants");
          if (!response.ok) throw new Error("Failed to load participants");
          const data = await response.json() as Participant[];
          setParticipants(data);
        } else {
          // Load from localStorage
          const savedParticipants = localStorage.getItem("leaderboardParticipants");
          if (savedParticipants) {
            setParticipants(JSON.parse(savedParticipants) as Participant[]);
          }
        }
      } catch (error) {
        console.error("Error loading participants:", error);
        toast.error("Failed to load participants. Using local storage instead.");
        // Fallback to localStorage
        const savedParticipants = localStorage.getItem("leaderboardParticipants");
        if (savedParticipants) {
          setParticipants(JSON.parse(savedParticipants) as Participant[]);
        }
        setUseDatabase(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadParticipants();
  }, []);

  // Save participants to localStorage whenever they change
  useEffect(() => {
    if (!isLoading && !useDatabase) {
      localStorage.setItem("leaderboardParticipants", JSON.stringify(participants));
    }
  }, [participants, isLoading, useDatabase]);

  const toggleDatabaseMode = () => {
    const newMode = !useDatabase;
    setUseDatabase(newMode);
    localStorage.setItem("useDatabase", String(newMode));
    
    toast.success("Storage mode changed. Reloading data...");
    
    // Reload the page to refresh data from the correct source
    window.location.reload();
  };

  const handleAddParticipant = async () => {
    if (newParticipant.trim() === "") {
      toast.error("Participant name cannot be empty");
      return;
    }

    const participantExists = participants.some(
      (p) => p.name.toLowerCase() === newParticipant.toLowerCase()
    );

    if (participantExists) {
      toast.error("Participant already exists");
      return;
    }

    try {
      if (useDatabase) {
        setIsSaving(true);
        // Add participant through API
        const response = await fetch("/api/participants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newParticipant }),
        });

        if (!response.ok) throw new Error("Failed to add participant");
        const newParticipantData = await response.json() as Participant;
        
        // Fetch updated list to ensure correct sorting
        const updatedResponse = await fetch("/api/participants");
        if (!updatedResponse.ok) throw new Error("Failed to refresh participants");
        const updatedData = await updatedResponse.json() as Participant[];
        setParticipants(updatedData);
      } else {
        // Add participant locally
        const newParticipantObj: Participant = {
          id: Date.now().toString(),
          name: newParticipant,
          score: 0,
        };
        setParticipants([...participants, newParticipantObj].sort((a, b) => b.score - a.score));
      }

      setNewParticipant("");
      toast.success("Participant added successfully");
    } catch (error) {
      console.error("Error adding participant:", error);
      toast.error("Failed to add participant");
    } finally {
      setIsSaving(false);
    }
  };

  const handleScoreChange = async (id: string, delta: number) => {
    try {
      const participant = participants.find(p => p.id === id);
      if (!participant) return;

      const newScore = participant.score + delta;
      // Prevent negative scores
      if (newScore < 0) {
        toast.error("Score cannot be negative");
        return;
      }

      if (useDatabase) {
        setIsSaving(true);
        // Update score through API
        const response = await fetch(`/api/participants/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ score: newScore }),
        });

        if (!response.ok) throw new Error("Failed to update score");
        
        // Fetch updated list to ensure correct sorting
        const updatedResponse = await fetch("/api/participants");
        if (!updatedResponse.ok) throw new Error("Failed to refresh participants");
        const updatedData = await updatedResponse.json() as Participant[];
        setParticipants(updatedData);
      } else {
        // Update score locally
        const updatedParticipants = participants.map((p) => {
          if (p.id === id) {
            return { ...p, score: newScore };
          }
          return p;
        });
        // Sort participants by score (highest first)
        setParticipants([...updatedParticipants].sort((a, b) => b.score - a.score));
      }
    } catch (error) {
      console.error("Error updating score:", error);
      toast.error("Failed to update score");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = (participant: Participant) => {
    setParticipantToDelete(participant);
  };

  const handleRemoveParticipant = async () => {
    if (!participantToDelete) return;
    
    try {
      if (useDatabase) {
        setIsSaving(true);
        // Remove participant through API
        const response = await fetch(`/api/participants/${participantToDelete.id}`, {
          method: "DELETE",
        });

        if (!response.ok) throw new Error("Failed to remove participant");
        
        // Fetch updated list
        const updatedResponse = await fetch("/api/participants");
        if (!updatedResponse.ok) throw new Error("Failed to refresh participants");
        const updatedData = await updatedResponse.json() as Participant[];
        setParticipants(updatedData);
      } else {
        // Remove participant locally
        setParticipants(participants.filter((p) => p.id !== participantToDelete.id));
      }

      toast.success(`${participantToDelete.name} removed successfully`);
    } catch (error) {
      console.error("Error removing participant:", error);
      toast.error("Failed to remove participant");
    } finally {
      setIsSaving(false);
      setParticipantToDelete(null);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">      
      <AlertDialog open={!!participantToDelete} onOpenChange={() => setParticipantToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Participant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {participantToDelete?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveParticipant} className="bg-red-600 hover:bg-red-700">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl md:text-3xl font-bold text-indigo-800 flex items-center">
                <Trophy className="h-6 w-6 mr-2 text-yellow-500" /> Leaderboard
              </CardTitle>
              <CardDescription>
                {useDatabase ? "Using database storage" : "Using local browser storage"}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={toggleDatabaseMode}
            >
              {useDatabase ? "Use Local Storage" : "Use Database"}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-6">
              <div className="flex gap-2">
                <Input
                  placeholder="Add new participant..."
                  value={newParticipant}
                  onChange={(e) => setNewParticipant(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddParticipant()}
                  className="border-indigo-200 focus:border-indigo-400"
                  disabled={isSaving}
                />
                <Button
                  onClick={handleAddParticipant}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4 mr-2" />
                  )}
                  Add
                </Button>
              </div>

              <div className="rounded-lg border bg-white overflow-hidden">
                <div className="grid grid-cols-12 gap-2 p-4 bg-indigo-100 font-medium text-indigo-900">
                  <div className="col-span-1 text-center">#</div>
                  <div className="col-span-5">Name</div>
                  <div className="col-span-2 text-center">Score</div>
                  <div className="col-span-4 text-center">Actions</div>
                </div>

                {isLoading ? (
                  <div className="p-12 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                  </div>
                ) : (
                  <AnimatePresence>
                    {participants.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="p-8 text-center text-gray-500"
                      >
                        No participants yet. Add your first one!
                      </motion.div>
                    ) : (
                      participants.map((participant, index) => (
                        <motion.div
                          key={participant.id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30,
                            mass: 1,
                          }}
                          className={`grid grid-cols-12 gap-2 p-4 items-center ${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          } ${index === 0 ? "bg-gradient-to-r from-yellow-50 to-yellow-100" : ""}`}
                        >
                          <div className="col-span-1 text-center font-medium">
                            {index === 0 ? (
                              <Trophy className="h-5 w-5 text-yellow-500 mx-auto" />
                            ) : (
                              index + 1
                            )}
                          </div>
                          <div className="col-span-5 font-medium">
                            {participant.name}
                          </div>
                          <motion.div
                            key={`score-${participant.id}-${participant.score}`}
                            initial={{ scale: 1.5 }}
                            animate={{ scale: 1 }}
                            className="col-span-2 text-center font-bold text-indigo-700"
                          >
                            {participant.score}
                          </motion.div>
                          <div className="col-span-4 flex justify-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-green-500 text-green-600 hover:bg-green-50"
                              onClick={() => handleScoreChange(participant.id, 1)}
                              disabled={isSaving}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-amber-500 text-amber-600 hover:bg-amber-50"
                              onClick={() => handleScoreChange(participant.id, -1)}
                              disabled={isSaving || participant.score <= 0}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-500 text-red-600 hover:bg-red-50"
                              onClick={() => confirmDelete(participant)}
                              disabled={isSaving}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                )}
              </div>
              
              {participants.length > 0 && (
                <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-lg">
                  <div className="text-indigo-800">
                    <span className="font-medium">{participants.length}</span> participants
                  </div>
                  <div className="text-indigo-800">
                    Total points: <span className="font-medium">
                      {participants.reduce((sum, p) => sum + p.score, 0)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      <footer className="mt-8 text-center text-gray-500 text-sm">
        <p>Interactive leaderboard with real-time updates.</p>
        <p className="mt-1">
          {useDatabase 
            ? "Data is stored in the database and synchronized across all devices." 
            : "Data is stored in this browser only. Clear your browser data to reset."}
        </p>
      </footer>
    </div>
  );
}