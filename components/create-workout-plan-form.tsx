"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"

interface InjuryHypothesis {
  id: string
  hypothesis: string
  symptoms: string
  created_at: string
}

interface CreateWorkoutPlanFormProps {
  userId: string
  injuryHypotheses: InjuryHypothesis[]
}

export function CreateWorkoutPlanForm({ userId, injuryHypotheses }: CreateWorkoutPlanFormProps) {
  const [planName, setPlanName] = useState("")
  const [durationWeeks, setDurationWeeks] = useState("")
  const [difficultyLevel, setDifficultyLevel] = useState("")
  const [selectedInjury, setSelectedInjury] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const generateExercises = (difficulty: string, injuryType?: string) => {
    // Simulated AI logic for generating exercises based on difficulty and injury
    const baseExercises = {
      beginner: [
        {
          name: "Gentle Stretching",
          sets: 1,
          reps: "Hold 30 seconds",
          instructions: "Gentle stretches to improve flexibility and reduce stiffness",
        },
        {
          name: "Walking",
          sets: 1,
          reps: "10-15 minutes",
          duration: "10-15 min",
          instructions: "Light walking to promote circulation and gentle movement",
        },
        {
          name: "Basic Range of Motion",
          sets: 2,
          reps: "10 repetitions",
          instructions: "Slow, controlled movements to maintain joint mobility",
        },
      ],
      intermediate: [
        {
          name: "Resistance Band Exercises",
          sets: 3,
          reps: "12-15 repetitions",
          instructions: "Use light to moderate resistance to strengthen muscles",
        },
        {
          name: "Core Strengthening",
          sets: 3,
          reps: "10-12 repetitions",
          instructions: "Planks, modified crunches, and stability exercises",
        },
        {
          name: "Balance Training",
          sets: 2,
          reps: "30 seconds each",
          instructions: "Single-leg stands and stability challenges",
        },
        {
          name: "Functional Movements",
          sets: 2,
          reps: "8-10 repetitions",
          instructions: "Squats, lunges, and movement patterns for daily activities",
        },
      ],
      advanced: [
        {
          name: "Progressive Strength Training",
          sets: 4,
          reps: "8-12 repetitions",
          instructions: "Compound movements with progressive overload",
        },
        {
          name: "Plyometric Exercises",
          sets: 3,
          reps: "6-8 repetitions",
          instructions: "Jump training and explosive movements for power development",
        },
        {
          name: "Sport-Specific Drills",
          sets: 3,
          reps: "10-15 repetitions",
          instructions: "Movements that mimic sport or activity demands",
        },
        {
          name: "Advanced Stability",
          sets: 3,
          reps: "45 seconds each",
          instructions: "Complex balance and proprioception challenges",
        },
      ],
    }

    return baseExercises[difficulty as keyof typeof baseExercises] || baseExercises.beginner
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!planName.trim() || !durationWeeks || !difficultyLevel) return

    setIsLoading(true)
    setError(null)

    try {
      const exercises = generateExercises(difficultyLevel, selectedInjury)

      const supabase = createClient()
      const { error: dbError } = await supabase.from("workout_plans").insert({
        user_id: userId,
        injury_hypothesis_id: selectedInjury || null,
        plan_name: planName.trim(),
        exercises: exercises,
        duration_weeks: Number.parseInt(durationWeeks),
        difficulty_level: difficultyLevel,
      })

      if (dbError) throw dbError

      // Reset form
      setPlanName("")
      setDurationWeeks("")
      setDifficultyLevel("")
      setSelectedInjury("")

      // Refresh to show new plan
      router.refresh()

      // Switch to plans tab
      const plansTab = document.querySelector('[data-state="inactive"][value="plans"]') as HTMLElement
      if (plansTab) {
        plansTab.click()
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Workout Plan</CardTitle>
        <CardDescription>
          Generate a personalized exercise routine based on your needs and fitness level.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="planName">Plan Name</Label>
            <Input
              id="planName"
              placeholder="e.g., Lower Back Recovery Plan"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="duration">Duration (weeks)</Label>
              <Select value={durationWeeks} onValueChange={setDurationWeeks} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 weeks</SelectItem>
                  <SelectItem value="4">4 weeks</SelectItem>
                  <SelectItem value="6">6 weeks</SelectItem>
                  <SelectItem value="8">8 weeks</SelectItem>
                  <SelectItem value="12">12 weeks</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select value={difficultyLevel} onValueChange={setDifficultyLevel} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {injuryHypotheses.length > 0 && (
            <div>
              <Label htmlFor="injury">Related Injury (Optional)</Label>
              <Select value={selectedInjury} onValueChange={setSelectedInjury}>
                <SelectTrigger>
                  <SelectValue placeholder="Select related injury assessment" />
                </SelectTrigger>
                <SelectContent>
                  {injuryHypotheses.map((injury) => (
                    <SelectItem key={injury.id} value={injury.id}>
                      {injury.hypothesis.substring(0, 60)}...
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Creating Plan..." : "Create Workout Plan"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
