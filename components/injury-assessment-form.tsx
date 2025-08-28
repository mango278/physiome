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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!symptoms.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      console.log("[v0] Starting AI API call for injury assessment")

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: `Please analyze these symptoms and provide an injury hypothesis with confidence score: ${symptoms}`,
        }),
      })

      console.log("[v0] AI API response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] AI API error response:", errorText)
        throw new Error(`AI service error: ${response.status} - ${errorText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("No response body received")
      }

      let aiResponse = ""
      const decoder = new TextDecoder()

      // Read the streaming response
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        aiResponse += chunk
      }

      console.log("[v0] Complete AI response:", aiResponse)

      let aiResult
      try {
        // First try to parse as JSON
        const jsonResponse = JSON.parse(aiResponse)
        aiResult = {
          hypothesis: jsonResponse.hypothesis || jsonResponse.assessment || aiResponse,
          confidence: jsonResponse.confidence || jsonResponse.confidence_score || 5,
        }
        console.log("[v0] Parsed JSON response:", aiResult)
      } catch {
        // Enhanced fallback parsing for text responses
        console.log("[v0] Parsing as text response")

        // Look for confidence patterns (more flexible)
        const confidencePatterns = [
          /confidence[:\s]*(\d+(?:\.\d+)?)/i,
          /(\d+(?:\.\d+)?)%?\s*confidence/i,
          /score[:\s]*(\d+(?:\.\d+)?)/i,
          /certainty[:\s]*(\d+(?:\.\d+)?)/i,
        ]

        let confidence = 5 // default
        for (const pattern of confidencePatterns) {
          const match = aiResponse.match(pattern)
          if (match) {
            confidence = Math.round(Number.parseFloat(match[1]))
            console.log("[v0] Found confidence:", confidence, "using pattern:", pattern)
            break
          }
        }

        // Clean up the hypothesis text (remove confidence mentions for cleaner display)
        let hypothesis = aiResponse.trim()
        hypothesis = hypothesis.replace(/confidence[:\s]*\d+(?:\.\d+)?%?/gi, "")
        hypothesis = hypothesis.replace(/score[:\s]*\d+(?:\.\d+)?/gi, "")
        hypothesis = hypothesis.trim()

        aiResult = {
          hypothesis: hypothesis || "Assessment completed - please review with a healthcare professional",
          confidence: Math.min(Math.max(confidence, 1), 10), // Ensure 1-10 range
        }
        console.log("[v0] Parsed text response:", aiResult)
      }

      // Save to database
      const supabase = createClient()
      const { error: dbError } = await supabase.from("injury_hypothesis").insert({
        user_id: userId,
        subjective: symptoms.trim(), // Store symptoms in subjective column
        differentials: {
          hypothesis: aiResult.hypothesis,
          confidence_score: Math.min(Math.max(aiResult.confidence, 1), 10),
          ai_generated: true,
          timestamp: new Date().toISOString(),
        }, // Store AI results in differentials JSON column
        status: "active",
        version: 1,
      })

      if (dbError) {
        console.error("[v0] Database error:", dbError)
        throw dbError
      }

      console.log("[v0] Successfully saved assessment to database")
      setResult(aiResult)

      // Refresh the page to show the new assessment in the recent list
      router.refresh()
    } catch (error: unknown) {
      console.error("[v0] Error in injury assessment:", error)
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
