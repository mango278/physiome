"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface CheckIn {
  id: string
  pain_level: number
  mobility_score: number
  notes: string | null
  completed_exercises: string[] | null
  created_at: string
  workout_plans?: {
    id: string
    plan_name: string
  }
}

interface CheckInHistoryProps {
  checkIns: CheckIn[]
}

export function CheckInHistory({ checkIns }: CheckInHistoryProps) {
  if (checkIns.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-gray-500">No check-ins recorded yet. Start tracking your progress today!</p>
        </CardContent>
      </Card>
    )
  }

  const getPainLevelColor = (level: number) => {
    if (level <= 3) return "bg-green-100 text-green-800"
    if (level <= 6) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  const getMobilityColor = (score: number) => {
    if (score >= 8) return "bg-green-100 text-green-800"
    if (score >= 5) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  const getPainTrend = (currentIndex: number) => {
    if (currentIndex >= checkIns.length - 1) return null
    const current = checkIns[currentIndex].pain_level
    const previous = checkIns[currentIndex + 1].pain_level
    if (current < previous) return "↓"
    if (current > previous) return "↑"
    return "→"
  }

  const getMobilityTrend = (currentIndex: number) => {
    if (currentIndex >= checkIns.length - 1) return null
    const current = checkIns[currentIndex].mobility_score
    const previous = checkIns[currentIndex + 1].mobility_score
    if (current > previous) return "↑"
    if (current < previous) return "↓"
    return "→"
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Progress Overview</CardTitle>
          <CardDescription>Your recovery journey over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{checkIns.length}</div>
              <div className="text-sm text-blue-700">Total Check-ins</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {(checkIns.reduce((sum, c) => sum + c.pain_level, 0) / checkIns.length).toFixed(1)}
              </div>
              <div className="text-sm text-red-700">Avg Pain Level</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {(checkIns.reduce((sum, c) => sum + c.mobility_score, 0) / checkIns.length).toFixed(1)}
              </div>
              <div className="text-sm text-green-700">Avg Mobility</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {checkIns.map((checkIn, index) => (
          <Card key={checkIn.id}>
            <CardContent className="py-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-medium text-gray-900">
                    {new Date(checkIn.created_at).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-sm text-gray-500">{new Date(checkIn.created_at).toLocaleTimeString()}</p>
                </div>
                {checkIn.workout_plans && (
                  <Badge variant="outline" className="text-xs">
                    {checkIn.workout_plans.plan_name}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <Badge className={getPainLevelColor(checkIn.pain_level)}>Pain: {checkIn.pain_level}/10</Badge>
                  {getPainTrend(index) && <span className="text-sm text-gray-500">{getPainTrend(index)}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getMobilityColor(checkIn.mobility_score)}>
                    Mobility: {checkIn.mobility_score}/10
                  </Badge>
                  {getMobilityTrend(index) && <span className="text-sm text-gray-500">{getMobilityTrend(index)}</span>}
                </div>
              </div>

              {checkIn.completed_exercises && checkIn.completed_exercises.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">Completed Exercises:</p>
                  <div className="flex flex-wrap gap-1">
                    {checkIn.completed_exercises.map((exercise, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {exercise}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {checkIn.notes && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Notes:</p>
                  <p className="text-sm text-gray-600">{checkIn.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
