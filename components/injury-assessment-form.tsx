"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

interface InjuryAssessmentFormProps {
  userId: string
}

export function InjuryAssessmentForm({ userId }: InjuryAssessmentFormProps) {
  const [symptoms, setSymptoms] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    hypothesis: string
    confidence: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const generateHypothesis = (symptoms: string) => {
    // Simulated AI logic - in a real app, this would call an AI service
    const commonConditions = [
      {
        keywords: ["back", "lower back", "spine", "lumbar"],
        hypothesis: "Lower back strain or muscle spasm, possibly due to poor posture or sudden movement",
        confidence: 7,
      },
      {
        keywords: ["knee", "kneecap", "patella"],
        hypothesis: "Patellofemoral pain syndrome or knee strain from overuse or improper movement",
        confidence: 6,
      },
      {
        keywords: ["shoulder", "arm", "rotator"],
        hypothesis: "Rotator cuff strain or shoulder impingement from repetitive overhead movements",
        confidence: 8,
      },
      {
        keywords: ["neck", "cervical", "stiff neck"],
        hypothesis: "Cervical strain or tension headache from poor posture or stress",
        confidence: 7,
      },
      {
        keywords: ["ankle", "foot", "heel"],
        hypothesis: "Ankle sprain or plantar fasciitis from overuse or improper footwear",
        confidence: 6,
      },
    ]

    const lowerSymptoms = symptoms.toLowerCase()

    for (const condition of commonConditions) {
      if (condition.keywords.some((keyword) => lowerSymptoms.includes(keyword))) {
        return {
          hypothesis: condition.hypothesis,
          confidence: condition.confidence + Math.floor(Math.random() * 2), // Add some variation
        }
      }
    }

    // Default response for unmatched symptoms
    return {
      hypothesis:
        "General musculoskeletal strain. Recommend rest, ice, and gentle movement. Consider consulting a healthcare professional for persistent symptoms.",
      confidence: 5,
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!symptoms.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      // Generate AI hypothesis (simulated)
      const aiResult = generateHypothesis(symptoms)

      // Save to database
      const supabase = createClient()
      const { error: dbError } = await supabase.from("injury_hypotheses").insert({
        user_id: userId,
        symptoms: symptoms.trim(),
        hypothesis: aiResult.hypothesis,
        confidence_score: Math.min(aiResult.confidence, 10),
      })

      if (dbError) throw dbError

      setResult(aiResult)

      // Refresh the page to show the new assessment in the recent list
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewAssessment = () => {
    setSymptoms("")
    setResult(null)
    setError(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Describe Your Symptoms</CardTitle>
        <CardDescription>
          Provide detailed information about your pain, discomfort, or injury for an AI-powered assessment.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!result ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="symptoms">Symptoms Description</Label>
              <Textarea
                id="symptoms"
                placeholder="Describe your symptoms in detail... For example: 'I have sharp pain in my lower back that started after lifting a heavy box. The pain worsens when I bend forward and feels better when I lie down.'"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                rows={6}
                className="mt-2"
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" disabled={isLoading || !symptoms.trim()} className="w-full">
              {isLoading ? "Analyzing..." : "Get AI Assessment"}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-medium text-green-900 mb-2">Assessment Complete</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Your Symptoms:</p>
                  <p className="text-sm text-gray-600">{symptoms}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">AI Hypothesis:</p>
                  <p className="text-sm text-gray-800">{result.hypothesis}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-blue-600">Confidence Score: {result.confidence}/10</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-32">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(result.confidence / 10) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleNewAssessment} variant="outline" className="flex-1 bg-transparent">
                New Assessment
              </Button>
              <Button asChild className="flex-1">
                <a href="/plan">Get Workout Plan</a>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
