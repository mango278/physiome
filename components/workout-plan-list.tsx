"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface Exercise {
  name: string
  sets: number
  reps: string
  duration?: string
  instructions: string
}

interface WorkoutPlan {
  id: string
  plan_name: string
  exercises: Exercise[]
  duration_weeks: number
  difficulty_level: string
  created_at: string
  injury_hypotheses?: {
    id: string
    hypothesis: string
    symptoms: string
  }
}

interface WorkoutPlanListProps {
  plans: WorkoutPlan[]
}

export function WorkoutPlanList({ plans }: WorkoutPlanListProps) {
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null)

  if (plans.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-gray-500">No workout plans found. Create your first plan to get started!</p>
        </CardContent>
      </Card>
    )
  }

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case "beginner":
        return "bg-green-100 text-green-800"
      case "intermediate":
        return "bg-yellow-100 text-yellow-800"
      case "advanced":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-4">
      {plans.map((plan) => (
        <Card key={plan.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">{plan.plan_name}</CardTitle>
                <CardDescription>
                  {plan.duration_weeks} week program • Created {new Date(plan.created_at).toLocaleDateString()}
                </CardDescription>
              </div>
              <Badge className={getDifficultyColor(plan.difficulty_level)}>{plan.difficulty_level}</Badge>
            </div>
            {plan.injury_hypotheses && (
              <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Related to:</strong> {plan.injury_hypotheses.hypothesis}
                </p>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">{plan.exercises.length} exercises included</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
              >
                {expandedPlan === plan.id ? "Hide Details" : "View Exercises"}
              </Button>
            </div>

            {expandedPlan === plan.id && (
              <div className="mt-4 space-y-3">
                <h4 className="font-medium text-gray-900">Exercise Details:</h4>
                {plan.exercises.map((exercise, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-medium text-gray-900">{exercise.name}</h5>
                      <div className="text-sm text-gray-600">
                        {exercise.sets} sets × {exercise.reps}
                        {exercise.duration && ` • ${exercise.duration}`}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{exercise.instructions}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
