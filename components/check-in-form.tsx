"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"

interface Exercise {
  name: string
  sets: number
  reps: string
  instructions: string
}

interface WorkoutPlan {
  id: string
  plan_name: string
  exercises: Exercise[]
}

interface CheckInFormProps {
  userId: string
  workoutPlans: WorkoutPlan[]
}

export function CheckInForm({ userId, workoutPlans }: CheckInFormProps) {
  const [painLevel, setPainLevel] = useState("")
  const [mobilityScore, setMobilityScore] = useState("")
  const [notes, setNotes] = useState("")
  const [selectedWorkoutPlan, setSelectedWorkoutPlan] = useState("")
  const [completedExercises, setCompletedExercises] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const selectedPlan = workoutPlans.find((plan) => plan.id === selectedWorkoutPlan)

  const handleExerciseToggle = (exerciseName: string, checked: boolean) => {
    if (checked) {
      setCompletedExercises([...completedExercises, exerciseName])
    } else {
      setCompletedExercises(completedExercises.filter((name) => name !== exerciseName))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!painLevel || !mobilityScore) return

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: dbError } = await supabase.from("check_ins").insert({
        user_id: userId,
        workout_plan_id: selectedWorkoutPlan || null,
        pain_level: Number.parseInt(painLevel),
        mobility_score: Number.parseInt(mobilityScore),
        notes: notes.trim() || null,
        completed_exercises: completedExercises.length > 0 ? completedExercises : null,
      })

      if (dbError) throw dbError

      // Reset form
      setPainLevel("")
      setMobilityScore("")
      setNotes("")
      setSelectedWorkoutPlan("")
      setCompletedExercises([])
      setSuccess(true)

      // Refresh to show new check-in
      router.refresh()

      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const getPainLevelColor = (level: string) => {
    const num = Number.parseInt(level)
    if (num <= 3) return "text-green-600"
    if (num <= 6) return "text-yellow-600"
    return "text-red-600"
  }

  const getMobilityColor = (score: string) => {
    const num = Number.parseInt(score)
    if (num >= 8) return "text-green-600"
    if (num >= 5) return "text-yellow-600"
    return "text-red-600"
  }

  if (success) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="text-green-600 text-4xl mb-4">✓</div>
          <h3 className="text-lg font-medium text-green-900 mb-2">Check-in Recorded!</h3>
          <p className="text-green-700 text-sm">Your progress has been saved successfully.</p>
          <Button onClick={() => setSuccess(false)} className="mt-4" variant="outline">
            Record Another Check-in
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Progress Check-in</CardTitle>
        <CardDescription>Record your current pain level, mobility, and exercise completion.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="painLevel">Pain Level (1-10)</Label>
              <Select value={painLevel} onValueChange={setPainLevel} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select pain level" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => (
                    <SelectItem key={level} value={level.toString()}>
                      <span className={getPainLevelColor(level.toString())}>
                        {level} - {level <= 3 ? "Mild" : level <= 6 ? "Moderate" : "Severe"}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="mobilityScore">Mobility Score (1-10)</Label>
              <Select value={mobilityScore} onValueChange={setMobilityScore} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select mobility score" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => (
                    <SelectItem key={score} value={score.toString()}>
                      <span className={getMobilityColor(score.toString())}>
                        {score} - {score >= 8 ? "Excellent" : score >= 5 ? "Good" : "Limited"}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {workoutPlans.length > 0 && (
            <div>
              <Label htmlFor="workoutPlan">Related Workout Plan (Optional)</Label>
              <Select value={selectedWorkoutPlan} onValueChange={setSelectedWorkoutPlan}>
                <SelectTrigger>
                  <SelectValue placeholder="Select workout plan" />
                </SelectTrigger>
                <SelectContent>
                  {workoutPlans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.plan_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedPlan && (
            <div>
              <Label>Completed Exercises</Label>
              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                {selectedPlan.exercises.map((exercise, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Checkbox
                      id={`exercise-${index}`}
                      checked={completedExercises.includes(exercise.name)}
                      onCheckedChange={(checked) => handleExerciseToggle(exercise.name, checked as boolean)}
                    />
                    <Label htmlFor={`exercise-${index}`} className="text-sm">
                      {exercise.name} ({exercise.sets} sets × {exercise.reps})
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="How are you feeling today? Any specific observations about your recovery..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-2"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Recording..." : "Record Check-in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
